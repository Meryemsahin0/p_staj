const express = require('express');
const router = express.Router();
const tireTests = require('../controllers/tireTests.controller');
const authenticate = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Görüntüleme/arama: VIEW_TIRE_TESTS yetkisi olan roller
router.get('/search', authenticate, requirePermission('VIEW_TIRE_TESTS'), tireTests.search);
router.get('/distinct-values', authenticate, requirePermission('VIEW_TIRE_TESTS'), tireTests.distinctValues);
router.get('/:id', authenticate, requirePermission('VIEW_TIRE_TESTS'), tireTests.getById);

// Ekleme, düzenleme, silme: CREATE_TIRE_TESTS yetkisi olan roller
router.post('/', authenticate, requirePermission('CREATE_TIRE_TESTS'), tireTests.create);
router.put('/:id', authenticate, requirePermission('CREATE_TIRE_TESTS'), tireTests.update);
router.patch('/:id/sonlandir', authenticate, requirePermission('CREATE_TIRE_TESTS'), tireTests.sonlandir);
router.delete('/:id', authenticate, requirePermission('CREATE_TIRE_TESTS'), tireTests.remove);

module.exports = router;
