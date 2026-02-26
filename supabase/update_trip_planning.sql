-- Add planned_flights to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_flights JSONB DEFAULT '[]'::jsonb;

-- Create hotel_entries table
CREATE TABLE IF NOT EXISTS hotel_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10,2) DEFAULT 0,
    hotel_name TEXT,
    location TEXT,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hotel_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (Mirroring other entry tables)
CREATE POLICY "Users can view hotel entries of their trips" 
ON hotel_entries FOR SELECT 
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = hotel_entries.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can insert hotel entries to their trips" 
ON hotel_entries FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM trips WHERE trips.id = hotel_entries.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can update hotel entries of their trips" 
ON hotel_entries FOR UPDATE 
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = hotel_entries.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can delete hotel entries of their trips" 
ON hotel_entries FOR DELETE 
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = hotel_entries.trip_id AND trips.user_id = auth.uid()));
