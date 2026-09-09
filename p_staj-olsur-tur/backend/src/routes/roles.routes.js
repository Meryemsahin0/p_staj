const express = require('express');
const router = express.Router();
const roles = require('../controllers/roles.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin, requireChiefOrAdmin } = require('../middleware/rbac');

// Görüntüleme ve izin düzenleme: ADMIN veya departman şefi (şef sadece kendi departmanına
// ait izinleri değiştirebilir — controller içinde filtrelenir)
router.get('/', authenticate, requireChiefOrAdmin(), roles.list);
router.get('/permissions-catalog', authenticate, requireChiefOrAdmin(), roles.permissionsCatalog);
router.put('/:id/permissions', authenticate, requireChiefOrAdmin(), roles.updatePermissions);

// Yeni rol oluşturma/silme/açıklama düzenleme: SADECE ADMIN
router.post('/', authenticate, requireEffectiveAdmin, roles.create);
router.patch('/:id', authenticate, requireEffectiveAdmin, roles.updateDescription);
router.delete('/:id', authenticate, requireEffectiveAdmin, roles.remove);

module.exports = router;
