const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authenticate = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/rbac');
const logAction = require('../middleware/auditLog');

// Dosya yükleme, belge/saha testi/kabul-ret içeriklerinden herhangi birini oluşturma yetkisi olan herkese açıktır.
const canUpload = requireAnyPermission('CREATE_DOCUMENTS', 'CREATE_TIRE_TESTS', 'CREATE_KABUL_RET');

// POST /api/v1/uploads  (ADMIN/yetkili/PERSONEL) - PDF veya görsel yükler, erişim URL'i döner
router.post('/', authenticate, canUpload, upload.single('file'), async (req, res) => {
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

// POST /api/v1/uploads/multi  (ADMIN/yetkili/PERSONEL) - 1 ile 10 arası PDF/görsel yükler
// Dönen "files" dizisi, ilgili kaydı (belge/saha testi/kabul-ret) oluştururken/güncellerken
// gövdede "files" alanı olarak geri gönderilip attachments tablosuna işlenir.
router.post('/multi', authenticate, canUpload, upload.uploadMulti.array('files', upload.MAX_FILES), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'En az 1 dosya seçmelisiniz.' });
  }
  if (req.files.length > upload.MAX_FILES) {
    return res.status(400).json({ error: `En fazla ${upload.MAX_FILES} dosya yükleyebilirsiniz.` });
  }
  await logAction(req, 'UPLOAD_MULTI_FILE', `count=${req.files.length}`);
  res.status(201).json({
    status: 'Success',
    files: req.files.map(f => ({ url: `/uploads/${f.filename}`, originalName: f.originalname, mimeType: f.mimetype }))
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
