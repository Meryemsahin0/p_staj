// İlk kurulumda çalıştırılır: node src/utils/seed.js
// Roller/kategoriler init.sql'de oluşturulur; burada sadece ilk ADMIN kullanıcısı eklenir.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@petlas.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeThisPassword123!';

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    console.log(`Kullanıcı '${username}' zaten mevcut, seed atlanıyor.`);
    process.exit(0);
  }

  const roleRes = await pool.query("SELECT id FROM roles WHERE role_name = 'ADMIN'");
  if (roleRes.rows.length === 0) {
    console.error("ADMIN rolü bulunamadı. Önce database/init.sql çalıştırılmalı.");
    process.exit(1);
  }
  const roleId = roleRes.rows[0].id;
  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)`,
    [username, email, hash, roleId]
  );

  console.log(`Admin kullanıcı oluşturuldu: ${username} (şifre .env SEED_ADMIN_PASSWORD)`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
