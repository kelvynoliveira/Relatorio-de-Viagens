'use client';

import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTripStore } from '@/lib/store';
import { DEFAULT_SCOPE_ITEMS } from '@/lib/constants';
import { Play, Square, Plus, Camera, Minus, Trash2, Clock, Loader2, X } from 'lucide-react';
import { formatDuration, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CampusVisit, PhotoEntry } from '@/lib/models';
import { PhotoUploader } from '@/components/ui/photo-uploader';

interface CampusVisitDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    visitId: string;
}

export default function CampusVisitDrawer({ open, onOpenChange, tripId, visitId }: CampusVisitDrawerProps) {
    const { getTrip, updateCampusVisit, campuses } = useTripStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const trip = getTrip(tripId);
    const visitIndex = trip?.visits.findIndex(v => v.id === visitId);
    const visit = visitIndex !== undefined && visitIndex >= 0 ? trip?.visits[visitIndex] : undefined;

    const campus = visit ? campuses.find(c => c.id === visit.campusId) : undefined;

    const [manualStartTime, setManualStartTime] = useState('');
    const [manualEndTime, setManualEndTime] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Local State for Draft Editing (No Auto-Save)
    const [localScope, setLocalScope] = useState<any[]>([]);
    const [localPhotos, setLocalPhotos] = useState<PhotoEntry[]>([]);

    const loadedVisitId = useRef<string | null>(null);

    // Sync local state when visit loads or opens
    useEffect(() => {
        if (!open) {
            loadedVisitId.current = null;
            return;
        }

        if (visit && loadedVisitId.current !== visit.id) {
            setLocalScope(visit.scope || []);
            setLocalPhotos(visit.photos || []);
            loadedVisitId.current = visit.id;
        }
    }, [visit, open]);

    // Initialize scope if empty (One-time, can still be auto-save or just local init)
    // We'll init locally if empty.
    useEffect(() => {
        if (open && visit && (!visit.scope || visit.scope.length === 0) && localScope.length === 0) {
            const newScope = DEFAULT_SCOPE_ITEMS.map((t: any) => ({ ...t, qty: 0 }));
            setLocalScope(newScope);
        }
    }, [visit, open, localScope.length]);

    if (!trip || !visit || !campus) return null;

    // --- Logic ---

    const activeSessionIndex = visit.sessions.findIndex(s => !s.endAt);
    const isWorking = activeSessionIndex >= 0;

    const handleStartSession = () => {
        if (isWorking) {
            toast.error('Já existe um atendimento em andamento.');
            return;
        }

        const newSessions = [...visit.sessions, {
            id: generateId(),
            startAt: new Date().toISOString(),
            // endAt should be undefined for active sessions per schema
        }];
        updateVisit({ sessions: newSessions, status: 'in_progress' });
        toast.success('Atendimento iniciado!');
    };

    const handleEndSession = () => {
        if (activeSessionIndex === -1) return;
        const newSessions = [...visit.sessions];
        newSessions[activeSessionIndex] = {
            ...newSessions[activeSessionIndex],
            endAt: new Date().toISOString()
        };
        updateVisit({ sessions: newSessions });
        toast.success('Sessão finalizada.');
    };

    const updateVisit = async (updates: Partial<CampusVisit>) => {
        setIsSubmitting(true);
        try {
            await updateCampusVisit(tripId, visitId, updates);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScopeChange = (itemLabel: string, delta: number) => {
        setLocalScope(prev => prev.map(item => {
            if (item.label === itemLabel) {
                return { ...item, qty: Math.max(0, item.qty + delta) };
            }
            return item;
        }));
    };

    const calculateTotalTime = () => {
        let totalMin = 0;
        visit.sessions.forEach(s => {
            if (!s.startAt) return;
            const end = s.endAt ? new Date(s.endAt as string).getTime() : new Date().getTime();
            const start = new Date(s.startAt as string).getTime();
            totalMin += (end - start) / 1000 / 60;
        });
        return Math.floor(totalMin);
    };

    // Photo upload handled by PhotoUploader component directly

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 bg-black/60 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] outline-none sm:rounded-2xl overflow-hidden">
                <DialogHeader className="flex-none p-6 pb-4 border-b border-white/5 bg-primary/10 backdrop-blur-xl z-20">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-4">
                                {campus.name}
                            </DialogTitle>
                            <div className="flex items-center gap-3">
                                <Badge variant={visit.status === 'done' ? 'default' : 'outline'} className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${visit.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : visit.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-pulse' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                                    {visit.status === 'in_progress' ? 'Em Andamento' :
                                        visit.status === 'done' ? 'Concluído' : 'Pendente'}
                                </Badge>
                                <span className="h-1 w-1 rounded-full bg-white/10" />
                                <DialogDescription className="flex items-center gap-3 text-muted-foreground/60 m-0">
                                    <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                                        {campus.city}
                                    </span>
                                    {calculateTotalTime() > 0 && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-white/10" />
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/80">
                                                <Clock className="w-3 h-3" />
                                                {formatDuration(calculateTotalTime())}
                                            </span>
                                        </>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-8 scrollbar-hide">

                    {/* 1. Time Tracking */}
                    <div className="bg-primary/5 backdrop-blur-sm p-5 rounded-2xl border border-white/5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                        <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground/50">
                            <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
                            Registro de Ponto
                        </h3>

                        <div className="flex gap-3">
                            {!isWorking ? (
                                <div className="flex-1 flex gap-3">
                                    <Button className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-900/20 font-bold uppercase tracking-wide text-xs transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleStartSession}>
                                        <Play className="w-3.5 h-3.5 mr-2 fill-current" /> Iniciar
                                    </Button>
                                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 px-4 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 text-muted-foreground font-semibold uppercase tracking-wide text-xs transition-all">
                                                <Clock className="w-3.5 h-3.5 mr-2" /> Manual
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-black/90 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-white">Adicionar Tempo Manual</h4>
                                                    <p className="text-xs text-muted-foreground/70">
                                                        Insira a duração do atendimento.
                                                    </p>
                                                </div>
                                                <div className="grid gap-3">
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="start" className="text-xs font-bold uppercase text-muted-foreground">Início</Label>
                                                        <Input
                                                            id="start"
                                                            type="time"
                                                            value={manualStartTime}
                                                            onChange={(e) => setManualStartTime(e.target.value)}
                                                            className="col-span-2 h-9 bg-white/5 border-white/10 text-white focus:border-primary/50 focus:bg-white/10 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="end" className="text-xs font-bold uppercase text-muted-foreground">Fim</Label>
                                                        <Input
                                                            id="end"
                                                            type="time"
                                                            value={manualEndTime}
                                                            onChange={(e) => setManualEndTime(e.target.value)}
                                                            className="col-span-2 h-9 bg-white/5 border-white/10 text-white focus:border-primary/50 focus:bg-white/10 transition-colors"
                                                        />
                                                    </div>
                                                    <Button size="sm" onClick={() => {
                                                        if (manualStartTime && manualEndTime) {
                                                            const now = new Date();
                                                            const [startH, startM] = manualStartTime.split(':').map(Number);
                                                            const [endH, endM] = manualEndTime.split(':').map(Number);

                                                            const start = new Date(now);
                                                            start.setHours(startH, startM, 0, 0);

                                                            const end = new Date(now);
                                                            end.setHours(endH, endM, 0, 0);

                                                            if (end < start) {
                                                                toast.error('A hora final deve ser após a inicial');
                                                                return;
                                                            }

                                                            const newSessions = [...visit.sessions, {
                                                                id: generateId(),
                                                                startAt: start.toISOString(),
                                                                endAt: end.toISOString()
                                                            }];

                                                            const newStatus = visit.status === 'pending' ? 'in_progress' : visit.status;

                                                            updateVisit({ sessions: newSessions, status: newStatus });
                                                            toast.success('Horário adicionado manual');
                                                            setIsPopoverOpen(false);
                                                            setManualStartTime('');
                                                            setManualEndTime('');
                                                        } else {
                                                            toast.error('Preencha os dois horários');
                                                        }
                                                    }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide text-xs">
                                                        Confirmar
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            ) : (
                                <Button className="w-full h-10 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 animate-pulse font-bold uppercase tracking-wide text-xs transition-all" onClick={handleEndSession}>
                                    <Square className="w-3.5 h-3.5 mr-2 fill-current" /> Parar Atendimento
                                </Button>
                            )}
                        </div>

                        {visit.sessions.length > 0 && (
                            <div className="space-y-1 mt-4 pt-3 border-t border-white/5">
                                {visit.sessions.map((s, i) => (
                                    <div key={s.id} className="flex justify-between text-xs text-muted-foreground/60 font-mono">
                                        <span>Sessão {i + 1}</span>
                                        <span>
                                            {s.startAt ? new Date(s.startAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            {' - '}
                                            {s.endAt ? new Date(s.endAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Scope */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground/70">
                            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
                            Escopo do Serviço
                        </h3>
                        <div className="space-y-3">
                            {localScope.map((item) => (
                                <div key={item.label} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 ${item.qty > 0 ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${item.qty > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                                        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-white rounded-md" onClick={() => handleScopeChange(item.label, -1)} disabled={item.qty === 0}>
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-12 h-7 text-center font-bold text-sm font-mono bg-transparent border-none p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white"
                                                value={item.qty.toString()}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setLocalScope(prev => prev.map(s => s.label === item.label ? { ...s, qty: isNaN(val) ? 0 : Math.max(0, val) } : s));
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-white rounded-md hover:bg-white/10" onClick={() => handleScopeChange(item.label, 1)}>
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Comment Input */}
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            className="flex-1 text-xs bg-black/20 border border-white/5 rounded-lg p-3 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-black/40 resize-none transition-colors"
                                            placeholder="Adicionar observação técnica..."
                                            rows={item.comment ? 2 : 1}
                                            value={item.comment || ''}
                                            onChange={(e) => {
                                                setLocalScope(prev => prev.map(s => s.label === item.label ? { ...s, comment: e.target.value } : s));
                                            }}
                                        />

                                        {/* Per-Item Photos */}
                                        <div className="mt-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Camera className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Evidências do Item</span>
                                            </div>
                                            <PhotoUploader
                                                value={item.photos || []}
                                                onChange={(photos) => {
                                                    setLocalScope(prev => prev.map(s => s.label === item.label ? { ...s, photos } : s));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Photos */}
                    <div className="space-y-4 pb-2">
                        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground/70">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                            Registro Fotográfico
                        </h3>
                        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                            <PhotoUploader
                                value={localPhotos}
                                onChange={(photos) => setLocalPhotos(photos)}
                            />
                        </div>
                    </div>

                </div>

                <DialogFooter className="flex-none p-6 pt-4 border-t border-white/5 bg-black/20 backdrop-blur-3xl z-10 sm:justify-between sm:items-center">
                    <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            className="h-12 text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                    await updateVisit({
                                        scope: localScope,
                                        photos: localPhotos
                                    });
                                    toast.success('Dados salvos com sucesso!');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                        </Button>
                        <Button
                            className="h-12 text-base font-semibold shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                            variant={visit.status === 'done' ? 'outline' : 'default'}
                            disabled={isSubmitting}
                            onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                    await updateVisit({
                                        status: 'done',
                                        scope: localScope,
                                        photos: localPhotos
                                    });
                                    toast.success('Campus finalizado!');
                                    onOpenChange(false);
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                visit.status === 'done' ? 'Atualizar Dados' : 'Concluir Atendimento'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
