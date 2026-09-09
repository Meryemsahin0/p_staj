const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

function karisimYetkisiVarMi(user) {
  return user.isEffectiveAdmin || (user.isChief && user.department === 'SAHA_MUHENDISLIGI') || user.canManageKarisim;
}

// GET /api/v1/karisimlar (Saha Mühendisliği departmanındaki herkes + admin — form içinde seçim için)
async function list(req, res) {
  try {
    const result = await pool.query('SELECT * FROM karisimlar ORDER BY ad');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/karisimlar (ADMIN, Saha Mühendisliği Şefi, veya "karışım yönetebilir" yetkisi verilmiş kişi)
async function create(req, res) {
  if (!karisimYetkisiVarMi(req.user)) {
    return res.status(403).json({ error: 'Karışım ekleme yetkiniz yok.' });
  }
  const { ad, aciklama } = req.body;
  if (!ad) return res.status(400).json({ error: 'Karışım adı zorunludur.' });
  try {
    const result = await pool.query(
      'INSERT INTO karisimlar (ad, aciklama, created_by) VALUES ($1, $2, $3) RETURNING *',
      [ad.trim(), aciklama || null, req.user.id]
    );
    await logAction(req, 'CREATE_KARISIM', `ad=${ad}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu isimde bir karışım zaten mevcut.' });
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/karisimlar/:id
async function update(req, res) {
  if (!karisimYetkisiVarMi(req.user)) {
    return res.status(403).json({ error: 'Karışım düzenleme yetkiniz yok.' });
  }
  const { ad, aciklama } = req.body;
  try {
    await pool.query(
      'UPDATE karisimlar SET ad = COALESCE($1, ad), aciklama = $2 WHERE id = $3',
      [ad ? ad.trim() : null, aciklama || null, req.params.id]
    );
    await logAction(req, 'UPDATE_KARISIM', `karisim_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/karisimlar/:id
async function remove(req, res) {
  if (!karisimYetkisiVarMi(req.user)) {
    return res.status(403).json({ error: 'Karışım silme yetkiniz yok.' });
  }
  try {
    await pool.query('DELETE FROM karisimlar WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_KARISIM', `karisim_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list, create, update, remove };
