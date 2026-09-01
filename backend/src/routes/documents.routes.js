const express = require('express');
const router = express.Router();
const docs = require('../controllers/documents.controller');
const authenticate = require('../middleware/auth');
const { requireContentEditor } = require('../middleware/rbac');

// Tüm rollere açık: arama ve görüntüleme (STAJYER dahil)
router.get('/search', authenticate, docs.search);
router.get('/:id', authenticate, docs.getById);

// ADMIN / admin yetkili / PERSONEL: ekleme, düzenleme, silme. STAJYER (yetkisiz) yapamaz.
router.post('/', authenticate, requireContentEditor, docs.create);
router.put('/:id', authenticate, requireContentEditor, docs.update);
router.delete('/:id', authenticate, requireContentEditor, docs.remove);

module.exports = router;
