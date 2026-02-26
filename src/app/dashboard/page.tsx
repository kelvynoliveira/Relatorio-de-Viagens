'use client';

import { useTripStore } from '@/lib/store';
import DashboardStats from '@/components/dashboard/dashboard-stats';
import DashboardEmptyState from '@/components/dashboard/dashboard-empty-state';
import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatUserName } from '@/lib/utils';

export default function DashboardPage() {
    const { trips: allTrips, isLoading, user } = useTripStore();

    const userTrips = useMemo(() => {
        if (!user) return [];
        return allTrips.filter(t => t.userId === user.id);
    }, [allTrips, user]);

    const stats = useMemo(() => {
        if (!user) return { totalMinutes: 0, totalKm: 0, fuelCost: 0, tollCost: 0 };

        let totalMinutes = 0;
        let totalKm = 0;
        let fuelCost = 0;
        let tollCost = 0;

        userTrips.forEach(trip => {
            trip.visits.forEach(v => {
                v.sessions.forEach(s => {
                    if (s.startAt && s.endAt) {
                        totalMinutes += Math.floor((new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 60000);
                    }
                });
            });
            totalKm += trip.legs.reduce((sum, l) => sum + (l.distanceKm || 0), 0);
            fuelCost += trip.fuelEntries.reduce((sum, f) => sum + (f.pricePaid || 0), 0);
            tollCost += trip.tollEntries.reduce((sum, t) => sum + (t.amount || 0), 0);
        });

        return { totalMinutes, totalKm, fuelCost, tollCost };
    }, [userTrips, user]);

    // Sort trips by date desc
    const sortedUserTrips = useMemo(() => {
        return [...userTrips].sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }, [userTrips]);

    // If global loading is true AND we don't have a user yet, show main loader
    if (isLoading && !user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Identificando usuário e carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-10 animate-in fade-in duration-500">
            {sortedUserTrips.length > 0 ? (
                <>
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">Painel de Controle</h1>
                            <p className="text-muted-foreground mt-2 text-lg">Olá, <span className="text-foreground font-medium">{formatUserName(user?.name)}</span>. Aqui está o resumo das suas atividades.</p>
                        </div>
                        <Link href="/trips/new">
                            <Button className="w-full md:w-auto shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Nova Viagem
                            </Button>
                        </Link>
                    </header>

                    <DashboardStats trips={userTrips} />

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold tracking-tight">Viagens Recentes</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sortedUserTrips.map((trip) => (
                                <TripCard key={trip.id} trip={trip} />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="min-h-[80vh] flex flex-col justify-center">
                    <DashboardEmptyState userName={user?.name || ''} />
                </div>
            )}
        </div>
    );
}
