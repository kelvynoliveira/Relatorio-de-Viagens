'use client';

import { useParams } from 'next/navigation';
import { useTripStore } from '@/lib/store';
import { Button, MotionButton } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, CalendarDays, Clock, PenTool, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import TripCard from '@/components/trip/trip-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

    const userTrips = trips.filter(t => t.userId === userId);
    
    // Improved Status Logic: Status manual + Date Check
    const now = new Date();
    const activeTrip = userTrips.find(t => {
        if (t.status !== 'in_progress') return false;
        const start = new Date(t.startDate);
        return now >= start;
    });

    // Show all OTHER trips in history
    const pastTrips = userTrips.filter(t => t.id !== activeTrip?.id);

    const currentLocationData = (() => {
        if (!activeTrip) return { location: 'Base', status: 'Disponível' };

        // Priority 1: Check for an active session in any visit
        for (const visit of activeTrip.visits) {
            const hasActiveSession = visit.sessions.some(s => !s.endAt);
            if (hasActiveSession) {
                const campus = campuses.find(c => c.id === visit.campusId);
                if (campus) {
                    return { location: campus.name, status: 'Em Atendimento' };
                }
            }
        }

        // Priority 2: Get the most recent event (Leg or Visit)
        const events: { date: Date; location: string }[] = [];

        activeTrip.legs.forEach(leg => {
            const legDate = leg.date ? new Date(`${leg.date}T${leg.time || '00:00'}`) : new Date(0);
            events.push({ date: legDate, location: leg.to });
        });

        activeTrip.visits.forEach(visit => {
            const campus = campuses.find(c => c.id === visit.campusId);
            if (campus && visit.sessions.length > 0) {
                const latestSession = [...visit.sessions].sort((a, b) =>
                    new Date(b.startAt || 0).getTime() - new Date(a.startAt || 0).getTime()
                )[0];
                if (latestSession && latestSession.startAt) {
                    events.push({ date: new Date(latestSession.startAt), location: campus.name });
                }
            }
        });

        if (events.length > 0) {
            const latestEvent = events.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
            return { location: latestEvent.location, status: 'Em Viagem' };
        }

        return { location: activeTrip.originCity, status: 'Em Viagem' };
    })();

    const currentLocation = currentLocationData.location;
    const technicianStatus = currentLocationData.status;

    if (isLoadingProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Carregando perfil de elite...</p>
            </div>
        );
    }

    if (!technician) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
                <h2 className="text-2xl font-black text-white">Técnico não encontrado.</h2>
                <Link href="/manager/tracking" className="mt-4 block text-primary font-bold">Voltar ao rastreamento</Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <Link href="/manager/tracking">
                    <MotionButton 
                        variant="outline" 
                        size="icon" 
                        className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        whileHover={{ scale: 1.1, x: -2 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                    </MotionButton>
                </Link>
                <h1 className="text-4xl font-black tracking-tighter text-white">Detalhes do <span className="text-gradient">Técnico</span></h1>
            </div>

            {/* Technician Profile Header - Premium Redesign */}
            <Card className="glass-card border-white/5 rounded-[3.5rem] overflow-hidden relative group">
                <div className={cn(
                    "absolute -right-20 -top-20 w-[30rem] h-[30rem] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
                    activeTrip ? "bg-blue-600" : "bg-emerald-600"
                )} />

                <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="relative">
                        <Avatar className="h-40 w-40 text-4xl border-[12px] border-white/5 shadow-2xl ring-4 ring-white/5">
                            <AvatarImage src={technician.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-black">
                                {technician.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-[#0a0a0b] shadow-xl",
                            activeTrip ? "bg-blue-500" : "bg-emerald-500"
                        )} />
                    </div>

                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="space-y-2">
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-tight">{technician.name}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                <span className="text-primary font-black uppercase tracking-widest text-xs bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                    {technician.role === 'admin' ? 'Administrador' : 'Técnico de Campo'}
                                </span>
                                <span className="text-muted-foreground/60 font-medium text-sm">{technician.email}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                activeTrip 
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]" 
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full", activeTrip ? "bg-blue-400 animate-pulse" : "bg-emerald-400")} />
                                {technicianStatus}
                            </div>
                            
                            {activeTrip && (
                                <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 backdrop-blur-md">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span>Local: <strong className="text-white">{currentLocation}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end p-8 bg-black/40 border border-white/5 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl">
                        <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-2">Histórico</div>
                        <div className="flex items-baseline gap-2 text-white">
                            <span className="text-6xl font-black">{userTrips.length}</span>
                            <span className="text-sm font-bold text-muted-foreground/60 uppercase">Viagens</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-8 h-14">
                    <TabsTrigger value="active" className="rounded-xl px-10 font-bold data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Viagem Atual</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-10 font-bold data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Histórico Completo</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4 animate-in fade-in duration-500">
                    {activeTrip ? (
                        <div className="glass-card border-white/5 rounded-[3rem] p-10 md:p-14 space-y-12 overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                <CalendarDays className="w-40 h-40 text-white" />
                             </div>

                            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
                                <div className="space-y-4 max-w-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                        <h3 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tighter">{activeTrip.title}</h3>
                                    </div>
                                    <div className="flex flex-wrap items-center text-muted-foreground font-medium gap-6">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <CalendarDays className="w-4 h-4 text-primary" />
                                            <span className="text-sm tracking-tight">
                                                {new Date(activeTrip.startDate).toLocaleDateString()} — {activeTrip.endDate ? new Date(activeTrip.endDate).toLocaleDateString() : 'Em andamento'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="text-sm tracking-tight">{activeTrip.originCity}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/manager/trips/${activeTrip.id}`}>
                                    <MotionButton 
                                        className="h-16 px-10 rounded-2xl bg-primary text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Ver Roteiro <ArrowLeft className="ml-3 h-4 w-4 rotate-180 stroke-[3]" />
                                    </MotionButton>
                                </Link>
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 border-l-2 border-primary/30 pl-3">Linha do Tempo</h4>
                                    <div className="space-y-6">
                                        {activeTrip.visits.length > 0 ? (
                                            [...activeTrip.visits]
                                                .sort((a, b) => {
                                                    const itemA = activeTrip.itinerary.find(i => i.campusId === a.campusId);
                                                    const itemB = activeTrip.itinerary.find(i => i.campusId === b.campusId);
                                                    return (itemA?.order || 0) - (itemB?.order || 0);
                                                })
                                                .slice(0, 4)
                                                .map((visit, i) => {
                                                    const campus = campuses.find(c => c.id === visit.campusId);
                                                    return (
                                                        <div key={i} className="flex gap-5 items-center p-4 bg-white/2 rounded-[1.5rem] border border-transparent hover:border-white/5 transition-all">
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full shadow-lg",
                                                                visit.status === 'done' ? 'bg-emerald-500 shadow-emerald-500/20' : visit.status === 'in_progress' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-white/10'
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-white truncate text-lg">{campus ? campus.name : 'Unidade Técnica'}</p>
                                                                <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                                                    {visit.status === 'done' ? 'Fase Concluída' : visit.status === 'in_progress' ? 'Sendo Executado' : 'Aguardando Chegada'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="p-8 rounded-[2rem] border border-dashed border-white/5 text-center">
                                                <p className="text-sm font-bold text-muted-foreground/40 italic">Nenhuma atividade registrada na linha do tempo.</p>
                                            </div>
                                        )}
                                        {activeTrip.legs.length > 0 && (
                                            <div className="flex gap-5 items-center p-4 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                                                <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                                <div>
                                                    <p className="font-black text-white text-lg tracking-tight">Deslocamento em Curso</p>
                                                    <p className="text-primary/70 text-[10px] font-black uppercase tracking-widest">Destino: {activeTrip.legs[activeTrip.legs.length - 1].to}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 border-l-2 border-primary/30 pl-3">Visão Financeira</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/2 border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                                            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Combustível</div>
                                            <div className="text-2xl font-black text-white">R$ {activeTrip.fuelEntries.reduce((a, b: any) => a + b.pricePaid, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-white/2 border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                                            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Alimentação</div>
                                            <div className="text-2xl font-black text-white">R$ {(activeTrip.foodEntries || []).reduce((a, b: any) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-white/2 border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                                            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Pedágios</div>
                                            <div className="text-2xl font-black text-white">R$ {activeTrip.tollEntries.reduce((a, b: any) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-white/2 border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                                            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Outros</div>
                                            <div className="text-2xl font-black text-white">R$ {(activeTrip.otherEntries || []).reduce((a, b: any) => a + b.amount, 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 border-2 border-dashed border-white/5 rounded-[3rem] group">
                            <motion.div 
                                className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                <PenTool className="w-8 h-8 text-muted-foreground/30" />
                            </motion.div>
                            <p className="text-xl font-bold text-muted-foreground/40 tracking-tight">O técnico não está em nenhuma viagem ativa no momento.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-8 animate-in fade-in duration-500">
                    {pastTrips.length > 0 ? (
                        <div className="space-y-8">
                            {pastTrips.map(trip => (
                                <div key={trip.id} className="glass-card border-white/5 rounded-[3rem] p-10 md:p-14 space-y-12 overflow-hidden relative opacity-80 hover:opacity-100 transition-opacity group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CheckCircle2 className="w-40 h-40 text-emerald-500" />
                                    </div>

                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
                                        <div className="space-y-4 max-w-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tighter">{trip.title}</h3>
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase font-black tracking-widest text-[10px] py-1 px-3 rounded-full">Concluída</Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center text-muted-foreground font-medium gap-6">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                                    <CalendarDays className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm tracking-tight">
                                                        {new Date(trip.startDate).toLocaleDateString()} — {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '--'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm tracking-tight">{trip.originCity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/manager/trips/${trip.id}`}>
                                            <MotionButton 
                                                className="h-14 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-xs uppercase tracking-widest transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Ver Detalhes <ArrowRight className="ml-3 h-4 w-4 rotate-0 stroke-[3]" />
                                            </MotionButton>
                                        </Link>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 border-l-2 border-emerald-500/30 pl-3">Resumo da Missão</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                                                    <span className="text-sm font-bold text-muted-foreground">Atendimentos Realizados</span>
                                                    <span className="text-lg font-black text-white">{trip.visits.filter(v => v.status === 'done').length}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                                                    <span className="text-sm font-bold text-muted-foreground">Distância Total Percorrida</span>
                                                    <span className="text-lg font-black text-white">{trip.legs.reduce((a, b) => a + (b.distanceKm || 0), 0).toFixed(1)} KM</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 border-l-2 border-emerald-500/30 pl-3">Investimento Total</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Combustível', val: trip.fuelEntries.reduce((a, b: any) => a + b.pricePaid, 0) },
                                                    { label: 'Alimentação', val: (trip.foodEntries || []).reduce((a, b: any) => a + b.amount, 0) },
                                                    { label: 'Pedágios', val: trip.tollEntries.reduce((a, b: any) => a + b.amount, 0) },
                                                    { label: 'Outros', val: (trip.otherEntries || []).reduce((a, b: any) => a + b.amount, 0) }
                                                ].map(item => (
                                                    <div key={item.label} className="bg-white/2 border border-white/5 p-5 rounded-2xl">
                                                        <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">{item.label}</div>
                                                        <div className="text-xl font-black text-white">R$ {item.val.toFixed(2)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/5">
                            <p className="text-muted-foreground/60 font-medium italic">Ficha técnica limpa. Nenhum histórico disponível.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
