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

module.exports = requireRole;
module.exports.requireRole = requireRole;
module.exports.requireEffectiveAdmin = requireEffectiveAdmin;
module.exports.requireContentEditor = requireContentEditor;
