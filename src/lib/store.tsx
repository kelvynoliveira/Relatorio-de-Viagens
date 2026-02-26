'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Trip, Brand, Campus, ItineraryItem, CampusVisit, DisplacementLeg, FuelEntry, TollEntry, FoodEntry, MobilityEntry, OtherEntry } from './models';
import { toast } from 'sonner';
import { supabase } from './supabase';
import { getCurrentUser, User } from './auth';

// We need to extend the context to include catalogs
interface TripStoreContextType {
    trips: Trip[];
    brands: Brand[];
    campuses: Campus[];
    isLoading: boolean;
    user: User | null;
    setUser: (user: User | null) => void;
    appSettings: Record<string, any>; // ADDED
    setAppSetting: (key: string, value: any) => Promise<void>; // ADDED
    addTrip: (trip: Trip) => Promise<void>;
    updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    getTrip: (id: string) => Trip | undefined;
    refreshData: () => Promise<void>;
    addFuelEntry: (tripId: string, entry: FuelEntry) => void;
    addTollEntry: (tripId: string, entry: TollEntry) => void;
    addFoodEntry: (tripId: string, entry: FoodEntry) => void;
    addMobilityEntry: (tripId: string, entry: MobilityEntry) => void;
    addOtherEntry: (tripId: string, entry: OtherEntry) => void;
    updateCampusVisit: (tripId: string, visitId: string, updates: Partial<CampusVisit>) => Promise<void>;
}

const TripStoreContext = createContext<TripStoreContextType | undefined>(undefined);

export function TripStoreProvider({ children }: { children: React.ReactNode }) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [appSettings, setAppSettings] = useState<Record<string, any>>({}); // ADDED

    const isRefreshing = React.useRef(false);

    const refreshData = async () => {
        if (isRefreshing.current) {
            console.log('[Store] refreshData skipped - already fetching');
            return;
        }

        isRefreshing.current = true;
        // Only show global loader if we have no data yet
        const isInitialLoad = trips.length === 0;
        if (isInitialLoad) setIsLoading(true);

        console.log(`[Store] refreshData started (Initial: ${isInitialLoad})`);
        try {
            // 0. Fetch User (if not already set or refreshing)
            console.log('[Store] Fetching user...');
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // 0.5 Fetch App Settings
            const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('*');
            if (!settingsError && settingsData) {
                const settingsMap = settingsData.reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});
                setAppSettings(settingsMap);
            }

            // 1. Fetch Brands
            console.log('[Store] Fetching brands...');
            const { data: brandsData, error: brandsError } = await supabase.from('brands').select('*');
            if (brandsError) {
                console.error('[Store] Error fetching brands:', brandsError);
            } else {
                setBrands(brandsData || []);
            }

            // 2. Fetch Campuses
            console.log('[Store] Fetching campuses...');
            const { data: campusesData, error: campusesError } = await supabase.from('campuses').select('*');
            if (campusesError) {
                console.error('[Store] Error fetching campuses:', campusesError);
            } else {
                setCampuses((campusesData || []).map((c: any) => ({
                    id: c.id,
                    brandId: c.brand_id,
                    name: c.name,
                    city: c.city,
                    state: c.state,
                    address: c.address
                })));
            }

            // 3. Fetch Trips (and joined data)
            console.log('[Store] Fetching trips and relations...');
            // Note: We'll wrap the big select to see if it's the one failing
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select(`
                    *,
                    itinerary_items (campus_id, item_order, planned_arrival, planned_departure, hotel_name, hotel_cost),
                    campus_visits (*),
                    displacement_legs (*),
                    fuel_entries (*),
                    toll_entries (*),
                    food_entries (*),
                    mobility_entries (*),
                    hotel_entries (*),
                    other_entries (*),
                    planned_flights
                `)
                .order('created_at', { ascending: false });

            if (tripsError) {
                console.error('[Store] Error fetching trips:', tripsError);
                // If the big select fails with "column does not exist", let's try a fallback simple select
                if (tripsError.code === 'PGRST204' || tripsError.message?.includes('column')) {
                    console.warn('[Store] Big select failed, falling back to basic trip select...');
                    const { data: basicTrips, error: basicError } = await supabase.from('trips').select('*');
                    if (basicError) throw basicError;
                    setTrips((basicTrips || []).map((t: any) => ({
                        ...t,
                        originCity: t.origin_city,
                        startDate: t.start_date,
                        endDate: t.end_date,
                        userId: t.user_id,
                        itinerary: [],
                        legs: [],
                        fuelEntries: [],
                        tollEntries: [],
                        foodEntries: [],
                        mobilityEntries: [],
                        hotelEntries: [],
                        otherEntries: [],
                        plannedFlights: [],
                        visits: []
                    })));
                } else {
                    throw tripsError;
                }
            } else {
                // Transform raw DB data to our Trip model
                const formattedTrips: Trip[] = (tripsData || []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    originCity: t.origin_city,
                    startDate: t.start_date,
                    endDate: t.end_date,
                    notes: t.notes,
                    status: t.status,
                    userId: t.user_id,
                    createdAt: t.created_at,
                    updatedAt: t.updated_at,
                    itinerary: (t.itinerary_items || [])
                        .sort((a: any, b: any) => a.item_order - b.item_order)
                        .map((i: any) => ({
                            campusId: i.campus_id,
                            order: i.item_order,
                            plannedArrival: i.planned_arrival,
                            plannedDeparture: i.planned_departure,
                            hotelName: i.hotel_name,
                            hotelCost: i.hotel_cost
                        })),
                    legs: (t.displacement_legs || []).map((l: any) => ({
                        id: l.id,
                        from: l.origin,
                        to: l.destination,
                        transportType: l.transport_type,
                        distanceKm: l.distance_km,
                        cost: l.cost || 0,
                        date: l.date,
                        description: l.description,
                        photos: l.photos || []
                    })),
                    fuelEntries: (t.fuel_entries || []).map((f: any) => ({
                        id: f.id,
                        date: f.date,
                        liters: f.liters,
                        pricePaid: f.price_paid,
                        pricePerLiter: f.price_per_liter,
                        location: f.location,
                        odometer: f.odometer
                    })),
                    tollEntries: (t.toll_entries || []).map((to: any) => ({
                        id: to.id,
                        date: to.date,
                        amount: to.amount,
                        location: to.location,
                        name: to.name,
                        photos: to.photos || []
                    })),
                    foodEntries: (t.food_entries || []).map((f: any) => ({
                        id: f.id,
                        date: f.date,
                        amount: f.amount,
                        location: f.location,
                        description: f.description,
                        photos: f.photos || []
                    })),
                    mobilityEntries: (t.mobility_entries || []).map((m: any) => ({
                        id: m.id,
                        date: m.date,
                        amount: m.amount,
                        transportType: m.transport_type,
                        from: m.from_location || m.origin, // Use from_location if available, fallback to origin
                        to: m.to_location || m.destination, // Use to_location if available, fallback to destination
                        location: m.location,
                        description: m.description,
                        photos: m.photos || []
                    })),
                    hotelEntries: (t.hotel_entries || []).map((h: any) => ({
                        id: h.id,
                        date: h.date,
                        amount: h.amount,
                        hotelName: h.hotel_name,
                        location: h.location,
                        description: h.description,
                        photos: h.photos || []
                    })),
                    otherEntries: (t.other_entries || []).map((o: any) => ({
                        id: o.id,
                        date: o.date,
                        amount: o.amount,
                        description: o.description,
                        photos: o.photos || []
                    })),
                    plannedFlights: t.planned_flights || [],
                    visits: (t.campus_visits || []).map((v: any) => ({
                        id: v.id,
                        campusId: v.campus_id,
                        status: v.status,
                        notes: v.notes,
                        sessions: v.sessions || [],
                        scope: v.scope || [],
                        photos: v.photos || []
                    }))
                }));
                setTrips(formattedTrips);
            }

        } catch (error: any) {
            console.error('[Store] refreshData CRITICAL ERROR:', error);
            toast.error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
        } finally {
            console.log('[Store] refreshData finished');
            setIsLoading(false);
            isRefreshing.current = false;
        }
    };

    // Use a Ref for refreshData to avoid closure issues in listeners
    const refreshDataRef = React.useRef(refreshData);
    useEffect(() => {
        refreshDataRef.current = refreshData;
    }, [refreshData]);

    useEffect(() => {
        // 1. Listen for auth changes to trigger refreshes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Store] Auth event: ${event}`);
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session) {
                    refreshDataRef.current();
                } else {
                    setUser(null);
                }
            } else if (event === 'SIGNED_OUT') {
                setTrips([]);
                setUser(null);
                setIsLoading(false);
            }
        });

        // 2. Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                refreshDataRef.current();
            } else {
                console.log('[Store] No session found on mount');
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Listener is attached once, always uses the latest refreshDataRef.current

    const addTrip = async (trip: Trip) => {
        try {
            // 1. Insert Trip
            const { error: tripError } = await supabase.from('trips').insert({
                id: trip.id, // Use client-generated ID or let DB generate? schema says default gen, but let's stick to consistent UUID if provided
                title: trip.title,
                origin_city: trip.originCity,
                start_date: trip.startDate,
                end_date: trip.endDate,
                notes: trip.notes,
                status: trip.status,
                user_id: trip.userId, // Persist ownership
                planned_flights: trip.plannedFlights,
                created_at: trip.createdAt,
                updated_at: trip.updatedAt
            });
            if (tripError) throw tripError;

            // 2. Insert Itinerary Items
            if (trip.itinerary.length > 0) {
                const { error: itinError } = await supabase.from('itinerary_items').insert(
                    trip.itinerary.map(item => ({
                        trip_id: trip.id,
                        campus_id: item.campusId,
                        item_order: item.order,
                        planned_arrival: item.plannedArrival,
                        planned_departure: item.plannedDeparture,
                        hotel_name: item.hotelName,
                        hotel_cost: item.hotelCost
                    }))
                );
                if (itinError) throw itinError;
            }

            // 3. Insert Visits (Auto-generated empty visits usually)
            if (trip.visits.length > 0) {
                const { error: visitError } = await supabase.from('campus_visits').insert(
                    trip.visits.map(v => ({
                        id: v.id,
                        trip_id: trip.id,
                        campus_id: v.campusId,
                        status: v.status,
                        notes: v.notes,
                        sessions: v.sessions,
                        scope: v.scope,
                        photos: v.photos
                    }))
                );
                if (visitError) throw visitError;
            }

            // 4. Insert Displacement Legs
            if (trip.legs.length > 0) {
                const { error: legError } = await supabase.from('displacement_legs').insert(
                    trip.legs.map(l => ({
                        id: l.id,
                        trip_id: trip.id,
                        origin: l.from,
                        destination: l.to,
                        transport_type: l.transportType,
                        distance_km: l.distanceKm,
                        cost: l.cost,
                        date: l.date,
                        description: l.description,
                        photos: l.photos
                    }))
                );
                if (legError) throw legError;
            }

            // 5. Insert Fuel Entries
            if (trip.fuelEntries.length > 0) {
                const { error: fuelError } = await supabase.from('fuel_entries').insert(
                    trip.fuelEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        liters: e.liters,
                        price_paid: e.pricePaid,
                        price_per_liter: e.pricePerLiter,
                        location: e.location,
                        odometer: e.odometer
                    }))
                );
                if (fuelError) throw fuelError;
            }

            // 6. Insert Toll Entries
            if (trip.tollEntries.length > 0) {
                const { error: tollError } = await supabase.from('toll_entries').insert(
                    trip.tollEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        amount: e.amount,
                        location: e.location,
                        name: e.name,
                        photos: e.photos
                    }))
                );
                if (tollError) throw tollError;
            }

            // 7. Insert Food Entries
            if (trip.foodEntries.length > 0) {
                const { error: foodError } = await supabase.from('food_entries').insert(
                    trip.foodEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        amount: e.amount,
                        location: e.location,
                        description: e.description,
                        photos: e.photos
                    }))
                );
                if (foodError) throw foodError;
            }

            // 8. Insert Mobility Entries
            if (trip.mobilityEntries.length > 0) {
                const { error: mobilityError } = await supabase.from('mobility_entries').insert(
                    trip.mobilityEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        amount: e.amount,
                        transport_type: e.transportType,
                        origin: e.from,
                        destination: e.to,
                        location: e.location,
                        description: e.description,
                        photos: e.photos
                    }))
                );
                if (mobilityError) throw mobilityError;
            }

            // 9. Insert Hotel Entries
            if (trip.hotelEntries && trip.hotelEntries.length > 0) {
                const { error: hotelError } = await supabase.from('hotel_entries').insert(
                    trip.hotelEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        amount: e.amount,
                        hotel_name: e.hotelName,
                        location: e.location,
                        description: e.description,
                        photos: e.photos
                    }))
                );
                if (hotelError) throw hotelError;
            }

            // 10. Insert Other Entries
            if (trip.otherEntries.length > 0) {
                const { error: otherError } = await supabase.from('other_entries').insert(
                    trip.otherEntries.map(e => ({
                        id: e.id,
                        trip_id: trip.id,
                        date: e.date,
                        amount: e.amount,
                        description: e.description,
                        photos: e.photos
                    }))
                );
                if (otherError) throw otherError;
            }

            // Optimistic update
            setTrips(prev => [trip, ...prev]);
            toast.success('Viagem criada com sucesso!');

        } catch (error: any) {
            console.error('Error creating trip:', error);
            toast.error(`Erro ao criar viagem: ${error.message}`);
        }
    };

    const updateTrip = async (id: string, updates: Partial<Trip>) => {
        try {
            // 1. Update Main Trip Table
            // Construct payload dynamically to avoid sending undefined (which resets to NULL or errors)
            const tripUpdates: any = {};
            if (updates.title !== undefined) tripUpdates.title = updates.title;
            if (updates.originCity !== undefined) tripUpdates.origin_city = updates.originCity;
            if (updates.startDate !== undefined) tripUpdates.start_date = updates.startDate;
            if (updates.endDate !== undefined) tripUpdates.end_date = updates.endDate;
            if (updates.notes !== undefined) tripUpdates.notes = updates.notes;
            if (updates.status !== undefined) tripUpdates.status = updates.status;
            if (updates.plannedFlights !== undefined) tripUpdates.planned_flights = updates.plannedFlights;
            tripUpdates.updated_at = new Date().toISOString();

            let updatedTripData: any = null;

            if (Object.keys(tripUpdates).length > 1) { // 1 because updated_at is always there
                const { data, error: tripError } = await supabase.from('trips')
                    .update(tripUpdates)
                    .eq('id', id)
                    .select()
                    .single();

                if (tripError) throw tripError;
                updatedTripData = data;
            }

            // 2. Handle Itinerary Changes (Delete All + Insert New)
            if (updates.itinerary) {
                const { error: deleteItinError } = await supabase
                    .from('itinerary_items')
                    .delete()
                    .eq('trip_id', id);
                if (deleteItinError) throw deleteItinError;

                if (updates.itinerary.length > 0) {
                    const { error: insertItinError } = await supabase.from('itinerary_items').insert(
                        updates.itinerary.map(item => ({
                            trip_id: id,
                            campus_id: item.campusId,
                            item_order: item.order,
                            planned_arrival: item.plannedArrival,
                            planned_departure: item.plannedDeparture,
                            hotel_name: item.hotelName,
                            hotel_cost: item.hotelCost
                        }))
                    );
                    if (insertItinError) throw insertItinError;
                }
            }

            // 3. Handle Visits (Update existing, Delete removed, Insert new)
            if (updates.visits) {
                console.log(`[Store] Updating visits for trip ${id}. Count: ${updates.visits.length}`);

                // 3.1 Delete visits that are no longer in the visits list
                const keepVisitIds = updates.visits.map(v => v.id).filter(Boolean);
                if (keepVisitIds.length > 0) {
                    const { error: delVisitError } = await supabase
                        .from('campus_visits')
                        .delete()
                        .eq('trip_id', id)
                        .not('id', 'in', `(${keepVisitIds.join(',')})`);
                    if (delVisitError) {
                        console.error('[Store] Error deleting orphaned visits:', delVisitError);
                        throw delVisitError;
                    }
                } else {
                    const { error: delVisitError } = await supabase.from('campus_visits').delete().eq('trip_id', id);
                    if (delVisitError) throw delVisitError;
                }

                // 3.2 Upsert current visits
                const upsertData = updates.visits.map(v => ({
                    id: v.id,
                    trip_id: id,
                    campus_id: v.campusId,
                    status: v.status,
                    notes: v.notes,
                    sessions: v.sessions,
                    scope: v.scope,
                    photos: v.photos
                }));

                const { error: visitError } = await supabase.from('campus_visits').upsert(upsertData);
                if (visitError) {
                    console.error('[Store] Error upserting visits:', visitError);
                    throw visitError;
                }
            }

            // 4. Handle Displacement Legs
            if (updates.legs) {
                console.log(`[Store] Updating legs for trip ${id}. Count: ${updates.legs.length}`);
                const keepLegIds = updates.legs.map(l => l.id).filter(Boolean);

                try {
                    if (keepLegIds.length > 0) {
                        // Fix: PostgREST 'in' filter syntax: .not('id', 'in', `(id1,id2)`) is the standard, 
                        // but let's ensure the string concatenation is very clean.
                        const { error: delError } = await supabase
                            .from('displacement_legs')
                            .delete()
                            .eq('trip_id', id)
                            .not('id', 'in', `(${keepLegIds.join(',')})`);
                        if (delError) {
                            console.error('[Store] Error deleting legs:', delError);
                            throw delError;
                        }
                    } else {
                        const { error: delError } = await supabase.from('displacement_legs').delete().eq('trip_id', id);
                        if (delError) throw delError;
                    }

                    if (updates.legs.length > 0) {
                        const upsertLegs = updates.legs.map(l => ({
                            id: l.id,
                            trip_id: id,
                            origin: l.from,
                            destination: l.to,
                            transport_type: l.transportType,
                            distance_km: l.distanceKm,
                            cost: l.cost,
                            date: l.date || new Date().toISOString(),
                            description: l.description,
                            photos: l.photos || []
                        }));
                        console.log('[Store] Upserting legs:', upsertLegs);
                        const { error: legError } = await supabase.from('displacement_legs').upsert(upsertLegs);
                        if (legError) throw legError;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in legs update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }

            // 5. Handle Other Tables (Fuel, Toll, Food, Other) - keeping existing logic but formatted
            if (updates.fuelEntries) {
                const keepIds = updates.fuelEntries.map(f => f.id);
                try {
                    if (keepIds.length > 0) {
                        const { error } = await supabase.from('fuel_entries').delete().eq('trip_id', id).not('id', 'in', `(${keepIds.join(',')})`);
                        if (error) {
                            console.error('[Store] Error deleting fuel entries:', error);
                            throw error;
                        }
                    } else {
                        const { error } = await supabase.from('fuel_entries').delete().eq('trip_id', id);
                        if (error) throw error;
                    }
                    if (updates.fuelEntries.length > 0) {
                        const upsert = updates.fuelEntries.map(f => ({
                            id: f.id, trip_id: id, date: f.date, liters: f.liters, price_paid: f.pricePaid,
                            price_per_liter: f.pricePerLiter, location: f.location, odometer: f.odometer
                        }));
                        const { error } = await supabase.from('fuel_entries').upsert(upsert);
                        if (error) throw error;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in fuel entries update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }
            if (updates.tollEntries) {
                const keepIds = updates.tollEntries.map(f => f.id);
                try {
                    if (keepIds.length > 0) {
                        const { error } = await supabase.from('toll_entries').delete().eq('trip_id', id).not('id', 'in', `(${keepIds.join(',')})`);
                        if (error) {
                            console.error('[Store] Error deleting toll entries:', error);
                            throw error;
                        }
                    } else {
                        const { error } = await supabase.from('toll_entries').delete().eq('trip_id', id);
                        if (error) throw error;
                    }
                    if (updates.tollEntries.length > 0) {
                        const upsert = updates.tollEntries.map(f => ({
                            id: f.id, trip_id: id, date: f.date, amount: f.amount, location: f.location, name: f.name, photos: f.photos
                        }));
                        const { error } = await supabase.from('toll_entries').upsert(upsert);
                        if (error) throw error;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in toll entries update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }
            if (updates.foodEntries) {
                const keepIds = updates.foodEntries.map(f => f.id);
                try {
                    if (keepIds.length > 0) {
                        const { error } = await supabase.from('food_entries').delete().eq('trip_id', id).not('id', 'in', `(${keepIds.join(',')})`);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('food_entries').delete().eq('trip_id', id);
                        if (error) throw error;
                    }
                    if (updates.foodEntries.length > 0) {
                        const upsert = updates.foodEntries.map(f => ({
                            id: f.id, trip_id: id, date: f.date, amount: f.amount, location: f.location, description: f.description, photos: f.photos
                        }));
                        const { error } = await supabase.from('food_entries').upsert(upsert);
                        if (error) throw error;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in food entries update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }
            if (updates.mobilityEntries) {
                const keepIds = updates.mobilityEntries.map(f => f.id);
                try {
                    if (keepIds.length > 0) {
                        const { error } = await supabase.from('mobility_entries').delete().eq('trip_id', id).not('id', 'in', `(${keepIds.join(',')})`);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('mobility_entries').delete().eq('trip_id', id);
                        if (error) throw error;
                    }
                    if (updates.mobilityEntries.length > 0) {
                        const upsert = updates.mobilityEntries.map(f => ({
                            id: f.id, trip_id: id, date: f.date, amount: f.amount,
                            transport_type: f.transportType, origin: f.from, destination: f.to,
                            location: f.location, description: f.description, photos: f.photos
                        }));
                        const { error } = await supabase.from('mobility_entries').upsert(upsert);
                        if (error) throw error;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in mobility entries update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }
            if (updates.otherEntries) {
                const keepIds = updates.otherEntries.map(f => f.id);
                try {
                    if (keepIds.length > 0) {
                        const { error } = await supabase.from('other_entries').delete().eq('trip_id', id).not('id', 'in', `(${keepIds.join(',')})`);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('other_entries').delete().eq('trip_id', id);
                        if (error) throw error;
                    }
                    if (updates.otherEntries.length > 0) {
                        const upsert = updates.otherEntries.map(f => ({
                            id: f.id, trip_id: id, date: f.date, amount: f.amount, description: f.description, photos: f.photos
                        }));
                        const { error } = await supabase.from('other_entries').upsert(upsert);
                        if (error) throw error;
                    }
                } catch (err: any) {
                    console.error('[Store] Error in other entries update:', {
                        message: err?.message || 'No message',
                        details: err?.details || 'No details',
                        code: err?.code || 'No code',
                        full: err
                    });
                    throw err;
                }
            }

            // Update Local State with merged data
            // If we got updatedTripData from DB, use its fields. Otherwise use updates (optimistic).
            setTrips(prev => prev.map(t => {
                if (t.id !== id) return t;

                let newTrip = { ...t, ...updates };
                if (updatedTripData) {
                    // Map back from DB columns if needed
                    newTrip = {
                        ...newTrip,
                        title: updatedTripData.title,
                        originCity: updatedTripData.origin_city,
                        startDate: updatedTripData.start_date,
                        endDate: updatedTripData.end_date,
                        notes: updatedTripData.notes,
                        status: updatedTripData.status,
                        updatedAt: updatedTripData.updated_at
                    };
                }
                return newTrip;
            }));

            // Refresh in background to sync specific related tables if needed, 
            // but we're pretty confident in local state now.
            // Await it to ensure complete sync if caller awaits.
            await refreshData();

        } catch (error: any) {
            console.error('[Store] updateTrip CRITICAL ERROR:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                full: error
            });
            toast.error(`Erro ao atualizar viagem: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const updateCampusVisit = async (tripId: string, visitId: string, updates: Partial<CampusVisit>) => {
        try {
            // 1. Optimistic Update
            setTrips(prev => prev.map(t => {
                if (t.id !== tripId) return t;
                const visitIndex = t.visits.findIndex(v => v.id === visitId);
                if (visitIndex === -1) return t;

                const newVisits = [...t.visits];
                newVisits[visitIndex] = { ...newVisits[visitIndex], ...updates } as CampusVisit;
                return { ...t, visits: newVisits };
            }));

            // 2. DB Update
            // We need to map client model back to DB columns if they differ.
            // campus_visits columns: status, notes, sessions (jsonb), scope (jsonb), photos (jsonb)
            const dbUpdates: any = {};
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.notes) dbUpdates.notes = updates.notes;
            if (updates.sessions) dbUpdates.sessions = updates.sessions;
            if (updates.scope) dbUpdates.scope = updates.scope;
            if (updates.photos) dbUpdates.photos = updates.photos;

            if (Object.keys(dbUpdates).length === 0) return;

            const { error } = await supabase.from('campus_visits')
                .update(dbUpdates)
                .eq('id', visitId);

            if (error) throw error;

        } catch (err: any) {
            console.error('Error updating campus visit:', {
                message: err?.message || 'No message',
                details: err?.details || 'No details',
                code: err?.code || 'No code',
                full: err
            });
            toast.error('Erro ao salvar dados do atendimento');
            refreshData(); // Revert on error
        }
    };

    const setAppSetting = async (key: string, value: any) => {
        try {
            // Optimistic
            setAppSettings(prev => ({ ...prev, [key]: value }));

            // DB
            const { error } = await supabase.from('app_settings').upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error('[Store] Error setting app setting:', error);
                throw error;
            }
        } catch (error: any) {
            toast.error(`Erro ao salvar configuração: ${error.message}`);
        }
    };

    const deleteTrip = async (id: string) => {
        try {
            const { error } = await supabase.from('trips').delete().eq('id', id);
            if (error) throw error;

            setTrips(prev => prev.filter(t => t.id !== id));
            toast.success('Viagem excluída');
        } catch (error) {
            console.error('Error deleting trip:', error);
            toast.error('Erro ao excluir viagem');
        }
    };

    const getTrip = (id: string) => trips.find(t => t.id === id);

    const addFuelEntry = (tripId: string, entry: FuelEntry) => {
        const trip = getTrip(tripId);
        if (!trip) return;
        updateTrip(tripId, { fuelEntries: [...trip.fuelEntries, entry] });
    };

    const addTollEntry = (tripId: string, entry: TollEntry) => {
        const trip = getTrip(tripId);
        if (!trip) return;
        updateTrip(tripId, { tollEntries: [...trip.tollEntries, entry] });
    };

    const addFoodEntry = (tripId: string, entry: FoodEntry) => {
        const trip = getTrip(tripId);
        if (!trip) return;
        updateTrip(tripId, { foodEntries: [...trip.foodEntries || [], entry] });
    };

    const addMobilityEntry = (tripId: string, entry: MobilityEntry) => {
        const trip = getTrip(tripId);
        if (!trip) return;
        updateTrip(tripId, { mobilityEntries: [...trip.mobilityEntries || [], entry] });
    };

    const addOtherEntry = (tripId: string, entry: OtherEntry) => {
        const trip = getTrip(tripId);
        if (!trip) return;
        updateTrip(tripId, { otherEntries: [...trip.otherEntries || [], entry] });
    };

    const value = {
        trips,
        brands,
        campuses,
        isLoading,
        user,
        setUser,
        appSettings,
        setAppSetting,
        addTrip,
        updateTrip,
        deleteTrip,
        getTrip,
        refreshData,
        addFuelEntry,
        addTollEntry,
        addFoodEntry,
        addMobilityEntry,
        addOtherEntry,
        updateCampusVisit
    };

    return <TripStoreContext.Provider value={value}>{children}</TripStoreContext.Provider>;
}

export function useTripStore() {
    const context = useContext(TripStoreContext);
    if (!context) {
        throw new Error('useTripStore must be used within a TripStoreProvider');
    }
    return context;
}
