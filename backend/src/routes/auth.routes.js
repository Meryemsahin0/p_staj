const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin } = require('../middleware/rbac');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// Yeni kullanıcı sadece ADMIN veya admin yetkili tarafından oluşturulabilir
router.post('/register', authenticate, requireEffectiveAdmin, authController.register);

module.exports = router;
