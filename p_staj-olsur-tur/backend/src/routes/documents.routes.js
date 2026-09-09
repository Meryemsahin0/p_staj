const express = require('express');
const router = express.Router();
const docs = require('../controllers/documents.controller');
const authenticate = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Görüntüleme/arama: VIEW_DOCUMENTS yetkisi olan roller (varsayılan: ADMIN, PERSONEL, STAJYER)
router.get('/search', authenticate, requirePermission('VIEW_DOCUMENTS'), docs.search);
router.get('/:id', authenticate, requirePermission('VIEW_DOCUMENTS'), docs.getById);

// Ekleme, düzenleme, silme: CREATE_DOCUMENTS yetkisi olan roller
router.post('/', authenticate, requirePermission('CREATE_DOCUMENTS'), docs.create);
router.put('/:id', authenticate, requirePermission('CREATE_DOCUMENTS'), docs.update);
router.delete('/:id', authenticate, requirePermission('CREATE_DOCUMENTS'), docs.remove);

module.exports = router;
