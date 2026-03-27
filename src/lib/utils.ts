import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDistance(km: number) {
  return `${km.toLocaleString('pt-BR')} km`;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Reliable ID generator for now (client-side only)
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback to RFC4122 v4 compliant hex generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts an ISO string or Date to a local 'YYYY-MM-DDTHH:mm' string for datetime-local inputs.
 * Accounts for the browser's local timezone offset.
 */
export function toInputDateTime(date?: string | Date | null) {
  if (!date) return '';

  // If it's already a YYYY-MM-DDTHH:mm string (length 16)
  if (typeof date === 'string' && date.length === 16 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    // If it's a string but we can't parse it as a date, return as-is to allow typing
    return typeof date === 'string' ? date : '';
  }

  // Shift the date by the offset so that slicing the ISO string gives the local time
  const offset = d.getTimezoneOffset() * 60000; // in ms
  const localIso = new Date(d.getTime() - offset).toISOString();
  return localIso.substring(0, 16);
}

/**
 * Converts an ISO string or Date to a local 'YYYY-MM-DD' string for date inputs.
 */
export function toInputDate(date?: string | Date | null) {
  if (!date) return '';

  // If it's already a YYYY-MM-DD string (length 10)
  if (typeof date === 'string' && date.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    // If it's a string but we can't parse it as a date, return as-is to allow typing
    return typeof date === 'string' ? date : '';
  }

  const offset = d.getTimezoneOffset() * 60000;
  const localIso = new Date(d.getTime() - offset).toISOString();
  return localIso.substring(0, 10);
}

/**
 * Converts a string from a datetime-local input ('YYYY-MM-DDTHH:mm') 
 * back to a standard UTC ISO string for storage.
 */
export function fromInputDateTime(value: string) {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

/**
 * Validates if the given date is within the trip's date range (inclusive).
 */
export function isDateInTripRange(
  dateValue: string | Date | undefined | null,
  trip: { startDate: string; endDate: string }
): { isValid: boolean; message: string } {
  if (!dateValue) return { isValid: true, message: '' };

  const d = new Date(dateValue);

  // Create helper to parse date without timezone issues if it's YYYY-MM-DD
  const parseTripDate = (dateStr: string, isEnd: boolean) => {
    // If it's 10 chars, it's YYYY-MM-DD
    if (dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return isEnd
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    // Otherwise assume it's ISO
    const d = new Date(dateStr);
    if (isEnd) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  };

  const start = parseTripDate(trip.startDate, false);
  const end = parseTripDate(trip.endDate, true);

  if (d < start || d > end) {
    return {
      isValid: false,
      message: `A data deve estar entre ${start.toLocaleDateString('pt-BR')} e ${end.toLocaleDateString('pt-BR')}`
    };
  }

  return { isValid: true, message: '' };
}

export function formatUserName(name?: string | null) {
  if (!name) return 'Viajante';
  const rawName = name.split(' ')[0].split('.')[0];
  return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

/**
 * Parses an ISO string and returns a Date object shifted so that its local representation
 * matches the UTC representation of the string. This prevents "day before" bugs in calendars.
 */
export function parseISOAsLocal(isoString: string | undefined | null): Date {
  if (!isoString) return new Date();
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return new Date();
  
  // Shift the date so that local time matches what was stored as UTC
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() + offset);
}

/**
 * Returns an ISO string from a Date object by shifting it so that its UTC representation
 * matches its local representation.
 */
export function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString();
}
