'use client';

import { Trip } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    Circle,
    MapPin,
    Receipt,
    FileText,
    ChevronRight,
    Clock,
    ClipboardList,
    Truck,
    CheckCircle2,
    Calendar,
    Building2,
    ArrowRight,
    PlaneTakeoff
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep existing import

interface TripGuidanceProps {
    trip: Trip;
    stats: any;
    onAction: (action: string) => void;
}

export default function TripGuidance({ trip, stats, onAction }: TripGuidanceProps) {
    const { campuses } = useTripStore();
    const isDraft = trip.status === 'draft';
    const isInProgress = trip.status === 'in_progress';
    const isCompleted = trip.status === 'completed';

    // Data calculations for checklist
    const totalVisits = trip.itinerary.length;
    const visitsDoneCount = trip.visits.filter(v => v.status === 'done').length;
    const hasLegs = trip.legs.length > 0;
    const hasExpenses = (trip.fuelEntries.length > 0) ||
        (trip.tollEntries.length > 0) ||
        (trip.foodEntries.length > 0) ||
        (trip.mobilityEntries?.length > 0) ||
        (trip.otherEntries.length > 0);

    const photoCount = (trip.visits.reduce((acc, v) => acc + (v.photos?.length || 0), 0)) +
        (trip.fuelEntries.reduce((acc, f) => acc + (f.photos?.length || 0), 0)) +
        (trip.mobilityEntries?.reduce((acc, m) => acc + (m.photos?.length || 0), 0) || 0) +
        (trip.tollEntries.reduce((acc, t) => acc + (t.photos?.length || 0), 0)) +
        (trip.foodEntries.reduce((acc, f) => acc + (f.photos?.length || 0), 0)) +
        (trip.otherEntries.reduce((acc, o) => acc + (o.photos?.length || 0), 0)) +
        (trip.legs.reduce((acc, l) => acc + (l.photos?.length || 0), 0));

    // Journey Steps Definition
    const steps = [
        {
            id: 'planning',
            label: 'Planejamento',
            icon: <Calendar className="w-5 h-5" />,
            isDone: !isDraft,
            isActive: isDraft,
            items: [
                { label: 'Definir datas e origem', done: !!trip.startDate },
                { label: 'Montar roteiro de paradas', done: totalVisits > 0 }
            ],
            action: { label: 'Revisar Viagem', cmd: 'edit' }
        },
        {
            id: 'departure',
            label: 'Partida',
            icon: <PlaneTakeoff className="w-5 h-5" />,
            isDone: hasLegs,
            isActive: isInProgress && !hasLegs,
            items: [
                { label: 'Registrar primeiro deslocamento', done: hasLegs }
            ],
            action: { label: 'Registrar Saída', cmd: 'add-leg' }
        },
        {
            id: 'visits',
            label: 'Atendimentos',
            icon: <MapPin className="w-5 h-5" />,
            isDone: visitsDoneCount === totalVisits && totalVisits > 0,
            isActive: isInProgress && hasLegs && visitsDoneCount < totalVisits,
            items: [
                { label: `${visitsDoneCount}/${totalVisits} paradas concluídas`, done: visitsDoneCount === totalVisits && totalVisits > 0 }
            ],
            // Dynamic logic for next visit or interstitial expense
            getInfo: () => {
                const orderedItinerary = [...trip.itinerary].sort((a, b) => a.order - b.order);

                // 1. Find the first pending/in_progress visit
                let nextVisitMeta = orderedItinerary.find(item => {
                    const v = trip.visits.find(vis => vis.campusId === item.campusId);
                    return v && (v.status === 'pending' || v.status === 'in_progress');
                });

                // 2. But WAIT, check if we JUST finished a visit (Interstitial)
                let lastDoneVisit = null;
                for (let i = orderedItinerary.length - 1; i >= 0; i--) {
                    const item = orderedItinerary[i];
                    const v = trip.visits.find(vis => vis.campusId === item.campusId);
                    if (v && v.status === 'done') {
                        lastDoneVisit = v;
                        break;
                    }
                }

                // If lastDoneVisit exists AND either there's a next one pending OR we're at the end
                // We want to force a "Lançar Gastos" prompt before moving on.
                // We use a simple heuristic: if a visit is DONE, and the Guidance hasn't been "skipped" to the next one.
                // Actually, the Guidance automatically follows nextVisitMeta. 
                // To create an interstitial, we need to know if the user WANTS to record expenses for the LAST DONE visit.

                if (lastDoneVisit && (!nextVisitMeta || (nextVisitMeta && trip.visits.find(v => v.campusId === nextVisitMeta.campusId)?.status === 'pending'))) {
                    // Show Interstitial for Expenses
                    const campus = campuses.find(c => c.id === lastDoneVisit.campusId);
                    return {
                        isInterstitial: true,
                        name: campus?.name || 'Campus',
                        action: { label: 'Lançar Gastos', cmd: 'expenses' },
                        secondaryAction: nextVisitMeta ? { label: 'Próxima Parada', cmd: 'visits' } : null
                    };
                }

                if (!nextVisitMeta) return null;
                const visit = trip.visits.find(v => v.campusId === nextVisitMeta.campusId);
                const campus = campuses.find(c => c.id === nextVisitMeta.campusId);
                return {
                    isInterstitial: false,
                    name: campus?.name || 'Campus',
                    status: visit?.status,
                    id: visit?.id,
                    action: { label: visit?.status === 'in_progress' ? 'Ver Atendimento' : 'Iniciar Visita', cmd: 'visits' }
                };
            },
            action: { label: 'Próxima Parada', cmd: 'visits' } // Default, usually overridden by getInfo
        },
        {
            id: 'expenses',
            label: 'Acerto',
            icon: <Receipt className="w-5 h-5" />,
            isDone: hasExpenses && photoCount > 0,
            isActive: isInProgress && visitsDoneCount === totalVisits && (!hasExpenses || photoCount === 0),
            items: [
                { label: 'Registrar gastos da viagem', done: hasExpenses },
                { label: `Anexar evidências (${photoCount})`, done: photoCount > 0 }
            ],
            action: { label: 'Lançar Gastos', cmd: 'expenses' }
        },
        {
            id: 'report',
            label: 'Relatório',
            icon: <FileText className="w-5 h-5" />,
            isDone: isCompleted,
            isActive: (isInProgress && visitsDoneCount === totalVisits && hasExpenses && photoCount > 0) || (isCompleted && false),
            items: [
                { label: 'Conferir resumo final', done: isCompleted }
            ],
            action: { label: 'Ver Relatório', cmd: 'report' }
        }
    ];

    const currentStep = steps.find(s => s.isActive) || (isCompleted ? steps[4] : steps[0]);
    const stepInfo = (currentStep as any).getInfo ? (currentStep as any).getInfo() : null;
    const isInterstitial = stepInfo?.isInterstitial;

    const CurrentStayAlert = () => {
        if (!isInProgress) return null;

        const now = new Date();
        const orderedItinerary = [...trip.itinerary].sort((a, b) => a.order - b.order);

        // Find current stop: the first stop that isn't DONE
        const currentStop = orderedItinerary.find(item => {
            const v = trip.visits.find(vis => vis.campusId === item.campusId);
            return v && (v.status === 'pending' || v.status === 'in_progress');
        });

        if (!currentStop) return null;

        const arrival = currentStop.plannedArrival ? new Date(currentStop.plannedArrival) : null;
        const departure = currentStop.plannedDeparture ? new Date(currentStop.plannedDeparture) : null;
        const campus = campuses.find(c => c.id === currentStop.campusId);

        // Check-in logic: today is arrival day and now is before or close to arrival
        const isArrivalDay = arrival && arrival.toDateString() === now.toDateString();
        const isDepartureDay = departure && departure.toDateString() === now.toDateString();

        if (isArrivalDay && now < arrival) {
            return (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 mb-4 animate-pulse">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Check-in hoje em {campus?.name} as {arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            );
        }

        if (isDepartureDay) {
            const hoursLeft = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursLeft > 0 && hoursLeft <= 4) {
                return (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100 mb-4 animate-bounce">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold">Checkout previsto em {Math.ceil(hoursLeft * 60)} min — {campus?.name}</span>
                    </div>
                );
            }
        }

        return null;
    };

    return (
        <Card className="border-0 shadow-lg bg-transparent overflow-hidden mt-8 mb-4">
            <CardContent className="p-0">
                <CurrentStayAlert />

                {/* Horizontal Stepper Area */}
                <div className="relative flex justify-between items-start mb-10 px-6">
                    {/* Progress Line */}
                    <div className="absolute top-7 left-0 right-0 h-[2px] bg-white/5 -z-0 mx-16 hidden md:block" />

                    {/* Active Progress Line Glow */}
                    <div className="absolute top-7 left-0 h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0 -z-0 mx-16 hidden md:block w-3/4 opacity-50 blur-[2px]" />

                    {steps.map((step, idx) => {
                        const isPast = step.isDone;
                        const isActive = step.isActive;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1 group cursor-default">
                                {/* Node */}
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 relative",
                                    isPast ? "bg-violet-500 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-90" :
                                        isActive ? "bg-black/80 border-violet-500 text-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)] ring-4 ring-violet-500/10 scale-110" :
                                            "bg-card/20 border-white/5 text-muted-foreground backdrop-blur-sm hover:bg-white/5"
                                )}>
                                    {isActive && <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping opacity-20" />}
                                    {isPast ? <Check className="w-6 h-6 stroke-[3px]" /> : step.icon}
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "mt-4 text-xs md:text-sm font-bold tracking-tight text-center hidden md:block transition-colors duration-300",
                                    isActive ? "text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" : isPast ? "text-muted-foreground" : "text-muted-foreground/40"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Focus Active Step Items & Action */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-violet-500/30 transition-colors duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                        <div className="space-y-5 flex-1">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                                    {isInterstitial ? `Alimentação e Gastos` : currentStep.label}
                                    {!isInterstitial && currentStep.id === 'visits' && stepInfo && (
                                        <Badge variant="outline" className="text-lg py-1 px-3 border-violet-500/30 text-violet-400 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                                            {stepInfo.name}
                                        </Badge>
                                    )}
                                    {isInterstitial && (
                                        <Badge variant="outline" className="text-lg py-1 px-3 border-violet-500/30 text-violet-400 bg-violet-500/5">
                                            {stepInfo.name}
                                        </Badge>
                                    )}
                                </h3>
                                <p className="text-muted-foreground text-base mt-2 max-w-xl leading-relaxed">
                                    {isInterstitial
                                        ? "Concluiu o atendimento? Lembre-se de registrar as refeições e outros gastos feitos nesta parada hoje."
                                        : (isCompleted ? "Viagem finalizada com sucesso." : "Complete os itens abaixo para avançar:")
                                    }
                                </p>
                            </div>

                            {/* Checklist (only show if not interstitial to avoid clutter) */}
                            {!isInterstitial && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
                                    {currentStep.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 group/item">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border",
                                                item.done ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/5 text-muted-foreground/30"
                                            )}>
                                                <CheckCircle2 className={cn("w-3.5 h-3.5", item.done ? "fill-current" : "")} />
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium transition-colors duration-300",
                                                item.done ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground/70"
                                            )}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Area */}
                        {!isCompleted && (
                            <div className="w-full md:w-auto flex flex-col gap-4">
                                <Button
                                    onClick={() => onAction(isInterstitial ? stepInfo.action.cmd : currentStep.action.cmd)}
                                    size="lg"
                                    className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold h-16 px-10 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] active:scale-95 transition-all text-base"
                                >
                                    {isInterstitial ? stepInfo.action.label : currentStep.action.label}
                                    <ArrowRight className="ml-3 w-5 h-5" />
                                </Button>

                                {isInterstitial && stepInfo.secondaryAction && (
                                    <Button
                                        variant="outline"
                                        onClick={() => onAction(stepInfo.secondaryAction.cmd)}
                                        className="h-12 rounded-xl border-white/10 hover:bg-white/5 hover:text-white"
                                    >
                                        {stepInfo.secondaryAction.label}
                                    </Button>
                                )}

                                {!isInterstitial && currentStep.id === 'visits' && visitsDoneCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => onAction('expenses')}
                                        className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5 transition-colors"
                                    >
                                        Ou registrar gastos pendentes
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
