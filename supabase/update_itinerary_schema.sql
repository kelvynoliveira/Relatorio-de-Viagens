-- Add stay duration and hotel tracking columns to itinerary_items
alter table itinerary_items add column if not exists planned_arrival timestamp with time zone;
alter table itinerary_items add column if not exists planned_departure timestamp with time zone;
alter table itinerary_items add column if not exists hotel_name text;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
