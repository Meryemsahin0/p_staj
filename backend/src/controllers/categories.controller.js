const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

async function list(req, res) {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY category_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function create(req, res) {
  const { categoryName, description } = req.body;
  if (!categoryName) return res.status(400).json({ error: 'Kategori adı zorunludur.' });
  try {
    const result = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES ($1, $2) RETURNING *',
      [categoryName, description || null]
    );
    await logAction(req, 'CREATE_CATEGORY', `category=${categoryName}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu kategori zaten mevcut.' });
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list, create };
