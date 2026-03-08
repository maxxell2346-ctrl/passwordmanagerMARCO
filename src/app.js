const express = require("express");
const cors = require("cors");

const vaultRoutes = require("./routes/vault.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);

// ===== Ruta de prueba =====

app.get("/health", (req, res) => {
  res.status(200).json({
    status:"puedo mandar esto asi?"
  });
});

module.exports = app;