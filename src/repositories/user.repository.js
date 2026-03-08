const pool = require("../db/connection");

//CREAR USUARIO
async function createUser(email, passwordHash) {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email, email_verified, created_at;
  `;

  const result = await pool.query(query, [email, passwordHash]);
  return result.rows[0];
}

// BUSCAR UN USUARIO POR MAIL
async function findUserByEmail(email) {
  const query = `
    SELECT id, email, password_hash, email_verified, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
}

async function markEmailVerified(userId) {
  const query = `
    UPDATE users
    SET email_verified = TRUE
    WHERE id = $1
    RETURNING id, email, email_verified;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  markEmailVerified,
};