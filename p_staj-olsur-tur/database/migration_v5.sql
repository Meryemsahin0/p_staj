-- ============================================================================
-- Petlas Saha KB - Migration v5
-- "Başlangıç Kilometresi" alanı Lastik Test Formu'na eklendi.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v5.sql
-- ============================================================================

ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS baslangic_km VARCHAR(50);

SELECT 'migration_v5 tamamlandi' AS sonuc;
