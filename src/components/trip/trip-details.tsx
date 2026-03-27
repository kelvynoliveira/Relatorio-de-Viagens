'use client';

import { useTripStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, MotionButton } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronLeft, MapPin, CalendarDays, Receipt, Car, Map as MapIcon, ClipboardList, FileText, Trash2, Edit, Clock, Coins, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { calculateTripStats } from '@/lib/trip-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

const TripMap = dynamic(() => import('@/components/dashboard/trip-map'), { 
    ssr: false,
    loading: () => <div className="w-full h-[400px] rounded-[2rem] bg-muted/20 animate-pulse" />
});

// Sub-components
import TabItinerary from '@/components/trip/details-tabs/tab-itinerary';
import TabDisplacements from '@/components/trip/details-tabs/tab-displacements';
import TabExpenses from '@/components/trip/details-tabs/tab-expenses';
import TabVisits from '@/components/trip/details-tabs/tab-visits';
import TabReport from '@/components/trip/details-tabs/tab-report';
import AddLegDrawer from '@/components/trip/drawers/add-leg-drawer';
import AddFuelDrawer from '@/components/trip/drawers/add-fuel-drawer';
import AddTollDrawer from '@/components/trip/drawers/add-toll-drawer';
import AddFoodDrawer from '@/components/trip/drawers/add-food-drawer';
import AddOtherDrawer from '@/components/trip/drawers/add-other-drawer';
import AddMobilityDrawer from '@/components/trip/drawers/add-mobility-drawer';
import ExpenseWizardDrawer from '@/components/trip/drawers/expense-wizard-drawer';
import CampusVisitDrawer from '@/components/trip/drawers/campus-visit-drawer';
import TripGuidance from './trip-guidance';
import FloatingQuickActions from './floating-quick-actions';
import SuccessModal from '@/components/ui/success-modal';

interface TripDetailsProps {
    tripId: string;
    readonly?: boolean;
}

export default function TripDetails({ tripId, readonly = false }: TripDetailsProps) {
    const router = useRouter();
    const { trips, deleteTrip, updateTrip, isLoading } = useTripStore();
    const trip = trips.find(t => t.id === tripId);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isFuelOpen, setIsFuelOpen] = useState(false);
    const [isTollOpen, setIsTollOpen] = useState(false);
    const [isFoodOpen, setIsFoodOpen] = useState(false);
    const [isOtherOpen, setIsOtherOpen] = useState(false);
    const [isMobilityOpen, setIsMobilityOpen] = useState(false);
    const [isExpenseWizardOpen, setIsExpenseWizardOpen] = useState(false);
    const [isLegDrawerOpen, setIsLegDrawerOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [editingLeg, setEditingLeg] = useState<any>(null);

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!trip) return <div className="text-center py-12">Viagem não encontrada.</div>;

    const handleDelete = () => {
        deleteTrip(trip.id);
        router.push('/dashboard');
    };

    const handleConfirmComplete = async () => {
        setIsConfirmDialogOpen(false);
        try {
            await updateTrip(trip.id, { status: 'completed' });
            setIsSuccessOpen(true);
            setActiveTab('report');
        } catch (error) {
            console.error('Erro ao finalizar viagem:', error);
            toast.error('Erro ao finalizar viagem.');
        }
    };

    const handleComplete = () => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const endDateStr = trip.endDate; // Assuming it's YYYY-MM-DD

        if (todayStr < endDateStr) {
            const formattedDate = new Date(trip.endDate + 'T12:00:00').toLocaleDateString('pt-BR');
            toast.error(`Viagem ainda em curso. Você só poderá finalizar a partir de ${formattedDate}.`, {
                description: "O relatório técnico só pode ser gerado após a data de término prevista.",
                duration: 5000
            });
            return;
        }
        setIsConfirmDialogOpen(true);
    };

    // Calculate Stats
    const stats = calculateTripStats(trip);

    const scheduleBadgeColors = {
        scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const handleGuidanceAction = (action: string) => {
        if (action === 'edit') {
            router.push(`/trips/${trip.id}/edit`);
        } else if (action === 'add-leg') {
            setEditingLeg(null);
            setIsLegDrawerOpen(true);
        } else if (action === 'visits') {
            // Sort itinerary to find the logical next step
            const orderedItinerary = [...trip.itinerary].sort((a, b) => a.order - b.order);

            // Find the first visit in itinerary order that is either in_progress or pending
            let nextVisitId = null;
            for (const item of orderedItinerary) {
                const v = trip.visits.find(v => v.campusId === item.campusId);
                if (v && (v.status === 'in_progress' || v.status === 'pending')) {
                    nextVisitId = v.id;
                    break;
                }
            }

            if (nextVisitId) {
                setSelectedVisitId(nextVisitId);
            } else if (trip.visits.length > 0) {
                // Fallback to first visit if all are done (or somehow logic fails)
                setSelectedVisitId(trip.visits[0].id);
            }
            setActiveTab('visits');
        } else if (action === 'report') {
            setActiveTab('report');
        } else if (action === 'expenses') {
            setIsExpenseWizardOpen(true);
        } else if (action === 'complete') {
            handleComplete();
        }
    };

    const handleQuickAction = (type: 'fuel' | 'toll' | 'food' | 'leg' | 'other' | 'mobility') => {
        if (type === 'fuel') setIsFuelOpen(true);
        else if (type === 'toll') setIsTollOpen(true);
        else if (type === 'food') setIsFoodOpen(true);
        else if (type === 'mobility') setIsMobilityOpen(true);
        else if (type === 'other') setIsOtherOpen(true);
        else if (type === 'leg') {
            setEditingLeg(null);
            setIsLegDrawerOpen(true);
        }
    };



    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <SuccessModal 
                isOpen={isSuccessOpen} 
                onClose={() => setIsSuccessOpen(false)}
                title="Viagem Finalizada!"
                message="Seu relatório técnico foi gerado com sucesso e está pronto para assinatura."
            />
            {/* FAB actions */}
            {!readonly && <FloatingQuickActions onAction={handleQuickAction} />}
            {/* Hero Header */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-primary/5 to-purple-900/20 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={cn(
                                "capitalize shadow-sm backdrop-blur-md border-white/10 px-3 py-1 text-xs font-semibold tracking-wide rounded-full",
                                trip.status === 'in_progress' && new Date(trip.startDate) > new Date()
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                    : trip.status === 'draft' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : trip.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            )}>
                                {trip.status === 'draft' ? 'Rascunho' :
                                    (trip.status === 'in_progress' && new Date(trip.startDate) > new Date()) ? 'Agendada' :
                                        trip.status === 'in_progress' ? 'Em Andamento' : 'Finalizada'}
                            </Badge>
                            <Badge variant="secondary" className={cn("px-3 py-1 text-xs font-medium border-0 rounded-full bg-white/5 text-muted-foreground", scheduleBadgeColors[stats.scheduleStatus.type])}>
                                {stats.scheduleStatus.label}
                            </Badge>
                            {readonly && <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 rounded-full">Modo Leitura</Badge>}
                        </div>

                        <div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-2 drop-shadow-lg">
                                {trip.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm md:text-base text-muted-foreground/80 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-primary" /> {trip.originCity}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {!readonly && (
                            <>
                                {trip.status === 'in_progress' && (
                                    <MotionButton
                                        onClick={handleComplete}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Finalizar
                                    </MotionButton>
                                )}
                                <Link href={`/trips/${trip.id}/edit`} className="flex-1 md:flex-none">
                                    <MotionButton 
                                        variant="outline" 
                                        className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-md rounded-full px-6 transition-all group/btn"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Edit className="w-4 h-4 mr-2 group-hover/btn:text-sky-400 transition-colors" />
                                        Editar
                                    </MotionButton>
                                </Link>
                                <MotionButton
                                    variant="ghost"
                                    onClick={handleDelete}
                                    className="px-4 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </MotionButton>
                            </>
                        )}
                        <Link href={readonly ? "/manager/tracking" : "/dashboard"}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Horas Técnicas', value: formatDuration(stats.totalHoursMin), icon: Clock, color: 'text-zinc-200', bg: 'bg-zinc-500/10', glow: 'hover:shadow-white/5' },
                    { label: 'Total Gastos', value: formatCurrency(stats.totalExpenses), icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'hover:shadow-emerald-500/10' },
                    { label: 'Total Percorrido', value: formatDistance(stats.totalKm), icon: MapIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'hover:shadow-blue-500/10' },
                    { label: 'Pedágios', value: formatCurrency(stats.tollStats.cost), icon: Car, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'hover:shadow-amber-500/10' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="group"
                    >
                        <Card className={cn(
                            "glass-card border-white/5 overflow-hidden transition-all duration-500 h-full",
                            stat.glow
                        )}>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-20 h-20 rotate-12" />
                            </div>
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn("p-2.5 rounded-xl ring-1 ring-inset ring-white/10", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className={cn("text-2xl md:text-3xl font-black tracking-tighter drop-shadow-sm", stat.color)}>
                                        {stat.value}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* UX Guidance Card & Checklist */}
            {!readonly && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent blur-3xl -z-10" />
                    <TripGuidance trip={trip} stats={stats} onAction={handleGuidanceAction} />
                </div>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="sticky top-4 z-30 -mx-4 px-4 md:static md:mx-0 md:px-0 mb-8">
                    <TabsList className="w-full h-auto bg-black/20 backdrop-blur-xl border border-white/5 p-1.5 rounded-full shadow-lg flex-wrap md:flex-nowrap justify-start overflow-x-auto">
                        {[
                            { id: 'itinerary', icon: MapIcon, label: 'Roteiro' },
                            { id: 'legs', icon: Car, label: 'Deslocamentos' },
                            { id: 'expenses', icon: Receipt, label: 'Gastos' },
                            { id: 'visits', icon: ClipboardList, label: 'Atendimentos' },
                            { id: 'report', icon: FileText, label: 'Relatório' },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex-1 rounded-full px-4 py-2.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300 border border-transparent data-[state=active]:border-primary/20"
                            >
                                <tab.icon className="w-4 h-4 mr-2" />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-h-[400px]"
                    >
                        <TabsContent value="itinerary" className="mt-0 space-y-6">
                            <TripMap trips={[trip]} campuses={useTripStore().campuses} />
                            <TabItinerary trip={trip} readonly={readonly} />
                        </TabsContent>
                        <TabsContent value="legs" className="mt-0">
                            <TabDisplacements trip={trip} readonly={readonly} />
                        </TabsContent>
                        <TabsContent value="expenses" className="mt-0">
                            <TabExpenses trip={trip} readonly={readonly} />
                        </TabsContent>
                        <TabsContent value="visits" className="mt-0">
                            <TabVisits trip={trip} readonly={readonly} onSelectVisit={setSelectedVisitId} />
                        </TabsContent>
                        <TabsContent value="report" className="mt-0">
                            <TabReport trip={trip} />
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>

            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent className="bg-black/80 backdrop-blur-2xl border-white/10 max-w-[400px] rounded-[2rem] p-8">
                    <AlertDialogHeader>
                        <div className="flex justify-center mb-6">
                            <div className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center animate-pulse shadow-2xl",
                                stats.totalKm === 0 && stats.totalExpenses === 0 && !trip.visits.some(v => v.status === 'done')
                                    ? "bg-amber-500/20 text-amber-500 ring-4 ring-amber-500/10 shadow-amber-500/20"
                                    : "bg-emerald-500/20 text-emerald-500 ring-4 ring-emerald-500/10 shadow-emerald-500/20"
                            )}>
                                {stats.totalKm === 0 && stats.totalExpenses === 0 && !trip.visits.some(v => v.status === 'done')
                                    ? <AlertTriangle className="w-10 h-10" />
                                    : <CheckCircle2 className="w-10 h-10" />
                                }
                            </div>
                        </div>
                        <AlertDialogTitle className="text-3xl font-black text-center text-white tracking-tighter mb-2">
                            {stats.totalKm === 0 && stats.totalExpenses === 0 && !trip.visits.some(v => v.status === 'done')
                                ? "Relatório Vazio!"
                                : "Finalizar Viagem?"
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-lg leading-relaxed">
                            {stats.totalKm === 0 && stats.totalExpenses === 0 && !trip.visits.some(v => v.status === 'done')
                                ? "Você ainda não registrou nada nesta viagem. Deseja realmente finalizar o relatório em branco?"
                                : "Isso marcará o relatório como concluído e gerará o documento final. Confirmar?"
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 sm:flex-col gap-3">
                        <AlertDialogAction
                            onClick={handleConfirmComplete}
                            className={cn(
                                "w-full font-bold h-14 rounded-2xl transition-all shadow-lg active:scale-95 text-base",
                                stats.totalKm === 0 && stats.totalExpenses === 0 && !trip.visits.some(v => v.status === 'done')
                                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                            )}
                        >
                            Sim, Finalizar Agora
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white m-0 text-base">
                            Voltar e Revisar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CampusVisitDrawer
                open={!!selectedVisitId}
                onOpenChange={(open) => !open && setSelectedVisitId(null)}
                tripId={trip.id}
                visitId={selectedVisitId || ''}
            />
            <AddLegDrawer open={isLegDrawerOpen} onOpenChange={setIsLegDrawerOpen} tripId={trip.id} initialData={editingLeg} />
            <AddFuelDrawer open={isFuelOpen} onOpenChange={setIsFuelOpen} tripId={trip.id} />
            <AddTollDrawer open={isTollOpen} onOpenChange={setIsTollOpen} tripId={trip.id} />
            <AddFoodDrawer open={isFoodOpen} onOpenChange={setIsFoodOpen} tripId={trip.id} />
            <AddOtherDrawer open={isOtherOpen} onOpenChange={setIsOtherOpen} tripId={trip.id} />
            <AddMobilityDrawer open={isMobilityOpen} onOpenChange={setIsMobilityOpen} tripId={trip.id} />
            <ExpenseWizardDrawer
                open={isExpenseWizardOpen}
                onOpenChange={setIsExpenseWizardOpen}
                onLaunch={(cat) => handleQuickAction(cat as any)}
            />
        </div>
    );
}
