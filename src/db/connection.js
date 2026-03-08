const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "MTN",
  database: "password_manager"
});

module.exports = pool;