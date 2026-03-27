'use client';

import { useTripStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, MotionButton } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, CalendarDays, ExternalLink, ArrowRight, Edit3 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { Trip } from '@/lib/models';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, Globe, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const TechnicianMap = dynamic(() => import('@/components/manager/technician-map'), { 
    ssr: false,
    loading: () => <div className="w-full h-[600px] rounded-[3rem] bg-white/5 animate-pulse flex items-center justify-center text-muted-foreground font-black uppercase tracking-widest">Carregando Mapa...</div>
});

interface TrajectoryPoint {
    city: string;
    status: 'past' | 'current' | 'future';
}

export default function ManagerTrackingPage() {
    const { trips, campuses, user: currentUser } = useTripStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    const [editingTech, setEditingTech] = useState<User | null>(null);
    const [newHomeCity, setNewHomeCity] = useState('');
    const [isUpdatingBase, setIsUpdatingBase] = useState(false);
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        async function fetchProfiles() {
            setIsLoadingProfiles(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*');

                if (error) throw error;

                setTechnicians((data || []).map((p: any) => ({
                    id: p.id,
                    name: p.name || 'Sem Nome',
                    email: p.email,
                    role: p.role,
                    avatar_url: p.avatar_url,
                    home_city: p.home_city || 'Recife'
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
        return trips.filter(t => t.userId === techId);
    };

    const getLastLocation = (techTrips: Trip[]) => {
        const now = new Date();
        const activeTrip = techTrips.find(t => {
            if (t.status !== 'in_progress') return false;
            const start = t.startDate ? new Date(t.startDate) : new Date(0);
            return now >= start;
        });

        if (activeTrip) {
            for (const visit of activeTrip.visits) {
                const hasActiveSession = visit.sessions.some(s => !s.endAt);
                if (hasActiveSession) {
                    const campus = campuses.find(c => c.id === visit.campusId);
                    if (campus) {
                        return { city: campus.name, status: 'Em Atendimento', tripName: activeTrip.title };
                    }
                }
            }

            const events: { date: Date; location: string }[] = [];
            activeTrip.legs.forEach(leg => {
                const legDateStr = leg.date ? `${leg.date}T${leg.time || '00:00'}` : '';
                const legDate = legDateStr ? new Date(legDateStr) : new Date(0);
                events.push({ date: legDate, location: leg.to });
            });

            activeTrip.visits.forEach(visit => {
                const campus = campuses.find(c => c.id === visit.campusId);
                if (campus && visit.sessions.length > 0) {
                    const latestSession = [...visit.sessions].sort((a,b) => 
                        new Date(b.startAt || 0).getTime() - new Date(a.startAt || 0).getTime()
                    )[0];
                    if (latestSession && latestSession.startAt) {
                        events.push({ date: new Date(latestSession.startAt), location: campus.name });
                    }
                }
            });

            if (events.length > 0) {
                const latestEvent = events.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
                return { city: latestEvent.location, status: 'Em Viagem', tripName: activeTrip.title };
            }

            return { city: activeTrip.originCity, status: 'Em Viagem', tripName: activeTrip.title };
        }

        // Use the technician's home city instead of a hardcoded "Base"
        const techId = techTrips[0]?.userId || (techTrips as any)._techId; 
        const tech = technicians.find(t => t.id === techId);
        return { city: tech?.home_city || 'Recife', status: 'Disponível', tripName: '-' };
    };

    const getTrajectory = (activeTrip: Trip, currentCity: string): TrajectoryPoint[] => {
        const trajectory: TrajectoryPoint[] = [];
        
        // 1. Start with Origin
        trajectory.push({ city: activeTrip.originCity, status: 'past' });

        // 2. Add Itinerary Cities
        const plannedCities = activeTrip.itinerary
            .sort((a, b) => a.order - b.order)
            .map(item => campuses.find(c => c.id === item.campusId)?.city)
            .filter(Boolean) as string[];

        // 3. Determine status based on currentCity
        // If currentCity is not in plannedCities or origin, we might be "in between" or at a new place.
        // We'll find the last "past" city.
        
        let foundCurrent = false;
        
        // Check if origin is the current city
        if (activeTrip.originCity === currentCity) {
            trajectory[0].status = 'current';
            foundCurrent = true;
        }

        plannedCities.forEach((city) => {
            let status: 'past' | 'current' | 'future' = 'future';
            
            if (!foundCurrent) {
                if (city === currentCity) {
                    status = 'current';
                    foundCurrent = true;
                } else {
                    status = 'past';
                }
            }
            
            trajectory.push({ city, status });
        });

        return trajectory;
    };

    const techLocations = useMemo(() => {
        return technicians.map(tech => {
            const techTrips = getTechTrips(tech.id);
            // Pass tech ID context if needed
            (techTrips as any)._techId = tech.id;
            const location = getLastLocation(techTrips);
            
            let trajectory: TrajectoryPoint[] | undefined = undefined;
            const activeTrip = techTrips.find(t => t.status === 'in_progress');
            if (activeTrip) {
                trajectory = getTrajectory(activeTrip, location.city);
            }

            return {
                tech,
                ...location,
                trajectory
            };
        });
    }, [technicians, trips, campuses]);

    const filteredLocations = techLocations.filter(loc =>
        loc.tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateBase = async () => {
        if (!editingTech || !newHomeCity.trim()) return;

        try {
            setIsUpdatingBase(true);
            const { error } = await supabase
                .from('profiles')
                .update({ home_city: newHomeCity.trim() })
                .eq('id', editingTech.id);

            if (error) throw error;

            setTechnicians(prev => prev.map(t => 
                t.id === editingTech.id ? { ...t, home_city: newHomeCity.trim() } : t
            ));

            toast.success(`Base de ${editingTech.name} atualizada!`);
            setEditingTech(null);
        } catch (error: any) {
            console.error('Error updating base:', error);
            toast.error('Erro ao atualizar cidade base');
        } finally {
            setIsUpdatingBase(false);
        }
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
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar técnico..."
                        className="pl-8 bg-white/5 border-white/10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                    <Button 
                        variant={viewMode === 'grid' ? "default" : "ghost"}
                        size="sm"
                        className={cn("rounded-xl px-4", viewMode === 'grid' ? "shadow-lg shadow-primary/20" : "")}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Cards
                    </Button>
                    <Button 
                        variant={viewMode === 'map' ? "default" : "ghost"}
                        size="sm"
                        className={cn("rounded-xl px-4", viewMode === 'map' ? "shadow-lg shadow-primary/20" : "")}
                        onClick={() => setViewMode('map')}
                    >
                        <Globe className="w-4 h-4 mr-2" />
                        Mapa
                    </Button>
                </div>
            </div>

            {/* Technicians Grid */}
            {viewMode === 'grid' ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredLocations.map(({ tech, city, status, tripName }) => {
                        const isTraveling = status === 'Em Viagem';
                        const techTrips = getTechTrips(tech.id);
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
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <CardTitle className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors truncate">{tech.name}</CardTitle>
                                            {isAdmin && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 flex-shrink-0 rounded-full border border-white/5 hover:bg-white/10"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingTech(tech);
                                                        setNewHomeCity(tech.home_city || '');
                                                    }}
                                                >
                                                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            )}
                                        </div>
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
                                        {(isTraveling || status === 'Em Atendimento') && (
                                            <div className="flex items-center text-sm font-bold text-muted-foreground/80">
                                                <MapPin className="mr-1.5 h-4 w-4 text-primary" />
                                                {city}
                                            </div>
                                        )}
                                    </div>

                                    {status !== 'Disponível' ? (
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
                                            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-2xl transition-all border-white/5 hover:bg-white/10 group-hover:border-primary/50" 
                                            variant="outline"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Ver Detalhes <ArrowRight className="ml-2 h-3 w-3 stroke-[3]" />
                                        </MotionButton>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <TechnicianMap locations={filteredLocations} />
            )}

            {/* Edit Base Dialog */}
            <Dialog open={!!editingTech} onOpenChange={(open) => !open && setEditingTech(null)}>
                <DialogContent className="sm:max-w-md border-white/5 bg-[#0a0a0b]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white">Configurar Cidade Base</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={editingTech?.avatar_url} />
                                <AvatarFallback className="font-bold">{editingTech?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-white">{editingTech?.name}</div>
                                <div className="text-xs text-muted-foreground">{editingTech?.email}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="base-city" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cidade de Origem</Label>
                            <Input 
                                id="base-city"
                                placeholder="Recife, São Paulo, Paripiranga..."
                                value={newHomeCity}
                                onChange={(e) => setNewHomeCity(e.target.value)}
                                className="bg-white/5 border-white/10 rounded-xl h-12"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            className="rounded-xl"
                            onClick={() => setEditingTech(null)}
                            disabled={isUpdatingBase}
                        >
                            Cancelar
                        </Button>
                        <MotionButton
                            className="rounded-xl px-8 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90"
                            onClick={handleUpdateBase}
                            disabled={isUpdatingBase || !newHomeCity.trim()}
                        >
                            {isUpdatingBase ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Base'}
                        </MotionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
