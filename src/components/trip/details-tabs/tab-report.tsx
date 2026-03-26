'use client';

import { Trip } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, FileText, LayoutList, Settings2, Fuel, Coins, Utensils, Building2, CarFront, Receipt, Calendar, ArrowRight, Clock, MapPin, CheckCircle2, Circle, Plane, BedDouble, Bus } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { formatCurrency, formatDistance, formatDuration, cn } from '@/lib/utils';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

import { format } from 'date-fns';
import { ptBR, pt } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TabReport({ trip }: { trip: Trip }) {
    console.log('TabReport Locale Debug:', { ptBR, pt });
    const { campuses, user } = useTripStore();
    const [reportOptions, setReportOptions] = useState({
        fuel: false,
        tolls: false,
        food: false,
        mobility: true,
        hotel: true,
        flights: true,
        other: false,
    });

    const hasAnyOptionSelected = Object.values(reportOptions).some(Boolean);

    // Inject print styles for fixed header/footer margins
    const printStyles = `
        @media print {
            @page {
                margin-top: 5mm;
                margin-bottom: 20mm;
            }
            body {
                -webkit-print-color-adjust: exact;
            }
        }
    `;

    const handlePrint = () => {
        window.print();
    };


    const getCampus = (id: string) => campuses.find(c => c.id === id);

    const totalFuel = trip.fuelEntries.reduce((acc, curr) => acc + curr.pricePaid, 0);
    const totalTolls = trip.tollEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const totalFood = (trip.foodEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalHotel = (trip.hotelEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalOther = (trip.otherEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalDisplacementCost = (trip.legs || []).filter(l => l.transportType !== 'car').reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalMobilityEntries = (trip.mobilityEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalFlights = (trip.plannedFlights || []).reduce((acc, curr) => acc + (curr.price || 0), 0);

    const totalExpenses =
        (reportOptions.fuel ? totalFuel : 0) +
        (reportOptions.tolls ? totalTolls : 0) +
        (reportOptions.food ? totalFood : 0) +
        (reportOptions.hotel ? totalHotel : 0) +
        (reportOptions.other ? totalOther : 0) +
        (reportOptions.flights ? totalFlights : 0) +
        (reportOptions.mobility ? (totalDisplacementCost + totalMobilityEntries) : 0);

    const totalKm = trip.legs.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0);

    let totalMinutes = 0;
    trip.visits.forEach(v => {
        v.sessions.forEach(s => {
            const end = s.endAt ? new Date(s.endAt).getTime() : new Date().getTime();
            const start = s.startAt ? new Date(s.startAt).getTime() : 0;
            if (start > 0) {
                totalMinutes += (end - start) / 1000 / 60;
            }
        });
    });

    // --- SCREEN RENDERERS (Glassmorphism) ---

    const renderScreenConsolidated = () => (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" /> Horas Técnicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" /> Deslocamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{formatDistance(totalKm)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-sm relative overflow-hidden group md:col-span-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" /> Custo Total (Selecionado)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-3xl font-bold text-primary">{formatCurrency(totalExpenses)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Travel Logistics (Horizontal Timeline) */}
            <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Logística de Deslocamento</CardTitle>
                    <CardDescription>Cronograma da jornada</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex justify-between items-center w-full px-4 py-12">

                            {/* Origin Node */}
                            <div className="relative flex flex-col items-center flex-1 min-w-[100px] max-w-[200px] group">
                                <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                                <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-500 mb-0 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-4 ring-black/40" />
                                <div className="absolute -top-12 flex flex-col items-center w-full px-1">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Início</span>
                                    <span className="font-bold text-white text-lg w-full text-center truncate" title={trip.originCity}>
                                        {trip.originCity}
                                    </span>
                                </div>
                                <div className="absolute top-10 w-full text-center">
                                    <span className="text-xs font-mono text-muted-foreground">{trip.startDate ? format(new Date(trip.startDate), 'dd/MM', { locale: ptBR || pt }) : ''}</span>
                                </div>
                            </div>

                            {/* Legs Nodes */}
                            {[...trip.legs].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()).map((leg, i) => (
                                <div key={leg.id} className="relative flex flex-col items-center flex-1 min-w-[120px] max-w-[240px] group">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                                    <div className={cn(
                                        "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all group-hover:scale-110 group-hover:border-white/30 bg-black/40 backdrop-blur-sm",
                                        leg.transportType === 'airplane' ? "text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]" :
                                            leg.transportType === 'car' ? "text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.2)]" :
                                                leg.transportType === 'bus' ? "text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)]" : "text-gray-400"
                                    )}>
                                        {leg.transportType === 'airplane' ? <Plane className="w-5 h-5" /> :
                                            leg.transportType === 'car' ? <CarFront className="w-5 h-5" /> :
                                                leg.transportType === 'bus' ? <Bus className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                    </div>
                                    <div className="absolute -top-14 flex flex-col items-center w-full px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                            {leg.transportType === 'airplane' ? 'Voo' : leg.transportType === 'car' ? 'Carro' : 'Deslocamento'}
                                        </span>
                                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-white w-full">
                                            <span className="opacity-70 truncate max-w-[80px]" title={leg.from}>
                                                {leg.from.length > 12 ? leg.from.slice(0, 12) + '...' : leg.from}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-white/30 shrink-0" />
                                            <span className="truncate max-w-[80px]" title={leg.to}>
                                                {leg.to.length > 12 ? leg.to.slice(0, 12) + '...' : leg.to}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute top-16 w-full text-center">
                                        <span className="text-xs font-mono text-muted-foreground">{leg.date ? format(new Date(leg.date), 'dd/MM HH:mm', { locale: ptBR || pt }) : '-'}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Destination / End Node */}
                            <div className="relative flex flex-col items-center flex-1 min-w-[100px] max-w-[200px] group">
                                <div className="absolute top-1/2 left-0 w-1/2 h-0.5 bg-gradient-to-l from-white/50 to-white/10 -translate-y-1/2 z-0" />
                                <div className="relative z-10 w-4 h-4 rounded-full bg-white mb-0 shadow-[0_0_15px_rgba(255,255,255,0.5)] ring-4 ring-black/40" />
                                <div className="absolute -top-12 flex flex-col items-center w-full px-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fim</span>
                                    <span className="font-bold text-white text-lg">Conclusão</span>
                                </div>
                                <div className="absolute top-10 w-full text-center">
                                    <span className="text-xs font-mono text-muted-foreground">{trip.endDate ? format(new Date(trip.endDate), 'dd/MM', { locale: ptBR || pt }) : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expenses Breakdown */}
            <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Detalhamento de Custos</CardTitle>
                    <CardDescription>Resumo dos gastos selecionados para o relatório.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportOptions.fuel && totalFuel > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Fuel className="w-4 h-4 text-orange-500" /> Combustível</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalFuel)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.tolls && totalTolls > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-500" /> Pedágios</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalTolls)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.food && totalFood > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Utensils className="w-4 h-4 text-red-500" /> Alimentação</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalFood)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.hotel && totalHotel > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-500" /> Consumo na Hospedagem (Extras)</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalHotel)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.flights && totalFlights > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Plane className="w-4 h-4 text-sky-500" /> Passagens Aéreas</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalFlights)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.mobility && (totalDisplacementCost + totalMobilityEntries) > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><CarFront className="w-4 h-4 text-blue-500" /> Mobilidade</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalDisplacementCost + totalMobilityEntries)}</TableCell>
                                </TableRow>
                            )}
                            {reportOptions.other && totalOther > 0 && (
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-500" /> Outros</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalOther)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Itinerary Timeline */}
            <Card className="bg-background/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Roteiro Realizado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l border-border/50 ml-4 space-y-6">
                        {trip.itinerary.map((item, idx) => {
                            const c = getCampus(item.campusId);
                            const visit = trip.visits.find(v => v.campusId === c?.id);
                            return (
                                <div key={idx} className="mb-6 ml-6 relative group">
                                    <span className={cn(
                                        "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background transition-all",
                                        visit?.status === 'done' ? "bg-green-500 text-white" :
                                            visit?.status === 'in_progress' ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        {visit?.status === 'done' ? <CheckCircle2 className="w-3 h-3" /> :
                                            visit?.status === 'in_progress' ? <Clock className="w-3 h-3 animate-pulse" /> :
                                                <Circle className="w-3 h-3" />}
                                    </span>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                                        <div>
                                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                {c ? c.name : 'Unknown Campus'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{c ? `${c.city}/${c.state}` : ''}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("text-xs border-0", visit?.status === 'done' ? "bg-green-500/20 text-green-500" : visit?.status === 'in_progress' ? "bg-blue-500/20 text-blue-500" : "bg-zinc-500/20 text-zinc-500")}>
                                            {visit?.status === 'done' ? 'Realizado' : visit?.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div >
    );

    // Sort visits based on itinerary order
    const sortedVisits = trip.itinerary
        .map(item => trip.visits.find(v => v.campusId === item.campusId))
        .filter((v): v is typeof trip.visits[0] => !!v);

    const renderScreenTechnical = () => (
        <div className="space-y-6">
            {sortedVisits.map((visit, idx) => {
                const c = getCampus(visit.campusId);
                const campusTotalMin = visit.sessions.reduce((acc, s) => {
                    const e = s.endAt ? new Date(s.endAt).getTime() : new Date().getTime();
                    const st = s.startAt ? new Date(s.startAt).getTime() : 0;
                    return acc + (st > 0 ? (e - st) / 1000 / 60 : 0);
                }, 0);

                return (
                    <Card key={visit.id} className="bg-background/40 backdrop-blur-md border-white/10 shadow-lg overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-purple-500 opacity-70" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl">{c?.name}</CardTitle>
                                <CardDescription>{c?.city}/{c?.state}</CardDescription>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className="ml-2 font-mono">Ref: {visit.id.slice(0, 6)}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Status</span>
                                    <div className="text-lg font-medium mt-1 flex items-center gap-2">
                                        {visit.status === 'done' ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Concluído</span> :
                                            visit.status === 'in_progress' ? <span className="text-blue-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Em Andamento</span> :
                                                'Pendente'}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Tempo Total</span>
                                    <div className="text-lg font-mono mt-1">{formatDuration(campusTotalMin)}</div>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                                    <LayoutList className="w-4 h-4" /> Escopo Realizado
                                </h3>
                                <div className="space-y-2">
                                    {visit.scope.filter(s => s.qty > 0).length === 0 ? (
                                        <p className="italic text-muted-foreground text-sm pl-6">Nenhum item registrado.</p>
                                    ) : (
                                        visit.scope.filter(s => s.qty > 0).map(s => (
                                            <div key={s.label} className="flex flex-col p-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{s.label}</span>
                                                    <Badge variant="secondary" className="font-mono">x{s.qty}</Badge>
                                                </div>
                                                {s.comment && (
                                                    <div className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-primary/30">
                                                        {s.comment}
                                                    </div>
                                                )}
                                                {s.photos && s.photos.length > 0 && (
                                                    <div className="mt-3 grid grid-cols-4 gap-2">
                                                        {s.photos.map((p, i) => (
                                                            <div key={p.id} className="relative aspect-video rounded-sm overflow-hidden border border-white/10 group">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={p.url}
                                                                    alt={`Evidência ${s.label} ${i + 1}`}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                                    <Settings2 className="w-4 h-4" /> Evidências
                                </h3>
                                {visit.photos.length === 0 ? (
                                    <p className="italic text-muted-foreground text-sm pl-6">Nenhuma foto registrada.</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {visit.photos.map((p, i) => (
                                            <div key={p.id} className="relative aspect-video rounded-md overflow-hidden border border-white/10 group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.url}
                                                    alt={`Evidência ${i + 1}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                />
                                                {p.description && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                                                        <p className="text-[10px] text-white font-medium text-center truncate">{p.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );

    // --- PRINT RENDERERS (Legacy / Clean White) ---

    // Keep existing renderConsolidated and renderTechnical for print, renamed slightly to avoid conflict if needed, or just use them inside the print block.
    // actually, I can just copy the previous implementation for print logic and wrap it in `renderPrintConsolidated` etc.

    const renderPrintConsolidated = () => (
        <div className="bg-white text-black p-8 shadow-sm border rounded-lg min-h-[29.7cm] print:min-h-0 print:shadow-none print:border-none print:w-full print:p-0">
            {/* Print Header (Spacer for Fixed Header) */}
            <div className="h-[25mm] print:block hidden" />

            {/* Trip Title */}
            <div className="border-b-2 border-primary pb-2 mb-6 mt-4">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-primary">Relatório de Viagem</h1>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0">
                <div>
                    <span className="block text-xs font-bold uppercase text-gray-500">Título</span>
                    <span className="text-lg font-medium">{trip.title}</span>
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase text-gray-500">Período</span>
                    <span className="text-lg font-medium">
                        {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '-'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '-'}
                    </span>
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase text-gray-500">Origem</span>
                    <span className="text-lg font-medium">{trip.originCity}</span>
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase text-gray-500">Status</span>
                    <span className="text-lg font-medium uppercase">{trip.status}</span>
                </div>
            </div>

            {/* Logistics Sequence (Horizontal for Print) */}
            <div className="mb-8 p-4 border rounded-lg bg-gray-50/50 print:border-none print:bg-transparent print:p-0">
                <h3 className="text-sm font-bold uppercase border-b mb-6 pb-1">Logística de Deslocamento</h3>

                <div className="flex flex-wrap items-start">
                    {/* Origin */}
                    <div className="flex flex-col items-center w-[120px] mb-6 px-1 relative">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black text-white mb-2 shadow-sm z-10 shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="text-center w-full">
                            <span className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Origem</span>
                            <span className="block text-sm font-bold leading-tight mb-1 truncate px-1" title={trip.originCity}>
                                {trip.originCity.length > 18 ? trip.originCity.slice(0, 18) + '...' : trip.originCity}
                            </span>
                            <span className="block text-[10px] font-mono text-gray-400">
                                {trip.startDate ? format(new Date(trip.startDate), 'dd/MM', { locale: ptBR || pt }) : '-'}
                            </span>
                        </div>
                        {/* Connector Line (Right) - Adjusted top to 16px (center of 32px height) */}
                        <div className="absolute top-4 left-1/2 w-full h-[2px] bg-gray-200 -z-0" />
                    </div>

                    {[...trip.legs].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()).map((leg, i) => (
                        <div key={leg.id} className="flex flex-col items-center w-[140px] mb-6 px-1 relative">
                            {/* Connector Line (Left & Right) - Adjusted top to 16px, height to 2px for better visibility */}
                            <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-200 -z-0" />

                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border bg-white mb-2 shadow-sm z-10 shrink-0",
                                leg.transportType === 'airplane' ? "border-sky-200 text-sky-600" :
                                    leg.transportType === 'car' ? "border-orange-200 text-orange-600" :
                                        "border-gray-200 text-gray-600"
                            )}>
                                {leg.transportType === 'airplane' ? <Plane className="w-4 h-4" /> :
                                    leg.transportType === 'car' ? <CarFront className="w-4 h-4" /> :
                                        leg.transportType === 'bus' ? <Bus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            </div>

                            <div className="text-center w-full">
                                <span className="block text-[10px] font-bold uppercase text-gray-400 mb-0.5">
                                    {leg.transportType === 'airplane' ? 'Voo' : leg.transportType === 'car' ? 'Carro' : 'Deslocamento'}
                                </span>
                                <div className="flex items-center justify-center gap-1 text-sm font-bold leading-tight mb-1 w-full px-1">
                                    <span className="text-gray-600 truncate max-w-[50px]" title={leg.from}>
                                        {leg.from.length > 8 ? leg.from.slice(0, 8) + '...' : leg.from}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                                    <span className="truncate max-w-[50px]" title={leg.to}>
                                        {leg.to.length > 8 ? leg.to.slice(0, 8) + '...' : leg.to}
                                    </span>
                                </div>
                                <span className="block text-[10px] font-mono text-gray-400">
                                    {leg.date ? format(new Date(leg.date), 'dd/MM HH:mm', { locale: ptBR || pt }) : '-'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Destination */}
                    <div className="flex flex-col items-center w-[120px] mb-6 px-1 relative">
                        {/* Connector Line (Left) - Adjusted top to 16px */}
                        <div className="absolute top-4 left-0 w-1/2 h-[2px] bg-gray-200 -z-0" />

                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-black bg-white text-black mb-2 shadow-sm z-10 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-center w-full">
                            <span className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Fim</span>
                            <span className="block text-sm font-bold leading-tight mb-1">Conclusão</span>
                            <span className="block text-[10px] font-mono text-gray-400">
                                {trip.endDate ? format(new Date(trip.endDate), 'dd/MM', { locale: ptBR || pt }) : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Totals */}
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1">Totais e Custos</h3>
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b">
                            <td className="py-2">Total Horas Técnicas</td>
                            <td className="py-2 text-right font-mono font-bold">{formatDuration(totalMinutes)}</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-2">Deslocamento Terrestre</td>
                            <td className="py-2 text-right font-mono font-bold">{formatDistance(totalKm)}</td>
                        </tr>
                        {reportOptions.fuel && totalFuel > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Combustível</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalFuel)}</td>
                            </tr>
                        )}
                        {reportOptions.tolls && totalTolls > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Pedágios</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalTolls)}</td>
                            </tr>
                        )}
                        {reportOptions.food && totalFood > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Alimentação</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalFood)}</td>
                            </tr>
                        )}
                        {reportOptions.mobility && (totalDisplacementCost + totalMobilityEntries) > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Mobilidade (Voo/Uber/Táxi/Ônibus)</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalDisplacementCost + totalMobilityEntries)}</td>
                            </tr>
                        )}
                        {reportOptions.hotel && totalHotel > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Consumo na Hospedagem (Extras)</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalHotel)}</td>
                            </tr>
                        )}
                        {reportOptions.flights && totalFlights > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Passagens Aéreas</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalFlights)}</td>
                            </tr>
                        )}
                        {reportOptions.other && totalOther > 0 && (
                            <tr className="border-b">
                                <td className="py-2">Outras Despesas</td>
                                <td className="py-2 text-right font-mono font-bold">{formatCurrency(totalOther)}</td>
                            </tr>
                        )}
                        <tr className="bg-primary/5 font-bold print:bg-transparent">
                            <td className="py-3">Custo Total da Viagem</td>
                            <td className="py-3 text-right text-base">{formatCurrency(totalExpenses)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Detailed Expenses Section */}
            {hasAnyOptionSelected && (
                <div className="mb-8 break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1">Detalhamento de Despesas</h3>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left bg-gray-100 print:bg-gray-100">
                                <th className="p-2">Data</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Descrição / Local</th>
                                <th className="p-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportOptions.fuel && trip.fuelEntries.map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Combustível</td>
                                    <td className="p-2">{e.location} - {e.liters}L</td>
                                    <td className="p-2 text-right">{formatCurrency(e.pricePaid)}</td>
                                </tr>
                            ))}
                            {reportOptions.tolls && trip.tollEntries.map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Pedágio</td>
                                    <td className="p-2">{e.location} {e.name ? `(${e.name})` : ''}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.amount)}</td>
                                </tr>
                            ))}
                            {reportOptions.food && (trip.foodEntries || []).map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Alimentação</td>
                                    <td className="p-2">{e.description} {e.location ? `(${e.location})` : ''}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.amount)}</td>
                                </tr>
                            ))}
                            {reportOptions.hotel && (trip.hotelEntries || []).map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Consumo Hospedagem</td>
                                    <td className="p-2">{e.location || ''} {e.description ? `(${e.description})` : ''}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.amount)}</td>
                                </tr>
                            ))}
                            {reportOptions.other && (trip.otherEntries || []).map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Outros</td>
                                    <td className="p-2">{e.description}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.amount)}</td>
                                </tr>
                            ))}
                            {reportOptions.mobility && (trip.mobilityEntries || []).map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2">Mobilidade</td>
                                    <td className="p-2">{e.location || ''} {e.description ? `(${e.description})` : ''}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.amount)}</td>
                                </tr>
                            ))}
                            {reportOptions.mobility && (trip.legs || []).filter(l => (l.cost || 0) > 0).map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="p-2">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="p-2 font-medium">
                                        Mobilidade (Leg - {
                                            e.transportType === 'airplane' ? 'Voo' :
                                                e.transportType === 'car' ? 'Carro' :
                                                    e.transportType === 'uber' ? 'Uber/Táxi' :
                                                        e.transportType === 'bus' ? 'Ônibus' : 'Outro'
                                        })
                                    </td>
                                    <td className="p-2">{e.from} ➔ {e.to}</td>
                                    <td className="p-2 text-right">{formatCurrency(e.cost || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Itinerary Summary (Print) */}
            <div>
                <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1">Campi Visitados</h3>
                <div className="space-y-4">
                    {trip.itinerary.map((item, idx) => {
                        const c = getCampus(item.campusId);
                        const visit = trip.visits.find(v => v.campusId === c?.id);
                        return (
                            <div key={idx} className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <span className="font-bold text-gray-500">{idx + 1}.</span>
                                    <div>
                                        <p className="font-bold">{c ? c.name : 'Unknown Campus'}</p>
                                        <p className="text-xs text-gray-500">{c ? `${c.city}/${c.state}` : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded border ${visit?.status === 'done' ? 'border-green-500 text-green-700' : 'border-gray-300'}`}>
                                        {visit?.status === 'done' ? 'Realizado' :
                                            visit?.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Signature Section */}
            {user?.signature_url && (
                <div className="mt-16 pt-8 border-t border-gray-200 break-inside-avoid">
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src={user.signature_url}
                            alt="Assinatura"
                            className="h-20 w-auto object-contain mix-blend-multiply"
                        />
                        <div className="mt-2 text-center">
                            <p className="font-bold text-sm tracking-[0.2em] uppercase">{user.name}</p>
                            <div className="h-0.5 w-48 bg-gray-200 my-1 mx-auto" />
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Analista Responsável</p>
                            <p className="text-[9px] text-gray-400 mt-2 italic font-mono">
                                Assinado digitalmente • {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPrintTechnical = () => (
        <div className="bg-white text-black p-8 shadow-sm border rounded-lg min-h-[29.7cm] print:min-h-0 print:shadow-none print:border-none print:w-full print:p-0">
            {sortedVisits.map((visit, idx) => {
                const c = getCampus(visit.campusId);
                const campusTotalMin = visit.sessions.reduce((acc, s) => {
                    const e = s.endAt ? new Date(s.endAt).getTime() : new Date().getTime();
                    const st = s.startAt ? new Date(s.startAt).getTime() : 0;
                    return acc + (st > 0 ? (e - st) / 1000 / 60 : 0);
                }, 0);

                return (
                    <div key={visit.id} className="mb-12 break-inside-avoid print:break-before-page">
                        {/* Spacer for Fixed Header */}
                        <div className="h-[25mm] print:block hidden" />

                        <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-end mt-4">
                            <div>
                                <h2 className="text-xl font-bold uppercase">Relatório Técnico - {c?.name}</h2>
                                <p className="font-mono text-sm">{c?.city}/{c?.state}</p>
                            </div>
                            <div className="text-right text-xs">
                                Ref: {visit.id.slice(0, 6)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <span className="font-bold block">Status:</span>
                                {visit.status === 'done' ? 'Concluído' : visit.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                            </div>
                            <div>
                                <span className="font-bold block">Tempo Decorrido:</span> {formatDuration(campusTotalMin)}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold uppercase text-xs border-b border-gray-300 mb-2">Escopo Realizado</h3>
                            <ul className="text-sm space-y-1">
                                {visit.scope.filter(s => s.qty > 0).length === 0 ? (
                                    <li className="italic text-gray-500">Nenhum item de escopo registrado.</li>
                                ) : (
                                    visit.scope.filter(s => s.qty > 0).map(s => (
                                        <li key={s.label} className="flex flex-col border-b border-dotted border-gray-200 py-2 break-inside-avoid">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{s.label}</span>
                                                <span className="font-mono font-bold">x{s.qty}</span>
                                            </div>
                                            {s.comment && (
                                                <div className="text-xs text-gray-500 mt-1 italic pl-2 border-l-2 border-gray-300 whitespace-pre-wrap">
                                                    Obs: {s.comment}
                                                </div>
                                            )}
                                            {s.photos && s.photos.length > 0 && (
                                                <div className="mt-2 grid grid-cols-4 gap-2">
                                                    {s.photos.map((p, i) => (
                                                        <div key={p.id} className="border p-0.5 bg-gray-50 flex flex-col">
                                                            <div className="aspect-video relative bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={p.url}
                                                                    alt={`Evidência ${s.label} ${i + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            {p.description && (
                                                                <div className="p-1 bg-white border-t border-gray-100 text-center">
                                                                    <p className="text-[9px] text-gray-700 font-bold uppercase tracking-wider truncate">{p.description}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold uppercase text-xs border-b border-gray-300 mb-2">Evidências / Fotos</h3>
                            {visit.photos.length === 0 ? (
                                <p className="text-sm italic text-gray-500">Nenhuma foto registrada.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {visit.photos.map((p, i) => (
                                        <div key={p.id} className="border p-1 bg-gray-50 flex flex-col">
                                            <div className="aspect-video relative bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.url}
                                                    alt={`Evidência ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {p.description && (
                                                <div className="p-1 bg-white border-t border-gray-100 text-center">
                                                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider truncate">{p.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            {/* Signature Section */}
            {user?.signature_url && (
                <div className="mt-16 pt-8 border-t-2 border-black break-inside-avoid text-black">
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src={user.signature_url}
                            alt="Assinatura"
                            className="h-24 w-auto object-contain mix-blend-multiply"
                        />
                        <div className="mt-2 text-center">
                            <p className="font-bold text-base tracking-[0.25em] uppercase">{user.name}</p>
                            <div className="h-0.5 w-64 bg-black my-2 mx-auto" />
                            <p className="text-xs font-bold uppercase tracking-widest">Responsável Técnico</p>
                            <p className="text-[10px] text-gray-600 mt-3 italic font-mono">
                                Validação Digital realizada em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            {/* Print Header (Fixed on every page) */}
            <div className="hidden print:flex fixed top-0 left-0 right-0 h-[15mm] items-center justify-between border-b border-gray-200 bg-white z-50 print:visible">
                <div className="flex items-center gap-3">
                    {/* Company Logo / Brand */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="https://tfzlgednlkvmcrxlztkj.supabase.co/storage/v1/object/public/branding/logo.png"
                        alt="Logo"
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Fallback to V via DOM manipulation since we want to avoid complex state for this simple print fix
                            if (e.currentTarget.parentElement) {
                                const fallback = document.createElement('div');
                                fallback.className = "w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold print:bg-primary print:text-white";
                                fallback.innerText = "V";
                                e.currentTarget.parentElement.appendChild(fallback);
                            }
                        }}
                    />
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-wide text-primary">Viagens Técnicas</h1>
                        <p className="text-[10px] text-gray-500">Ânima Educação - Infraestrutura de TI</p>
                    </div>
                </div>
                <div className="text-right text-[10px] text-gray-400">
                    <p>Relatório Gerado em {new Date().toLocaleDateString()}</p>
                    <p>ID: {trip.id.slice(0, 8)}</p>
                </div>
            </div>

            {/* Print Footer (Fixed on every page) */}
            <div className="hidden print:flex fixed bottom-0 left-0 right-0 h-[10mm] items-center justify-between border-t border-gray-200 bg-white z-50 print:visible">
                <p className="text-[10px] text-gray-400">Plataforma Viagens - Desenvolvido pela Equipe de Infraestrutura</p>
                <p className="text-[10px] text-gray-400">Página <span className="pageNumber"></span></p>
            </div>

            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h3 className="text-lg font-medium">Relatórios</h3>
                    <p className="text-sm text-muted-foreground">Selecione o modelo e imprima.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="border-dashed">
                                <Settings2 className="w-4 h-4 mr-2" />
                                Personalizar Relatório
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[480px] p-0 bg-black/90 backdrop-blur-xl border-white/10" align="end">
                            <div className="p-4 border-b border-white/10">
                                <h4 className="font-medium leading-none text-white">Personalizar Relatório</h4>
                                <p className="text-sm text-muted-foreground mt-1">Selecione as categorias de despesas para exibir.</p>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, fuel: !prev.fuel }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.fuel
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.fuel ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <Fuel className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Combustível</div>
                                        <div className="text-[10px] opacity-70">Abastecimentos</div>
                                    </div>
                                    {reportOptions.fuel && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, tolls: !prev.tolls }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.tolls
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.tolls ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Pedágios</div>
                                        <div className="text-[10px] opacity-70">Tarifas de estrada</div>
                                    </div>
                                    {reportOptions.tolls && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, food: !prev.food }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.food
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.food ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <Utensils className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Alimentação</div>
                                        <div className="text-[10px] opacity-70">Refeições</div>
                                    </div>
                                    {reportOptions.food && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, hotel: !prev.hotel }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.hotel
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.hotel ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <BedDouble className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Hospedagem</div>
                                        <div className="text-[10px] opacity-70">Consumo extra</div>
                                    </div>
                                    {reportOptions.hotel && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, flights: !prev.flights }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.flights
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.flights ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Aéreo</div>
                                        <div className="text-[10px] opacity-70">Passagens</div>
                                    </div>
                                    {reportOptions.flights && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, mobility: !prev.mobility }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                                        reportOptions.mobility
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.mobility ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <CarFront className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Mobilidade</div>
                                        <div className="text-[10px] opacity-70">Uber/Táxi/Bus</div>
                                    </div>
                                    {reportOptions.mobility && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>

                                <button
                                    onClick={() => setReportOptions(prev => ({ ...prev, other: !prev.other }))}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group col-span-2",
                                        reportOptions.other
                                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        reportOptions.other ? "bg-primary text-black" : "bg-white/10 text-inherit group-hover:scale-110 duration-300"
                                    )}>
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">Outras Despesas</div>
                                        <div className="text-[10px] opacity-70">Gastos diversos não categorizados</div>
                                    </div>
                                    {reportOptions.other && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                                </button>
                            </div>
                            <div className="p-4 bg-white/5 border-t border-white/10">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
                                    Concluir Seleção
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir / Salvar PDF
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body {
                        visibility: hidden;
                        background: white;
                    }
                    /* Print Overlay Container */
                    #print-container {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Ensure children are visible */
                    #print-container * {
                        visibility: visible;
                        position: relative;
                    }

                     /* Utilities */
                    .break-before-page {
                        page-break-before: always;
                    }
                }
            `}</style>

            {/* Screen View: Tabs */}
            <div className="print:hidden">
                <Tabs defaultValue="consolidated">
                    <TabsList>
                        <TabsTrigger value="consolidated"><LayoutList className="w-4 h-4 mr-2" /> Resumo da Viagem</TabsTrigger>
                        <TabsTrigger value="technical"><FileText className="w-4 h-4 mr-2" /> Relatórios Técnicos (Por Campus)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="consolidated">
                        {renderScreenConsolidated()}
                    </TabsContent>

                    <TabsContent value="technical">
                        {renderScreenTechnical()}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Print View: Stacked */}
            <div id="print-container" className="hidden print:block">
                <div>
                    {renderPrintConsolidated()}
                </div>
                <div className="break-before-page">
                    {renderPrintTechnical()}
                </div>
            </div>

        </div>
    );
}
