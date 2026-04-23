const prisma = require("../config/prisma");
const { getIO } = require("../socket");

function canReceiveChats(user) {
  if (!user) return false;

  return ["CORRETOR", "ADMIN"].includes(user.role) && user.online === true;
}

async function getAvailableBrokers() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["CORRETOR", "ADMIN"]
      }
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

  return users.filter(canReceiveChats);
}

async function getNextBrokerByRotation() {
  const availableBrokers = await getAvailableBrokers();

  if (availableBrokers.length === 0) {
    return null;
  }

  let distribution = await prisma.leadDistribution.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!distribution) {
    distribution = await prisma.leadDistribution.create({
      data: {}
    });
  }

  let selectedBroker = null;

  if (!distribution.lastAssignedUserId) {
    selectedBroker = availableBrokers[0];
  } else {
    const lastIndex = availableBrokers.findIndex(
      (broker) => broker.id === distribution.lastAssignedUserId
    );

    if (lastIndex === -1 || lastIndex === availableBrokers.length - 1) {
      selectedBroker = availableBrokers[0];
    } else {
      selectedBroker = availableBrokers[lastIndex + 1];
    }
  }

  await prisma.leadDistribution.update({
    where: {
      id: distribution.id
    },
    data: {
      lastAssignedUserId: selectedBroker.id
    }
  });

  return selectedBroker;
}

async function createConversation(req, res) {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        error: "Nome e mensagem são obrigatórios."
      });
    }

    const broker = await getNextBrokerByRotation();

    if (!broker) {
      return res.status(400).json({
        error: "Nenhum corretor online no momento."
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        visitorName: name,
        visitorPhone: phone || null,
        visitorEmail: email || null,
        assignedToId: broker.id,
        messages: {
          create: {
            senderType: "CLIENTE",
            senderName: name,
            text: message
          }
        }
      },
      include: {
        messages: true,
        assignedTo: true
      }
    });

    const io = getIO();
    io.emit("newConversation", conversation);

    return res.status(201).json(conversation);
  } catch (err) {
    console.error("Erro ao criar chat:", err);
    return res.status(500).json({
      error: "Erro ao criar chat"
    });
  }
}

async function getMyConversations(req, res) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        assignedToId: req.user.id
      },
      include: {
        messages: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(conversations);
  } catch (err) {
    console.error("Erro ao listar conversas:", err);
    return res.status(500).json({
      error: "Erro ao listar conversas"
    });
  }
}

async function sendMessage(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Texto é obrigatório."
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversa não encontrada."
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: req.user.role === "ADMIN" ? "ADMIN" : "CORRETOR",
        senderName: req.user.name,
        text
      }
    });

    const io = getIO();
    io.to(id).emit("newMessage", message);

    return res.json(message);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    return res.status(500).json({
      error: "Erro ao enviar mensagem"
    });
  }
}

module.exports = {
  createConversation,
  getMyConversations,
  sendMessage
};