const pool = require('../config/db');

// files: [{ url, originalName, mimeType }]
async function saveAttachments(ownerType, ownerId, files, userId) {
  if (!Array.isArray(files) || files.length === 0) return;
  for (const f of files) {
    if (!f || !f.url) continue;
    await pool.query(
      `INSERT INTO attachments (owner_type, owner_id, file_path, original_name, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ownerType, ownerId, f.url, f.originalName || null, f.mimeType || null, userId || null]
    );
  }
}

async function getAttachments(ownerType, ownerId) {
  const result = await pool.query(
    `SELECT id, file_path, original_name, mime_type, created_at
     FROM attachments WHERE owner_type = $1 AND owner_id = $2 ORDER BY created_at ASC`,
    [ownerType, ownerId]
  );
  return result.rows;
}

async function deleteAttachment(id) {
  await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
}

module.exports = { saveAttachments, getAttachments, deleteAttachment };
