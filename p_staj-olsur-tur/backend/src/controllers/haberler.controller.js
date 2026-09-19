const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

// GET /api/v1/haberler?limit=10 (herkes görebilir)
async function list(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  try {
    const result = await pool.query(
      'SELECT * FROM haberler ORDER BY created_at DESC LIMIT $1', [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/haberler/:id (herkes görebilir)
async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM haberler WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Haber bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/haberler (SADECE ADMIN)
async function create(req, res) {
  const { baslik, icerik, gorselUrl } = req.body;
  if (!baslik || !icerik) return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });
  try {
    const result = await pool.query(
      'INSERT INTO haberler (baslik, icerik, gorsel_url, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [baslik, icerik, gorselUrl || null, req.user.id]
    );
    await logAction(req, 'CREATE_HABER', `haber_id=${result.rows[0].id} baslik=${baslik}`);
    res.status(201).json({ status: 'Success', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/haberler/:id (SADECE ADMIN)
async function update(req, res) {
  const { baslik, icerik, gorselUrl } = req.body;
  try {
    await pool.query(
      `UPDATE haberler SET baslik = COALESCE($1, baslik), icerik = COALESCE($2, icerik),
       gorsel_url = COALESCE($3, gorsel_url), updated_at = NOW() WHERE id = $4`,
      [baslik, icerik, gorselUrl, req.params.id]
    );
    await logAction(req, 'UPDATE_HABER', `haber_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/haberler/:id (SADECE ADMIN)
async function remove(req, res) {
  try {
    await pool.query('DELETE FROM haberler WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_HABER', `haber_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list, getById, create, update, remove };
