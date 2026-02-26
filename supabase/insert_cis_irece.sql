-- Insert CIS - IRECE for AGES (b1)
-- Generating a specific ID to avoid conflicts with auto-increment or other seeds

INSERT INTO campuses (id, brand_id, name, city, state, address) VALUES
('cis_irece', 'b1', 'CIS - IRECÊ', 'IRECÊ', 'BA', 'Rua Rio Corrente, s/n')
ON CONFLICT (id) DO NOTHING;
