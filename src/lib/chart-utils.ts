import { Trip } from './models';

export interface MonthlyExpense {
  month: string;
  amount: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
}

/**
 * Groups expenses by month based on the trip's start date
 */
export function getMonthlyExpenseData(trips: Trip[]): MonthlyExpense[] {
  const monthlyData: Record<string, number> = {};

  // Sort trips by date first
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  sortedTrips.forEach(trip => {
    if (trip.status === 'draft') return;
    
    const date = new Date(trip.startDate);
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    // Calculate total expenses for this trip
    let tripTotal = 0;
    trip.fuelEntries?.forEach(e => tripTotal += e.pricePaid || 0);
    trip.tollEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.foodEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.mobilityEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.hotelEntries?.forEach(e => tripTotal += e.amount || 0);
    trip.otherEntries?.forEach(e => tripTotal += e.amount || 0);

    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tripTotal;
  });

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month: month.charAt(0).toUpperCase() + month.slice(1),
    amount
  }));
}

/**
 * Calculates expense distribution by category
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

/**
 * Calculates KM evolution per month
 */
export function getMonthlyKmData(trips: Trip[]): { month: string, km: number }[] {
    const monthlyData: Record<string, number> = {};

    const sortedTrips = [...trips].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    sortedTrips.forEach(trip => {
        if (trip.status === 'draft') return;
        
        const date = new Date(trip.startDate);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        let tripKm = 0;
        trip.legs?.forEach(l => tripKm += (l.distanceKm || 0));

        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tripKm;
    });

    return Object.entries(monthlyData).map(([month, km]) => ({
        month: month.charAt(0).toUpperCase() + month.slice(1),
        km: Math.round(km)
    }));
}
