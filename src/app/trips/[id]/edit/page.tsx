'use client';

import TripWizard from '@/components/trip/trip-wizard';
import { useTripStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/models'; // Ensure Trip type is imported

export default function EditTripPage() {
    const params = useParams();
    const router = useRouter();
    const { getTrip, isLoading } = useTripStore();
    const [trip, setTrip] = useState<Trip | undefined>(undefined);
    const id = params.id as string;

    // Fetch trip on mount or when store loads
    useEffect(() => {
        if (!isLoading) {
            const foundTrip = getTrip(id);
            if (!foundTrip) {
                // Handle not found if needed, or just let Wizard handle broken state?
                // Ideally redirect or show error
            }
            setTrip(foundTrip);
        }
    }, [id, getTrip, isLoading]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando dados da viagem...</div>;
    }

    if (!trip) {
        return (
            <div className="p-8 text-center space-y-4">
                <h2 className="text-xl font-semibold">Viagem não encontrada</h2>
                <Link href="/dashboard">
                    <Button>Voltar ao Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight">Editar Viagem</h1>
                    <span className="text-sm text-muted-foreground">Editando: {trip.title}</span>
                </div>
            </div>

            <TripWizard initialTrip={trip} />
        </div>
    );
}
