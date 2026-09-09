# Petlas Saha Teknik Personeli Bilgi Tabanı ve Hızlı Çözüm Rehberi (Secure KB)

Petlas Müşteri Sonrası Saha Hizmetleri / Teknik Servis birimi için geliştirilmiş,
**JWT tabanlı kimlik doğrulama**, **rol bazlı erişim kontrolü (RBAC)** ve
**güvenlik denetim loglaması (Audit Log)** içeren, mobil uyumlu bir kurumsal
bilgi yönetim sistemi.

Bu proje, staj/bitirme projesi PDF planındaki 4 haftalık yol haritasının
(veritabanı & backend → içerik yönetimi → frontend → güvenlik & Docker)
tam çalışan bir uygulamaya dönüştürülmüş halidir.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | Node.js + Express, JWT (jsonwebtoken), bcryptjs, Helmet, Rate Limiting |
| Frontend | Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS |
| Veritabanı | PostgreSQL |
| Konteynerizasyon | Docker + Docker Compose |

## Proje Yapısı

```
petlas-saha-kb/
├── backend/                # Express REST API
│   ├── src/
│   │   ├── config/db.js            # PostgreSQL bağlantı havuzu
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT doğrulama
│   │   │   ├── rbac.js             # Rol bazlı yetkilendirme
│   │   │   └── auditLog.js         # Güvenlik logu kaydı
│   │   ├── controllers/            # auth, documents, categories, users, audit
│   │   ├── routes/                 # /api/v1/* endpoint tanımları
│   │   ├── utils/
│   │   │   ├── jwt.js              # Token üretim/doğrulama
│   │   │   └── seed.js             # İlk admin kullanıcı oluşturma
│   │   └── index.js                # Express giriş noktası
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/                # Vue 3 SPA
│   ├── src/
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   ├── Search.vue          # Ana arama ekranı
│   │   │   ├── DocumentDetail.vue  # Doküman detayı
│   │   │   ├── Admin.vue           # Doküman CRUD paneli
│   │   │   ├── AdminUsers.vue      # Kullanıcı/rol yönetimi
│   │   │   └── AdminLogs.vue       # Denetim logları görüntüleme
│   │   ├── store/auth.js           # Pinia auth store (JWT saklama)
│   │   ├── api/axios.js            # Axios instance + interceptor'lar
│   │   └── router/index.js         # Route guard'ları (RBAC)
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── database/
│   └── init.sql             # Tablolar, roller, örnek kategoriler
├── docker-compose.yml
└── README.md
```

## Veritabanı Şeması (Özet)

- **roles**: ADMIN, MANAGER, USER
- **users**: kullanıcı hesapları (rol ile ilişkili, bcrypt hash'li şifre)
- **categories**: Tork Değerleri, Basınç Tabloları, Arıza Çözümleri, Garanti Prosedürleri
- **guides**: teknik dokümanlar (kategori, anahtar kelime, opsiyonel dosya eki)
- **audit_logs**: kim, ne zaman, hangi işlemi yaptı (IP, endpoint, detay)

## RBAC Yetki Matrisi

| İşlem | Stajyer (yetkisiz) | Personel | ADMIN / Admin Yetkili |
|---|---|---|---|
| Doküman/Form arama/görüntüleme | ✅ | ✅ | ✅ |
| Doküman/Form ekleme | ❌ | ✅ | ✅ |
| Doküman/Form düzenleme/silme | ❌ | ✅ (yalnızca kendi eklediği) | ✅ (tümü) |
| Kullanıcı oluşturma/silme/rol atama | ❌ | ❌ | ✅ |
| Admin yetkisi verme/alma | ❌ | ❌ | ✅ |
| Denetim loglarını görüntüleme | ❌ | ❌ | ✅ |

> Not: Bir Stajyer veya Personel'e ADMIN tarafından "admin yetkisi" verilirse, o kullanıcı rolü değişmeden (PERSONEL/STAJYER olarak görünmeye devam eder) en sağdaki sütunun tüm yetkilerine sahip olur.

## Yeni Eklenen Özellikler (v1.2)

### 1. Petlas Logosu
Giriş ekranında ve soldaki menüde Petlas logosu görünür (`frontend/src/assets/petlas-logo.png`).

### 2. Şifremi Unuttum / Şifre Sıfırlama
- `POST /api/v1/auth/forgot-password { email }` → e-postaya (varsa) sıfırlama linki gönderir.
- `POST /api/v1/auth/reset-password { email, token, newPassword }` → şifreyi günceller.
- **SMTP tanımlı değilse** (varsayılan), link gerçek mail olarak gitmez, backend loglarında (`docker logs petlas_backend`) görünür — demo/sunum için yeterlidir.
- **Gerçek e-posta göndermek için**: `docker-compose.yml`'deki `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` değerlerini doldurun. Gmail kullanacaksanız normal şifreniz değil, [Uygulama Şifresi](https://myaccount.google.com/apppasswords) gerekir.

### 3. Profil Ekranı
`/profil` sayfasından herkes kendi e-postasını, şifresini ve profil fotoğrafını güncelleyebilir.

### 4. Yeni Rol Sistemi (ADMIN / PERSONEL / STAJYER)
- **ADMIN**: Sistemde sabit ve tek bir hesaptır (seed ile oluşturulur), rolü değiştirilemez/silinemez, tam yetkilidir.
- **PERSONEL**: Personel seçilirken **Teknik Servis** veya **Saha** alt tipi seçilir. Varsayılan olarak içerik ekleyip kendi eklediğini düzenleyebilir/silebilir.
- **STAJYER**: Varsayılan olarak yalnızca görüntüleme/arama yapabilir, içerik ekleyemez.
- **Admin Yetkisi**: ADMIN (veya zaten admin yetkili biri), Personel ya da Stajyer'e ek olarak "admin yetkisi" bayrağı verebilir — bu kişi böylece kullanıcı yönetimi, denetim logları, tüm içerikleri düzenleme gibi tam yetkilere sahip olur (rolü PERSONEL/STAJYER olarak görünmeye devam eder).
- Kullanıcı Yönetimi ekranından (`/admin/kullanicilar`) rol/personel tipi değiştirme, admin yetkisi verme/alma, hesap aktif/pasif yapma ve **kullanıcı silme** yapılabilir (sabit ADMIN hesabı hariç).

### 5. Soldan Açılan Menü
Üst menü yerine artık soldan açılan tıklanabilir bir panel var — Arama, Lastik Test Formu, İçerik Ekle, Kullanıcılar, Denetim Logları, Profilim ve Çıkış hepsi bu panelde. Mobilde hamburger (☰) ikonuyla açılır/kapanır.

### 6. Lastik Test Formu Geliştirmeleri
- **Yeni alanlar**: Araç No, Hafta. **Model** alanı artık "Marka - Model" olarak etiketlendi.
- **Pozisyon kodları genişletildi**: S1-S9 (Sol) / D1-D9 (Sağ).
- **Araç cinsine özel pozisyon diyagramı**: Araç Cinsi seçildiğinde, sadece o araç tipine uygun pozisyon kodları listelenir (örn. Bijli'de S1/S2/D1/D2, Yarı Treyler'de S1-S5/D1-D5 gibi).
- **Otomatik satır ekleme**: Bir pozisyona tıklamak, Lastik Bilgileri tablosuna o pozisyon için otomatik bir satır ekler (benzersiz **Lastik ID** ile, örn. `LST-TST2026001-S1`); seçimi kaldırmak satırı da kaldırır (veri varsa onay ister). Manuel "+ Ekstra Satır" butonu standart dışı durumlar için hâlâ mevcut.
- **AI Yorumu**: Girilen ölçümlere (diş derinliği, PSI, km) göre kural tabanlı otomatik bir özet paragrafı üretir — stajyer ve ekibin durumu hızlıca anlaması için. Harici API/anahtar gerekmez.
- **Tablolaştır + Excel İndir**: "📊 Tablolaştır" butonu verileri temiz bir tablo halinde gösterir; açılan panelde "⬇ Excel Olarak İndir" butonu gerçek bir `.xlsx` dosyası indirir (tarayıcıda, backend'e gitmeden, `xlsx` kütüphanesiyle).

---

## Yeni Eklenen Özellikler (v1.1)

### 1. Gerçek Dosya Yükleme (PDF / Görsel)
Artık "İçerik Ekle" ve "Lastik Test Formu" sayfalarında doküman metnine ek olarak
gerçek bir PDF veya görsel dosyası (jpg, png, webp, gif — 15MB'a kadar) yükleyebilirsin.
Backend `multer` ile dosyayı `backend/uploads/` klasörüne kaydeder (Docker'da
`petlas_uploads` volume'unda kalıcıdır) ve `/uploads/<dosya>` üzerinden servis eder.

```
POST /api/v1/uploads   (ADMIN, MANAGER, multipart/form-data, alan adı: "file")
→ { "url": "/uploads/1234567-891234.pdf", "originalName": "..." }
```

### 2. Lastik Test Formu Modülü
Sahada doldurulan kağıt "Lastik Test Formu"nun dijital karşılığı. Üst menüde
**Lastik Test Formu** sekmesinden erişilir; herkes arayabilir/görüntüleyebilir,
sadece ADMIN/MANAGER ekleyip düzenleyebilir (kendi eklediği kayıtları MANAGER
sadece kendisi düzenler/siler — dokümanlarla aynı kural).

İçerdiği alanlar (kağıt formla birebir):
- Genel bilgiler: Şirket, Araç Cinsi, Plaka, Model, Araç Tipi, Test No, Yük Ağırlığı
- Montaj Pozisyonu: Sol (S1-S8) / Sağ (D1-D8) tıklanabilir pozisyon seçimi
- Pozisyon bazlı Ebat / Desen / Hatta Kodu / Seri Numarası tablosu (satır ekle/sil)
- Tarihe göre ölçümler: KM, Desen, Orj. Diş Derinliği, 4 adet Ölçülen PSİ,
  Önerilen PSİ (F/D/T), Sıcak/Soğuk — istenildiği kadar tarih bloğu eklenebilir
- Kağıt formun fotoğrafı/PDF eki
- **Açıklama** alanı (arama için ana başlık) ve **arama butonu**

Veritabanında `tire_tests` tablosu olarak tutulur (`database/init.sql`); esnek
sayıda pozisyon/tarih girilebilmesi için `items` ve `measurements` alanları
JSONB olarak saklanır. İlk kurulumda **2 örnek doldurulmuş kayıt** otomatik
eklenir, referans olarak incelenebilir.

API:
```
GET    /api/v1/tire-tests/search?q=   → Arama (tüm roller)
GET    /api/v1/tire-tests/:id         → Detay (tüm roller)
POST   /api/v1/tire-tests             → Yeni form (ADMIN, MANAGER)
PUT    /api/v1/tire-tests/:id         → Güncelle (ADMIN, MANAGER)
DELETE /api/v1/tire-tests/:id         → Sil (ADMIN, MANAGER)
```

### 3. Menü Adı Değişikliği
Eski "Yönetim Paneli" sekmesi artık **"İçerik Ekle"** olarak görünüyor
(doküman CRUD ekranı aynı, sadece isim değişti).

---



### Yöntem 1: Docker Compose ile (Önerilen — tek komut)

```bash
docker compose up --build
```

Ardından backend içine girip ilk admin kullanıcıyı oluştur:

```bash
docker exec -it petlas_backend node src/utils/seed.js
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000
- Giriş bilgileri: `admin` / `.env` dosyasındaki `SEED_ADMIN_PASSWORD` (varsayılan: `ChangeThisPassword123!`)

> **Önemli:** `docker-compose.yml` içindeki `JWT_SECRET`, `DB_PASSWORD` ve
> `SEED_ADMIN_PASSWORD` değerlerini gerçek/staj sunumu öncesinde mutlaka değiştir.

### Yöntem 2: Manuel (Docker'sız, geliştirme için)

**1) PostgreSQL kurulumu**
```bash
createdb petlas_saha_kb
psql -d petlas_saha_kb -f database/init.sql
```

**2) Backend**
```bash
cd backend
cp .env.example .env
# .env içindeki DB_* ve JWT_* değerlerini kendi ortamına göre düzenle
npm install
npm run seed     # ilk admin kullanıcısını oluşturur
npm run dev       # http://localhost:4000
```

**3) Frontend**
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173 (vite proxy ile backend'e bağlanır)
```

## API Endpoint Özeti

```
POST   /api/v1/auth/login              → Giriş, JWT token döner
POST   /api/v1/auth/refresh            → Access token yenileme
POST   /api/v1/auth/register           → Yeni kullanıcı (ADMIN)

GET    /api/v1/documents/search?q=&category=   → Arama (tüm roller)
GET    /api/v1/documents/:id           → Doküman detay (tüm roller)
POST   /api/v1/documents               → Doküman ekle (ADMIN, MANAGER)
PUT    /api/v1/documents/:id           → Doküman güncelle (ADMIN, MANAGER)
DELETE /api/v1/documents/:id           → Doküman sil (ADMIN, MANAGER)

GET    /api/v1/categories              → Kategori listesi
POST   /api/v1/categories              → Kategori ekle (ADMIN, MANAGER)

GET    /api/v1/users                   → Kullanıcı listesi (ADMIN)
PATCH  /api/v1/users/:id/role          → Rol değiştir (ADMIN)
PATCH  /api/v1/users/:id/status        → Hesap aktif/pasif (ADMIN)

GET    /api/v1/audit-logs              → Denetim logları (ADMIN)
```

## Güvenlik Önlemleri

- Şifreler **bcrypt** (12 round) ile hash'lenir, hiçbir zaman düz metin saklanmaz.
- Tüm korumalı endpoint'ler **JWT Bearer token** ister; token süresi doldurulabilir/yenilenebilir.
- **RBAC middleware**'i, rolüne uygun olmayan kullanıcıların admin endpoint'lerine erişimini `403` ile engeller.
- **Audit log** middleware'i her önemli işlemi (giriş, doküman görüntüleme/ekleme/güncelleme/silme, kullanıcı işlemleri) kullanıcı, IP ve zaman damgasıyla kaydeder.
- `helmet` ile güvenlik HTTP başlıkları, `express-rate-limit` ile login brute-force koruması eklenmiştir.
- SQL enjeksiyonuna karşı tüm sorgular parametreli (`$1, $2, ...`) çalıştırılır.

## Staj Raporunda Kullanabileceğin Test Senaryoları

1. `USER` rolüyle giriş yap → doküman ekleme butonunun/endpoint'inin `403` döndüğünü göster.
2. `MANAGER` rolüyle bir doküman ekle, başka bir `MANAGER` ile onu silmeyi dene → `403` (yalnızca kendi eklediğini silebilir).
3. `ADMIN` ile `/admin/loglar` sayfasını aç → az önceki denemelerin `audit_logs` tablosuna düştüğünü göster.
4. Yanlış şifreyle 20'den fazla giriş denemesi yap → rate limit mesajını göster.
5. Docker Compose ile `docker compose up` tek komutuyla tüm sistemi ayağa kaldır → "kurumsal hava" için mimari şemanı bu README'deki klasör yapısından çıkar.

## Notlar

- Şema, PDF planındaki `Users / Roles / Documents(Guides) / AuditLogs` tablolarının
  birebir karşılığıdır; ek olarak arama/filtreleme için `Categories` tablosu ayrıştırılmıştır.
- Kod tabanı staj raporunda mimari şema (Frontend ↔ Backend API ↔ PostgreSQL, JWT ile korunan katmanlar) olarak doğrudan kullanılabilir.
