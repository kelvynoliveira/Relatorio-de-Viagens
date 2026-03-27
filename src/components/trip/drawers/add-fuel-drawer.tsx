'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FuelEntry, FuelEntrySchema } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { generateId, fromInputDateTime, isDateInTripRange, parseISOAsLocal, toLocalISOString } from '@/lib/utils';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PhotoUploader } from '@/components/ui/photo-uploader';
import { Loader2 } from 'lucide-react';
import { ReceiptScanner } from '@/components/trip/receipt-scanner';

interface AddFuelDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    initialData?: FuelEntry | null;
}

export default function AddFuelDrawer({ open, onOpenChange, tripId, initialData }: AddFuelDrawerProps) {
    const { updateTrip, getTrip } = useTripStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FuelEntry>({
        resolver: zodResolver(FuelEntrySchema) as any,
        defaultValues: {
            id: '',
            liters: 0,
            pricePaid: 0,
            pricePerLiter: 0,
            location: '',
            odometer: 0,
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
                    liters: 0,
                    pricePaid: 0,
                    pricePerLiter: 0,
                    location: '',
                    odometer: 0,
                    date: new Date().toISOString(),
                    photos: []
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: FuelEntry) => {
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

        // Calculate total pricePaid based on liters * pricePerLiter
        // The form binds to pricePerLiter now.
        const pricePerLiter = data.pricePerLiter || 0;
        const totalPaid = data.liters * pricePerLiter;

        const entryData = {
            ...data,
            pricePaid: totalPaid,
            pricePerLiter: pricePerLiter
        };

        let newEntries = [...trip.fuelEntries];
        if (initialData) {
            newEntries = newEntries.map(e => e.id === initialData.id ? entryData : e);
        } else {
            newEntries.push(entryData);
        }

        try {
            await updateTrip(tripId, { fuelEntries: newEntries });
            toast.success(initialData ? 'Abastecimento atualizado!' : `Abastecimento de R$ ${totalPaid.toFixed(2)} registrado!`);
            onOpenChange(false);
        } catch (error) {
            console.error('Error in AddFuelDrawer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] outline-none">
                <div className="mx-auto w-full max-w-sm flex flex-col h-full max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-white tracking-tight">{initialData ? 'Editar Abastecimento' : 'Registrar Abastecimento'}</DrawerTitle>
                        <DrawerDescription className="text-muted-foreground/80">{initialData ? 'Altere os dados do abastecimento.' : 'Lance o valor total do tanque.'}</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 px-6 pb-0 flex-1 overflow-auto scrollbar-hide">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-4">
                                    <ReceiptScanner
                                        onScanComplete={(data, photo) => {
                                            if (data.totalAmount) {
                                                if (data.liters) {
                                                    form.setValue('liters', data.liters);
                                                    form.setValue('pricePerLiter', data.totalAmount / data.liters);
                                                } else {
                                                    const currentLiters = form.getValues('liters');
                                                    if (currentLiters > 0) {
                                                        form.setValue('pricePerLiter', data.totalAmount / currentLiters);
                                                    }
                                                }
                                            }
                                            if (data.date) {
                                                form.setValue('date', data.date);
                                            }
                                            if (data.location) {
                                                form.setValue('location', data.location);
                                            }
                                            
                                            // Add the photo to the list
                                            const currentPhotos = form.getValues('photos') || [];
                                            form.setValue('photos', [...currentPhotos, photo]);
                                            
                                            toast.info('Dados e comprovante extraídos!');
                                        }}
                                    />
                                    <div className="h-px bg-white/10 w-full" />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data e Hora</FormLabel>
                                            <FormControl>
                                                <div className="bg-white/5 border border-white/10 rounded-md p-1">
                                                    <DateTimePicker
                                                        date={field.value ? parseISOAsLocal(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date ? toLocalISOString(date) : '')}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="liters"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Litros (L)</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">L</span>
                                                        <CurrencyInput
                                                            placeholder="0,00"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            decimalScale={2}
                                                            className="text-lg font-bold bg-white/5 border-white/10 focus:border-primary/50 text-white h-10 pr-8"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pricePerLiter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preço/L (R$)</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">R$</span>
                                                        <CurrencyInput
                                                            placeholder="0,00"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            decimalScale={2}
                                                            className="text-lg font-bold pl-9 bg-white/5 border-white/10 focus:border-primary/50 text-white h-10"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Posto / Cidade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Shell Feira de Santana" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="odometer"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                                    Odômetro (KM)
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">KM</span>
                                                        <CurrencyInput
                                                            placeholder="0"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            decimalScale={0}
                                                            className="text-2xl font-bold bg-white/5 border-blue-500/30 focus:border-blue-500 text-blue-400 h-14"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                            'Salvar Abastecimento'
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
        </Drawer >
    );
}
