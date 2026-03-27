'use client';

import { useTripStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, MotionButton } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, CalendarDays, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Trip } from '@/lib/models';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ManagerTrackingPage() {
    const { trips, campuses } = useTripStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

    useEffect(() => {
        async function fetchProfiles() {
            setIsLoadingProfiles(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'user');

                if (error) throw error;

                setTechnicians((data || []).map((p: any) => ({
                    id: p.id,
                    name: p.name || 'Sem Nome',
                    email: p.email,
                    role: p.role,
                    avatar_url: p.avatar_url
                })));
            } catch (error) {
                console.error('Error fetching profiles:', error);
            } finally {
                setIsLoadingProfiles(false);
            }
        }
        fetchProfiles();
    }, []);

    const filteredTechnicians = technicians.filter(tech =>
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTechTrips = (techId: string) => {
        // Map tech trips (handling text vs uuid if necessary, but profiles.id is uuid)
        return trips.filter(t => t.userId === techId);
    };

    const getLastLocation = (techTrips: Trip[]) => {
        const now = new Date();
        const activeTrip = techTrips.find(t => {
            if (t.status !== 'in_progress') return false;
            const start = new Date(t.startDate);
            return now >= start;
        });

        if (activeTrip) {
            // 1. Check last leg destination (sorted by date)
            if (activeTrip.legs.length > 0) {
                const sortedLegs = [...activeTrip.legs].sort((a, b) =>
                    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
                );
                return { city: sortedLegs[0].to, status: 'Em Viagem', tripName: activeTrip.title };
            }

            // 2. Check for latest visit if no legs
            if (activeTrip.visits.length > 0) {
                const latestVisit = activeTrip.visits[activeTrip.visits.length - 1];
                const campus = campuses.find((c: any) => c.id === latestVisit.campusId);
                if (campus) {
                    return { city: campus.city, status: 'Em Viagem', tripName: activeTrip.title };
                }
            }

            return { city: activeTrip.originCity, status: 'Em Viagem', tripName: activeTrip.title };
        }
        return { city: 'Base', status: 'Disponível', tripName: '-' };
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Acompanhar Viagens</h1>
                <p className="text-muted-foreground">
                    Visualize a localização e o status dos técnicos em tempo real.
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar técnico..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Technicians Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredTechnicians.map((tech) => {
                    const techTrips = getTechTrips(tech.id);
                    const { city, status, tripName } = getLastLocation(techTrips);
                    const isTraveling = status === 'Em Viagem';
                    const currentTrip = techTrips.find(t => t.status === 'in_progress' && new Date() >= new Date(t.startDate));

                    return (
                        <Card key={tech.id} className="relative overflow-hidden group glass-card border-white/5 rounded-[2.5rem] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1">
                            {/* Accent Background Overlay */}
                            <div className={cn(
                                "absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] transition-all duration-700 opacity-20 group-hover:opacity-30",
                                isTraveling ? "bg-blue-500" : "bg-emerald-500"
                            )} />

                            <CardHeader className="flex flex-row items-center gap-5 p-8 pb-3 relative z-10">
                                <Avatar className="h-20 w-20 ring-4 ring-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                    <AvatarImage src={tech.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-2xl font-black">
                                        {tech.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden space-y-1">
                                    <CardTitle className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors">{tech.name}</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground/60 text-sm truncate uppercase tracking-widest">{tech.email}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                                        isTraveling ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isTraveling ? "bg-blue-400" : "bg-emerald-400")} />
                                        {status}
                                    </div>
                                    {isTraveling && (
                                        <div className="flex items-center text-sm font-bold text-muted-foreground/80">
                                            <MapPin className="mr-1.5 h-4 w-4 text-primary" />
                                            {city}
                                        </div>
                                    )}
                                </div>

                                {isTraveling ? (
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
                                        <div className="space-y-1">
                                            <div className="font-black text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">Viagem Atual</div>
                                            <div className="font-bold text-white leading-tight line-clamp-1">{tripName}</div>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Gastos</div>
                                                <div className="text-sm font-black text-white">R$ {currentTrip?.fuelEntries.reduce((a: number, b: any) => a + b.pricePaid, 0).toFixed(2) || '0,00'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Fotos</div>
                                                <div className="text-sm font-black text-white">{currentTrip?.visits.reduce((a: number, b: any) => a + b.photos.length, 0) || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[114px] flex items-center justify-center rounded-3xl border border-dashed border-white/5 opacity-40">
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Aguardando Próxima Missão</p>
                                    </div>
                                )}

                                <Link href={`/manager/tracking/${tech.id}`} className="block">
                                    <MotionButton 
                                        className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all border-white/5 hover:bg-white/10 group-hover:border-primary/50" 
                                        variant="outline"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Detalhes Completos <ArrowRight className="ml-3 h-4 w-4 stroke-[3]" />
                                    </MotionButton>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
