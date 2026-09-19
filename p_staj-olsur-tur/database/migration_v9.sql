-- ============================================================================
-- Petlas Saha KB - Migration v9
-- Her lastik test formuna, araçla ilgili bilgi alınabilecek bir iletişim numarası eklendi.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v9.sql
-- ============================================================================

ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS iletisim_no VARCHAR(30);

SELECT 'migration_v9 tamamlandi' AS sonuc;
