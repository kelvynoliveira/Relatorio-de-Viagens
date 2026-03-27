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
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
                    role: data.role,
                    avatar_url: data.avatar_url
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
    const now = new Date();
    const activeTrip = userTrips.find(t => {
        if (t.status !== 'in_progress') return false;
        const start = new Date(t.startDate);
        return now >= start;
    });

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
            <Card className="glass-card border-white/5 rounded-[3rem] overflow-hidden relative group">
                {/* Accent glow based on status */}
                <div className={cn(
                    "absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-20",
                    activeTrip ? "bg-blue-500" : "bg-emerald-500"
                )} />

                <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <Avatar className="h-32 w-32 text-3xl border-8 border-white/5 shadow-2xl ring-4 ring-white/5">
                        <AvatarImage src={technician.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-black">
                            {technician.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="space-y-1">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{technician.name}</h2>
                            <p className="text-muted-foreground text-lg font-medium">
                                {technician.role === 'admin' ? 'Administrador' : 'Técnico de Campo'} • <span className="text-primary/80">{technician.email}</span>
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em]",
                                activeTrip ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", activeTrip ? "bg-blue-400" : "bg-emerald-400")} />
                                {technicianStatus}
                            </div>
                            
                            {activeTrip && (
                                <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground/80">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span>Atualmente em: <strong className="text-white">{currentLocation}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-1 px-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
                        <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Viagens Totais</div>
                        <div className="text-5xl font-black text-white leading-none">{userTrips.length}</div>
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
