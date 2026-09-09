const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticate = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/rbac');
const logAction = require('../middleware/auditLog');

const canManage = requireAnyPermission('CREATE_DOCUMENTS', 'CREATE_TIRE_TESTS', 'CREATE_KABUL_RET');

// DELETE /api/v1/attachments/:id (ADMIN/yetkili: her ek, PERSONEL: sadece kendi yüklediği)
router.delete('/:id', authenticate, canManage, async (req, res) => {
  try {
    const existing = await pool.query('SELECT uploaded_by FROM attachments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Ek dosya bulunamadı.' });

    if (!req.user.isEffectiveAdmin && existing.rows[0].uploaded_by !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Sadece kendi yüklediğiniz dosyaları silebilirsiniz.' });
    }

    await pool.query('DELETE FROM attachments WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_ATTACHMENT', `attachment_id=${req.params.id}`);
    res.json({ status: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
