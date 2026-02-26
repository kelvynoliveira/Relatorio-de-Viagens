import { Trip, FuelEntry, TollEntry, FoodEntry, MobilityEntry, OtherEntry, DisplacementLeg, HotelEntry } from '@/lib/models';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Fuel, Coins, Utensils, Receipt, Image as ImageIcon, CarFront, Pencil, Trash2, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useTripStore } from '@/lib/store';
import { toast } from 'sonner';
import AddFuelDrawer from '../drawers/add-fuel-drawer';
import AddTollDrawer from '../drawers/add-toll-drawer';
import AddFoodDrawer from '../drawers/add-food-drawer';
import AddMobilityDrawer from '../drawers/add-mobility-drawer';
import AddHotelDrawer from '../drawers/add-hotel-drawer';
import AddOtherDrawer from '../drawers/add-other-drawer';
import AddLegDrawer from '../drawers/add-leg-drawer';
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

export default function TabExpenses({ trip, readonly = false }: { trip: Trip, readonly?: boolean }) {
    const { updateTrip } = useTripStore();

    // Drawer States
    const [isFuelOpen, setIsFuelOpen] = useState(false);
    const [isTollOpen, setIsTollOpen] = useState(false);
    const [isFoodOpen, setIsFoodOpen] = useState(false);
    const [isOtherOpen, setIsOtherOpen] = useState(false);
    const [isMobilityOpen, setIsMobilityOpen] = useState(false);
    const [isHotelOpen, setIsHotelOpen] = useState(false);
    const [isLegOpen, setIsLegOpen] = useState(false);

    // Editing States
    const [editingFuel, setEditingFuel] = useState<FuelEntry | null>(null);
    const [editingToll, setEditingToll] = useState<TollEntry | null>(null);
    const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
    const [editingOther, setEditingOther] = useState<OtherEntry | null>(null);
    const [editingMobility, setEditingMobility] = useState<MobilityEntry | null>(null);
    const [editingLeg, setEditingLeg] = useState<DisplacementLeg | null>(null);
    const [editingHotel, setEditingHotel] = useState<HotelEntry | null>(null);

    // Deletion State
    const [itemToDelete, setItemToDelete] = useState<{ type: 'fuel' | 'toll' | 'food' | 'mobility' | 'other' | 'leg' | 'hotel', id: string } | null>(null);

    const totalFuel = trip.fuelEntries.reduce((acc, curr) => acc + curr.pricePaid, 0);
    const totalTolls = trip.tollEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const totalFood = (trip.foodEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalMobility = (trip.mobilityEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalHotel = (trip.hotelEntries || []).reduce((acc, curr) => acc + curr.amount, 0);
    const totalOther = (trip.otherEntries || []).reduce((acc, curr) => acc + curr.amount, 0);

    // Unified list of all movements for the mobility section
    const mobilityItems = [
        ...(trip.mobilityEntries || []).map(m => ({ ...m, _type: 'mobility' as const })),
        ...trip.legs.map(l => ({ ...l, _type: 'leg' as const }))
    ].filter(item => {
        const value = item._type === 'leg' ? (item as any).cost : (item as any).amount;
        return value && value > 0;
    }).sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity;
        const dateB = b.date ? new Date(b.date).getTime() : Infinity;
        return dateA - dateB;
    });

    const totalExpensesMobility = (trip.mobilityEntries || []).reduce((acc, curr) => acc + curr.amount, 0) +
        trip.legs.filter(l => l.transportType !== 'car' && l.transportType !== 'airplane').reduce((acc, curr) => acc + (curr.cost || 0), 0);

    const handleEdit = (type: 'fuel' | 'toll' | 'food' | 'mobility' | 'other' | 'leg' | 'hotel', item: any) => {
        if (readonly) return;
        if (type === 'fuel') {
            setEditingFuel(item);
            setIsFuelOpen(true);
        } else if (type === 'toll') {
            setEditingToll(item);
            setIsTollOpen(true);
        } else if (type === 'food') {
            setEditingFood(item);
            setIsFoodOpen(true);
        } else if (type === 'mobility' || type === 'leg') {
            if (item._type === 'leg') {
                setEditingLeg(item);
                setEditingMobility(null);
                setIsLegOpen(true);
            } else {
                setEditingMobility(item);
                setEditingLeg(null);
                setIsMobilityOpen(true);
            }
        } else if (type === 'hotel') {
            setEditingHotel(item);
            setIsHotelOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (readonly || !itemToDelete || !trip) return;
        const { id, type } = itemToDelete;
        let successMessage = '';

        try {
            if (type === 'fuel') {
                const newEntries = (trip.fuelEntries || []).filter(e => e.id !== id);
                await updateTrip(trip.id, { fuelEntries: newEntries });
                successMessage = 'Abastecimento removido.';
            } else if (type === 'toll') {
                const newEntries = (trip.tollEntries || []).filter(e => e.id !== id);
                await updateTrip(trip.id, { tollEntries: newEntries });
                successMessage = 'Pedágio removido.';
            } else if (type === 'food') {
                const newEntries = (trip.foodEntries || []).filter(e => e.id !== id);
                await updateTrip(trip.id, { foodEntries: newEntries });
                successMessage = 'Alimentação removida.';
            } else if (type === 'mobility') {
                // If it came from the mobility section, we check the original item type
                // But confirming from state is safer if we store the full item.
                // Let's just check the lists.
                const isMobility = (trip.mobilityEntries || []).some(e => e.id === id);
                if (isMobility) {
                    const newEntries = (trip.mobilityEntries || []).filter(e => e.id !== id);
                    await updateTrip(trip.id, { mobilityEntries: newEntries });
                    successMessage = 'Gasto de mobilidade removido.';
                } else {
                    const newLegs = trip.legs.filter(l => l.id !== id);
                    await updateTrip(trip.id, { legs: newLegs });
                    successMessage = 'Deslocamento removido.';
                }
            } else if (type === 'other') {
                const newEntries = (trip.otherEntries || []).filter(e => e.id !== id);
                await updateTrip(trip.id, { otherEntries: newEntries });
                successMessage = 'Outro gasto removido.';
            } else if (type === 'leg') { // Explicitly handle 'leg' type if it's not covered by 'mobility'
                const newLegs = trip.legs.filter(l => l.id !== id);
                await updateTrip(trip.id, { legs: newLegs });
                successMessage = 'Deslocamento removido.';
            } else if (type === 'hotel') {
                const newEntries = (trip.hotelEntries || []).filter(e => e.id !== id);
                await updateTrip(trip.id, { hotelEntries: newEntries });
                successMessage = 'Hospedagem removida.';
            }

            if (successMessage) {
                toast.success(successMessage);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            // toast error is handled in store but we can reinforce it
        } finally {
            setItemToDelete(null);
        }
    };

    const renderSection = (
        title: string,
        total: number,
        icon: React.ReactNode,
        bgColor: string,
        textColor: string,
        items: any[],
        onAdd: () => void,
        type: 'fuel' | 'toll' | 'food' | 'mobility' | 'other' | 'leg' | 'hotel',
        renderItemContent: (item: any) => React.ReactNode
    ) => (
        <div className="space-y-4">
            <div className={`rounded-2xl p-4 border border-white/5 transition-all duration-300 ${items.length > 0 ? 'bg-black/20 backdrop-blur-xl' : 'bg-transparent'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`${bgColor} p-2.5 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] ${textColor} ring-1 ring-white/10`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                            <p className="text-sm text-muted-foreground font-mono">Total: <span className="text-foreground">{formatCurrency(total)}</span></p>
                        </div>
                    </div>
                    {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            if (type === 'fuel') setEditingFuel(null);
                            if (type === 'toll') setEditingToll(null);
                            if (type === 'food') setEditingFood(null);
                            if (type === 'mobility') setEditingMobility(null);
                            if (type === 'hotel') setEditingHotel(null);
                            if (type === 'other') setEditingOther(null);
                            if (type === 'leg') setEditingLeg(null);
                            onAdd();
                        }} className="hover:bg-white/10 active:scale-95 transition-all">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    )}
                </div>

                <div className="grid gap-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-sm text-muted-foreground italic mb-3">Nenhum registro de {title.toLowerCase()}.</p>
                            {!readonly && (
                                <Button variant="outline" size="sm" className="bg-transparent border-white/10 hover:bg-white/5" onClick={() => {
                                    if (type === 'fuel') setEditingFuel(null);
                                    if (type === 'toll') setEditingToll(null);
                                    if (type === 'food') setEditingFood(null);
                                    if (type === 'mobility') setEditingMobility(null);
                                    if (type === 'hotel') setEditingHotel(null);
                                    if (type === 'other') setEditingOther(null);
                                    if (type === 'leg') setEditingLeg(null);
                                    onAdd();
                                }}>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar {title.split(' ')[0]}
                                </Button>
                            )}
                        </div>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="border-0 bg-black/40 hover:bg-black/60 transition-colors group">
                                <CardContent className="p-3 flex justify-between items-center text-sm">
                                    <div className="flex-1">
                                        {renderItemContent(item)}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <div className={`font-bold text-lg text-white bg-black/30 px-3 py-1 rounded-lg border border-white/5`}>
                                            {formatCurrency(item.amount || item.pricePaid || item.cost || 0)}
                                        </div>
                                        {!readonly && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-white/10" onClick={() => handleEdit(type, item)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => setItemToDelete({ type, id: item.id })}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="w-full">
                    {renderSection(
                        'Alimentação',
                        totalFood,
                        <Utensils className="w-5 h-5" />,
                        'bg-red-100 dark:bg-red-900/20',
                        'text-red-600',
                        trip.foodEntries || [],
                        () => setIsFoodOpen(true),
                        'food',
                        (entry) => (
                            <div className="flex flex-col gap-1">
                                <div>
                                    <span className="font-medium">{entry.location || 'Restaurante'}</span>
                                    {entry.description && <span className="text-muted-foreground"> - {entry.description}</span>}
                                </div>
                                {(entry.photos?.length > 0) && (
                                    <div className="flex items-center text-xs text-blue-600 gap-1">
                                        <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                <div className="w-full">
                    {renderSection(
                        'Consumo na Hospedagem',
                        totalHotel,
                        <Building2 className="w-5 h-5" />,
                        'bg-emerald-100 dark:bg-emerald-900/20',
                        'text-emerald-600',
                        trip.hotelEntries || [],
                        () => setIsHotelOpen(true),
                        'hotel',
                        (entry) => (
                            <div className="flex flex-col gap-1">
                                <div>
                                    <span className="font-medium">{entry.hotelName || 'Hotel'}</span>
                                    {entry.location && <span className="text-muted-foreground"> • {entry.location}</span>}
                                </div>
                                {(entry.photos?.length > 0) && (
                                    <div className="flex items-center text-xs text-blue-600 gap-1">
                                        <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                <div className="w-full">
                    {renderSection(
                        'Combustível',
                        totalFuel,
                        <Fuel className="w-5 h-5" />,
                        'bg-orange-100 dark:bg-orange-900/20',
                        'text-orange-600',
                        trip.fuelEntries,
                        () => setIsFuelOpen(true),
                        'fuel',
                        (entry) => (
                            <div className="flex flex-col gap-1">
                                <div>
                                    <span className="font-semibold">{entry.liters} L</span>
                                    {entry.location && <span className="text-muted-foreground"> • {entry.location}</span>}
                                </div>
                                {(entry.photos?.length > 0) && (
                                    <div className="flex items-center text-xs text-blue-600 gap-1">
                                        <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                <div className="w-full">
                    {renderSection(
                        'Pedágios',
                        totalTolls,
                        <Coins className="w-5 h-5" />,
                        'bg-yellow-100 dark:bg-yellow-900/20',
                        'text-yellow-600',
                        trip.tollEntries,
                        () => setIsTollOpen(true),
                        'toll',
                        (entry) => (
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{entry.location || 'Pedágio'}</span>
                                {(entry.photos?.length > 0) && (
                                    <div className="flex items-center text-xs text-blue-600 gap-1">
                                        <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                <div className="w-full">
                    {renderSection(
                        'Mobilidade / Deslocamento',
                        totalExpensesMobility,
                        <CarFront className="w-5 h-5" />,
                        'bg-blue-100 dark:bg-blue-900/20',
                        'text-blue-600',
                        mobilityItems,
                        () => setIsMobilityOpen(true),
                        'mobility',
                        (entry) => {
                            const isLeg = entry._type === 'leg';
                            return (
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium capitalize">
                                        {
                                            entry.transportType === 'airplane' ? 'Voo' :
                                                entry.transportType === 'car' ? 'Carro' :
                                                    entry.transportType === 'uber' ? 'Uber/Táxi' :
                                                        entry.transportType === 'bus' ? 'Ônibus' : 'Outro'
                                        }
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {isLeg ? `${entry.from} ➔ ${entry.to}` : (entry.from && entry.to ? `${entry.from} ➔ ${entry.to}` : (entry.location || entry.description || 'Gasto de transporte'))}
                                    </span>
                                    {(entry.photos?.length > 0) && (
                                        <div className="flex items-center text-xs text-blue-600 gap-1">
                                            <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>

                <div className="w-full">
                    {renderSection(
                        'Outros',
                        totalOther,
                        <Receipt className="w-5 h-5" />,
                        'bg-gray-100 dark:bg-gray-800',
                        'text-gray-600',
                        trip.otherEntries || [],
                        () => setIsOtherOpen(true),
                        'other',
                        (entry) => (
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{entry.description || 'Despesa'}</span>
                                {(entry.photos?.length > 0) && (
                                    <div className="flex items-center text-xs text-blue-600 gap-1">
                                        <ImageIcon className="w-3 h-3" /> {entry.photos.length} foto(s)
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            <AddFuelDrawer open={isFuelOpen} onOpenChange={setIsFuelOpen} tripId={trip.id} initialData={editingFuel} />
            <AddTollDrawer open={isTollOpen} onOpenChange={setIsTollOpen} tripId={trip.id} initialData={editingToll} />
            <AddFoodDrawer open={isFoodOpen} onOpenChange={setIsFoodOpen} tripId={trip.id} initialData={editingFood} />
            <AddMobilityDrawer open={isMobilityOpen} onOpenChange={setIsMobilityOpen} tripId={trip.id} initialData={editingMobility} />
            <AddHotelDrawer open={isHotelOpen} onOpenChange={setIsHotelOpen} tripId={trip.id} initialData={editingHotel} />
            <AddLegDrawer open={isLegOpen} onOpenChange={setIsLegOpen} tripId={trip.id} initialData={editingLeg} />
            <AddOtherDrawer open={isOtherOpen} onOpenChange={setIsOtherOpen} tripId={trip.id} initialData={editingOther} />

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro será removido permanentemente.
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
