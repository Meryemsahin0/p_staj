-- Petlas Saha Teknik Personeli Bilgi Tabanı - Veritabanı Şeması
-- PostgreSQL

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, PERSONEL, STAJYER
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    personel_tipi VARCHAR(30),             -- yalnızca PERSONEL için: TEKNIK_SERVIS veya SAHA
    admin_yetkisi BOOLEAN DEFAULT FALSE,    -- PERSONEL/STAJYER'e ADMIN tarafından verilebilen ek yetki
    profil_foto VARCHAR(500),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL, -- Tork Değerleri, Basınç Tabloları, Arıza Çözümleri...
    description TEXT
);

CREATE TABLE IF NOT EXISTS guides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    keywords TEXT, -- arama için virgülle ayrılmış anahtar kelimeler
    file_path VARCHAR(500), -- opsiyonel PDF/ek dosya yolu
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- LOGIN, VIEW_DOCUMENT, CREATE_DOCUMENT, UPDATE_DOCUMENT, DELETE_DOCUMENT, CREATE_USER...
    endpoint VARCHAR(255),
    ip_address VARCHAR(64),
    details TEXT,
    "timestamp" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category_id);
CREATE INDEX IF NOT EXISTS idx_guides_keywords ON guides USING gin (to_tsvector('simple', coalesce(keywords,'') || ' ' || title));
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- Lastik Test Formu (kağıt formun dijital karşılığı)
-- items ve measurements alanları JSONB olarak tutulur: değişken sayıda pozisyon (A-N) ve
-- değişken sayıda tarih ölçümü (1.Tarih, 2.Tarih, ...) esnek şekilde saklanabilsin diye.
CREATE TABLE IF NOT EXISTS tire_tests (
    id SERIAL PRIMARY KEY,
    aciklama VARCHAR(255) NOT NULL,          -- Formun arama/listeleme için başlığı
    sirket VARCHAR(150),
    arac_cinsi VARCHAR(50),                  -- C, TR, R, S, T, İ, P, U, F (kağıttaki kodlar)
    plaka VARCHAR(30),
    arac_no VARCHAR(50),                     -- Filo içi araç numarası
    model VARCHAR(150),                      -- "Marka - Model" biçiminde girilir
    arac_tipi VARCHAR(100),
    test_no VARCHAR(50),
    hafta VARCHAR(20),                       -- Test haftası (örn: 2026-W27)
    yuk_agirligi VARCHAR(50),
    montaj_pozisyonu JSONB DEFAULT '[]',     -- Sol/Sağ S1-S9, D1-D9 seçilen pozisyonlar
    items JSONB DEFAULT '[]',                -- [{pozisyon, lastik_id, ebat, desen, hatta_kodu, seri_numarasi}, ...]
    measurements JSONB DEFAULT '[]',         -- [{tarih, km, desen, orj_dis_derinligi, olculen_psi:[..], onerilen_psi:{f,d,t}, sicak, soguk}, ...]
    file_path VARCHAR(500),                  -- Taranmış kağıt / ek fotoğraf (PDF veya görsel)
    notlar TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tire_tests_aciklama ON tire_tests USING gin (to_tsvector('simple', coalesce(aciklama,'') || ' ' || coalesce(plaka,'') || ' ' || coalesce(model,'')));

-- Başlangıç rolleri (tek sabit ADMIN + ayrıca ADMIN_YETKISI bayrağı ile genişletilebilir)
INSERT INTO roles (role_name, description) VALUES
    ('ADMIN', 'Sistem Yöneticisi - sabit tek hesap, tam yetki'),
    ('PERSONEL', 'Teknik Servis veya Saha personeli - doküman/form ekleyebilir'),
    ('STAJYER', 'Stajyer - varsayılan olarak sadece inceleme yapabilir')
ON CONFLICT (role_name) DO NOTHING;

-- Örnek kategoriler
INSERT INTO categories (category_name, description) VALUES
    ('Tork Değerleri', 'Lastik/jant montaj tork tabloları'),
    ('Basınç Tabloları', 'Araç tipine göre hava basıncı standartları'),
    ('Arıza Çözümleri', 'Sık karşılaşılan sahra arızaları ve çözüm adımları'),
    ('Garanti Prosedürleri', 'Garanti ön değerlendirme kriterleri')
ON CONFLICT (category_name) DO NOTHING;

-- NOT: Varsayılan admin kullanıcısı backend ilk açılışta seed script ile (bcrypt hash'i ile) oluşturulur.

-- Örnek doldurulmuş Lastik Test Formu kayıtları (referans / eğitim amaçlı)
INSERT INTO tire_tests (aciklama, sirket, arac_cinsi, plaka, arac_no, model, arac_tipi, test_no, hafta, yuk_agirligi, montaj_pozisyonu, items, measurements, notlar)
VALUES
(
    '35 Ton Yarı Römork Sahra Testi - İstanbul-Ankara Hattı',
    'Petlas Lastik San. ve Tic. A.Ş.',
    'S - YARI TREYLER',
    '06 ABC 123',
    'ARC-0451',
    'Mercedes-Benz - Actros 1848',
    'Yarı Römork',
    'TST-2026-001',
    '2026-W22',
    '35000 kg',
    '[{"kod":"S1","secili":true},{"kod":"S3","secili":true},{"kod":"D2","secili":true},{"kod":"D4","secili":true}]',
    '[{"pozisyon":"S1","lastik_id":"LST-TST2026001-S1","ebat":"385/65 R22.5","desen":"NH200","hatta_kodu":"HK-114","seri_numarasi":"PT2601001"},
      {"pozisyon":"D2","lastik_id":"LST-TST2026001-D2","ebat":"385/65 R22.5","desen":"NH200","hatta_kodu":"HK-114","seri_numarasi":"PT2601002"}]',
    '[{"tarih":"2026-06-01","km":"0","desen":"NH200","orj_dis_derinligi":"18 mm","olculen_psi":["120","121","119","120"],"onerilen_psi":{"f":"120","d":"115","t":"110"},"sicak":"38°C","soguk":"25°C"},
      {"tarih":"2026-07-01","km":"18450","desen":"NH200","orj_dis_derinligi":"15 mm","olculen_psi":["118","119","117","118"],"onerilen_psi":{"f":"120","d":"115","t":"110"},"sicak":"36°C","soguk":"24°C"}]',
    'Örnek doldurulmuş referans kayıt. Yeni test girerken benzer şekilde doldurabilirsiniz.'
),
(
    '22.5 İnç Şehir İçi Otobüs Lastik Kontrolü - Örnek Kayıt',
    'Petlas Lastik San. ve Tic. A.Ş.',
    'U - ŞEHİR OTOBÜSÜ',
    '35 XYZ 456',
    'ARC-0912',
    'Mercedes-Benz - Citaro',
    'Şehir İçi Otobüs',
    'TST-2026-002',
    '2026-W19',
    '18000 kg',
    '[{"kod":"S2","secili":true},{"kod":"D1","secili":true}]',
    '[{"pozisyon":"S2","lastik_id":"LST-TST2026002-S2","ebat":"275/70 R22.5","desen":"CU200","hatta_kodu":"HK-098","seri_numarasi":"PT2601050"}]',
    '[{"tarih":"2026-05-10","km":"0","desen":"CU200","orj_dis_derinligi":"16 mm","olculen_psi":["110","111","110","112"],"onerilen_psi":{"f":"110","d":"108","t":"105"},"sicak":"34°C","soguk":"22°C"}]',
    'Örnek doldurulmuş referans kayıt.'
)
ON CONFLICT DO NOTHING;
