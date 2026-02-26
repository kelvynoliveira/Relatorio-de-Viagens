'use client';

import { Trip, MobilityEntry, DisplacementLeg } from '@/lib/models';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTripStore } from '@/lib/store';
import { Plus, Car, Plane, Bus, MapPin, Receipt } from 'lucide-react';
import { formatDistance, formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import AddLegDrawer from '../drawers/add-leg-drawer';
import AddMobilityDrawer from '../drawers/add-mobility-drawer';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TabDisplacements({ trip, readonly = false }: { trip: Trip, readonly?: boolean }) {
    const { updateTrip } = useTripStore();
    const [isLegDrawerOpen, setIsLegDrawerOpen] = useState(false);
    const [isMobilityDrawerOpen, setIsMobilityDrawerOpen] = useState(false);
    const [editingLeg, setEditingLeg] = useState<DisplacementLeg | null>(null);
    const [editingMobility, setEditingMobility] = useState<MobilityEntry | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'leg' | 'mobility', id: string } | null>(null);

    const allMovements = [
        ...trip.legs.map(l => ({ ...l, _type: 'leg' as const })),
        ...(trip.mobilityEntries || []).map(m => ({ ...m, _type: 'mobility' as const }))
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'airplane': return <Plane className="w-5 h-5" />;
            case 'bus': return <Bus className="w-5 h-5" />;
            default: return <Car className="w-5 h-5" />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'airplane': return 'Voo';
            case 'bus': return 'Ônibus';
            case 'uber': return 'Uber/Táxi';
            case 'car': return 'Carro';
            default: return 'Outro';
        }
    };

    const handleEdit = (item: any) => {
        if (readonly) return;
        if (item._type === 'leg') {
            setEditingLeg(item);
            setIsLegDrawerOpen(true);
        } else {
            setEditingMobility(item);
            setIsMobilityDrawerOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !trip) return;

        try {
            if (itemToDelete.type === 'leg') {
                const newLegs = trip.legs.filter(l => l.id !== itemToDelete.id);
                await updateTrip(trip.id, { legs: newLegs });
                toast.success('Deslocamento removido.');
            } else {
                const newEntries = (trip.mobilityEntries || []).filter(e => e.id !== itemToDelete.id);
                await updateTrip(trip.id, { mobilityEntries: newEntries });
                toast.success('Gasto de mobilidade removido.');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Deslocamentos Realizados</h3>
                {!readonly && (
                    <div className="flex gap-2">
                        <Button onClick={() => { setEditingLeg(null); setIsLegDrawerOpen(true); }} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {allMovements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-white/5 rounded-3xl bg-black/20 backdrop-blur-xl transition-all duration-500 hover:bg-black/30 group">
                        <div className="bg-primary/10 p-5 rounded-full text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                            <Car className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Inicie seu trajeto</h4>
                        <p className="text-muted-foreground max-w-[280px] mb-8 leading-relaxed">
                            Registre seus deslocamentos e gastos de mobilidade para acompanhar sua jornada.
                        </p>
                        {!readonly && (
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <Button onClick={() => { setEditingLeg(null); setIsLegDrawerOpen(true); }} className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                                    <Plus className="w-4 h-4 mr-2" /> Registrar Deslocamento
                                </Button>
                                <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-all" onClick={() => { setEditingMobility(null); setIsMobilityDrawerOpen(true); }}>
                                    <Plus className="w-4 h-4 mr-2" /> Gasto de Mobilidade
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    allMovements
                        .sort((a, b) => {
                            const dateA = a.date ? new Date(a.date).getTime() : Infinity;
                            const dateB = b.date ? new Date(b.date).getTime() : Infinity;
                            return dateA - dateB;
                        })
                        .map((item, idx) => (
                            <Card key={item.id || idx} className="group relative border-0 bg-black/20 backdrop-blur-xl ring-1 ring-white/5 hover:ring-primary/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {!readonly && (
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-20">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 hover:bg-primary/20 hover:text-primary rounded-lg backdrop-blur-md" onClick={() => handleEdit(item)}>
                                            <span className="sr-only">Editar</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 hover:bg-red-500/20 hover:text-red-400 rounded-lg backdrop-blur-md" onClick={() => setItemToDelete({ type: item._type, id: item.id })}>
                                            <span className="sr-only">Excluir</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </Button>
                                    </div>
                                )}
                                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3 rounded-xl text-primary mt-1 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                            {item._type === 'mobility' ? <Receipt className="w-5 h-5" /> : getIcon(item.transportType)}
                                        </div>
                                        <div className="w-full space-y-1">
                                            <div className="font-bold text-lg flex items-center gap-2 flex-wrap">
                                                {item._type === 'leg' ? (
                                                    <>{item.from} <span className="text-muted-foreground/50">→</span> {item.to}</>
                                                ) : (
                                                    <>{item.from && item.to ? <>{item.from} <span className="text-muted-foreground/50">→</span> {item.to}</> : (item.location || item.description || 'Mobilidade')}</>
                                                )}
                                                {item.date && (
                                                    <Badge variant="outline" className="ml-auto font-mono text-[10px] hidden sm:flex bg-white/5 border-white/10 text-muted-foreground">
                                                        {new Date(item.date).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex gap-3 items-center flex-wrap">
                                                <Badge variant="secondary" className="text-xs font-normal bg-white/5 hover:bg-white/10 transition-colors">
                                                    {getLabel(item.transportType)}
                                                </Badge>
                                                {item._type === 'leg' && item.distanceKm != null && item.distanceKm > 0 && (
                                                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-white/20" /> {formatDistance(item.distanceKm)}</span>
                                                )}
                                                {item._type === 'mobility' && item.amount != null && item.amount > 0 && (
                                                    <span className="font-bold text-emerald-400 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-white/20" /> {formatCurrency(item.amount)}</span>
                                                )}
                                                {item.date && (
                                                    <span className="sm:hidden flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-white/20" /> {new Date(item.date).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                )}
            </div>

            <AddLegDrawer
                open={isLegDrawerOpen}
                onOpenChange={setIsLegDrawerOpen}
                tripId={trip.id}
                initialData={editingLeg}
            />

            <AddMobilityDrawer
                open={isMobilityDrawerOpen}
                onOpenChange={setIsMobilityDrawerOpen}
                tripId={trip.id}
                initialData={editingMobility}
            />

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro será removido permanentemente do banco de dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
