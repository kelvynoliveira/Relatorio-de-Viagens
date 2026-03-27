'use client';

import { Trip } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map as MapIcon, Edit, Plane, CarFront, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TabItinerary({ trip, readonly = false }: { trip: Trip, readonly?: boolean }) {
    const { campuses } = useTripStore();
    const getCampusDetails = (id: string) => campuses.find(c => c.id === id);

    return (
        <div className="space-y-4">
            {trip.itinerary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="bg-primary/10 p-4 rounded-full text-primary mb-4">
                        <MapIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-semibold mb-1">Roteiro vazio</h4>
                    <p className="text-muted-foreground max-w-[280px] mb-6">
                        Você ainda não definiu as paradas desta viagem.
                    </p>
                    {!readonly && (
                        <Link href={`/trips/${trip.id}/edit`}>
                            <Button>
                                <Edit className="w-4 h-4 mr-2" /> Editar Roteiro
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="relative ml-4 pl-8 space-y-8 py-4">
                    {/* Gradient Line Glow - More Intense */}
                    <div className="absolute top-0 bottom-0 left-[-1px] w-[2px] bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 shadow-[0_0_15px_rgba(var(--primary),0.3)]" />

                    {/* Complete Journey Timeline (Campuses + Legs + Flights) */}
                    {(() => {
                        const allItems = [
                            ...trip.itinerary.map(item => ({ ...item, type: 'campus', date: item.plannedArrival })),
                            ...trip.legs.map(leg => ({ ...leg, type: 'leg' })),
                            ...trip.plannedFlights.map(flight => ({ ...flight, type: 'flight' }))
                        ].sort((a, b) => {
                            const dateA = new Date(a.date || '').getTime();
                            const dateB = new Date(b.date || '').getTime();
                            return dateA - dateB;
                        });

                        return allItems.map((item, idx) => {
                            if (item.type === 'campus') {
                                const campus = getCampusDetails((item as any).campusId);
                                if (!campus) return null;

                                return (
                                    <div key={`campus-${idx}`} className="relative group">
                                        <div className="absolute -left-[41px] top-5 w-5 h-5 rounded-full bg-black/60 border-2 border-primary/40 flex items-center justify-center z-10 transition-all duration-500 group-hover:border-primary group-hover:scale-110">
                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)] animate-pulse" />
                                            <div className="absolute inset-0 rounded-full bg-primary/20 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                        </div>

                                        <Card className="border border-white/5 bg-black/20 backdrop-blur-sm hover:bg-white/5 transition-all duration-500 rounded-2xl overflow-hidden group-hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:border-primary/20 hover:-translate-y-1">
                                            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5 h-5 shadow-inner">
                                                            Ponto de Atendimento
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-bold text-xl text-foreground/90 group-hover:text-primary transition-colors tracking-tight">
                                                        {campus.name}
                                                    </h4>
                                                    <div className="text-muted-foreground/70 text-sm flex items-start gap-2 mt-2 leading-relaxed max-w-xl">
                                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/40 group-hover:text-primary/70 transition-colors" />
                                                        <span>{campus.address || campus.city}, {campus.city}</span>
                                                    </div>
                                                </div>
                                                {(item as any).plannedArrival && (
                                                    <div className="text-right">
                                                        <div className="text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                            {new Date((item as any).plannedArrival).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            } else {
                                // Transport Item (Leg or Flight)
                                const isFlight = item.type === 'flight';
                                return (
                                    <div key={`transport-${idx}`} className="relative group/transport py-2">
                                        <div className={cn(
                                            "relative ml-4 flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all group-hover/transport:bg-white/[0.05]",
                                            isFlight ? "border-sky-500/10" : "border-amber-500/10"
                                        )}>
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                isFlight ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-500"
                                            )}>
                                                {isFlight ? <Plane className="w-5 h-5" /> : <CarFront className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">
                                                        {isFlight ? "Voo Planejado" : "Deslocamento"}
                                                    </span>
                                                    {isFlight && (item as any).flightNumber && (
                                                        <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border-none text-[9px] px-1.5 h-4">
                                                            {(item as any).flightNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                                                    <span className="text-white/70">{(item as any).from}</span>
                                                    <ArrowRight className="w-3 h-3 text-white/20" />
                                                    <span className="text-white">{(item as any).to}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-mono text-muted-foreground/60">
                                                    {(item as any).date ? format(new Date((item as any).date), 'dd/MM HH:mm') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        });
                    })()}
                </div>
            )}
        </div>
    );
}
