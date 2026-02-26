'use client';

import { useTripStore } from '@/lib/store';
import { Trip } from '@/lib/models';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import CampusVisitDrawer from '../drawers/campus-visit-drawer';

export default function TabVisits({ trip, readonly = false, onSelectVisit }: { trip: Trip, readonly?: boolean, onSelectVisit?: (id: string | null) => void }) {
    const { campuses } = useTripStore();
    // Local state removed, using onSelectVisit from parent

    const getCampusDetails = (id: string) => campuses.find(c => c.id === id);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'done': return 'Concluído';
            case 'in_progress': return 'Em Andamento';
            default: return 'Pendente';
        }
    };

    return (
        <div className="space-y-4">
            {trip.visits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-white/5 rounded-3xl bg-black/20 backdrop-blur-xl transition-all duration-500 hover:bg-black/30 group">
                    <div className="bg-primary/10 p-5 rounded-full text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Sem atendimentos previstos</h4>
                    <p className="text-muted-foreground max-w-[280px] leading-relaxed">
                        Esta viagem não possui paradas em Campi planejadas no roteiro.
                    </p>
                </div>
            ) : (
                [...trip.visits]
                    .sort((a, b) => {
                        const itemA = trip.itinerary.find(i => i.campusId === a.campusId);
                        const itemB = trip.itinerary.find(i => i.campusId === b.campusId);
                        return (itemA?.order || 0) - (itemB?.order || 0);
                    })
                    .map((visit) => {
                        const campus = getCampusDetails(visit.campusId);
                        if (!campus) return null;

                        return (
                            <Card
                                key={visit.id}
                                className={readonly ? "opacity-100 border-0 bg-black/20 backdrop-blur-xl" : "cursor-pointer border-0 bg-black/20 backdrop-blur-xl hover:bg-white/5 ring-1 ring-white/5 hover:ring-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] group"}
                                onClick={() => !readonly && onSelectVisit?.(visit.id)}
                            >
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-2xl transition-all duration-300 ${visit.status === 'done' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-muted-foreground bg-white/5 group-hover:bg-white/10 group-hover:text-foreground'}`}>
                                            {visit.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{campus.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-muted-foreground/80">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {campus.city}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${getStatusColor(visit.status)} shadow-sm`}>
                                            {getStatusLabel(visit.status)}
                                        </Badge>
                                        {!readonly && <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors"><ChevronRight className="w-5 h-5" /></div>}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
            )}


        </div>
    );
}
