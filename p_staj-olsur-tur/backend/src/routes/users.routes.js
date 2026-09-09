const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin, requireChiefOrAdmin } = require('../middleware/rbac');

// Profil: herkes kendi bilgilerini görüp güncelleyebilir
router.get('/me', authenticate, users.me);
router.patch('/me', authenticate, users.updateMe);

// Kullanıcı yönetimi: ADMIN veya (sadece kendi departmanı için) departman şefi.
// Yetki detayı (bir şefin sadece kendi departmanını görebilmesi/yönetebilmesi) controller içinde kontrol edilir.
router.get('/', authenticate, requireChiefOrAdmin(), users.list);
router.patch('/:id/role', authenticate, requireChiefOrAdmin(), users.updateRole);
router.patch('/:id/status', authenticate, requireChiefOrAdmin(), users.updateStatus);
router.delete('/:id', authenticate, requireChiefOrAdmin(), users.remove);

// Departman ataması ve şeflik verme/alma: SADECE ADMIN (bir şef başka birini şef yapamaz)
router.patch('/:id/department', authenticate, requireEffectiveAdmin, users.updateDepartment);
router.patch('/:id/chief', authenticate, requireEffectiveAdmin, users.updateChief);
router.patch('/:id/admin-yetkisi', authenticate, requireEffectiveAdmin, users.updateAdminYetkisi);

// Karışım yönetim yetkisi: ADMIN veya Saha Mühendisliği Şefi
router.patch('/:id/karisim-yetkisi', authenticate, requireChiefOrAdmin('SAHA_MUHENDISLIGI'), users.updateKarisimYetkisi);

module.exports = router;
