const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin, requireChiefOrAdmin } = require('../middleware/rbac');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// Yeni kullanıcı ADMIN veya bir departman şefi tarafından oluşturulabilir
// (şef sadece kendi departmanına kullanıcı ekleyebilir, controller içinde zorlanır)
router.post('/register', authenticate, requireChiefOrAdmin(), authController.register);

module.exports = router;
