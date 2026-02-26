'use client';

import { useParams } from 'next/navigation';
import { useTripStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, CalendarDays, Clock } from 'lucide-react';
import Link from 'next/link';
import TripCard from '@/components/trip/trip-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function TechnicianDetailsPage() {
    const params = useParams();
    const userId = params.userId as string;
    const { trips, campuses } = useTripStore();
    const [technician, setTechnician] = useState<User | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            setIsLoadingProfile(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;

                setTechnician({
                    id: data.id,
                    name: data.name || 'Sem Nome',
                    email: data.email,
                    role: data.role
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        }
        fetchProfile();
    }, [userId]);

    // Filter trips by the userId from the URL (which corresponds to the technician)
    const userTrips = trips.filter(t => t.userId === userId);
    const activeTrip = userTrips.find(t => t.status === 'in_progress');
    // Show all OTHER trips in history, including other active ones if they exist (edge case)
    const pastTrips = userTrips.filter(t => t.id !== activeTrip?.id);

    const technicianStatus = activeTrip ? 'Em Viagem' : 'Disponível';
    const currentLocation = (() => {
        if (!activeTrip) return 'Base';

        // 1. Check legs (sorted by date)
        if (activeTrip.legs.length > 0) {
            const sortedLegs = [...activeTrip.legs].sort((a, b) =>
                new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            return sortedLegs[0].to;
        }

        // 2. Check latest visit
        if (activeTrip.visits.length > 0) {
            const latestVisit = activeTrip.visits[activeTrip.visits.length - 1];
            const campus = campuses.find((c: any) => c.id === latestVisit.campusId);
            if (campus) return campus.city;
        }

        return activeTrip.originCity;
    })();

    if (isLoadingProfile) {
        return <div className="flex items-center justify-center min-h-[400px]">Carregando perfil...</div>;
    }

    if (!technician) {
        return <div className="text-center py-20">Técnico não encontrado.</div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/manager/tracking">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Detalhes do Técnico</h1>
                </div>
            </div>

            {/* Technician Profile Header */}
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-20 w-20 text-xl border-4 border-muted">
                        <AvatarFallback>{technician.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                        <h2 className="text-2xl font-bold">{technician.name}</h2>
                        <p className="text-muted-foreground">{technician.role === 'admin' ? 'Administrador' : 'Técnico de Campo'} • {technician.email}</p>
                        <div className="flex gap-4 pt-2">
                            <div className="flex items-center text-sm gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-md">
                                <Clock className="w-4 h-4" />
                                <span>{technicianStatus}</span>
                            </div>
                            {activeTrip && (
                                <div className="flex items-center text-sm gap-1 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    <span>Atualmente em: <strong>{currentLocation}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[150px]">
                        <div className="text-sm text-muted-foreground">Viagens Totais</div>
                        <div className="text-2xl font-bold">{userTrips.length}</div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Viagem Atual</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4 mt-6">
                    {activeTrip ? (
                        <div className="border rounded-xl p-6 bg-card space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{activeTrip.title}</h3>
                                    <div className="flex items-center text-muted-foreground gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="w-4 h-4" />
                                            {new Date(activeTrip.startDate).toLocaleDateString()} - {activeTrip.endDate ? new Date(activeTrip.endDate).toLocaleDateString() : 'Em andamento'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {activeTrip.originCity}
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/manager/trips/${activeTrip.id}`}>
                                    <Button>Ver Roteiro Completo</Button>
                                </Link>
                            </div>

                            <Separator />

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-3">Últimas Atividades</h4>
                                    <div className="space-y-4">
                                        {/* Activity summary based on itinerary order */}
                                        {activeTrip.visits.length > 0 ? (
                                            [...activeTrip.visits]
                                                .sort((a, b) => {
                                                    const itemA = activeTrip.itinerary.find(i => i.campusId === a.campusId);
                                                    const itemB = activeTrip.itinerary.find(i => i.campusId === b.campusId);
                                                    return (itemA?.order || 0) - (itemB?.order || 0);
                                                })
                                                .slice(0, 3)
                                                .map((visit, i) => {
                                                    const campus = campuses.find(c => c.id === visit.campusId);
                                                    return (
                                                        <div key={i} className="flex gap-3 text-sm">
                                                            <div className={`w-2 h-2 mt-1.5 rounded-full ${visit.status === 'done' ? 'bg-green-500' : visit.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                            <div>
                                                                <p className="font-medium">
                                                                    {campus ? campus.name : 'Visita'}
                                                                </p>
                                                                <p className="text-muted-foreground text-xs uppercase">
                                                                    {visit.status === 'done' ? 'Concluída' : visit.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhuma visita registrada ainda.</p>
                                        )}
                                        {activeTrip.legs.length > 0 && (
                                            <div className="flex gap-3 text-sm">
                                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                                                <div>
                                                    <p className="font-medium">Deslocamento</p>
                                                    <p className="text-muted-foreground">Para: {activeTrip.legs[activeTrip.legs.length - 1].to}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Resumo Financeiro</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Combustível</div>
                                            <div className="font-bold">R$ {activeTrip.fuelEntries.reduce((a, b) => a + b.pricePaid, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Alimentação</div>
                                            <div className="font-bold">R$ {(activeTrip.foodEntries || []).reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Pedágios</div>
                                            <div className="font-bold">R$ {activeTrip.tollEntries.reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Outros</div>
                                            <div className="font-bold">R$ {(activeTrip.otherEntries || []).reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground">O técnico não está em nenhuma viagem no momento.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastTrips.map(trip => (
                            <TripCard key={trip.id} trip={trip} readonly={true} />
                        ))}
                    </div>
                    {pastTrips.length === 0 && (
                        <p className="text-muted-foreground italic">Nenhum histórico disponível.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
