const express = require('express');
const router = express.Router();
const tireTests = require('../controllers/tireTests.controller');
const authenticate = require('../middleware/auth');
const { requireContentEditor } = require('../middleware/rbac');

// Tüm rollere açık: arama ve görüntüleme (STAJYER dahil)
router.get('/search', authenticate, tireTests.search);
router.get('/:id', authenticate, tireTests.getById);

// ADMIN / admin yetkili / PERSONEL: ekleme, düzenleme, silme. STAJYER (yetkisiz) yapamaz.
router.post('/', authenticate, requireContentEditor, tireTests.create);
router.put('/:id', authenticate, requireContentEditor, tireTests.update);
router.delete('/:id', authenticate, requireContentEditor, tireTests.remove);

module.exports = router;
