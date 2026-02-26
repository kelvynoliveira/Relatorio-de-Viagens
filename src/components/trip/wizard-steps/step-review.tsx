'use client';

import { useFormContext } from 'react-hook-form';
import { Trip, Campus } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepReview() {
    const { getValues } = useFormContext<Trip>();
    const { campuses } = useTripStore();

    // We use getValues() because this step mounts after data is present.
    const values = getValues();

    const getCampusDetails = (id: string) => campuses.find((c: Campus) => c.id === id);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* Summary Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-6 md:p-8">
                {/* Decorative background */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-xl text-white tracking-tight">Resumo da Viagem</h3>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{values.title}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Origem</p>
                                <p className="font-medium text-white">{values.originCity}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <CalendarDays className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data</p>
                                <p className="font-medium text-white">
                                    {new Date(values.startDate).toLocaleDateString()} - {new Date(values.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {values.notes && (
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Observações</p>
                            <p className="text-sm text-zinc-300 leading-relaxed italic">"{values.notes}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Itinerary Timeline */}
            <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Itinerário Confirmado
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white ml-2">{values.itinerary?.length || 0} Paradas</Badge>
                </h3>

                {(!values.itinerary || values.itinerary.length === 0) ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                        <p className="text-red-400 font-medium">Nenhum campus selecionado! Volte e adicione paradas.</p>
                    </div>
                ) : (
                    <div className="relative pl-4 md:pl-8 space-y-0">
                        {/* Timeline Line */}
                        <div className="absolute left-[23px] md:left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent opacity-30" />

                        {values.itinerary.map((item, idx) => {
                            const campus = getCampusDetails(item.campusId);

                            return (
                                <div key={idx} className="relative pb-8 group">
                                    {/* Timeline Dot */}
                                    <div className="absolute left-[15px] md:left-[31px] top-5 w-4 h-4 rounded-full bg-black border-2 border-primary ring-4 ring-black z-10 group-hover:scale-110 transition-transform duration-300" />

                                    <div className="ml-12 md:ml-16 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm transition-all hover:bg-white/10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">{idx + 1}ª Parada</Badge>
                                                    {campus && <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{campus.city} / {campus.state}</span>}
                                                </div>
                                                <h4 className="font-bold text-lg text-white">
                                                    {campus ? campus.name : `ID: ${item.campusId.substring(0, 8)}...`}
                                                </h4>
                                            </div>

                                            {(item.plannedArrival || item.plannedDeparture) && (
                                                <div className="flex flex-col items-end gap-1 text-right">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permanência</div>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <span>{item.plannedArrival ? new Date(item.plannedArrival).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) : '--/--'}</span>
                                                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                        <span>{item.plannedDeparture ? new Date(item.plannedDeparture).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) : '--/--'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Warning / Next Steps Info */}
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-5 flex gap-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex-shrink-0 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                    <h4 className="font-bold text-violet-500 mb-1">Status: Rascunho</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Ao confirmar, a viagem será criada como <strong className="text-violet-400">Rascunho</strong>.
                        Você poderá adicionar detalhes de deslocamento, abastecimento, despesas e relatórios técnicos na próxima tela (Detalhes da Viagem).
                    </p>
                </div>
            </div>

        </div>
    );
}
