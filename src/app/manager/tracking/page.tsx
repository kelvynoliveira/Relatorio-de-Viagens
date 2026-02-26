'use client';

import { useTripStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, CalendarDays, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Trip } from '@/lib/models';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
                    role: p.role
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
        const activeTrip = techTrips.find(t => t.status === 'in_progress');
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTechnicians.map((tech) => {
                    const techTrips = getTechTrips(tech.id);
                    const { city, status, tripName } = getLastLocation(techTrips);
                    const isTraveling = status === 'Em Viagem';

                    return (
                        <Card key={tech.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-12 w-12 border-2 border-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {tech.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <CardTitle className="text-base truncate">{tech.name}</CardTitle>
                                    <CardDescription className="truncate">{tech.email}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant={isTraveling ? 'default' : 'secondary'} className={isTraveling ? 'bg-blue-600' : ''}>
                                        {status}
                                    </Badge>
                                    {isTraveling && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="mr-1 h-3 w-3" />
                                            {city}
                                        </div>
                                    )}
                                </div>

                                {isTraveling && (
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                                        <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Viagem Atual</div>
                                        <div className="font-medium truncate">{tripName}</div>

                                        {/* Progress using Real Trip Data */}
                                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                            <span>Gastos: R$ {techTrips.find(t => t.status === 'in_progress')?.fuelEntries.reduce((a: number, b: any) => a + b.pricePaid, 0).toFixed(2) || '0,00'}</span>
                                            <span>Fotos: {techTrips.find(t => t.status === 'in_progress')?.visits.reduce((a: number, b: any) => a + b.photos.length, 0) || 0}</span>
                                        </div>
                                    </div>
                                )}

                                <Link href={`/manager/tracking/${tech.id}`} className="block">
                                    <Button className="w-full" variant="outline">
                                        Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
