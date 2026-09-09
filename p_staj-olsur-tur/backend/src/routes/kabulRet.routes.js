const express = require('express');
const router = express.Router();
const kabulRet = require('../controllers/kabulRet.controller');
const authenticate = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.get('/search', authenticate, requirePermission('VIEW_KABUL_RET'), kabulRet.search);
router.get('/:id', authenticate, requirePermission('VIEW_KABUL_RET'), kabulRet.getById);

router.post('/', authenticate, requirePermission('CREATE_KABUL_RET'), kabulRet.create);
router.put('/:id', authenticate, requirePermission('CREATE_KABUL_RET'), kabulRet.update);
router.delete('/:id', authenticate, requirePermission('CREATE_KABUL_RET'), kabulRet.remove);

module.exports = router;
