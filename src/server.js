const pool = require("./db/connection");

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

pool.query("SELECT NOW()")
  .then(res => {
    console.log("Base de datos conectada:", res.rows[0]);
  })
  .catch(err => {
    console.error("Error conectando a la base de datos", err);
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http:localhost:${PORT}`);
});