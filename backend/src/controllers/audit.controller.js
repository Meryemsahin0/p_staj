const pool = require('../config/db');

// GET /api/v1/audit-logs (ADMIN)
async function list(req, res) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.action, a.endpoint, a.ip_address, a.details, a."timestamp", u.username
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a."timestamp" DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list };
