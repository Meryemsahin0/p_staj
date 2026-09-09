const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const logAction = require('../middleware/auditLog');
const { sendPasswordResetEmail } = require('../utils/mailer');

// POST /api/v1/auth/login
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.is_active, u.admin_yetkisi,
              u.personel_tipi, u.profil_foto, u.department, u.is_chief, u.can_manage_karisim, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmış.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await logAction(req, 'LOGIN_FAILED', `username=${username}`);
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    req.user = { id: user.id };
    await logAction(req, 'LOGIN', `username=${username}`);

    // Kullanıcının rolüne tanımlı esnek izinleri de gönderiyoruz (Roller & Yetkiler panelinden
    // yönetilir); frontend bunlarla sidebar/sayfa erişimini belirler.
    const permsRes = await pool.query(
      `SELECT rp.perm_key FROM role_permissions rp
       JOIN roles r ON rp.role_id = r.id WHERE r.role_name = $1`,
      [user.role_name]
    );

    res.json({
      token: accessToken,
      refreshToken,
      role: user.role_name,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      user: {
        id: user.id, username: user.username, email: user.email, role: user.role_name,
        adminYetkisi: !!user.admin_yetkisi, personelTipi: user.personel_tipi,
        profilFoto: user.profil_foto, isEffectiveAdmin: user.role_name === 'ADMIN' || !!user.admin_yetkisi,
        department: user.department, isChief: !!user.is_chief, canManageKarisim: !!user.can_manage_karisim,
        permissions: permsRes.rows.map(r => r.perm_key)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/auth/register  (ADMIN veya admin yetkili yeni kullanıcı açabilir - route seviyesinde korunur)
// NOT: ADMIN rolü sabit tek hesaptır; register ile ADMIN rolü verilemez.
async function register(req, res) {
  const { username, email, password, roleName, personelTipi, department } = req.body;
  if (!username || !email || !password || !roleName) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  }
  if (roleName === 'ADMIN') {
    return res.status(400).json({ error: 'ADMIN rolü sabittir, yeni ADMIN hesabı oluşturulamaz. Bunun yerine kullanıcıya "admin yetkisi" verebilirsiniz.' });
  }

  // Bir departman şefi (admin olmayan), sadece kendi departmanına yeni kullanıcı ekleyebilir.
  let finalDepartment = department || null;
  if (!req.user.isEffectiveAdmin && req.user.isChief) {
    finalDepartment = req.user.department;
  }

  try {
    // Roller artık sabit değildir: admin panelinden (Roller & Yetkiler) yeni roller oluşturulabilir.
    // roleName, veritabanındaki "roles" tablosunda bulunan herhangi bir rol (ADMIN hariç) olabilir.
    const roleRes = await pool.query('SELECT id FROM roles WHERE role_name = $1', [roleName]);
    if (roleRes.rows.length === 0) {
      return res.status(400).json({ error: 'Geçersiz rol.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const insertRes = await pool.query(
      `INSERT INTO users (username, email, password_hash, role_id, personel_tipi, department)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email`,
      [username, email, hash, roleRes.rows[0].id, roleName === 'PERSONEL' ? (personelTipi || null) : null, finalDepartment]
    );

    await logAction(req, 'CREATE_USER', `created_username=${username} role=${roleName}`);
    res.status(201).json({ status: 'Success', user: insertRes.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta zaten kayıtlı.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/auth/refresh
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken zorunludur.' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const result = await pool.query(
      `SELECT u.id, u.username, u.admin_yetkisi, u.personel_tipi, r.role_name FROM users u
       JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [payload.sub]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });

    const newAccessToken = signAccessToken(result.rows[0]);
    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token geçersiz veya süresi dolmuş.' });
  }
}

// POST /api/v1/auth/forgot-password  { email }
// Güvenlik gereği kullanıcı e-postanın kayıtlı olup olmadığını anlayamasın diye her durumda aynı mesaj döner.
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-posta zorunludur.' });

  try {
    const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [tokenHash, expires, user.id]
      );

      const appUrl = process.env.APP_URL || 'http://localhost:8080';
      const resetUrl = `${appUrl}/sifre-sifirla?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
      await logAction(req, 'FORGOT_PASSWORD_REQUEST', `email=${email}`);
    }
    // Kullanıcı kayıtlı olsun olmasın aynı cevap:
    res.json({ status: 'Success', message: 'E-posta adresiniz sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/auth/reset-password  { email, token, newPassword }
async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expires > NOW()`,
      [email, tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Sıfırlama bağlantısı geçersiz veya süresi dolmuş.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, result.rows[0].id]
    );
    await logAction(req, 'RESET_PASSWORD', `email=${email}`);
    res.json({ status: 'Success', message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { login, register, refresh, forgotPassword, resetPassword };
