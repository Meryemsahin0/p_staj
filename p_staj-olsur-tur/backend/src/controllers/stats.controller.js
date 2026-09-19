const pool = require('../config/db');

// GET /api/v1/stats/overview
// 1) errorCodeStats: Kabul/Ret kayıtlarında hangi hata kodundan kaç lastik geldiği
// 2) fieldEngineeringStats: Saha mühendisliği (tire_tests) kayıtlarının firmaya göre dağılımı
// 3) anasayfaSayaclari: şu an AKTİF (sonlandırılmamış) kayıtlara göre araç/lastik/il sayısı
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

    // Sadece AKTİF (sonlandırılmamış) kayıtlar sayılır: "şu an takılı" lastik/araç/il sayısı
    const anasayfaSayaclari = await pool.query(`
      SELECT
        COUNT(*)::int AS arac_sayisi,
        COALESCE(SUM(jsonb_array_length(items)), 0)::int AS lastik_sayisi,
        COUNT(DISTINCT NULLIF(TRIM(il), ''))::int AS il_sayisi
      FROM tire_tests
      WHERE durum = 'AKTIF'
    `);

    res.json({
      errorCodeStats: errorCodeStats.rows,
      fieldEngineeringStats: fieldEngineeringStats.rows,
      kararDagilimi: kararDagilimi.rows,
      anasayfaSayaclari: anasayfaSayaclari.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { overview };
