'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trip } from '@/lib/models';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { calculateTripStats } from '@/lib/trip-utils';
import { Clock, MapPin, Fuel, Coins, ArrowRight, Truck, Wallet, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardStats({ trips }: { trips: Trip[] }) {
    const stats = useMemo(() => {
        // ... (existing stats logic)
        let totalHoursMin = 0;
        let totalKm = 0;
        let totalFuel = 0;
        let totalFuelLiters = 0;
        let fuelCount = 0;
        let totalTolls = 0;

        trips.forEach((trip) => {
            const tripStats = calculateTripStats(trip);
            totalHoursMin += tripStats.totalHoursMin;
            totalKm += tripStats.totalKm;
            totalFuel += tripStats.fuelStats.cost;
            totalFuelLiters += tripStats.fuelStats.liters;
            fuelCount += tripStats.fuelStats.count;
            totalTolls += tripStats.tollStats.cost;
        });

        return { totalHoursMin, totalKm, totalFuel, totalFuelLiters, fuelCount, totalTolls };
    }, [trips]);

    const activeVisitInfo = useMemo(() => {
        for (const trip of trips) {
            const runningVisit = trip.visits?.find(v =>
                v.status === 'in_progress' || v.sessions?.some(s => s.endAt === null)
            );

            if (runningVisit) {
                return {
                    tripTitle: trip.title,
                    tripId: trip.id,
                    visitId: runningVisit.id,
                    startTime: runningVisit.sessions?.find(s => s.endAt === null)?.startAt
                };
            }
        }
        return null;
    }, [trips]);

    const nextMovement = useMemo(() => {
        const now = new Date();
        const activeTrips = trips.filter(t => t.status === 'in_progress');

        for (const trip of activeTrips) {
            const orderedItinerary = [...trip.itinerary].sort((a, b) => a.order - b.order);

            // Find current stop: the first stop that isn't DONE
            const currentIndex = orderedItinerary.findIndex(item => {
                const v = trip.visits.find(vis => vis.campusId === item.campusId);
                return v && (v.status === 'pending' || v.status === 'in_progress');
            });

            if (currentIndex === -1) continue;

            const currentStop = orderedItinerary[currentIndex];
            const departure = currentStop.plannedDeparture ? new Date(currentStop.plannedDeparture) : null;
            const isDepartureToday = departure && departure.toDateString() === now.toDateString();

            if (isDepartureToday) {
                const nextStop = orderedItinerary[currentIndex + 1];
                return {
                    tripTitle: trip.title,
                    currentCity: trip.originCity, // Simplified, maybe fetch from campus catalog if needed
                    departureTime: departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    nextCity: nextStop ? 'Próximo Campus' : 'Retorno',
                    isCheckout: !!currentStop.hotelName
                };
            }
        }
        return null;
    }, [trips]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeVisitInfo && (
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full animate-pulse">
                                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-green-900 dark:text-green-100">Atendimento em Andamento</h3>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Viagem: {activeVisitInfo.tripTitle}
                                        {activeVisitInfo.startTime && ` • Iniciado às ${new Date(activeVisitInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {nextMovement && (
                    <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
                        <CardContent className="p-4 flex items-center justify-between h-full">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sky-100 dark:bg-sky-800 rounded-full">
                                    <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-sky-900 dark:text-sky-100">Próximo Movimento</h3>
                                    <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
                                        <span>{nextMovement.isCheckout ? 'Checkout' : 'Partida'} as {nextMovement.departureTime}</span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span>{nextMovement.nextCity}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Animated Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: 'Horas Técnicas',
                        value: formatDuration(stats.totalHoursMin),
                        sub: 'Tempo em atendimento',
                        icon: Clock,
                        color: 'text-violet-500',
                        bg: 'bg-violet-500/10 border-violet-500/20'
                    },
                    {
                        label: 'Deslocamento',
                        value: formatDistance(stats.totalKm),
                        sub: 'Distância total percorrida',
                        icon: MapPin,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10 border-blue-500/20'
                    },
                    {
                        label: 'Combustível',
                        value: formatCurrency(stats.totalFuel),
                        sub: `${stats.fuelCount} abast. • ${stats.totalFuelLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`,
                        icon: Fuel,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10 border-orange-500/20'
                    },
                    {
                        label: 'Pedágios',
                        value: formatCurrency(stats.totalTolls),
                        sub: 'Total em tarifas',
                        icon: Coins,
                        color: 'text-amber-500',
                        bg: 'bg-amber-500/10 border-amber-500/20'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                        <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all hover:shadow-lg group">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                        <span>+0%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="text-xs text-muted-foreground/60">{stat.sub}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
