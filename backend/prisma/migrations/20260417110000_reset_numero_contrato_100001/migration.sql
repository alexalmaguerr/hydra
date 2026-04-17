-- Shift existing numero_contrato values to the 6-digit range (100001+)
UPDATE "contratos" SET "numero_contrato" = "numero_contrato" + 100000;

-- Advance the sequence so the next INSERT continues after the highest existing value
SELECT setval(
  pg_get_serial_sequence('"contratos"', 'numero_contrato'),
  GREATEST(COALESCE((SELECT MAX("numero_contrato") FROM "contratos"), 0), 100000)
);
