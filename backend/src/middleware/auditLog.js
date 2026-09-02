const pool = require('../config/db');

// Kullanıcı hareketlerini AuditLogs tablosuna kaydeder.
// action: 'LOGIN', 'VIEW_DOCUMENT', 'CREATE_DOCUMENT', vb.
async function logAction(req, action, details = null) {
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, endpoint, ip_address, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, req.originalUrl, ip, details]
    );
  } catch (err) {
    // Loglama hatası ana isteği bloklamamalı, sadece konsola yazılır.
    console.error('Audit log kaydı başarısız:', err.message);
  }
}

module.exports = logAction;
