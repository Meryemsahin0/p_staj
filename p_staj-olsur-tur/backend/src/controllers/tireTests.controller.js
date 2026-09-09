const pool = require('../config/db');
const logAction = require('../middleware/auditLog');
const { saveAttachments, getAttachments } = require('../utils/attachments');

// Hafta formatı: 4 hane, ilk 2 hane hafta numarası (01-53), son 2 hane yıl (herhangi bir değer).
const HAFTA_REGEX = /^(0[1-9]|[1-4][0-9]|5[0-3])\d{2}$/;

// Plaka formatı: 2 haneli il kodu (01-81) + boşluk + 1+ büyük harf + boşluk + 1+ rakam.
// Örnek: "34 XYZ 567"
const PLAKA_REGEX = /^(0[1-9]|[1-7][0-9]|8[01]) [A-ZİĞÜŞÖÇ]+ [0-9]+$/;

// Seri numarası, pozisyon bazlı "items" JSONB dizisinin içinde saklanır (düz bir sütun değildir).
const SERI_NO_EXISTS_SQL = `EXISTS (
  SELECT 1 FROM jsonb_array_elements(items) elem WHERE LOWER(elem->>'seri_numarasi') LIKE `;

// Karışım adı, "karisimlar" JSONB dizisinin içindeki "ad" alanında saklanır.
const KARISIM_EXISTS_SQL = `EXISTS (
  SELECT 1 FROM jsonb_array_elements(karisimlar) elem WHERE LOWER(elem->>'ad') LIKE `;

// GET /api/v1/tire-tests/search?q=...&sirket=...&aracCinsi=...&plaka=...&aracNo=...
//   &model=...&aracTipi=...&testNo=...&hafta=...&seriNo=...&il=...  (her alan ayrı ayrı filtrelenebilir)
async function search(req, res) {
  const { q, sirket, aracCinsi, plaka, aracNo, model, aracTipi, testNo, hafta, seriNo, il, karisim } = req.query;
  try {
    let query = `SELECT id, aciklama, sirket, arac_cinsi, plaka, arac_no, model, arac_tipi, test_no, hafta, il, created_at
                  FROM tire_tests WHERE 1=1`;
    const params = [];

    const addFilter = (column, value) => {
      if (value === undefined || value === null || value === '') return;
      params.push(`%${String(value).toLowerCase()}%`);
      query += ` AND LOWER(${column}) LIKE $${params.length}`;
    };

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      const idx = params.length;
      query += ` AND (LOWER(aciklama) LIKE $${idx} OR LOWER(sirket) LIKE $${idx} OR LOWER(arac_cinsi) LIKE $${idx}
                 OR LOWER(plaka) LIKE $${idx} OR LOWER(arac_no) LIKE $${idx} OR LOWER(model) LIKE $${idx}
                 OR LOWER(arac_tipi) LIKE $${idx} OR LOWER(test_no) LIKE $${idx} OR LOWER(hafta) LIKE $${idx}
                 OR LOWER(il) LIKE $${idx} OR ${SERI_NO_EXISTS_SQL}$${idx}) OR ${KARISIM_EXISTS_SQL}$${idx}))`;
    }
    addFilter('sirket', sirket);
    addFilter('arac_cinsi', aracCinsi);
    addFilter('plaka', plaka);
    addFilter('arac_no', aracNo);
    addFilter('model', model);
    addFilter('arac_tipi', aracTipi);
    addFilter('test_no', testNo);
    addFilter('hafta', hafta);
    addFilter('il', il);

    if (seriNo) {
      params.push(`%${seriNo.toLowerCase()}%`);
      query += ` AND ${SERI_NO_EXISTS_SQL}$${params.length})`;
    }
    if (karisim) {
      params.push(`%${karisim.toLowerCase()}%`);
      query += ` AND ${KARISIM_EXISTS_SQL}$${params.length})`;
    }

    query += ' ORDER BY created_at DESC LIMIT 500';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/tire-tests/:id
async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM tire_tests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    const attachments = await getAttachments('TIRE_TEST', req.params.id);
    await logAction(req, 'VIEW_TIRE_TEST', `tire_test_id=${req.params.id}`);
    res.json({ ...result.rows[0], attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Ortak doğrulamalar: hafta formatı, plaka formatı + benzersizliği
async function validateCommon(body, excludeId) {
  const { hafta, plaka } = body;
  if (hafta && !HAFTA_REGEX.test(hafta)) {
    return 'Hafta formatı geçersiz. 4 haneli olmalı: ilk 2 hane hafta (01-53), son 2 hane yıl.';
  }
  if (plaka) {
    if (!PLAKA_REGEX.test(plaka)) {
      return 'Plaka formatı geçersiz. Örnek: "34 XYZ 567" (il kodu 01-81, boşluk, büyük harfler, boşluk, rakamlar).';
    }
    const params = [plaka];
    let query = 'SELECT id FROM tire_tests WHERE plaka = $1';
    if (excludeId) {
      params.push(excludeId);
      query += ' AND id <> $2';
    }
    const existing = await pool.query(query, params);
    if (existing.rows.length > 0) {
      return 'Bu plaka zaten kayıtlı. Aynı plaka birden fazla test formunda kullanılamaz.';
    }
  }
  return null;
}

// POST /api/v1/tire-tests
async function create(req, res) {
  const {
    aciklama, sirket, aracCinsi, plaka, aracNo, model, aracTipi, hafta, il,
    yukAgirligi, onTarih, onKm, cekerTarih, cekerKm, dorseTarih, dorseKm,
    montajPozisyonu, items, measurements, karisimlar, filePath, notlar, files
  } = req.body;

  if (!plaka) return res.status(400).json({ error: 'Plaka zorunludur.' });
  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya ekleyebilirsiniz.' });
  }

  const hataMesaji = await validateCommon(req.body, null);
  if (hataMesaji) return res.status(400).json({ error: hataMesaji });

  try {
    const result = await pool.query(
      `INSERT INTO tire_tests
       (aciklama, sirket, arac_cinsi, plaka, arac_no, model, arac_tipi, hafta, il, yuk_agirligi,
        on_tarih, on_km, ceker_tarih, ceker_km, dorse_tarih, dorse_km,
        montaj_pozisyonu, items, measurements, karisimlar, file_path, notlar, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`,
      [
        aciklama, sirket || null, aracCinsi || null, plaka || null, aracNo || null, model || null,
        aracTipi || null, hafta || null, il || null, yukAgirligi || null,
        onTarih || null, onKm || null, cekerTarih || null, cekerKm || null, dorseTarih || null, dorseKm || null,
        JSON.stringify(montajPozisyonu || []), JSON.stringify(items || []),
        JSON.stringify(measurements || []), JSON.stringify(karisimlar || []),
        filePath || null, notlar || null, req.user.id
      ]
    );
    const id = result.rows[0].id;
    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('TIRE_TEST', id, files, req.user.id);
    }
    await logAction(req, 'CREATE_TIRE_TEST', `tire_test_id=${id} aciklama=${aciklama}`);
    res.status(201).json({ status: 'Success', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/tire-tests/:id
async function update(req, res) {
  const {
    aciklama, sirket, aracCinsi, plaka, aracNo, model, aracTipi, hafta, il,
    yukAgirligi, onTarih, onKm, cekerTarih, cekerKm, dorseTarih, dorseKm,
    montajPozisyonu, items, measurements, karisimlar, filePath, notlar, files
  } = req.body;

  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya ekleyebilirsiniz.' });
  }

  const hataMesaji = await validateCommon(req.body, req.params.id);
  if (hataMesaji) return res.status(400).json({ error: hataMesaji });

  try {
    const existing = await pool.query('SELECT created_by FROM tire_tests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz kayıtları düzenleyebilirsiniz.' });
    }

    await pool.query(
      `UPDATE tire_tests SET
        aciklama = COALESCE($1, aciklama), sirket = $2, arac_cinsi = $3, plaka = $4, arac_no = $5,
        model = $6, arac_tipi = $7, hafta = $8, il = $9, yuk_agirligi = $10,
        on_tarih = $11, on_km = $12, ceker_tarih = $13, ceker_km = $14, dorse_tarih = $15, dorse_km = $16,
        montaj_pozisyonu = $17, items = $18, measurements = $19, karisimlar = $20, file_path = $21,
        notlar = $22, updated_at = NOW()
       WHERE id = $23`,
      [
        aciklama, sirket || null, aracCinsi || null, plaka || null, aracNo || null, model || null,
        aracTipi || null, hafta || null, il || null, yukAgirligi || null,
        onTarih || null, onKm || null, cekerTarih || null, cekerKm || null, dorseTarih || null, dorseKm || null,
        JSON.stringify(montajPozisyonu || []), JSON.stringify(items || []),
        JSON.stringify(measurements || []), JSON.stringify(karisimlar || []),
        filePath || null, notlar || null, req.params.id
      ]
    );
    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('TIRE_TEST', req.params.id, files, req.user.id);
    }
    await logAction(req, 'UPDATE_TIRE_TEST', `tire_test_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/tire-tests/:id
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

// Filtre kutularında yazarken öneri (autocomplete) göstermek için izin verilen alanlar.
const DISTINCT_ALLOWED_FIELDS = ['sirket', 'arac_cinsi', 'plaka', 'arac_no', 'model', 'arac_tipi', 'test_no', 'hafta', 'il'];

// GET /api/v1/tire-tests/distinct-values?field=plaka&q=0
async function distinctValues(req, res) {
  const { field, q } = req.query;

  if (field === 'seri_no' || field === 'karisim') {
    const jsonField = field === 'seri_no' ? 'seri_numarasi' : 'ad';
    const jsonColumn = field === 'seri_no' ? 'items' : 'karisimlar';
    try {
      const params = [];
      let query = `SELECT elem->>'${jsonField}' AS value, MAX(t.created_at) AS last_used
                   FROM tire_tests t, jsonb_array_elements(t.${jsonColumn}) AS elem
                   WHERE elem->>'${jsonField}' IS NOT NULL AND elem->>'${jsonField}' <> ''`;
      if (q) {
        params.push(`${q.toLowerCase()}%`);
        query += ` AND LOWER(elem->>'${jsonField}') LIKE $${params.length}`;
      }
      query += ' GROUP BY value ORDER BY last_used DESC LIMIT 10';
      const result = await pool.query(query, params);
      return res.json(result.rows.map(r => r.value));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
  }

  if (!DISTINCT_ALLOWED_FIELDS.includes(field)) {
    return res.status(400).json({ error: 'Geçersiz alan.' });
  }
  try {
    const params = [];
    let query = `SELECT ${field} AS value, MAX(created_at) AS last_used
                 FROM tire_tests WHERE ${field} IS NOT NULL AND ${field} <> ''`;
    if (q) {
      params.push(`${q.toLowerCase()}%`);
      query += ` AND LOWER(${field}) LIKE $${params.length}`;
    }
    query += ` GROUP BY ${field} ORDER BY last_used DESC LIMIT 10`;
    const result = await pool.query(query, params);
    res.json(result.rows.map(r => r.value));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { search, getById, create, update, remove, distinctValues };
