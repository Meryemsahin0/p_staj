const express = require('express');
const router = express.Router();
const audit = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth');
const { requireChiefOrAdmin } = require('../middleware/rbac');

// Denetim logları: ADMIN (tüm loglar) veya departman şefi (sadece kendi departmanı)
router.get('/', authenticate, requireChiefOrAdmin(), audit.list);

module.exports = router;
