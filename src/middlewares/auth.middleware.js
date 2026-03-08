const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    // 1) Leer el header Authorization
    const authHeader = req.headers.authorization;

    // Si no viene header, no hay token
    if (!authHeader) {
      return res.status(401).json({ message: "Falta token (Authorization)" });
    }

    // 2) El formato correcto es: "Bearer TOKEN"
    const parts = authHeader.split(" "); // separa por espacio
    const type = parts[0]; // "Bearer"
    const token = parts[1]; // el token

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    // 3) Verificar el token
    // Si es válido, jwt.verify devuelve el payload (lo que firmamos al crearlo)
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Guardar el payload en req para que los controllers lo usen después
    // Ej: req.user.userId, req.user.email
    req.user = payload;

    // 5) Continuar a la siguiente función (ruta/controller)
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

module.exports = { requireAuth };
