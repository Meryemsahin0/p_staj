const express = require('express');
const router = express.Router();
const haberler = require('../controllers/haberler.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin } = require('../middleware/rbac');

// Listeleme ve detay: giriş yapmış herkes görebilir
router.get('/', authenticate, haberler.list);
router.get('/:id', authenticate, haberler.getById);

// Ekleme/düzenleme/silme: SADECE ADMIN
router.post('/', authenticate, requireEffectiveAdmin, haberler.create);
router.put('/:id', authenticate, requireEffectiveAdmin, haberler.update);
router.delete('/:id', authenticate, requireEffectiveAdmin, haberler.remove);

module.exports = router;
