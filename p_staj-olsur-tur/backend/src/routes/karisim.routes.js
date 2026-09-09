const express = require('express');
const router = express.Router();
const karisim = require('../controllers/karisim.controller');
const authenticate = require('../middleware/auth');

// Listeyi Saha Mühendisliği departmanındaki herkes + admin görebilir (form içinde seçim için)
router.get('/', authenticate, karisim.list);

// Ekleme/düzenleme/silme yetkisi controller içinde kontrol edilir
// (ADMIN, Saha Mühendisliği Şefi, veya "karışım yönetebilir" işaretli kişi)
router.post('/', authenticate, karisim.create);
router.put('/:id', authenticate, karisim.update);
router.delete('/:id', authenticate, karisim.remove);

module.exports = router;
