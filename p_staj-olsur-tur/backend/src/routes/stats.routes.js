const express = require('express');
const router = express.Router();
const stats = require('../controllers/stats.controller');
const authenticate = require('../middleware/auth');

// İstatistik tabloları/grafikleri artık giriş yapmış tüm kullanıcılara açık
router.get('/overview', authenticate, stats.overview);

module.exports = router;
