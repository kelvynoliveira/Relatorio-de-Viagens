'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trip } from '@/lib/models';
import { generateId } from '@/lib/utils';
import { Plane, Plus, Trash2 } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { format } from 'date-fns';

export default function StepGeneral() {
    const { control } = useFormContext<Trip>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'plannedFlights',
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Main Info Card */}
            {/* Main Info Card */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-5 shadow-2xl ring-1 ring-white/5">
                <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
                                Título da Viagem
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Vistoria Tecnica AGES (Jacobina) - Março/26"
                                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md h-10"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                        control={control}
                        name="originCity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Cidade de Origem</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Recife"
                                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md h-10"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <FormField
                        control={control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Data Início</FormLabel>
                                <FormControl>
                                    <div className="group transition-all duration-300 focus-within:ring-1 focus-within:ring-primary/50 rounded-md">
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                            showTime={false}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Data Fim</FormLabel>
                                <FormControl>
                                    <div className="group transition-all duration-300 focus-within:ring-1 focus-within:ring-primary/50 rounded-md">
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                            showTime={false}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Observações (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Vistoria Tecnica, Acompanhamento de Obra, Chamados, etc."
                                    className="resize-none h-24 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Plane className="w-5 h-5 text-sky-600" /> Passagens Aéreas
                        </h3>
                        <p className="text-sm text-muted-foreground">Registre os voos planejados para esta viagem (Opcional).</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ id: generateId(), from: '', to: '', date: '', flightNumber: '', flightTime: '', price: 0 })}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Voo
                    </Button>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="bg-black/30 backdrop-blur-md border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden hover:shadow-lg hover:shadow-primary/5">
                            <CardContent className="p-5 pt-6 relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors z-10"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.from`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Origem</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: REC" {...field} className="h-9 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all font-mono tracking-wider" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.to`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Destino</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: GRU" {...field} className="h-9 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all font-mono tracking-wider" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.date`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Data do Voo</FormLabel>
                                                <FormControl>
                                                    <div className="group/date">
                                                        <DateTimePicker
                                                            date={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                            showTime={false}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.flightNumber`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Nº do Voo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: AD1234" {...field} value={field.value ?? ''} className="h-9 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all font-mono" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.flightTime`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Horário do Voo</FormLabel>
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
                                    <FormField
                                        control={control}
                                        name={`plannedFlights.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Valor da Passagem (R$)</FormLabel>
                                                <FormControl>
                                                    <div className="relative group/price">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs font-mono group-focus-within/price:text-primary transition-colors">R$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0,00"
                                                            className="h-9 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 pl-8 transition-all font-mono"
                                                            {...field}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            value={field.value === 0 ? '' : field.value}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {fields.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 bg-white/5 rounded-xl text-muted-foreground text-sm hover:bg-white/10 transition-colors">
                            <Plane className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                            <p>Nenhum voo registrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
