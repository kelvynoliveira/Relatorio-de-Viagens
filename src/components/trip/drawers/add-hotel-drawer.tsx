'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HotelEntry, HotelEntrySchema } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { generateId, fromInputDateTime, isDateInTripRange, parseISOAsLocal, toLocalISOString } from '@/lib/utils';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PhotoUploader } from '@/components/ui/photo-uploader';
import { Loader2 } from 'lucide-react';
import { ReceiptScanner } from '@/components/trip/receipt-scanner';

interface AddHotelDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    initialData?: HotelEntry | null;
}

export default function AddHotelDrawer({ open, onOpenChange, tripId, initialData }: AddHotelDrawerProps) {
    const { updateTrip, getTrip } = useTripStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<HotelEntry>({
        resolver: zodResolver(HotelEntrySchema) as any,
        defaultValues: {
            id: '',
            amount: 0,
            hotelName: '',
            location: '',
            description: '',
            date: new Date().toISOString(),
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
                    hotelName: '',
                    location: '',
                    description: '',
                    date: new Date().toISOString(),
                    photos: []
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: HotelEntry) => {
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

        let newEntries = [...(trip.hotelEntries || [])];
        if (initialData) {
            newEntries = newEntries.map(e => e.id === initialData.id ? data : e);
        } else {
            newEntries.push(data);
        }

        try {
            await updateTrip(tripId, { hotelEntries: newEntries });
            toast.success(initialData ? 'Hospedagem atualizada!' : 'Hospedagem registrada!');
            onOpenChange(false);
        } catch (error) {
            console.error('Error in AddHotelDrawer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] outline-none">
                <div className="mx-auto w-full max-w-sm flex flex-col h-full max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold text-white tracking-tight">{initialData ? 'Editar Hospedagem' : 'Registrar Hospedagem'}</DrawerTitle>
                        <DrawerDescription className="text-muted-foreground/80">{initialData ? 'Altere os dados da hospedagem.' : 'Lance os custos com hotel, pousada, etc.'}</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 px-6 pb-0 flex-1 overflow-auto scrollbar-hide">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-4">
                                    <ReceiptScanner
                                        onScanComplete={(data, photo) => {
                                            if (data.totalAmount) {
                                                form.setValue('amount', data.totalAmount);
                                            }
                                            if (data.date) {
                                                form.setValue('date', data.date);
                                            }
                                            if (data.location) {
                                                form.setValue('location', data.location);
                                                if (!form.getValues('hotelName')) {
                                                    form.setValue('hotelName', data.location);
                                                }
                                            }
                                            
                                            // Add photo to list
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

                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                    Valor (R$)
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors">R$</span>
                                                        <CurrencyInput
                                                            placeholder="0,00"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="text-lg font-bold pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white h-12"
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
                                    name="hotelName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome do Hotel</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Hotel Ibis Salvador" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cidade / Local</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Salvador, BA" {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Obs adicionais..." {...field} value={field.value ?? ''} className="bg-white/5 border-white/10 focus:border-primary/50 text-white" />
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
                                            'Salvar Hospedagem'
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
