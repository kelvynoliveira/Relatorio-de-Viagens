import { Trip } from './models';

export interface TripExpense {
  name: string;
  amount: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
}

export interface TripKm {
  name: string;
  km: number;
}

/**
 * Gets expense data for each trip (Top 5 recent)
 */
export function getTripExpenseData(trips: Trip[]): TripExpense[] {
  // Filter out drafts and sort by date descending
  const activeTrips = trips
    .filter(t => t.status !== 'draft')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5) // Take last 5
    .reverse(); // Show oldest to newest in chart

  return activeTrips.map(trip => {
    let tripTotal = 0;
    trip.fuelEntries?.forEach(e => tripTotal += e.pricePaid || 0);
    trip.tollEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.foodEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.mobilityEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.hotelEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.otherEntries?.forEach(e => tripTotal += e.amount || 0);

    return {
      name: trip.title.length > 15 ? trip.title.substring(0, 12) + '...' : trip.title,
      amount: tripTotal
    };
  });
}

/**
 * Calculates KM per trip (Top 5 recent)
 */
export function getTripKmData(trips: Trip[]): TripKm[] {
  const activeTrips = trips
    .filter(t => t.status !== 'draft')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5)
    .reverse();

  return activeTrips.map(trip => {
    let tripKm = 0;
    trip.legs?.forEach(l => tripKm += (l.distanceKm || 0));

    return {
      name: trip.title.length > 15 ? trip.title.substring(0, 12) + '...' : trip.title,
      km: Math.round(tripKm)
    };
  });
}

/**
 * Calculates expense distribution by category (Aggregated from all trips)
 */
export function getCategoryDistribution(trips: Trip[]): CategoryExpense[] {
  const categories = {
    Combustível: 0,
    Pedágio: 0,
    Alimentação: 0,
    Mobilidade: 0,
    Hospedagem: 0,
    Outros: 0
  };

  trips.forEach(trip => {
    if (trip.status === 'draft') return;
    
    trip.fuelEntries?.forEach(e => categories.Combustível += e.pricePaid || 0);
    trip.tollEntries?.forEach(e => categories.Pedágio += e.amount || 0);
    trip.foodEntries?.forEach(e => categories.Alimentação += e.amount || 0);
    trip.mobilityEntries?.forEach(e => categories.Mobilidade += e.amount || 0);
    trip.hotelEntries?.forEach(e => categories.Hospedagem += e.amount || 0);
    trip.otherEntries?.forEach(e => categories.Outros += e.amount || 0);
  });

  return Object.entries(categories)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount
    }));
}
