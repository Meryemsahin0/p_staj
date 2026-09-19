-- ============================================================================
-- Petlas Saha KB - Migration v8
-- Lastik testi yaşam döngüsü (Aktif/Sonlandırıldı) ve Petlas Gündem haber modülü.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v8.sql
-- ============================================================================

-- 1) Lastik test formu durum takibi: AKTIF (varsayılan) / SONLANDIRILDI
--    Ana sayfadaki "şu an takılı lastik sayısı" ve "kaç ilde test yapılıyor" sayaçları
--    sadece AKTIF kayıtları sayar. Kayıt silinmese de "sonlandır" ile sayaçtan düşürülebilir.
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS durum VARCHAR(20) NOT NULL DEFAULT 'AKTIF';
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS sonlandirma_tarihi TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_tire_tests_durum ON tire_tests (durum);

-- 2) Petlas Gündem haber modülü (sadece admin ekler/düzenler, herkes görür)
CREATE TABLE IF NOT EXISTS haberler (
    id SERIAL PRIMARY KEY,
    baslik VARCHAR(255) NOT NULL,
    icerik TEXT NOT NULL,
    gorsel_url VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_haberler_created_at ON haberler (created_at DESC);

SELECT 'migration_v8 tamamlandi' AS sonuc;
