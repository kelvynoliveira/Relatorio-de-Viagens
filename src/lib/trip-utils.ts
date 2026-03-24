
import { Trip } from "./models";

export interface TripStats {
    totalHoursMin: number;
    totalKm: number;
    totalExpenses: number;
    fuelStats: {
        cost: number;
        liters: number;
        count: number;
    };
    tollStats: {
        cost: number;
        count: number;
    };
    scheduleStatus: {
        type: 'scheduled' | 'active' | 'completed' | 'overdue';
        label: string;
        daysDiff: number;
    };
}

export function calculateTripStats(trip: Trip): TripStats {
    let totalHoursMin = 0;
    let totalKm = 0;

    // Calculate hours from visits
    trip.visits?.forEach((visit) => {
        visit.sessions?.forEach((session) => {
            if (session.startAt && session.endAt) {
                const start = new Date(session.startAt).getTime();
                const end = new Date(session.endAt).getTime();
                totalHoursMin += (end - start) / 1000 / 60;
            }
        });
    });

    // Calculate KM
    trip.legs?.forEach((leg) => {
        if (leg.distanceKm) totalKm += leg.distanceKm;
    });

    // Calculate Expenses
    let totalFuel = 0;
    let totalFuelLiters = 0;
    let fuelCount = 0;
    trip.fuelEntries?.forEach((entry) => {
        totalFuel += entry.pricePaid;
        totalFuelLiters += entry.liters;
        fuelCount++;
    });

    let totalTolls = 0;
    let tollCount = 0;
    trip.tollEntries?.forEach((entry) => {
        totalTolls += entry.amount;
        tollCount++;
    });

    let totalFood = 0;
    trip.foodEntries?.forEach((entry) => {
        totalFood += entry.amount;
    });

    let totalOther = 0;
    trip.otherEntries?.forEach((entry) => {
        totalOther += entry.amount;
    });

    let totalLegsCost = 0;
    trip.legs?.forEach((leg) => {
        if (leg.cost) totalLegsCost += leg.cost;
    });

    const totalExpenses = totalFuel + totalTolls + totalFood + totalOther + totalLegsCost;

    // Calculate Schedule Status
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    // Reset times to compare dates only
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const oneDay = 1000 * 60 * 60 * 24;

    let scheduleStatus: TripStats['scheduleStatus'];

    if (trip.status === 'completed') {
        scheduleStatus = { type: 'completed', label: 'Concluída', daysDiff: 0 };
    } else if (nowTime < startTime) {
        const diff = Math.ceil((startTime - nowTime) / oneDay);
        scheduleStatus = { type: 'scheduled', label: `Faltam ${diff} dias`, daysDiff: diff };
    } else if (nowTime <= endTime) {
        const diff = Math.ceil((endTime - nowTime) / oneDay);
        scheduleStatus = { type: 'active', label: `Restam ${diff} dias`, daysDiff: diff };
    } else {
        const diff = Math.ceil((nowTime - endTime) / oneDay);
        scheduleStatus = { type: 'overdue', label: 'Atrasada', daysDiff: diff };
    }


    return {
        totalHoursMin,
        totalKm,
        totalExpenses,
        fuelStats: {
            cost: totalFuel,
            liters: totalFuelLiters,
            count: fuelCount
        },
        tollStats: {
            cost: totalTolls,
            count: tollCount
        },
        scheduleStatus
    };
}
