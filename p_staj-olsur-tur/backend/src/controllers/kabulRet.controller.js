const pool = require('../config/db');
const logAction = require('../middleware/auditLog');
const { saveAttachments, getAttachments } = require('../utils/attachments');

const GECERLI_KARARLAR = ['BEKLEMEDE', 'KABUL', 'RET'];

// GET /api/v1/kabul-ret/search?q=...&hataKodu=...&karar=...
async function search(req, res) {
  const { q, hataKodu, karar } = req.query;
  try {
    let query = `SELECT id, lastik_seri_no, lastik_ebat, musteri, hata_kodu, karar, created_at
                 FROM kabul_ret WHERE 1=1`;
    const params = [];
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(lastik_seri_no) LIKE $${params.length} OR LOWER(musteri) LIKE $${params.length} OR LOWER(aciklama) LIKE $${params.length})`;
    }
    if (hataKodu) {
      params.push(`%${hataKodu.toLowerCase()}%`);
      query += ` AND LOWER(hata_kodu) LIKE $${params.length}`;
    }
    if (karar) {
      params.push(karar);
      query += ` AND karar = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/kabul-ret/:id
async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM kabul_ret WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    const attachments = await getAttachments('KABUL_RET', req.params.id);
    await logAction(req, 'VIEW_KABUL_RET', `kabul_ret_id=${req.params.id}`);
    res.json({ ...result.rows[0], attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/kabul-ret
async function create(req, res) {
  const { lastikSeriNo, lastikEbat, musteri, hataKodu, karar, aciklama, files } = req.body;
  const kararValue = karar && GECERLI_KARARLAR.includes(karar) ? karar : 'BEKLEMEDE';
  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya (görsel) ekleyebilirsiniz.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO kabul_ret (lastik_seri_no, lastik_ebat, musteri, hata_kodu, karar, aciklama, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [lastikSeriNo || null, lastikEbat || null, musteri || null, hataKodu || null, kararValue, aciklama || null, req.user.id]
    );
    const id = result.rows[0].id;
    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('KABUL_RET', id, files, req.user.id);
    }
    await logAction(req, 'CREATE_KABUL_RET', `kabul_ret_id=${id} karar=${kararValue}`);
    res.status(201).json({ status: 'Success', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/kabul-ret/:id
async function update(req, res) {
  const { lastikSeriNo, lastikEbat, musteri, hataKodu, karar, aciklama, files } = req.body;
  if (karar && !GECERLI_KARARLAR.includes(karar)) {
    return res.status(400).json({ error: 'Geçersiz karar. BEKLEMEDE, KABUL veya RET olmalı.' });
  }
  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya (görsel) ekleyebilirsiniz.' });
  }

  try {
    const existing = await pool.query('SELECT created_by FROM kabul_ret WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz kayıtları düzenleyebilirsiniz.' });
    }

    await pool.query(
      `UPDATE kabul_ret SET
        lastik_seri_no = COALESCE($1, lastik_seri_no), lastik_ebat = COALESCE($2, lastik_ebat),
        musteri = COALESCE($3, musteri), hata_kodu = COALESCE($4, hata_kodu),
        karar = COALESCE($5, karar), aciklama = COALESCE($6, aciklama), updated_at = NOW()
       WHERE id = $7`,
      [lastikSeriNo, lastikEbat, musteri, hataKodu, karar, aciklama, req.params.id]
    );
    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('KABUL_RET', req.params.id, files, req.user.id);
    }
    await logAction(req, 'UPDATE_KABUL_RET', `kabul_ret_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/kabul-ret/:id
async function remove(req, res) {
  try {
    const existing = await pool.query('SELECT created_by FROM kabul_ret WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz kayıtları silebilirsiniz.' });
    }

    await pool.query('DELETE FROM kabul_ret WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_KABUL_RET', `kabul_ret_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { search, getById, create, update, remove };
