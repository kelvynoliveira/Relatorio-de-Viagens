import { z } from 'zod';

// --- Global Enums & Constants ---
export const TripStatusEnum = z.enum(['draft', 'in_progress', 'completed']);
export type TripStatus = z.infer<typeof TripStatusEnum>;

export const TransportTypeEnum = z.enum(['car', 'airplane', 'bus', 'uber', 'other']);
export type TransportType = z.infer<typeof TransportTypeEnum>;

export const PhotoTagEnum = z.enum(['ANTES', 'DEPOIS', 'PROBLEMA', 'SOLUÇÃO']);
export type PhotoTag = z.infer<typeof PhotoTagEnum>;

export const ExpenseTypeEnum = z.enum(['fuel', 'toll', 'food', 'mobility', 'other']);
export type ExpenseType = z.infer<typeof ExpenseTypeEnum>;

// --- Catalogs (Mocks) ---
export const BrandSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Brand = z.infer<typeof BrandSchema>;

export const CampusSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  address: z.string(),
});
export type Campus = z.infer<typeof CampusSchema>;

// --- Sub-Entities ---





const numericCoerce = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'string') {
    val = val.replace(',', '.');
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}, z.number());

// Helper for permissive dates (DB might have different formats or nulls)
const permissiveDate = z.preprocess((val) => {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString();
  // Try to validate/fix string format if needed, or just pass valid strings
  const s = String(val).trim();
  return s === '' ? undefined : s;
}, z.string().optional());


export const PhotoEntrySchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  description: z.string().optional(),
  timestamp: permissiveDate.optional(),
  tags: z.array(PhotoTagEnum),
});
export type PhotoEntry = z.infer<typeof PhotoEntrySchema>;

export const ScopeItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  qty: z.number().min(0, 'Quantidade inválida'),
  comment: z.string().optional(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type ScopeItem = z.infer<typeof ScopeItemSchema>;

export const FuelEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  liters: numericCoerce.pipe(z.number().min(0, 'Quantidade de litros inválida')),
  pricePaid: numericCoerce.pipe(z.number().min(0, 'Valor pago inválido')),
  pricePerLiter: numericCoerce.optional(),
  location: z.string().optional().nullable(),
  odometer: numericCoerce.optional(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type FuelEntry = z.infer<typeof FuelEntrySchema>;

export const TollEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  amount: numericCoerce.pipe(z.number().min(0, 'Valor inválido')),
  location: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type TollEntry = z.infer<typeof TollEntrySchema>;

export const FoodEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  amount: numericCoerce.pipe(z.number().min(0, 'Valor inválido')),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type FoodEntry = z.infer<typeof FoodEntrySchema>;

export const MobilityEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  amount: numericCoerce.pipe(z.number().min(0, 'Valor inválido')),
  transportType: z.enum(['uber', 'bus', 'other']).default('uber'),
  from: z.string().optional().nullable(),
  to: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type MobilityEntry = z.infer<typeof MobilityEntrySchema>;

export const OtherEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  amount: numericCoerce.pipe(z.number().min(0, 'Valor inválido')),
  description: z.string().min(2, 'Descrição obrigatória'),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type OtherEntry = z.infer<typeof OtherEntrySchema>;

export const HotelEntrySchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  amount: numericCoerce.pipe(z.number().min(0, 'Valor inválido')),
  hotelName: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type HotelEntry = z.infer<typeof HotelEntrySchema>;

export const PlannedFlightSchema = z.object({
  id: z.string().uuid(),
  date: permissiveDate.optional(),
  from: z.string().min(2, 'Origem obrigatória'),
  to: z.string().min(2, 'Destino obrigatório'),
  flightNumber: z.string().optional().nullable(),
  flightTime: z.string().optional().nullable(),
  price: z.union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => (val === '' || val === null || val === undefined) ? undefined : Number(String(val).replace(',', '.')))
    .pipe(z.number().min(0, 'Valor inválido').optional()),
  notes: z.string().optional().nullable(),
});
export type PlannedFlight = z.infer<typeof PlannedFlightSchema>;

export const DisplacementLegSchema = z.object({
  id: z.string().uuid(),
  from: z.string().min(2, 'Origem obrigatória'),
  to: z.string().min(2, 'Destino obrigatório'),
  transportType: TransportTypeEnum,
  distanceKm: z.union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => (val === '' || val === null || val === undefined) ? undefined : Number(String(val).replace(',', '.')))
    .pipe(z.number().min(0, 'Distância inválida').optional()),
  cost: z.union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => (val === '' || val === null || val === undefined) ? undefined : Number(String(val).replace(',', '.')))
    .pipe(z.number().min(0, 'Custo inválido').optional()),
  date: permissiveDate.optional(),
  description: z.string().optional().nullable(),
  photos: z.array(PhotoEntrySchema).default([]),
});
export type DisplacementLeg = z.infer<typeof DisplacementLegSchema>;

// --- Campus Visit (Atendimento) ---

export const WorkSessionSchema = z.object({
  id: z.string().uuid(),
  startAt: permissiveDate.optional(),
  endAt: permissiveDate.optional(),
});

export const CampusVisitSchema = z.object({
  id: z.string().uuid(),
  campusId: z.string(), // Link to Catalog
  status: z.enum(['pending', 'in_progress', 'done']),
  sessions: z.array(WorkSessionSchema),
  scope: z.array(ScopeItemSchema),
  photos: z.array(PhotoEntrySchema),
  notes: z.string().nullable().optional(), // Allow null specifically
});
export type CampusVisit = z.infer<typeof CampusVisitSchema>;

// --- Trip (Itinerary Item) ---
// Used for ordering in the wizard
export const ItineraryItemSchema = z.object({
  campusId: z.string(),
  order: z.number(),
  plannedArrival: permissiveDate.optional(),
  plannedDeparture: permissiveDate.optional(),
  hotelName: z.string().optional().nullable(),
  hotelCost: z.union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => (val === '' || val === null || val === undefined) ? undefined : Number(String(val).replace(',', '.')))
    .pipe(z.number().min(0, 'Custo inválido').optional()),
});
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

// --- Main Trip Model ---
export const TripSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().optional(), // Owner of the trip
  title: z.string().min(3, 'Título é obrigatório'),

  startDate: z.string().min(10, 'Data de início inválida'),
  endDate: z.string().min(10, 'Data de fim inválida'),

  originCity: z.string().min(2, 'Cidade de origem obrigatória'),
  notes: z.string().optional().nullable(),
  // notes in TripSchema lines 177 is already optional().nullable().
  // Wait, permissiveDate is used for createdAt/updatedAt.

  status: TripStatusEnum,
  createdAt: permissiveDate.optional(),
  updatedAt: permissiveDate.optional(),

  // Relationships
  itinerary: z.array(ItineraryItemSchema), // The plan

  // Data entries
  legs: z.array(DisplacementLegSchema),
  fuelEntries: z.array(FuelEntrySchema),
  tollEntries: z.array(TollEntrySchema),
  foodEntries: z.array(FoodEntrySchema).default([]),
  mobilityEntries: z.array(MobilityEntrySchema).default([]),
  hotelEntries: z.array(HotelEntrySchema).default([]),
  otherEntries: z.array(OtherEntrySchema).default([]),
  plannedFlights: z.array(PlannedFlightSchema).default([]),
  visits: z.array(CampusVisitSchema),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "A data fim deve ser maior ou igual a data início",
  path: ["endDate"],
});

export type Trip = z.infer<typeof TripSchema>;
