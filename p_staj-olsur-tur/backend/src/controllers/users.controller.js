const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

const DEPARTMENTS = ['SAHA_MUHENDISLIGI', 'TEKNIK_SERVIS'];

// Bir şefin, hedef kullanıcı üzerinde işlem yapıp yapamayacağını kontrol eder.
// ADMIN her zaman yapabilir. Şef, sadece KENDİ departmanındaki kullanıcılar üzerinde işlem yapabilir.
async function sefYetkiVarMi(req, targetUserId) {
  if (req.user.isEffectiveAdmin) return true;
  if (!req.user.isChief) return false;
  const targetRes = await pool.query('SELECT department FROM users WHERE id = $1', [targetUserId]);
  if (targetRes.rows.length === 0) return false;
  return targetRes.rows[0].department === req.user.department;
}

// GET /api/v1/users (ADMIN veya departman şefi — şef sadece kendi departmanını görür)
async function list(req, res) {
  try {
    let query = `SELECT u.id, u.username, u.email, u.is_active, u.admin_yetkisi, u.personel_tipi,
              u.profil_foto, u.department, u.is_chief, u.can_manage_karisim, u.created_at, r.role_name AS role
       FROM users u JOIN roles r ON u.role_id = r.id`;
    const params = [];
    if (!req.user.isEffectiveAdmin && req.user.isChief) {
      params.push(req.user.department);
      query += ` WHERE u.department = $1`;
    }
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/users/me (herkes kendi profilini görebilir)
async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.admin_yetkisi, u.personel_tipi, u.profil_foto,
              u.department, u.is_chief, u.can_manage_karisim, u.created_at, r.role_name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/me (herkes kendi e-posta/şifre/profil fotoğrafını güncelleyebilir)
async function updateMe(req, res) {
  const { email, password, profilFoto } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    }
    if (email) {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.id]);
    }
    if (profilFoto !== undefined) {
      await pool.query('UPDATE users SET profil_foto = $1 WHERE id = $2', [profilFoto, req.user.id]);
    }
    await logAction(req, 'UPDATE_PROFILE', 'kendi profili güncellendi');
    res.json({ status: 'Success' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor.' });
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/role (ADMIN veya kendi departmanındaki kullanıcılar için departman şefi)
async function updateRole(req, res) {
  const { roleName, personelTipi } = req.body;
  if (roleName === 'ADMIN') {
    return res.status(400).json({ error: 'ADMIN rolü sabittir, başka bir kullanıcıya atanamaz. Bunun yerine "admin yetkisi" verebilirsiniz.' });
  }
  try {
    if (!(await sefYetkiVarMi(req, req.params.id))) {
      return res.status(403).json({ error: 'Sadece kendi departmanınızdaki kullanıcıları yönetebilirsiniz.' });
    }

    const roleRes = await pool.query('SELECT id FROM roles WHERE role_name = $1', [roleName]);
    if (roleRes.rows.length === 0) return res.status(400).json({ error: 'Geçersiz rol.' });

    const targetRes = await pool.query('SELECT role_id FROM users WHERE id = $1', [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const currentRole = await pool.query('SELECT role_name FROM roles WHERE id = $1', [targetRes.rows[0].role_id]);
    if (currentRole.rows[0].role_name === 'ADMIN') {
      return res.status(400).json({ error: 'Sabit ADMIN hesabının rolü değiştirilemez.' });
    }

    await pool.query(
      'UPDATE users SET role_id = $1, personel_tipi = $2 WHERE id = $3',
      [roleRes.rows[0].id, roleName === 'PERSONEL' ? (personelTipi || null) : null, req.params.id]
    );
    await logAction(req, 'UPDATE_USER_ROLE', `user_id=${req.params.id} new_role=${roleName} personel_tipi=${personelTipi || ''}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/department (SADECE ADMIN) - kullanıcının departmanını atar
async function updateDepartment(req, res) {
  const { department } = req.body;
  if (department !== null && !DEPARTMENTS.includes(department)) {
    return res.status(400).json({ error: 'Geçersiz departman. SAHA_MUHENDISLIGI veya TEKNIK_SERVIS olmalı.' });
  }
  try {
    const targetRes = await pool.query(
      `SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`, [req.params.id]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (targetRes.rows[0].role_name === 'ADMIN') {
      return res.status(400).json({ error: 'Sabit ADMIN hesabının departmanı değiştirilemez.' });
    }
    await pool.query('UPDATE users SET department = $1 WHERE id = $2', [department, req.params.id]);
    await logAction(req, 'UPDATE_USER_DEPARTMENT', `user_id=${req.params.id} department=${department}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/chief (SADECE ADMIN) - departman şefliği ver/al
async function updateChief(req, res) {
  const { isChief } = req.body;
  try {
    const targetRes = await pool.query('SELECT department FROM users WHERE id = $1', [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (isChief && !targetRes.rows[0].department) {
      return res.status(400).json({ error: 'Şef yapmadan önce kullanıcıya bir departman atamalısınız.' });
    }
    await pool.query('UPDATE users SET is_chief = $1 WHERE id = $2', [!!isChief, req.params.id]);
    await logAction(req, 'UPDATE_USER_CHIEF', `user_id=${req.params.id} is_chief=${!!isChief}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/karisim-yetkisi (ADMIN veya Saha Mühendisliği Şefi)
// Sadece SAHA_MUHENDISLIGI departmanındaki kullanıcılara verilebilir.
async function updateKarisimYetkisi(req, res) {
  const { canManageKarisim } = req.body;
  if (!req.user.isEffectiveAdmin && !(req.user.isChief && req.user.department === 'SAHA_MUHENDISLIGI')) {
    return res.status(403).json({ error: 'Bu yetkiyi sadece Saha Mühendisliği Şefi veya admin verebilir.' });
  }
  try {
    const targetRes = await pool.query('SELECT department FROM users WHERE id = $1', [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (targetRes.rows[0].department !== 'SAHA_MUHENDISLIGI') {
      return res.status(400).json({ error: 'Karışım yetkisi sadece Saha Mühendisliği personeline verilebilir.' });
    }
    await pool.query('UPDATE users SET can_manage_karisim = $1 WHERE id = $2', [!!canManageKarisim, req.params.id]);
    await logAction(req, 'UPDATE_KARISIM_YETKISI', `user_id=${req.params.id} can_manage_karisim=${!!canManageKarisim}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/admin-yetkisi (SADECE ADMIN) - PERSONEL/STAJYER'e admin yetkisi verir/alır
async function updateAdminYetkisi(req, res) {
  const { adminYetkisi } = req.body;
  try {
    const targetRes = await pool.query(
      `SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [req.params.id]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (targetRes.rows[0].role_name === 'ADMIN') {
      return res.status(400).json({ error: 'Sabit ADMIN hesabı zaten tam yetkilidir.' });
    }

    await pool.query('UPDATE users SET admin_yetkisi = $1 WHERE id = $2', [!!adminYetkisi, req.params.id]);
    await logAction(req, 'UPDATE_ADMIN_YETKISI', `user_id=${req.params.id} admin_yetkisi=${!!adminYetkisi}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/users/:id/status (ADMIN veya kendi departmanındaki kullanıcılar için departman şefi)
async function updateStatus(req, res) {
  const { isActive } = req.body;
  try {
    if (!(await sefYetkiVarMi(req, req.params.id))) {
      return res.status(403).json({ error: 'Sadece kendi departmanınızdaki kullanıcıları yönetebilirsiniz.' });
    }
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, req.params.id]);
    await logAction(req, 'UPDATE_USER_STATUS', `user_id=${req.params.id} is_active=${isActive}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/users/:id (ADMIN veya kendi departmanındaki kullanıcılar için departman şefi) - sabit ADMIN hesabı silinemez
async function remove(req, res) {
  try {
    const targetRes = await pool.query(
      `SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`, [req.params.id]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (targetRes.rows[0].role_name === 'ADMIN') {
      return res.status(400).json({ error: 'Sabit ADMIN hesabı silinemez.' });
    }
    if (parseInt(req.params.id) === parseInt(req.user.id)) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });
    }
    if (!(await sefYetkiVarMi(req, req.params.id))) {
      return res.status(403).json({ error: 'Sadece kendi departmanınızdaki kullanıcıları yönetebilirsiniz.' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_USER', `deleted_user_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = {
  list, me, updateMe, updateRole, updateAdminYetkisi, updateStatus, remove,
  updateDepartment, updateChief, updateKarisimYetkisi
};
