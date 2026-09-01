const express = require('express');
const router = express.Router();
const categories = require('../controllers/categories.controller');
const authenticate = require('../middleware/auth');
const { requireContentEditor } = require('../middleware/rbac');

router.get('/', authenticate, categories.list);
router.post('/', authenticate, requireContentEditor, categories.create);

module.exports = router;
