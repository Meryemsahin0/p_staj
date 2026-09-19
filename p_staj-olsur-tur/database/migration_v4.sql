-- ============================================================================
-- Petlas Saha KB - Migration v4
-- "İlk Lastik Takılma Tarihi" alanı Lastik Test Formu'na eklendi.
-- NOT: test_no, stencil_no ve hata_kodu sütunları kasıtlı olarak SİLİNMEDİ
-- (eski kayıtlarla uyum için), sadece yeni formlarda artık kullanılmıyorlar.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v4.sql
-- ============================================================================

ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS ilk_takilma_tarihi DATE;

SELECT 'migration_v4 tamamlandi' AS sonuc;
