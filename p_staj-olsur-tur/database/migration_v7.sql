-- ============================================================================
-- Petlas Saha KB - Migration v7
-- Doküman kategorilerine "Diğer" ve proje ile ilgili ek kategoriler eklendi.
--
-- Çalıştırma:
--   psql -U petlas_admin -d petlas_saha_kb -h localhost -f database/migration_v7.sql
-- ============================================================================

INSERT INTO categories (category_name, description) VALUES
    ('Diğer', 'Yukarıdaki kategorilere uymayan belgeler'),
    ('Montaj Talimatları', 'Lastik/jant sökme-takma adım adım talimatları'),
    ('Bakım ve Rotasyon', 'Periyodik bakım ve lastik rotasyon planları'),
    ('Kalite Standartları', 'Üretim ve saha kalite kriterleri'),
    ('Ürün Katalogları', 'Lastik modelleri, desen ve ebat kataloğu'),
    ('Sertifikalar', 'ISO, TSE ve diğer uygunluk sertifikaları'),
    ('Eğitim Materyalleri', 'Personel ve bayi eğitim dokümanları'),
    ('İş Güvenliği', 'Sahada ve teknik serviste iş güvenliği talimatları'),
    ('Şikayet ve Geri Bildirim', 'Müşteri şikayet değerlendirme süreçleri'),
    ('Lojistik ve Sevkiyat', 'Depo, sevkiyat ve teslimat prosedürleri'),
    ('Fiyat ve Teklif Listeleri', 'Güncel fiyat listeleri ve teklif şablonları'),
    ('Saha Raporlama', 'Saha mühendisliği periyodik rapor şablonları'),
    ('Teknik Servis Prosedürleri', 'Kabul/ret değerlendirme ve servis akışları'),
    ('Sözleşme ve Anlaşmalar', 'Bayi/müşteri sözleşme örnekleri'),
    ('Duyurular', 'Şirket içi duyurular ve güncellemeler')
ON CONFLICT (category_name) DO NOTHING;

SELECT 'migration_v7 tamamlandi' AS sonuc;
