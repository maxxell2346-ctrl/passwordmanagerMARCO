const vaultRepository = require("../repositories/vault.repository");

// POST /vault
async function create(req, res) {
  try {
    const userId = req.user.userId;

    const { serviceName, loginName, secretValue } = req.body;

    // 3) validación básica
    if (!serviceName || !loginName || !secretValue) {
      return res.status(400).json({
        message: "serviceName, loginName y secretValue son obligatorios",
      });
    }

    // 4) guardamos en DB
    const item = await vaultRepository.createVaultItem(
      userId,
      serviceName,
      loginName,
      secretValue
    );

    return res.status(201).json({
      message: "Credencial guardada",
      item,
    });
  } catch (error) {
    console.error("VAULT CREATE ERROR:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

// GET /vault
async function list(req, res) {
  try {
    const userId = req.user.userId;

    const items = await vaultRepository.listVaultItems(userId);

    return res.status(200).json({
      message: "OK",
      items,
    });
  } catch (error) {
    console.error("VAULT LIST ERROR:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function update(req, res) {
  try {
    const userId = req.user.userId;

    // viene de /vault/:id
    const itemId = Number(req.params.id);

    const { serviceName, loginName, secretValue } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!serviceName || !loginName || !secretValue) {
      return res.status(400).json({
        message: "serviceName, loginName y secretValue son obligatorios",
      });
    }

    const updated = await vaultRepository.updateVaultItem(
      userId,
      itemId,
      serviceName,
      loginName,
      secretValue
    );

    if (!updated) {
      // No existe o no te pertenece
      return res.status(404).json({ message: "Item no encontrado" });
    }

    return res.json({ message: "Actualizado", item: updated });
  } catch (error) {
    console.error("VAULT UPDATE ERROR:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user.userId;
    const itemId = Number(req.params.id);

    if (!itemId) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const deleted = await vaultRepository.deleteVaultItem(userId, itemId);

    if (!deleted) {
      return res.status(404).json({ message: "Item no encontrado" });
    }

    return res.json({ message: "Eliminado", id: deleted.id });
  } catch (error) {
    console.error("VAULT DELETE ERROR:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
};
