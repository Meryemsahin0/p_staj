const express = require('express');
const router = express.Router();
const audit = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth');
const { requireEffectiveAdmin } = require('../middleware/rbac');

// Denetim logları: ADMIN veya admin yetkili
router.get('/', authenticate, requireEffectiveAdmin, audit.list);

module.exports = router;
