-- ============================================================================
-- Petlas Saha KB - Migration v3
-- "Stencil No" alanı Lastik Test Formu'na eklendi.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v3.sql
-- ============================================================================

ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS stencil_no VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_tire_tests_stencil_no ON tire_tests (stencil_no);

SELECT 'migration_v3 tamamlandi' AS sonuc;
