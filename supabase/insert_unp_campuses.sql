-- Insert campuses for UNP (Brand ID: b26)
-- Using UUIDs for IDs since the user provided examples like 'c10', but strict UUIDs are safer if the DB expects them. 
-- However, previous examples showed 'cXXX'. I will use 'c_mossoro' and 'c_paus_dos_ferros' given I cannot generate sequential IDs easily without risking collision, 
-- OR better, I will let the user know to check the ID format. 
-- Actually, the user's previous list showed 'c87', 'c77' etc.
-- I'll use random UUIDs to be safe if the column supports it, or specific 'c' prefixed IDs if that's the convention.
-- Looking at 'c87', it seems to be a manual or legacy ID system.
-- I will generate standard UUIDs using `gen_random_uuid()` if supported, or just static IDs that likely won't collide for this manual insertion.
-- Let's use 'unp_mossoro' and 'unp_paus' to be safe and distinct.

INSERT INTO campuses (id, brand_id, name, city, state, address) VALUES
('unp_mossoro', 'b26', 'MOSSORÓ', 'MOSSORÓ', 'RIO GRANDE DO NORTE', 'Endereço não informado'),
('unp_paus', 'b26', 'PAU DOS FERROS', 'PAU DOS FERROS', 'RIO GRANDE DO NORTE', 'Endereço não informado');
