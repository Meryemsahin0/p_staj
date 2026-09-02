const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

// GET /api/v1/tire-tests/search?q=...  (tüm roller)
async function search(req, res) {
  const { q } = req.query;
  try {
    let query = `SELECT id, aciklama, sirket, arac_cinsi, plaka, arac_no, model, test_no, hafta, created_at
                  FROM tire_tests WHERE 1=1`;
    const params = [];
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(aciklama) LIKE $${params.length} OR LOWER(plaka) LIKE $${params.length} OR LOWER(model) LIKE $${params.length} OR LOWER(test_no) LIKE $${params.length})`;
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/tire-tests/:id (tüm roller)
async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM tire_tests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    await logAction(req, 'VIEW_TIRE_TEST', `tire_test_id=${req.params.id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/tire-tests (ADMIN/YETKİLİ, PERSONEL)
async function create(req, res) {
  const {
    aciklama, sirket, aracCinsi, plaka, aracNo, model, aracTipi, testNo, hafta,
    yukAgirligi, montajPozisyonu, items, measurements, filePath, notlar
  } = req.body;

  if (!aciklama) return res.status(400).json({ error: 'Açıklama zorunludur.' });

  try {
    const result = await pool.query(
      `INSERT INTO tire_tests
       (aciklama, sirket, arac_cinsi, plaka, arac_no, model, arac_tipi, test_no, hafta, yuk_agirligi,
        montaj_pozisyonu, items, measurements, file_path, notlar, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [
        aciklama, sirket || null, aracCinsi || null, plaka || null, aracNo || null, model || null,
        aracTipi || null, testNo || null, hafta || null, yukAgirligi || null,
        JSON.stringify(montajPozisyonu || []), JSON.stringify(items || []),
        JSON.stringify(measurements || []), filePath || null, notlar || null, req.user.id
      ]
    );
    await logAction(req, 'CREATE_TIRE_TEST', `tire_test_id=${result.rows[0].id} aciklama=${aciklama}`);
    res.status(201).json({ status: 'Success', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/tire-tests/:id (ADMIN/YETKİLİ: tümü, PERSONEL: sadece kendi eklediği)
async function update(req, res) {
  const {
    aciklama, sirket, aracCinsi, plaka, aracNo, model, aracTipi, testNo, hafta,
    yukAgirligi, montajPozisyonu, items, measurements, filePath, notlar
  } = req.body;

  try {
    const existing = await pool.query('SELECT created_by FROM tire_tests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz kayıtları düzenleyebilirsiniz.' });
    }

    await pool.query(
      `UPDATE tire_tests SET
        aciklama = COALESCE($1, aciklama), sirket = $2, arac_cinsi = $3, plaka = $4, arac_no = $5,
        model = $6, arac_tipi = $7, test_no = $8, hafta = $9, yuk_agirligi = $10,
        montaj_pozisyonu = $11, items = $12, measurements = $13, file_path = $14,
        notlar = $15, updated_at = NOW()
       WHERE id = $16`,
      [
        aciklama, sirket || null, aracCinsi || null, plaka || null, aracNo || null, model || null,
        aracTipi || null, testNo || null, hafta || null, yukAgirligi || null,
        JSON.stringify(montajPozisyonu || []), JSON.stringify(items || []),
        JSON.stringify(measurements || []), filePath || null, notlar || null, req.params.id
      ]
    );
    await logAction(req, 'UPDATE_TIRE_TEST', `tire_test_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/tire-tests/:id (ADMIN/YETKİLİ: tümü, PERSONEL: sadece kendi eklediği)
async function remove(req, res) {
  try {
    const existing = await pool.query('SELECT created_by FROM tire_tests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz kayıtları silebilirsiniz.' });
    }

    await pool.query('DELETE FROM tire_tests WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_TIRE_TEST', `tire_test_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { search, getById, create, update, remove };
