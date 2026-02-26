'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Trip } from '@/lib/models';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, ArrowUp, ArrowDown, Plus, Clock, BedDouble, DollarSign, CalendarCheck, MapPin } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTripStore } from '@/lib/store';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StepItinerary() {
    const { control } = useFormContext<Trip>();
    const { brands, campuses } = useTripStore();
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'itinerary',
    });

    // Local state for the "Add Stop" form
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedCampus, setSelectedCampus] = useState<string>('');
    const [plannedArrival, setPlannedArrival] = useState<Date | undefined>(undefined);
    const [plannedDeparture, setPlannedDeparture] = useState<Date | undefined>(undefined);
    const [hotelName, setHotelName] = useState<string>('');
    const [hotelCost, setHotelCost] = useState<string>('');

    const availableCampuses = campuses.filter(c => c.brandId === selectedBrand);

    const handleAddCampus = () => {
        if (!selectedCampus) return;

        if (!plannedArrival || !plannedDeparture) {
            toast.error('Por favor, selecione as datas de chegada e saída.', {
                className: 'bg-red-500/10 border-red-500/20 text-red-500'
            });
            return;
        }

        const nextOrder = fields.length + 1;
        append({
            campusId: selectedCampus,
            order: nextOrder,
            plannedArrival: plannedArrival ? plannedArrival.toISOString() : undefined,
            plannedDeparture: plannedDeparture ? plannedDeparture.toISOString() : undefined,
            hotelName: hotelName.trim() || undefined,
            hotelCost: hotelCost ? Number(hotelCost.replace(',', '.')) : undefined
        });

        // Reset form but keep brand selected
        setSelectedCampus('');
        setPlannedArrival(undefined);
        setPlannedDeparture(undefined);
        setHotelName('');
        setHotelCost('');
        toast.success('Parada adicionada com sucesso!', {
            className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
        });
    };

    const getCampusDetails = (id: string) => campuses.find(c => c.id === id);
    const getBrandName = (brandId: string) => brands.find(b => b.id === brandId)?.name;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* Glassmorphic Add Stop Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:bg-black/50 group">
                {/* Decorative background gradients */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500" />

                <div className="p-6 md:p-8 space-y-6 relative z-10">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Adicionar Parada</h3>
                            <p className="text-sm text-muted-foreground/80">Selecione o campus e o período de permanência.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1">Marca</label>
                            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white focus:ring-primary/50 hover:bg-white/10 transition-all">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950/95 border-white/10 backdrop-blur-xl">
                                    {brands.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="text-zinc-300 focus:bg-primary/20 focus:text-white cursor-pointer">{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 md:col-span-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1">Campus</label>
                            <Select
                                value={selectedCampus}
                                onValueChange={setSelectedCampus}
                                disabled={!selectedBrand}
                            >
                                <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white focus:ring-primary/50 hover:bg-white/10 transition-all disabled:opacity-50">
                                    <SelectValue placeholder="Selecione o campus..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950/95 border-white/10 backdrop-blur-xl">
                                    {availableCampuses.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="text-zinc-300 focus:bg-primary/20 focus:text-white cursor-pointer py-2">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{c.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {c.address ? c.address : (c.city ? c.city : 'Sem endereço')}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1 flex items-center gap-1.5">
                                <CalendarCheck className="w-3 h-3 text-emerald-500" /> Chegada Prevista
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-1 hover:border-white/20 transition-colors focus-within:ring-1 focus-within:ring-primary/50">
                                <DateTimePicker
                                    date={plannedArrival}
                                    setDate={setPlannedArrival}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1 flex items-center gap-1.5">
                                <CalendarCheck className="w-3 h-3 text-violet-500" /> Saída Prevista
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-1 hover:border-white/20 transition-colors focus-within:ring-1 focus-within:ring-primary/50">
                                <DateTimePicker
                                    date={plannedDeparture}
                                    setDate={setPlannedDeparture}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-black/40 px-2 text-[10px] text-muted-foreground uppercase tracking-widest">Opcional</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1 flex items-center gap-1.5">
                                <BedDouble className="w-3 h-3 text-indigo-400" /> Hospedagem
                            </label>
                            <Input
                                value={hotelName}
                                onChange={(e) => setHotelName(e.target.value)}
                                placeholder="Nome do Hotel"
                                className="h-11 bg-white/5 border-white/10 text-white focus:border-indigo-500/50 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-1 flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3 text-emerald-400" /> Custo Estimado
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                                <Input
                                    type="number"
                                    value={hotelCost}
                                    onChange={(e) => setHotelCost(e.target.value)}
                                    placeholder="0,00"
                                    className="h-11 pl-9 bg-white/5 border-white/10 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddCampus}
                        disabled={!selectedCampus}
                        className={cn(
                            "w-full h-12 text-base font-bold shadow-lg transition-all duration-300 mt-2",
                            !selectedCampus
                                ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
                        )}
                    >
                        <Plus className="w-5 h-5 mr-2" /> Adicionar ao Roteiro
                    </Button>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    Roteiro Definido
                    <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full font-mono">{fields.length}</span>
                </h3>
            </div>

            {/* Empty State */}
            {fields.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-12 text-center group transition-colors hover:border-white/20 hover:bg-white/[0.07]">
                    <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">Roteiro vazio</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Adicione os campi que você visitará para gerar a previsão de deslocamento e custos.
                    </p>
                </div>
            )}

            {/* List Items */}
            <div className="space-y-3">
                {fields.map((field, index) => {
                    const campus = getCampusDetails(field.campusId);

                    return (
                        <Card key={field.id} className="group relative overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
                            <CardContent className="p-0">
                                {/* Flex container for content */}
                                <div className="flex flex-col sm:flex-row">
                                    {/* Number Strip */}
                                    <div className="w-full sm:w-16 flex flex-row sm:flex-col items-center justify-center p-3 gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center gap-3">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg text-white leading-tight">
                                                    {campus ? campus.name : `ID: ${field.campusId.substring(0, 8)}...`}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    {campus && (
                                                        <>
                                                            <span className="font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{getBrandName(campus.brandId)}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {campus.city}/{campus.state}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid - Clean Layout */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                            {(field.plannedArrival || field.plannedDeparture) && (
                                                <div className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                    <div className="mt-1 p-1.5 bg-primary/10 rounded text-primary">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Período</p>
                                                        <div className="text-sm space-y-0.5">
                                                            <div className="flex items-center gap-2 text-zinc-300">
                                                                <span className="text-xs text-muted-foreground w-12">Chegada</span>
                                                                <span className="text-white font-medium">
                                                                    {field.plannedArrival
                                                                        ? format(new Date(field.plannedArrival), "dd/MM 'às' HH:mm", { locale: ptBR })
                                                                        : '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-zinc-300">
                                                                <span className="text-xs text-muted-foreground w-12">Saída</span>
                                                                <span className="text-white font-medium">
                                                                    {field.plannedDeparture
                                                                        ? format(new Date(field.plannedDeparture), "dd/MM 'às' HH:mm", { locale: ptBR })
                                                                        : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(field.hotelName || field.hotelCost) && (
                                                <div className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                    <div className="mt-1 p-1.5 bg-violet-500/10 rounded text-violet-400">
                                                        <BedDouble className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hospedagem</p>
                                                        <div className="text-sm space-y-0.5">
                                                            {field.hotelName && (
                                                                <span className="block text-white font-medium truncate max-w-[200px]" title={field.hotelName}>
                                                                    {field.hotelName}
                                                                </span>
                                                            )}
                                                            {field.hotelCost && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs text-muted-foreground">Custo:</span>
                                                                    <span className="text-emerald-400 font-bold font-mono">
                                                                        R$ {Number(field.hotelCost).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons (Right side on desktop, bottom on mobile) */}
                                    <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-white/10 divide-x sm:divide-x-0 sm:divide-y divide-white/10">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => move(index, index - 1)}
                                            disabled={index === 0}
                                            className="flex-1 sm:flex-none h-12 sm:h-auto sm:py-4 rounded-none hover:bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30"
                                            title="Mover para cima"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => move(index, index + 1)}
                                            disabled={index === fields.length - 1}
                                            className="flex-1 sm:flex-none h-12 sm:h-auto sm:py-4 rounded-none hover:bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30"
                                            title="Mover para baixo"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => remove(index)}
                                            className="flex-1 sm:flex-none h-12 sm:h-auto sm:py-4 rounded-none hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <input type="hidden" {...control.register('itinerary')} />
        </div>
    );
}
