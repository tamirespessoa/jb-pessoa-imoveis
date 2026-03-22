const prisma = require("../config/prisma");

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao listar usuários.",
      details: error.message
    });
  }
}

module.exports = {
  listUsers
};