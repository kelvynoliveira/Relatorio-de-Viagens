'use client';

import { useTripStore } from '@/lib/store';
import DashboardStats from '@/components/dashboard/dashboard-stats';
import DashboardEmptyState from '@/components/dashboard/dashboard-empty-state';
import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatUserName } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Skeleton, StatsSkeleton, TripCardSkeleton } from '@/components/ui/skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1] as any
        } 
    }
};

export default function DashboardPage() {
    const { trips: allTrips, isLoading, user } = useTripStore();

    const userTrips = useMemo(() => {
        if (!user) return [];
        return allTrips.filter(t => t.userId === user.id);
    }, [allTrips, user]);

    // Sort trips by date desc
    const sortedUserTrips = useMemo(() => {
        return [...userTrips].sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }, [userTrips]);

    if (isLoading && !user) {
        return (
            <div className="container max-w-7xl mx-auto py-8 px-4 space-y-12">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-64 rounded-2xl" />
                    <Skeleton className="h-6 w-96 rounded-xl" />
                </div>
                <StatsSkeleton />
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => <TripCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="container max-w-7xl mx-auto py-4 px-4 space-y-12"
        >
            {sortedUserTrips.length > 0 ? (
                <>
                    <motion.header 
                        variants={itemVariants}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 glass-card p-10 rounded-[3rem] border-white/5"
                    >
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-3">
                                <span className="text-gradient">Painel</span> Geral
                            </h1>
                            <p className="text-muted-foreground text-xl font-medium">
                                Bem-vindo, <span className="text-white font-black">{formatUserName(user?.name)}</span>. 
                                Aqui está o seu relatório estratégico.
                            </p>
                        </div>
                        <Link href="/trips/new">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all bg-primary hover:bg-primary/90">
                                    <Plus className="mr-3 h-6 w-6 stroke-[3]" /> Nova Viagem
                                </Button>
                            </motion.div>
                        </Link>
                    </motion.header>

                    <motion.div variants={itemVariants}>
                        <DashboardStats trips={userTrips} />
                    </motion.div>

                    <div className="space-y-8">
                        <motion.h2 
                            variants={itemVariants}
                            className="text-3xl font-black tracking-tight flex items-center gap-4 ml-4"
                        >
                            <div className="w-2.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
                            Minhas Viagens
                        </motion.h2>
                        <motion.div 
                            variants={containerVariants}
                            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {sortedUserTrips.map((trip) => (
                                <motion.div key={trip.id} variants={itemVariants}>
                                    <TripCard trip={trip} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </>
            ) : (
                <motion.div variants={itemVariants} className="min-h-[80vh] flex flex-col justify-center">
                    <DashboardEmptyState userName={user?.name || ''} />
                </motion.div>
            )}
        </motion.div>
    );
}
