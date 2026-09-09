const pool = require('../config/db');

// GET /api/v1/stats/overview (yalnızca ADMIN/admin yetkili)
// 1) errorCodeStats: Kabul/Ret kayıtlarında hangi hata kodundan kaç lastik geldiği
// 2) fieldEngineeringStats: Saha mühendisliği (tire_tests) kayıtlarının araç tipine göre dağılımı
async function overview(req, res) {
  try {
    const errorCodeStats = await pool.query(`
      SELECT COALESCE(NULLIF(TRIM(hata_kodu), ''), 'Belirtilmemiş') AS label, COUNT(*)::int AS count
      FROM kabul_ret
      GROUP BY label
      ORDER BY count DESC
      LIMIT 10
    `);

    const fieldEngineeringStats = await pool.query(`
      SELECT COALESCE(NULLIF(TRIM(sirket), ''), 'Belirtilmemiş') AS label, COUNT(*)::int AS count
      FROM tire_tests
      GROUP BY label
      ORDER BY count DESC
      LIMIT 4
    `);

    const kararDagilimi = await pool.query(`
      SELECT karar AS label, COUNT(*)::int AS count FROM kabul_ret GROUP BY karar
    `);

    res.json({
      errorCodeStats: errorCodeStats.rows,
      fieldEngineeringStats: fieldEngineeringStats.rows,
      kararDagilimi: kararDagilimi.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { overview };
