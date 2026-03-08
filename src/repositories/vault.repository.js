const pool = require("../db/connection");

// Insertar un item
async function createVaultItem(userId, serviceName, loginName, secretValue) {
  const query = `
    INSERT INTO vault_items (user_id, service_name, login_name, secret_value)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, service_name, login_name, created_at;
  `;

  const values = [userId, serviceName, loginName, secretValue];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Traer todos los items del usuario
async function listVaultItems(userId) {
  const query = `
    SELECT id, service_name, login_name, secret_value, created_at
    FROM vault_items
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function updateVaultItem(userId, itemId, serviceName, loginName, secretValue) {
  const query = `
    UPDATE vault_items
    SET service_name = $1,
        login_name = $2,
        secret_value = $3
    WHERE id = $4 AND user_id = $5
    RETURNING id, user_id, service_name, login_name, created_at;
  `;

  const values = [serviceName, loginName, secretValue, itemId, userId];
  const result = await pool.query(query, values);
  return result.rows[0]; // undefined si no existe o no es del usuario
}

async function deleteVaultItem(userId, itemId) {
  const query = `
    DELETE FROM vault_items
    WHERE id = $1 AND user_id = $2
    RETURNING id;
  `;

  const result = await pool.query(query, [itemId, userId]);
  return result.rows[0]; // undefined si no borró nada
}

module.exports = {
  createVaultItem,
  listVaultItems,
  updateVaultItem,
  deleteVaultItem,
};