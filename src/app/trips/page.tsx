'use client';

import { useTripStore } from '@/lib/store';
import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, User } from '@/lib/auth';

export default function TripsPage() {
    const { trips: allTrips, isLoading, user } = useTripStore();

    const trips = useMemo(() => {
        if (!user) return [];
        return allTrips.filter(t => t.userId === user.id);
    }, [allTrips, user]);

    if (isLoading && !user) {
        return <div className="p-8 text-center text-muted-foreground italic flex flex-col items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Carregando viagens...
        </div>;
    }

    return (
        <div className="container max-w-6xl mx-auto py-12 px-4 space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/10 pb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Minhas Viagens
                    </h1>
                    <p className="text-muted-foreground text-lg font-light max-w-2xl">
                        Gerencie suas atividades, acompanhe o status dos deslocamentos e mantenha seus relatórios técnicos em dia.
                    </p>
                </div>
                <Link href="/trips/new">
                    <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full px-8">
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Viagem
                    </Button>
                </Link>
            </div>

            {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-card/30 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl">
                    <div className="bg-primary/10 p-6 rounded-full shadow-[0_0_30px_rgba(var(--primary),0.2)] mb-6 ring-1 ring-white/10">
                        <Plus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Nenhuma viagem encontrada</h3>
                    <p className="text-muted-foreground mb-8 max-w-md text-center text-lg leading-relaxed">
                        Seu histórico está vazio. Comece criando sua primeira viagem técnica para registrar atendimentos.
                    </p>
                    <Link href="/trips/new">
                        <Button variant="outline" size="lg" className="rounded-full border-primary/20 hover:bg-primary/5">
                            Criar primeira viagem
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {trips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                    ))}
                </div>
            )}
        </div>
    );
}
