const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// İzin verilen dosya türleri: PDF ve yaygın görsel formatları
const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece PDF veya görsel (jpg, png, webp, gif) dosyaları yüklenebilir.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// Belge/kayıt eklerinde 1-10 arası dosya yüklenebilmesi için ayrı bir sınır (en fazla 10 dosya)
const MAX_FILES = 10;
const uploadMulti = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: MAX_FILES }
});

module.exports = upload;
module.exports.uploadMulti = uploadMulti;
module.exports.MAX_FILES = MAX_FILES;
