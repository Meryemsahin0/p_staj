const pool = require('../config/db');
const logAction = require('../middleware/auditLog');
const { saveAttachments, getAttachments } = require('../utils/attachments');

// JavaScript'in toLowerCase()'i Türkçe "İ" harfini yanlış çevirdiği için (İ → i̇, i değil),
// "DİĞER" gibi kelimeler "diğer" ile eşleşmeyebiliyor. Bu yardımcılar bunu düzeltir.
function turkceKucukHarf(str) {
  // Aynı eşlemeyi JS tarafında da uyguluyoruz ki iki taraf (parametre ve SQL sütunu) birebir tutsun.
  return String(str)
    .replace(/İ/g, 'i').replace(/I/g, 'ı').replace(/Ş/g, 'ş').replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü').replace(/Ö/g, 'ö').replace(/Ç/g, 'ç')
    .toLowerCase();
}
function tl(ifade) {
  // Veritabanı sunucusunun dil ayarına (locale) bağlı kalmadan, Türkçe büyük harfleri
  // kendimiz küçük harfe çeviriyoruz. Aksi halde PostgreSQL'in LOWER() fonksiyonu
  // sunucu locale'ine göre Ö/Ş/Ğ/Ü/Ç gibi harfleri düzgün küçültmeyebiliyor.
  let e = ifade;
  const eslesmeler = [['İ','i'], ['I','ı'], ['Ş','ş'], ['Ğ','ğ'], ['Ü','ü'], ['Ö','ö'], ['Ç','ç']];
  for (const [buyuk, kucuk] of eslesmeler) {
    e = `REPLACE(${e}, '${buyuk}', '${kucuk}')`;
  }
  return `LOWER(${e})`;
}

const GECERLI_DEPARTMANLAR = ['GENEL', 'SAHA_MUHENDISLIGI', 'TEKNIK_SERVIS'];

// Bir belgeyi kullanıcının görüp göremeyeceğini kontrol eder.
// GENEL departmanlı belgeler herkese açıktır. Diğerleri (SAHA_MUHENDISLIGI / TEKNIK_SERVIS)
// sadece o departmandaki kullanıcılara ve admin'e açıktır.
function canViewGuide(user, guide) {
  if (!guide.department || guide.department === 'GENEL') return true;
  if (user.isEffectiveAdmin) return true;
  if (guide.created_by === parseInt(user.id)) return true;
  return user.department === guide.department;
}

// GET /api/v1/documents/search?q=tork&category=Montaj&hataKodu=E100
async function search(req, res) {
  const { q, category, hataKodu } = req.query;
  try {
    let query = `
      SELECT g.id, g.title, g.content, g.keywords, g.file_path, g.created_at,
             g.department, g.created_by,
             c.category_name AS category
      FROM guides g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE 1=1`;
    const params = [];

    if (q) {
      params.push(`%${turkceKucukHarf(q)}%`);
      query += ` AND (${tl('g.title')} LIKE $${params.length} OR ${tl('g.keywords')} LIKE $${params.length} OR ${tl('g.content')} LIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND c.category_name = $${params.length}`;
    }
    if (hataKodu) {
      params.push(`%${turkceKucukHarf(hataKodu)}%`);
      query += ` AND ${tl('g.keywords')} LIKE $${params.length}`;
    }
    query += ' ORDER BY g.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    const visible = result.rows.filter(row => canViewGuide(req.user, row));

    await logAction(req, 'SEARCH_DOCUMENTS', `q=${q || ''} category=${category || ''} hataKodu=${hataKodu || ''}`);
    res.json(visible);
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

    const guide = result.rows[0];
    if (!canViewGuide(req.user, guide)) {
      return res.status(403).json({ error: 'Bu belgeyi görüntüleme yetkiniz yok.' });
    }

    const attachments = await getAttachments('GUIDE', guide.id);
    await logAction(req, 'VIEW_DOCUMENT', `document_id=${req.params.id}`);
    res.json({ ...guide, attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/documents  (yetkilendirilen herkes)
// files: [{url, originalName, mimeType}] (en fazla 10), department: 'GENEL' | 'SAHA_MUHENDISLIGI' | 'TEKNIK_SERVIS'
async function create(req, res) {
  const { title, content, categoryId, keywords, filePath, files, department } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });
  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya ekleyebilirsiniz.' });
  }
  const finalDepartment = GECERLI_DEPARTMANLAR.includes(department) ? department : 'GENEL';

  try {
    const result = await pool.query(
      `INSERT INTO guides (title, content, category_id, keywords, file_path, created_by, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [title, content, categoryId || null, Array.isArray(keywords) ? keywords.join(',') : keywords,
       filePath || null, req.user.id, finalDepartment]
    );
    const guideId = result.rows[0].id;

    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('GUIDE', guideId, files, req.user.id);
    }

    await logAction(req, 'CREATE_DOCUMENT', `document_id=${guideId} title=${title} department=${finalDepartment}`);
    res.status(201).json({ status: 'Success', documentId: guideId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PUT /api/v1/documents/:id  (ADMIN/YETKİLİ: tümü, PERSONEL: sadece kendi eklediği)
async function update(req, res) {
  const { title, content, categoryId, keywords, filePath, files, department } = req.body;
  if (Array.isArray(files) && files.length > 10) {
    return res.status(400).json({ error: 'En fazla 10 dosya ekleyebilirsiniz.' });
  }
  if (department && !GECERLI_DEPARTMANLAR.includes(department)) {
    return res.status(400).json({ error: 'Geçersiz departman.' });
  }
  try {
    const existing = await pool.query('SELECT created_by FROM guides WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Doküman bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].created_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi eklediğiniz dokümanları düzenleyebilirsiniz.' });
    }

    await pool.query(
      `UPDATE guides SET title = COALESCE($1, title), content = COALESCE($2, content),
       category_id = COALESCE($3, category_id), keywords = COALESCE($4, keywords),
       file_path = COALESCE($5, file_path), department = COALESCE($6, department), updated_at = NOW()
       WHERE id = $7`,
      [title, content, categoryId, Array.isArray(keywords) ? keywords.join(',') : keywords, filePath,
       department || null, req.params.id]
    );

    if (Array.isArray(files) && files.length > 0) {
      await saveAttachments('GUIDE', req.params.id, files, req.user.id);
    }

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
