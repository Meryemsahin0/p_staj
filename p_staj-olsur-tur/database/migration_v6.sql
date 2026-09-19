-- ============================================================================
-- Petlas Saha KB - Migration v6
-- Departman/Şef yapısı, Karışım modülü, doküman departmanı, lastik test formu
-- için il/plaka/3'lü başlangıç tarihi-km (Ön/Çeker/Dorse) ve karışım alanları.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v6.sql
-- ============================================================================

-- 1) Kullanıcılara departman, şeflik ve karışım yönetim yetkisi
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(30);          -- SAHA_MUHENDISLIGI / TEKNIK_SERVIS / NULL (admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_chief BOOLEAN DEFAULT FALSE;  -- Departman şefi mi?
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_karisim BOOLEAN DEFAULT FALSE; -- Karışım ekle/çıkar yetkisi (saha müh. şefi tarafından verilir)

-- 2) Dokümanlara (guides) departman etiketi — GENEL herkese açık, diğerleri sadece kendi departmanına
ALTER TABLE guides ADD COLUMN IF NOT EXISTS department VARCHAR(30) DEFAULT 'GENEL';

-- 3) Karışım kataloğu (saha mühendisliği)
CREATE TABLE IF NOT EXISTS karisimlar (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(150) UNIQUE NOT NULL,
    aciklama TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4) Lastik Test Formu: il, plaka formatı zaten uygulama katmanında doğrulanacak,
--    3 ayrı başlangıç grubu (Ön / Çeker / Dorse) ve seçilen karışımlar
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS il VARCHAR(30);
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS on_tarih DATE;
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS on_km VARCHAR(50);
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS ceker_tarih DATE;
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS ceker_km VARCHAR(50);
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS dorse_tarih DATE;
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS dorse_km VARCHAR(50);
ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS karisimlar JSONB DEFAULT '[]';

-- Plaka benzersizliği: uygulama katmanında (controller içinde) kontrol edilir,
-- çünkü mevcut test verilerinde tekrar eden/boş plakalar olabilir; sert bir
-- UNIQUE kısıtı burada eklenmedi (mevcut veriyle çakışmaması için).

SELECT 'migration_v6 tamamlandi' AS sonuc;
