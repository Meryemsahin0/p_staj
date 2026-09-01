const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin } = require('../middleware/rbac');

// Profil: herkes kendi bilgilerini görüp güncelleyebilir
router.get('/me', authenticate, users.me);
router.patch('/me', authenticate, users.updateMe);

// Kullanıcı yönetimi: ADMIN veya admin yetkili
router.get('/', authenticate, requireEffectiveAdmin, users.list);
router.patch('/:id/role', authenticate, requireEffectiveAdmin, users.updateRole);
router.patch('/:id/admin-yetkisi', authenticate, requireEffectiveAdmin, users.updateAdminYetkisi);
router.patch('/:id/status', authenticate, requireEffectiveAdmin, users.updateStatus);
router.delete('/:id', authenticate, requireEffectiveAdmin, users.remove);

module.exports = router;
