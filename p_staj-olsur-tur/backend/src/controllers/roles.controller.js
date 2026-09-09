const pool = require('../config/db');
const logAction = require('../middleware/auditLog');

// GET /api/v1/roles (ADMIN veya admin yetkili) - roller + izinleri + kullanıcı sayısı
async function list(req, res) {
  try {
    const roles = await pool.query('SELECT * FROM roles ORDER BY id');
    const perms = await pool.query('SELECT role_id, perm_key FROM role_permissions');
    const counts = await pool.query('SELECT role_id, COUNT(*)::int AS user_count FROM users GROUP BY role_id');

    const permsByRole = {};
    for (const p of perms.rows) {
      if (!permsByRole[p.role_id]) permsByRole[p.role_id] = [];
      permsByRole[p.role_id].push(p.perm_key);
    }
    const countByRole = {};
    for (const c of counts.rows) countByRole[c.role_id] = c.user_count;

    res.json(roles.rows.map(r => ({
      ...r,
      permissions: permsByRole[r.id] || [],
      userCount: countByRole[r.id] || 0
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// GET /api/v1/roles/permissions-catalog - tüm mevcut izinlerin kataloğu (checkbox listesi için)
async function permissionsCatalog(req, res) {
  try {
    const result = await pool.query('SELECT * FROM permissions ORDER BY perm_key');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/v1/roles (ADMIN veya admin yetkili) - yeni rol oluştur
async function create(req, res) {
  const { roleName, description, permissionKeys } = req.body;
  if (!roleName) return res.status(400).json({ error: 'Rol adı zorunludur.' });
  const normalized = roleName.trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'ADMIN') {
    return res.status(400).json({ error: '"ADMIN" adında yeni bir rol oluşturulamaz, bu rol sabittir.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO roles (role_name, description) VALUES ($1, $2) RETURNING *',
      [normalized, description || null]
    );
    const roleId = result.rows[0].id;

    if (Array.isArray(permissionKeys)) {
      for (const key of permissionKeys) {
        // eslint-disable-next-line no-await-in-loop
        await pool.query('INSERT INTO role_permissions (role_id, perm_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roleId, key]);
      }
    }

    await logAction(req, 'CREATE_ROLE', `role=${normalized}`);
    res.status(201).json({ ...result.rows[0], permissions: permissionKeys || [] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu isimde bir rol zaten mevcut.' });
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

const { PERM_DEPARTMENT_MAP } = require('../middleware/rbac');

// PUT /api/v1/roles/:id/permissions (ADMIN veya departman şefi) - bir rolün izinlerini değiştir
// NOT: Bir şef (admin değilse), sadece KENDİ departmanına ait izin anahtarlarını (ör. saha müh.
// şefi için VIEW_TIRE_TESTS/CREATE_TIRE_TESTS) ekleyip çıkarabilir; departmanla ilgisi olmayan
// izinler (CREATE_DOCUMENTS gibi) veya diğer departmana ait izinler değiştirilmeden korunur.
async function updatePermissions(req, res) {
  const { permissionKeys } = req.body;
  if (!Array.isArray(permissionKeys)) return res.status(400).json({ error: 'permissionKeys bir dizi olmalıdır.' });

  try {
    const roleRes = await pool.query('SELECT role_name FROM roles WHERE id = $1', [req.params.id]);
    if (roleRes.rows.length === 0) return res.status(404).json({ error: 'Rol bulunamadı.' });
    if (roleRes.rows[0].role_name === 'ADMIN') {
      return res.status(400).json({ error: 'ADMIN rolünün izinleri sabittir (her zaman tam yetkilidir), değiştirilemez.' });
    }

    let finalKeys = permissionKeys;
    if (!req.user.isEffectiveAdmin && req.user.isChief) {
      // Şef, sadece kendi departmanına ait izinleri değiştirebilir; diğer izinler (departmana
      // bağlı olmayanlar dahil, örn. CREATE_DOCUMENTS) mevcut haliyle korunur.
      const existingRes = await pool.query('SELECT perm_key FROM role_permissions WHERE role_id = $1', [req.params.id]);
      const existingKeys = existingRes.rows.map(r => r.perm_key);
      const isOwnDept = (key) => PERM_DEPARTMENT_MAP[key] === req.user.department;
      const korunanlar = existingKeys.filter(key => !isOwnDept(key));
      const yenilenler = permissionKeys.filter(key => isOwnDept(key));
      finalKeys = [...new Set([...korunanlar, ...yenilenler])];
    }

    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [req.params.id]);
    for (const key of finalKeys) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query('INSERT INTO role_permissions (role_id, perm_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, key]);
    }

    await logAction(req, 'UPDATE_ROLE_PERMISSIONS', `role_id=${req.params.id} permissions=${finalKeys.join(',')}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// PATCH /api/v1/roles/:id (ADMIN veya admin yetkili) - rol açıklamasını güncelle
async function updateDescription(req, res) {
  const { description } = req.body;
  try {
    await pool.query('UPDATE roles SET description = $1 WHERE id = $2', [description || null, req.params.id]);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// DELETE /api/v1/roles/:id (ADMIN veya admin yetkili) - kullanıcı ataması yoksa rolü sil
async function remove(req, res) {
  try {
    const roleRes = await pool.query('SELECT role_name FROM roles WHERE id = $1', [req.params.id]);
    if (roleRes.rows.length === 0) return res.status(404).json({ error: 'Rol bulunamadı.' });
    if (['ADMIN', 'PERSONEL', 'STAJYER'].includes(roleRes.rows[0].role_name)) {
      return res.status(400).json({ error: 'Varsayılan sistem rolleri (ADMIN, PERSONEL, STAJYER) silinemez.' });
    }

    const userCount = await pool.query('SELECT COUNT(*)::int AS c FROM users WHERE role_id = $1', [req.params.id]);
    if (userCount.rows[0].c > 0) {
      return res.status(400).json({ error: 'Bu role atanmış kullanıcılar var, önce onları başka bir role taşıyın.' });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_ROLE', `role_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { list, permissionsCatalog, create, updatePermissions, updateDescription, remove };
