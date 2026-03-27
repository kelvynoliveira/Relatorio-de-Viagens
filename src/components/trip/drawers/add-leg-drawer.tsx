'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DisplacementLeg, DisplacementLegSchema, Trip, TransportTypeEnum } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, fromInputDateTime, isDateInTripRange } from '@/lib/utils';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PhotoUploader } from '@/components/ui/photo-uploader';
import { Loader2 } from 'lucide-react';

interface AddLegDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    initialData?: DisplacementLeg | null;
}

export default function AddLegDrawer({ open, onOpenChange, tripId, initialData }: AddLegDrawerProps) {
    const { updateTrip, getTrip } = useTripStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DisplacementLeg>({
        resolver: zodResolver(DisplacementLegSchema) as any,
        defaultValues: {
            id: '',
            transportType: 'car',
            from: '',
            to: '',
            distanceKm: 0,
            cost: 0,
            description: '',
            photos: []
        }
    });

    // Reset form when opened or initialData changes
    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset(initialData);
            } else {
                form.reset({
                    id: generateId(),
                    transportType: 'car',
                    from: '',
                    to: '',
                    distanceKm: 0,
                    cost: 0,
                    date: new Date().toISOString(),
                    description: '',
                    photos: []
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: DisplacementLeg) => {
        const trip = getTrip(tripId);
        if (!trip) return;

        setIsSubmitting(true);

        // Ensure date is stored as UTC
        if (data.date) {
            data.date = fromInputDateTime(data.date);
        }

        // Date validation: must be within trip range
        const dateCheck = isDateInTripRange(data.date, trip);
        if (!dateCheck.isValid) {
            toast.error(dateCheck.message);
            setIsSubmitting(false);
            return;
        }

        // Safety check available for ID
        if (!data.id) {
            data.id = generateId();
        }

        let newLegs = [...(trip.legs || [])];

        if (initialData) {
            // Edit mode
            newLegs = newLegs.map(l => l.id === initialData.id ? data : l);
        } else {
            // Add mode
            newLegs.push(data);
        }

        try {
            await updateTrip(tripId, { legs: newLegs });
            toast.success(initialData ? 'Deslocamento atualizado!' : 'Deslocamento adicionado!');
            onOpenChange(false);
        } catch (error) {
            console.error('Error in AddLegDrawer:', error);
            // toast for error is handled in store, but we can add more context here if needed
        } finally {
            setIsSubmitting(false);
        }
    };

    const transportType = useWatch({ control: form.control, name: 'transportType' });

    // Types that use Distance (KM)
    const isDistance = ['car', 'other'].includes(transportType);

    // Types that use Cost (R$)
    const isCost = ['uber', 'bus', 'airplane', 'other'].includes(transportType);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] outline-none">
                <div className="mx-auto w-full max-w-sm flex flex-col h-full max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-white tracking-tight">{initialData ? 'Editar Deslocamento' : 'Registrar Deslocamento'}</DrawerTitle>
                        <DrawerDescription className="text-muted-foreground/80">{initialData ? 'Altere os dados do deslocamento.' : 'Quantos KM você rodou neste trecho?'}</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 px-6 pb-0 flex-1 overflow-auto scrollbar-hide">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="transportType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meio de Transporte</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/50 h-10">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white">
                                                    <SelectItem value="car">Carro da Empresa/Próprio</SelectItem>
                                                    <SelectItem value="uber">Uber/Táxi</SelectItem>
                                                    <SelectItem value="bus">Ônibus</SelectItem>
                                                    <SelectItem value="airplane">Avião</SelectItem>
                                                    <SelectItem value="other">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origem</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="De onde?" {...field} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destino</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Para onde?" {...field} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data</FormLabel>
                                                <FormControl>
                                                    <DateTimePicker
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                        showTime={false}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Horário</FormLabel>
                                                <FormControl>
                                                    <DateTimePicker
                                                        date={field.value ? new Date(`2000-01-01T${field.value}`) : undefined}
                                                        setDate={(date) => field.onChange(date ? format(date, 'HH:mm') : '')}
                                                        showCalendar={false}
                                                        showTime={true}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {isDistance && (
                                    <FormField
                                        control={form.control}
                                        name="distanceKm"
                                        render={({ field }) => (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                        Distância (KM)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">KM</span>
                                                            <CurrencyInput
                                                                placeholder="0,0"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                decimalScale={1}
                                                                className="text-2xl font-bold bg-white/5 border-emerald-500/30 focus:border-emerald-500 text-emerald-400 h-14 pr-10"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            </div>
                                        )}
                                    />
                                )}

                                {isCost && (
                                    <FormField
                                        control={form.control}
                                        name="cost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custo (R$)</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">R$</span>
                                                        <CurrencyInput
                                                            placeholder="0,00"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="text-lg font-bold pl-9 bg-white/5 border-white/10 focus:border-primary/50 text-white h-12"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição / Notas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Voo Latam, Uber para o hotel" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="photos"
                                    render={({ field }) => (
                                        <div className="pt-2">
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Comprovantes</FormLabel>
                                                <PhotoUploader
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                />
                                            </div>
                                        </div>
                                    )}
                                />

                                <div className="pt-4">
                                    <Button type="submit" className="w-full h-12 text-base font-semibold shadow-xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            'Salvar Deslocamento'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>

                    <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                            <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5">Cancelar</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
