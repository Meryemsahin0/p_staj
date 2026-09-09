const express = require('express');
const router = express.Router();
const errorCodes = require('../controllers/errorCodes.controller');
const authenticate = require('../middleware/auth');
const { requireChiefOrAdmin } = require('../middleware/rbac');

// Listeyi herkes görebilir (kayıt formlarında öneri/otomatik tamamlama için)
router.get('/', authenticate, errorCodes.list);

// Ekleme/silme sadece ADMIN veya Teknik Servis Şefi'nde
router.post('/', authenticate, requireChiefOrAdmin('TEKNIK_SERVIS'), errorCodes.create);
router.delete('/:id', authenticate, requireChiefOrAdmin('TEKNIK_SERVIS'), errorCodes.remove);

module.exports = router;
