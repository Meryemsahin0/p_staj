const { verifyAccessToken } = require('../utils/jwt');

// JWT doğrulama middleware'i. Geçerli token yoksa 401 döner.
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme token bulunamadı.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      adminYetkisi: !!payload.adminYetkisi,
      personelTipi: payload.personelTipi || null,
      // Fiili yönetici yetkisi: ADMIN rolü VEYA sonradan verilmiş admin_yetkisi bayrağı
      isEffectiveAdmin: payload.role === 'ADMIN' || !!payload.adminYetkisi
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token geçersiz veya süresi dolmuş.' });
  }
}

module.exports = authenticate;
