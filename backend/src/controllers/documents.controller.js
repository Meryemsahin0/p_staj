const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

// GET /api/v1/documents/search?q=tork&category=Montaj
async function search(req, res) {
  const { q, category } = req.query;
  try {
    let query = `
      SELECT g.id, g.title, g.content, g.keywords, g.file_path, g.created_at,
             c.category_name AS category
      FROM guides g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE 1=1`;
    const params = [];

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(g.title) LIKE $${params.length} OR LOWER(g.keywords) LIKE $${params.length} OR LOWER(g.content) LIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND c.category_name = $${params.length}`;
    }
    query += ' ORDER BY g.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    await logAction(req, 'SEARCH_DOCUMENTS', `q=${q || ''} category=${category || ''}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/documents/:id
async function getById(req, res) {
  try {
    const result = await pool.query(
      `SELECT g.*, c.category_name AS category
       FROM guides g LEFT JOIN categories c ON g.category_id = c.id
       WHERE g.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Doküman bulunamadı.' });

    await logAction(req, 'VIEW_DOCUMENT', `document_id=${req.params.id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/documents  (ADMIN/YETKİLİ, PERSONEL)
async function create(req, res) {
  const { title, content, categoryId, keywords, filePath } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });

  try {
    const result = await pool.query(
      `INSERT INTO guides (title, content, category_id, keywords, file_path, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, content, categoryId || null, Array.isArray(keywords) ? keywords.join(',') : keywords, filePath || null, req.user.id]
    );
    await logAction(req, 'CREATE_DOCUMENT', `document_id=${result.rows[0].id} title=${title}`);
    res.status(201).json({ status: 'Success', documentId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/documents/:id  (ADMIN/YETKİLİ: tümü, PERSONEL: sadece kendi eklediği)
async function update(req, res) {
  const { title, content, categoryId, keywords, filePath } = req.body;
  try {
    const existing = await pool.query('SELECT created_by FROM guides WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Doküman bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz dokümanları düzenleyebilirsiniz.' });
    }

    await pool.query(
      `UPDATE guides SET title = COALESCE($1, title), content = COALESCE($2, content),
       category_id = COALESCE($3, category_id), keywords = COALESCE($4, keywords),
       file_path = COALESCE($5, file_path), updated_at = NOW()
       WHERE id = $6`,
      [title, content, categoryId, Array.isArray(keywords) ? keywords.join(',') : keywords, filePath, req.params.id]
    );
    await logAction(req, 'UPDATE_DOCUMENT', `document_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/documents/:id (ADMIN/YETKİLİ: tümü, PERSONEL: sadece kendi eklediği)
async function remove(req, res) {
  try {
    const existing = await pool.query('SELECT created_by FROM guides WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Doküman bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz dokümanları silebilirsiniz.' });
    }

    await pool.query('DELETE FROM guides WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_DOCUMENT', `document_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { search, getById, create, update, remove };
