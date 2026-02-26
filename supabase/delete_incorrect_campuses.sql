-- Run this script in the Supabase SQL Editor to delete the incorrect campuses.

DELETE FROM campuses 
WHERE id IN (
  'c87', -- AZURE
  'c31', -- BLOCO ENLACE E ROTEAMENTO
  'c71', -- BLOCO LEGADO
  'c78', -- BLOCO LEGADO
  'c77', -- DC UNP
  'c76', -- GCP
  'c66', -- PEDRA BRANCA DC
  'c65'  -- PEDRA BRANCA WIFI
);
