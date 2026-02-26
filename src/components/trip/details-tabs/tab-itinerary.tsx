'use client';

import { Trip } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map as MapIcon, Edit } from 'lucide-react';
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
                <div className="relative border-l-2 border-white/5 ml-4 pl-8 space-y-8 py-4">
                    {/* Gradient Line Glow */}
                    <div className="absolute top-0 bottom-0 left-[-1px] w-[2px] bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0" />

                    {trip.itinerary.map((item, idx) => {
                        const campus = getCampusDetails(item.campusId);
                        if (!campus) return null;

                        return (
                            <div key={idx} className="relative group">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[41px] top-5 w-5 h-5 rounded-full bg-black/40 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary),0.2)] group-hover:border-primary/80 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-500 z-10">
                                    <div className="w-2 h-2 rounded-full bg-primary/70 group-hover:bg-primary transition-colors" />
                                </div>

                                <Card className="border border-white/5 bg-black/20 backdrop-blur-sm hover:bg-white/5 transition-all duration-500 rounded-2xl overflow-hidden group-hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:border-primary/20 hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5 h-5 shadow-inner">
                                                    {idx + 1}ª Parada
                                                </Badge>
                                                {idx === 0 && <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">Início</span>}
                                                {idx === trip.itinerary.length - 1 && <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">Destino Final</span>}
                                            </div>

                                            <h4 className="font-bold text-xl text-foreground/90 group-hover:text-primary transition-colors tracking-tight">
                                                {campus.name}
                                            </h4>

                                            <div className="text-muted-foreground/70 text-sm flex items-start gap-2 mt-2 leading-relaxed max-w-xl">
                                                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/40 group-hover:text-primary/70 transition-colors" />
                                                {campus.address || campus.city ? (
                                                    <span>
                                                        {campus.address ? `${campus.address}, ` : ''}
                                                        <span className="text-foreground/80 font-medium">{campus.city || ''}</span>
                                                        {campus.state ? ` - ${campus.state}` : ''}
                                                    </span>
                                                ) : (
                                                    <span className="italic opacity-50">Localização não detalhada</span>
                                                )}
                                            </div>
                                        </div>

                                        {(item.plannedArrival || item.hotelName) && (
                                            <div className="flex flex-col gap-2 items-end min-w-[140px] text-right">
                                                {item.plannedArrival && (
                                                    <div className="text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                        {new Date(item.plannedArrival).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {item.hotelName && (
                                                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                                                        {item.hotelName}
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
