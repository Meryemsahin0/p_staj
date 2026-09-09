const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authenticate = require('../middleware/auth');
const { requireContentEditor } = require('../middleware/rbac');
const logAction = require('../middleware/auditLog');

// POST /api/v1/uploads  (ADMIN/yetkili/PERSONEL) - PDF veya görsel yükler, erişim URL'i döner
router.post('/', authenticate, requireContentEditor, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi.' });
  }
  await logAction(req, 'UPLOAD_FILE', `filename=${req.file.filename} original=${req.file.originalname}`);
  res.status(201).json({
    status: 'Success',
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// POST /api/v1/uploads/avatar (herkes, kimliği doğrulanmış herhangi bir kullanıcı) - profil fotoğrafı için
router.post('/avatar', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi.' });
  }
  await logAction(req, 'UPLOAD_AVATAR', `filename=${req.file.filename}`);
  res.status(201).json({
    status: 'Success',
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// Multer hata yakalayıcı (dosya boyutu / tür hatası vb.)
router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'Dosya yükleme hatası.' });
  }
  next();
});

module.exports = router;
