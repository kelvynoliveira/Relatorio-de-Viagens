'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MobilityEntry, MobilityEntrySchema } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
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

interface AddMobilityDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    initialData?: MobilityEntry | null;
}

export default function AddMobilityDrawer({ open, onOpenChange, tripId, initialData }: AddMobilityDrawerProps) {
    const { updateTrip, getTrip } = useTripStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<MobilityEntry>({
        resolver: zodResolver(MobilityEntrySchema) as any,
        defaultValues: {
            id: '',
            amount: 0,
            from: '',
            to: '',
            location: '',
            description: '',
            date: new Date().toISOString(),
            transportType: 'uber',
            photos: []
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset(initialData);
            } else {
                form.reset({
                    id: generateId(),
                    amount: 0,
                    from: '',
                    to: '',
                    location: '',
                    description: '',
                    date: new Date().toISOString(),
                    transportType: 'uber',
                    photos: []
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: MobilityEntry) => {
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

        let newEntries = [...(trip.mobilityEntries || [])];
        if (initialData) {
            newEntries = newEntries.map(e => e.id === initialData.id ? data : e);
        } else {
            newEntries.push(data);
        }

        try {
            await updateTrip(tripId, { mobilityEntries: newEntries });
            toast.success(initialData ? 'Gasto de mobilidade atualizado!' : 'Gasto de mobilidade registrado!');
            onOpenChange(false);
        } catch (error) {
            console.error('Error in AddMobilityDrawer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] outline-none">
                <div className="mx-auto w-full max-w-sm flex flex-col h-full max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-white tracking-tight">{initialData ? 'Editar Mobilidade' : 'Registrar Mobilidade'}</DrawerTitle>
                        <DrawerDescription className="text-muted-foreground/80">{initialData ? 'Altere os dados da mobilidade.' : 'Valor gasto com Uber, Táxi, Aplicativos, etc.'}</DrawerDescription>
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
                                                    <SelectItem value="uber">Uber/Táxi/App</SelectItem>
                                                    <SelectItem value="bus">Ônibus/Metrô</SelectItem>
                                                    <SelectItem value="other">Outro (Barco, Moto, etc)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data e Hora</FormLabel>
                                            <FormControl>
                                                <div className="bg-white/5 border border-white/10 rounded-md p-1">
                                                    <DateTimePicker
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date ? date.toISOString() : '')}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor (R$)</FormLabel>
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

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origem</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cidade A" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
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
                                                    <Input placeholder="Cidade B" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição / Notas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Corrida para o evento, Voo da companhia X, etc." {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
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
                                            'Salvar Gasto'
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
