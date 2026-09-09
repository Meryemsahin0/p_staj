-- ============================================================================
-- Petlas Saha KB - Migration v2
-- Bu script MEVCUT bir veritabanına güvenle uygulanabilir (hepsi IF NOT EXISTS /
-- ON CONFLICT DO NOTHING ile yazıldı). Yeni kurulumlarda init.sql zaten bunları içerir.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v2.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Esnek rol/yetki sistemi: permissions (sabit katalog) + role_permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    perm_key VARCHAR(60) PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    perm_key VARCHAR(60) NOT NULL REFERENCES permissions(perm_key) ON DELETE CASCADE,
    PRIMARY KEY (role_id, perm_key)
);

INSERT INTO permissions (perm_key, description) VALUES
    ('VIEW_DOCUMENTS', 'Teknik dokümanları görüntüleme ve arama'),
    ('CREATE_DOCUMENTS', 'Doküman ekleme, düzenleme, silme'),
    ('VIEW_TIRE_TESTS', 'Saha mühendisliği takip kartlarını görüntüleme'),
    ('CREATE_TIRE_TESTS', 'Saha mühendisliği takip kartı ekleme/düzenleme'),
    ('VIEW_KABUL_RET', 'Teknik servis kabul/ret kayıtlarını görüntüleme'),
    ('CREATE_KABUL_RET', 'Teknik servis kabul/ret kaydı oluşturma/düzenleme')
ON CONFLICT (perm_key) DO NOTHING;

-- Varsayılan rollere, projenin önceki davranışını koruyacak yetkileri ata:
-- PERSONEL: her şeyi görüntüleyebilir ve ekleyebilir
INSERT INTO role_permissions (role_id, perm_key)
SELECT r.id, p.perm_key FROM roles r CROSS JOIN permissions p WHERE r.role_name = 'PERSONEL'
ON CONFLICT DO NOTHING;

-- STAJYER: sadece görüntüleyebilir
INSERT INTO role_permissions (role_id, perm_key)
SELECT r.id, p.perm_key FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'STAJYER' AND p.perm_key IN ('VIEW_DOCUMENTS', 'VIEW_TIRE_TESTS', 'VIEW_KABUL_RET')
ON CONFLICT DO NOTHING;

-- ADMIN: zaten kod içinde her şeye erişir (isEffectiveAdmin bypass), ama tutarlılık için tam yetki de ekleyelim
INSERT INTO role_permissions (role_id, perm_key)
SELECT r.id, p.perm_key FROM roles r CROSS JOIN permissions p WHERE r.role_name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Hata kodları kataloğu (admin panelden yönetilir) + kayıtlarda serbest metin alan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS error_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tire_tests ADD COLUMN IF NOT EXISTS hata_kodu VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_tire_tests_hata_kodu ON tire_tests (hata_kodu);

-- ---------------------------------------------------------------------------
-- 3) Kabul/Ret modülü (teknik servise gelen lastikler)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kabul_ret (
    id SERIAL PRIMARY KEY,
    lastik_seri_no VARCHAR(100),
    lastik_ebat VARCHAR(100),
    musteri VARCHAR(150),
    hata_kodu VARCHAR(100),
    karar VARCHAR(15) NOT NULL DEFAULT 'BEKLEMEDE', -- BEKLEMEDE, KABUL, RET
    aciklama TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kabul_ret_hata_kodu ON kabul_ret (hata_kodu);
CREATE INDEX IF NOT EXISTS idx_kabul_ret_search ON kabul_ret
    USING gin (to_tsvector('simple', coalesce(lastik_seri_no,'') || ' ' || coalesce(musteri,'') || ' ' || coalesce(aciklama,'')));

-- ---------------------------------------------------------------------------
-- 4) Genel amaçlı çoklu dosya ekleri (belgeler, saha testleri, kabul/ret için ortak)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    owner_type VARCHAR(20) NOT NULL,   -- GUIDE, TIRE_TEST, KABUL_RET
    owner_id INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments (owner_type, owner_id);

-- ---------------------------------------------------------------------------
-- 5) Belge (guides) görünürlük ayarları: herkese açık ya da sadece belirli roller
-- ---------------------------------------------------------------------------
ALTER TABLE guides ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS guide_role_access (
    guide_id INTEGER NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (guide_id, role_id)
);

-- Bitti.
SELECT 'migration_v2 tamamlandi' AS sonuc;
