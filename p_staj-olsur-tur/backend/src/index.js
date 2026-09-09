require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/documents.routes');
const categoryRoutes = require('./routes/categories.routes');
const userRoutes = require('./routes/users.routes');
const auditRoutes = require('./routes/audit.routes');
const uploadRoutes = require('./routes/upload.routes');
const tireTestRoutes = require('./routes/tireTests.routes');
const kabulRetRoutes = require('./routes/kabulRet.routes');
const errorCodeRoutes = require('./routes/errorCodes.routes');
const roleRoutes = require('./routes/roles.routes');
const statsRoutes = require('./routes/stats.routes');
const attachmentRoutes = require('./routes/attachments.routes');
const karisimRoutes = require('./routes/karisim.routes');
const path = require('path');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined'));

// Brute-force login denemelerine karşı hız sınırlama
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20,
  message: { error: 'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.' }
});
app.use('/api/v1/auth/login', loginLimiter);

// Genel API hız sınırlama
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/api/', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'petlas-saha-kb-backend' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/tire-tests', tireTestRoutes);
app.use('/api/v1/kabul-ret', kabulRetRoutes);
app.use('/api/v1/error-codes', errorCodeRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/attachments', attachmentRoutes);
app.use('/api/v1/karisimlar', karisimRoutes);

// Yüklenen PDF/görsel dosyalarına doğrudan erişim (görüntüleme/indirme için)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı.' }));

// Global hata yakalayıcı
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Petlas Saha KB backend ${PORT} portunda çalışıyor.`);
});
