const pool = require("../db/connection");

async function createVerification(userId, codeHash, expiresAt) {
  const query = `
    INSERT INTO email_verifications (user_id, code_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, expires_at;
  `;
  const result = await pool.query(query, [userId, codeHash, expiresAt]);
  return result.rows[0];
}

async function findLatestValidVerification(userId) {
  const query = `
    SELECT id, code_hash, expires_at, used_at
    FROM email_verifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

async function markUsed(id) {
  const query = `
    UPDATE email_verifications
    SET used_at = NOW()
    WHERE id = $1
    RETURNING id;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = {
  createVerification,
  findLatestValidVerification,
  markUsed,
};