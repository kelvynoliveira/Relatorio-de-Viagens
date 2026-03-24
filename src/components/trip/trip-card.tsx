import { Trip } from '@/lib/models';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TripCardProps {
    trip: Trip;
    readonly?: boolean;
}

export default function TripCard({ trip, readonly = false }: TripCardProps) {
    const tripStatus = trip.status === 'draft' ? 'rascunho' :
        trip.status === 'in_progress' ? 'aberta' :
            'concluida';

    const isFinished = tripStatus === 'concluida';

    const statusColors = {
        rascunho: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
        aberta: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
        concluida: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
    };

    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    const duration = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 1;

    // Calculate total expenses safely
    // Sum all expense types
    const expenses = [
        ...(trip.fuelEntries || []),
        ...(trip.foodEntries || []),
        ...(trip.tollEntries || []),
        ...(trip.otherEntries || []),
        ...(trip.mobilityEntries || []),
        ...(trip.hotelEntries || []),
    ];
    const totalExpenses = expenses.reduce((sum, expense) => {
        const amount = 'amount' in expense ? expense.amount : (expense as any).pricePaid || 0;
        return sum + amount;
    }, 0);

    // Get destination from itinerary
    const destinationItem = trip.itinerary && trip.itinerary.length > 0
        ? trip.itinerary[trip.itinerary.length - 1]
        : null;

    // We don't have city/state in itinerary items directly, they are linked to campuses.
    // For the card display, we might need to rely on the title or use originCity as a fallback if destination is not available.
    // Ideally, we should fetch campus details, but for now let's use a safe fallback or just show origin.
    const displayDestination = trip.title;

    const cardContent = (
        <motion.div
            whileHover={readonly ? {} : { y: -8, scale: 1.02 }}
            whileTap={readonly ? {} : { scale: 0.98 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl transition-all duration-500 h-full flex flex-col",
                "glass-card border border-white/5 shadow-2xl hover:shadow-primary/10",
                "after:absolute after:inset-0 after:bg-gradient-to-br after:from-primary/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-700",
                isFinished && "opacity-60 grayscale-[0.8] hover:opacity-100 hover:grayscale-0"
            )}
        >
            {/* Status Indicator Stripe */}
            <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:w-2",
                tripStatus === 'rascunho' && "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]",
                tripStatus === 'aberta' && "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                tripStatus === 'concluida' && "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            )} />

            <CardHeader className="pb-4 pl-8 pr-6 pt-6 z-10 relative">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                        <CardTitle className="line-clamp-1 text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            {trip.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary/70" />
                            <span className="font-medium text-foreground/70">{trip.originCity}</span>
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className={cn(
                        "capitalize shadow-lg backdrop-blur-md border-0 px-3 py-1 text-xs font-semibold tracking-wide",
                        statusColors[tripStatus],
                        "group-hover:scale-105 transition-transform"
                    )}>
                        {tripStatus === 'aberta' && <Clock className="w-3 h-3 mr-1.5" />}
                        {tripStatus === 'rascunho' && <AlertCircle className="w-3 h-3 mr-1.5" />}
                        {tripStatus === 'concluida' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                        {tripStatus}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-4 pl-8 pr-6 flex-grow z-10 relative">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground/80">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <Calendar className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-medium">
                            {trip.startDate ? format(new Date(trip.startDate), 'dd MMM') : '--'}
                            <span className="mx-1 opacity-50">→</span>
                            {trip.endDate ? format(new Date(trip.endDate), 'dd MMM') : '--'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <Clock className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-medium">{duration} dias</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-5 pb-5 pl-8 pr-6 border-t border-white/5 bg-black/20 flex justify-between items-center group-hover:bg-white/5 transition-colors z-10 relative">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <div className="p-1.5 rounded-full bg-emerald-500/10">
                        <Wallet className="w-4 h-4" />
                    </div>
                    <span>{formatCurrency(totalExpenses)}</span>
                </div>

                {!readonly && (
                    <div className="flex items-center text-xs text-muted-foreground font-medium uppercase tracking-wider group-hover:text-primary transition-colors">
                        Detalhes <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                )}
            </CardFooter>
        </motion.div>
    );

    if (readonly) {
        return cardContent;
    }

    return (
        <Link href={`/trips/${trip.id}`}>
            {cardContent}
        </Link>
    );
}
