const pool = require('../config/db');

// GET /api/v1/audit-logs (ADMIN: tüm loglar, Departman Şefi: sadece kendi departmanındaki kullanıcıların logları)
async function list(req, res) {
  try {
    let query = `SELECT a.id, a.action, a.endpoint, a.ip_address, a.details, a."timestamp", u.username
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id`;
    const params = [];
    if (!req.user.isEffectiveAdmin && req.user.isChief) {
      params.push(req.user.department);
      query += ` WHERE u.department = $1`;
    }
    query += ' ORDER BY a."timestamp" DESC LIMIT 200';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list };
