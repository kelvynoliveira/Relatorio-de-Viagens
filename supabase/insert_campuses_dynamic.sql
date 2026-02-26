-- Dynamic Insert Script
-- This script looks up the brand_id by name instead of using hardcoded IDs like 'b26'.

-- 1. CAICÓ (UNP)
INSERT INTO campuses (id, brand_id, name, city, state, address)
SELECT
  'unp_caico',
  id,
  'CAICÓ',
  'CAICÓ',
  'RIO GRANDE DO NORTE',
  'Endereço não informado'
FROM brands
WHERE name ILIKE '%UNP%' OR name ILIKE '%Universidade Potiguar%'
LIMIT 1;

-- 2. PAU DOS FERROS (UNP)
INSERT INTO campuses (id, brand_id, name, city, state, address)
SELECT
  'unp_paus_ferros',
  id,
  'PAU DOS FERROS',
  'PAU DOS FERROS',
  'RIO GRANDE DO NORTE',
  'Endereço não informado'
FROM brands
WHERE name ILIKE '%UNP%' OR name ILIKE '%Universidade Potiguar%'
LIMIT 1;

-- 3. BELA CINTRA (UAM - Anhembi Morumbi)
INSERT INTO campuses (id, brand_id, name, city, state, address)
SELECT
  'uam_bela_cintra',
  id,
  'BELA CINTRA',
  'SÃO PAULO',
  'SÃO PAULO',
  'Rua Bela Cintra, 934 - Consolação'
FROM brands
WHERE name ILIKE '%Anhembi%' OR name ILIKE '%UAM%'
LIMIT 1;

-- VERIFICATION
-- Run this to check if they were inserted:
SELECT * FROM campuses WHERE id IN ('unp_caico', 'unp_paus_ferros', 'uam_bela_cintra');
