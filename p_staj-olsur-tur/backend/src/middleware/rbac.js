const pool = require('../config/db');

// Departman şefi kontrolü: ADMIN her zaman geçer. Belirli bir departman verilirse
// (SAHA_MUHENDISLIGI / TEKNIK_SERVIS) sadece o departmanın şefi + admin geçer;
// departman verilmezse (undefined) herhangi bir departmanın şefi + admin geçer.
function requireChiefOrAdmin(department) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
    if (req.user.isEffectiveAdmin) return next();
    if (req.user.isChief && (!department || req.user.department === department)) return next();
    return res.status(403).json({ error: 'Bu işlem için şeflik/yönetici yetkisi gerekiyor.' });
  };
}

// Bazı izinler sadece belirli bir departmandaki kullanıcılar için geçerlidir
// (ör. saha mühendisliği personeli olmayan biri CREATE_TIRE_TESTS iznine sahip olsa bile
// departmanı SAHA_MUHENDISLIGI değilse bu izni kullanamaz). ADMIN her zaman muaf.
const PERM_DEPARTMENT_MAP = {
  VIEW_TIRE_TESTS: 'SAHA_MUHENDISLIGI',
  CREATE_TIRE_TESTS: 'SAHA_MUHENDISLIGI',
  VIEW_KABUL_RET: 'TEKNIK_SERVIS',
  CREATE_KABUL_RET: 'TEKNIK_SERVIS'
  // VIEW_DOCUMENTS / CREATE_DOCUMENTS departmana bakılmaksızın herkese açık olabilir;
  // hangi BELGEYE erişileceği documents.controller.js içinde departman bazlı ayrıca filtrelenir.
};
function departmentAllows(user, permKey) {
  const requiredDept = PERM_DEPARTMENT_MAP[permKey];
  if (!requiredDept) return true;
  if (user.isEffectiveAdmin) return true;
  return user.department === requiredDept;
}

// Rol bazlı erişim kontrolü (RBAC). Kullanım: requireRole('ADMIN', 'PERSONEL')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor.' });
    }
    next();
  };
}

// Fiili yönetici kontrolü: ADMIN rolü VEYA sonradan verilmiş admin_yetkisi bayrağı
// (Personel veya Stajyer'e ADMIN tarafından admin yetkisi verilmiş olabilir.)
function requireEffectiveAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
  }
  if (!req.user.isEffectiveAdmin) {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  }
  next();
}

// STAJYER (admin yetkisi olmayan) sadece görüntüleyebilir; PERSONEL ve üzeri ekleme/düzenleme yapabilir.
function requireContentEditor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
  }
  const izinli = req.user.isEffectiveAdmin || req.user.role === 'PERSONEL';
  if (!izinli) {
    return res.status(403).json({ error: 'Stajyer hesapları içerik ekleyemez, sadece görüntüleyebilir.' });
  }
  next();
}

// Esnek yetki kontrolü: rolün role_permissions tablosunda belirtilen perm_key'e sahip olup
// olmadığına bakar. ADMIN / admin_yetkisi olan kullanıcılar her zaman geçer (tam yetki).
// Kullanım: requirePermission('CREATE_DOCUMENTS')
function requirePermission(permKey) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
    }
    if (req.user.isEffectiveAdmin) return next();
    if (!departmentAllows(req.user, permKey)) {
      return res.status(403).json({ error: 'Bu bölüm sizin departmanınıza ait değil.' });
    }
    try {
      const result = await pool.query(
        `SELECT 1 FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.id
         WHERE r.role_name = $1 AND rp.perm_key = $2`,
        [req.user.role, permKey]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor.' });
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Sunucu hatası.' });
    }
  };
}

// Verilen izinlerden en az birine sahip olma kontrolü (örn. genel dosya yükleme endpoint'i:
// CREATE_DOCUMENTS, CREATE_TIRE_TESTS veya CREATE_KABUL_RET izinlerinden herhangi biri yeterli).
function requireAnyPermission(...permKeys) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
    }
    if (req.user.isEffectiveAdmin) return next();
    try {
      const result = await pool.query(
        `SELECT 1 FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.id
         WHERE r.role_name = $1 AND rp.perm_key = ANY($2::text[])`,
        [req.user.role, permKeys]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor.' });
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Sunucu hatası.' });
    }
  };
}

module.exports = requireRole;
module.exports.requireRole = requireRole;
module.exports.requireEffectiveAdmin = requireEffectiveAdmin;
module.exports.requireContentEditor = requireContentEditor;
module.exports.requirePermission = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
module.exports.requireChiefOrAdmin = requireChiefOrAdmin;
module.exports.PERM_DEPARTMENT_MAP = PERM_DEPARTMENT_MAP;
