const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const pool = require("../db/connection"); // <-- asegúrate de que este path sea el correcto en tu proyecto

const userRepository = require("../repositories/user.repository");
const emailService = require("../services/email.service");
const emailVerificationRepository = require("../repositories/emailVerification.repository");

// ===================== REGISTER (CON TRANSACCIÓN) ============================

async function register(req, res) {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios",
      });
    }

    // 1) START TRANSACTION
    await client.query("BEGIN");

    // 2) Verificar si ya existe
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Ese email ya está registrado" });
    }

    // 3) Hash password y crear usuario
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await client.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at, email_verified`,
      [email, passwordHash]
    );

    const user = created.rows[0];

    // 4) Generar código y guardarlo como hash
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const codeHash = crypto
      .createHash("sha256")
      .update(code + process.env.EMAIL_VERIFY_PEPPER)
      .digest("hex");

    const ttlMin = Number(process.env.EMAIL_VERIFY_CODE_TTL_MIN || 10);
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    // 5) Guardar verificación (MISMA TRANSACCIÓN)
    await client.query(
      `INSERT INTO email_verifications (user_id, code_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, codeHash, expiresAt]
    );

    // 6) Enviar email (si esto falla, hacemos rollback)
    await emailService.sendVerificationCode(user.email, code);

    // 7) COMMIT (solo si TODO salió bien)
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Usuario creado. Te enviamos un código para verificar el email.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  } finally {
    client.release();
  }
}

// ===================== LOGIN ===============================================

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios",
      });
    }

    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // 🔒 BLOQUEO SI NO ESTÁ VERIFICADO
    if (!user.email_verified) {
      return res.status(403).json({
        message: "Debes verificar tu email antes de iniciar sesión",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const payload = { userId: user.id, email: user.email };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return res.status(200).json({
      message: "Login correcto",
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

// ===================== VERIFY EMAIL =========================================

async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "email y code son obligatorios",
      });
    }

    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (user.email_verified) {
      return res.status(200).json({
        message: "Email ya verificado",
      });
    }

    const verification =
      await emailVerificationRepository.findLatestValidVerification(user.id);

    if (!verification) {
      return res.status(400).json({
        message: "No hay código activo",
      });
    }

    if (verification.used_at) {
      return res.status(400).json({
        message: "Código ya usado",
      });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({
        message: "Código expirado",
      });
    }

    const incomingHash = crypto
      .createHash("sha256")
      .update(String(code) + process.env.EMAIL_VERIFY_PEPPER)
      .digest("hex");

    if (incomingHash !== verification.code_hash) {
      return res.status(400).json({
        message: "Código incorrecto",
      });
    }

    await emailVerificationRepository.markUsed(verification.id);
    await userRepository.markEmailVerified(user.id);

    return res.status(200).json({
      message: "Email verificado correctamente",
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

// ===================== ME ====================================================

function me(req, res) {
  return res.json({
    message: "Token válido",
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  verifyEmail,
  me,
};