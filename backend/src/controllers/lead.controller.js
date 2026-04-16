const prisma = require("../config/prisma");

async function createLeadWithRotation(req, res) {
  try {
    const { name, phone, email, message, propertyId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        error: "Nome e telefone são obrigatórios."
      });
    }

    const onlineBrokers = await prisma.user.findMany({
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
        online: true
      }
    });

    if (onlineBrokers.length === 0) {
      const leadWithoutBroker = await prisma.lead.create({
        data: {
          name: String(name).trim(),
          phone: String(phone).trim(),
          email: email ? String(email).trim() : null,
          message: message ? String(message).trim() : null,
          propertyId: propertyId || null,
          status: "NOVO"
        }
      });

      return res.status(201).json({
        message: "Lead criado, mas não havia corretor online no momento.",
        lead: leadWithoutBroker,
        broker: null
      });
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
      selectedBroker = onlineBrokers[0];
    } else {
      const lastIndex = onlineBrokers.findIndex(
        (broker) => broker.id === distribution.lastAssignedUserId
      );

      if (lastIndex === -1 || lastIndex === onlineBrokers.length - 1) {
        selectedBroker = onlineBrokers[0];
      } else {
        selectedBroker = onlineBrokers[lastIndex + 1];
      }
    }

    const createdLead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        message: message ? String(message).trim() : null,
        propertyId: propertyId || null,
        status: "NOVO",
        assignedToId: selectedBroker.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            online: true
          }
        }
      }
    });

    await prisma.leadDistribution.update({
      where: {
        id: distribution.id
      },
      data: {
        lastAssignedUserId: selectedBroker.id
      }
    });

    return res.status(201).json({
      message: "Lead criado e distribuído com sucesso.",
      lead: createdLead,
      broker: selectedBroker
    });
  } catch (error) {
    console.error("ERRO REAL AO CRIAR LEAD:", error);
    console.error("Mensagem:", error.message);
    console.error("Meta:", error.meta);

    return res.status(500).json({
      error: "Erro ao criar lead com roleta.",
      details: error.message
    });
  }
}

async function listLeads(req, res) {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : {
            assignedToId: req.user.id
          };

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            online: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(leads);
  } catch (error) {
    console.error("Erro ao listar leads:", error);

    return res.status(500).json({
      error: "Erro ao listar leads.",
      details: error.message
    });
  }
}

async function updateLeadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["NOVO", "EM_ATENDIMENTO", "ATENDIDO", "DESCARTADO"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        error: "Status inválido."
      });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!existingLead) {
      return res.status(404).json({
        error: "Lead não encontrado."
      });
    }

    if (req.user.role !== "ADMIN" && existingLead.assignedToId !== req.user.id) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar este lead."
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            online: true
          }
        }
      }
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);

    return res.status(500).json({
      error: "Erro ao atualizar status do lead.",
      details: error.message
    });
  }
}

module.exports = {
  createLeadWithRotation,
  listLeads,
  updateLeadStatus
};