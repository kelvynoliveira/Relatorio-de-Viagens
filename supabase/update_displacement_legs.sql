-- Update Displacement Legs Table to support photos and descriptions
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='displacement_legs' and column_name='description') then
        alter table displacement_legs add column description text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='displacement_legs' and column_name='photos') then
        alter table displacement_legs add column photos jsonb default '[]'::jsonb;
    end if;
end $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
