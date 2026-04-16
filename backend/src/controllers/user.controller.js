const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Já existe um usuário com este email."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "CORRETOR"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true,
        createdAt: true
      }
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return res.status(500).json({
      error: "Erro ao criar usuário."
    });
  }
}

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true,
        createdAt: true
      }
    });

    return res.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      error: "Erro ao listar usuários."
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, online } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: "Nome, email e perfil são obrigatórios."
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuário não encontrado."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userWithSameEmail = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id }
      }
    });

    if (userWithSameEmail) {
      return res.status(400).json({
        error: "Já existe outro usuário com este email."
      });
    }

    const data = {
      name: name.trim(),
      email: normalizedEmail,
      role
    };

    if (typeof online === "boolean") {
      data.online = online;
    }

    if (password && password.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true,
        createdAt: true
      }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      error: "Erro ao atualizar usuário."
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "ID do usuário é obrigatório."
      });
    }

    if (req.user.id === id) {
      return res.status(400).json({
        error: "Você não pode excluir seu próprio usuário."
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuário não encontrado."
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.json({
      message: "Usuário excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      error: "Erro ao excluir usuário."
    });
  }
}

async function updateMyOnlineStatus(req, res) {
  try {
    const { online } = req.body;

    if (typeof online !== "boolean") {
      return res.status(400).json({
        error: "O campo online deve ser true ou false."
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { online },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true
      }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar status online:", error);

    return res.status(500).json({
      error: "Erro ao atualizar status online."
    });
  }
}

async function listOnlineBrokers(req, res) {
  try {
    const brokers = await prisma.user.findMany({
      where: {
        role: "CORRETOR",
        online: true
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true
      }
    });

    return res.json(brokers);
  } catch (error) {
    console.error("Erro ao listar corretores online:", error);

    return res.status(500).json({
      error: "Erro ao listar corretores online."
    });
  }
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  updateMyOnlineStatus,
  listOnlineBrokers
};