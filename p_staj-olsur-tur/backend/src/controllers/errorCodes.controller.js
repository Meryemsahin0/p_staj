const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

// GET /api/v1/error-codes (kimliği doğrulanmış herkes - dropdown/otomatik tamamlama için)
async function list(req, res) {
  try {
    const result = await pool.query('SELECT * FROM error_codes ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/error-codes (ADMIN veya admin yetkili)
async function create(req, res) {
  const { code, description } = req.body;
  if (!code) return res.status(400).json({ error: 'Hata kodu zorunludur.' });
  try {
    const result = await pool.query(
      'INSERT INTO error_codes (code, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [code.trim(), description || null, req.user.id]
    );
    await logAction(req, 'CREATE_ERROR_CODE', `code=${code}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu hata kodu zaten kayıtlı.' });
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/error-codes/:id (ADMIN veya admin yetkili)
async function remove(req, res) {
  try {
    await pool.query('DELETE FROM error_codes WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_ERROR_CODE', `error_code_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list, create, remove };
