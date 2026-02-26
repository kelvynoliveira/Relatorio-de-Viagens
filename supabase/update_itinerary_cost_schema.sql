-- Add hotel_cost column to itinerary_items table
ALTER TABLE itinerary_items 
ADD COLUMN IF NOT EXISTS hotel_cost numeric(10,2);

-- Refresh the schema cache so PostgREST picks up the new column
NOTIFY pgrst, 'reload config';
