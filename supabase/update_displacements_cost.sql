-- Add 'cost' column to displacement_legs table
alter table displacement_legs add column if not exists cost numeric default 0;
