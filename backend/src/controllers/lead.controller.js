const prisma = require("../config/prisma");

function canReceiveLeads(user) {
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

  return users.filter(canReceiveLeads);
}

async function createLeadWithRotation(req, res) {
  try {
    const {
      name,
      phone,
      email,
      message,
      propertyId,
      source,
      sourceDetail,
      campaignId,
      campaignName,
      temperature,
      monthlyIncome,
      familyIncome,
      downPayment,
      hasFgts,
      fgtsValue,
      needsFinancing,
      financingApproved,
      desiredRegion,
      desiredCity,
      purchaseTime,
      notes,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        error: "Nome e telefone são obrigatórios."
      });
    }

    const onlineBrokers = await getAvailableBrokers();

    const leadData = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      message: message ? String(message).trim() : null,
      propertyId: propertyId || null,

      source: source || null,
      sourceDetail: sourceDetail || null,

      campaignId: campaignId || null,
      campaignName: campaignName || null,

      temperature: temperature || "FRIO",

      monthlyIncome:
        monthlyIncome !== undefined &&
        monthlyIncome !== null &&
        monthlyIncome !== ""
          ? Number(monthlyIncome)
          : null,

      familyIncome:
        familyIncome !== undefined &&
        familyIncome !== null &&
        familyIncome !== ""
          ? Number(familyIncome)
          : null,

      downPayment:
        downPayment !== undefined &&
        downPayment !== null &&
        downPayment !== ""
          ? Number(downPayment)
          : null,

      hasFgts:
        typeof hasFgts === "boolean"
          ? hasFgts
          : hasFgts === "true"
          ? true
          : hasFgts === "false"
          ? false
          : null,

      fgtsValue:
        fgtsValue !== undefined &&
        fgtsValue !== null &&
        fgtsValue !== ""
          ? Number(fgtsValue)
          : null,

      needsFinancing:
        typeof needsFinancing === "boolean"
          ? needsFinancing
          : needsFinancing === "true"
          ? true
          : needsFinancing === "false"
          ? false
          : null,

      financingApproved:
        typeof financingApproved === "boolean"
          ? financingApproved
          : financingApproved === "true"
          ? true
          : financingApproved === "false"
          ? false
          : null,

      desiredRegion: desiredRegion || null,
      desiredCity: desiredCity || null,
      purchaseTime: purchaseTime || null,
      notes: notes || null,

      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,

      status: "NOVO"
    };

    if (onlineBrokers.length === 0) {
      const leadWithoutBroker = await prisma.lead.create({
        data: leadData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              online: true
            }
          },
          property: true
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
        ...leadData,
        assignedToId: selectedBroker.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            online: true
          }
        },
        property: true
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
            role: true,
            online: true
          }
        },
        property: true
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

    const allowedStatus = [
      "NOVO",
      "CONTATO_REALIZADO",
      "EM_ATENDIMENTO",
      "QUALIFICADO",
      "SIMULACAO",
      "VISITA_AGENDADA",
      "VISITA_REALIZADA",
      "PROPOSTA",
      "DOCUMENTACAO",
      "ATENDIDO",
      "CONVERTIDO",
      "SEM_RESPOSTA",
      "SEM_RENDA",
      "SEM_ENTRADA",
      "NAO_INTERESSADO",
      "INVALIDO",
      "DESCARTADO",
      "PERDIDO"
    ];

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

    if (
      req.user.role !== "ADMIN" &&
      existingLead.assignedToId !== req.user.id
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar este lead."
      });
    }

    const updateData = {
      status
    };

    // =====================================================
    // PRIORIDADE AUTOMÁTICA
    // =====================================================

    if (
      status === "NOVO" ||
      status === "CONTATO_REALIZADO" ||
      status === "EM_ATENDIMENTO"
    ) {
      updateData.temperature = "FRIO";
    }

    if (
      status === "QUALIFICADO" ||
      status === "SIMULACAO"
    ) {
      updateData.temperature = "MORNO";
    }

    if (
      status === "VISITA_AGENDADA" ||
      status === "VISITA_REALIZADA" ||
      status === "PROPOSTA" ||
      status === "DOCUMENTACAO" ||
      status === "CONVERTIDO"
    ) {
      updateData.temperature = "QUENTE";
    }

    // =====================================================
    // DATA DO PRIMEIRO CONTATO
    // =====================================================

    if (
      status === "CONTATO_REALIZADO" ||
      status === "EM_ATENDIMENTO"
    ) {
      if (!existingLead.firstContactAt) {
        updateData.firstContactAt = new Date();
      }
    }

    // =====================================================
    // DATA DE QUALIFICAÇÃO
    // =====================================================

    if (status === "QUALIFICADO") {
      if (!existingLead.qualifiedAt) {
        updateData.qualifiedAt = new Date();
      }
    }

    // =====================================================
    // DATA DA VISITA
    // =====================================================

    if (
      status === "VISITA_AGENDADA" ||
      status === "VISITA_REALIZADA"
    ) {
      if (!existingLead.visitAt) {
        updateData.visitAt = new Date();
      }
    }

    // =====================================================
    // DATA DA PROPOSTA
    // =====================================================

    if (status === "PROPOSTA") {
      if (!existingLead.proposalAt) {
        updateData.proposalAt = new Date();
      }
    }

    // =====================================================
    // DATA DA CONVERSÃO / VENDA
    // =====================================================

    if (status === "CONVERTIDO") {
      if (!existingLead.convertedAt) {
        updateData.convertedAt = new Date();
      }

      updateData.lostAt = null;
    }

    // =====================================================
    // STATUS DE PERDA
    // =====================================================

    const lostStatuses = [
      "SEM_RESPOSTA",
      "SEM_RENDA",
      "SEM_ENTRADA",
      "NAO_INTERESSADO",
      "INVALIDO",
      "DESCARTADO",
      "PERDIDO"
    ];

    if (lostStatuses.includes(status)) {
      if (!existingLead.lostAt) {
        updateData.lostAt = new Date();
      }
    }

    if (!lostStatuses.includes(status) && status !== "CONVERTIDO") {
      updateData.lostAt = null;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            online: true
          }
        },
        property: true
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

async function assignLeadBroker(req, res) {
  try {
    const { id } = req.params;
    const { brokerId } = req.body;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Apenas administradores podem atribuir corretores."
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

    if (!brokerId) {
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          assignedToId: null
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              online: true
            }
          },
          property: true
        }
      });

      return res.json(updatedLead);
    }

    const broker = await prisma.user.findUnique({
      where: {
        id: String(brokerId)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        online: true
      }
    });

    if (!broker) {
      return res.status(404).json({
        error: "Corretor não encontrado."
      });
    }

    if (!["CORRETOR", "ADMIN"].includes(broker.role)) {
      return res.status(400).json({
        error: "Usuário selecionado não pode receber leads."
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedToId: broker.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            online: true
          }
        },
        property: true
      }
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atribuir corretor:", error);

    return res.status(500).json({
      error: "Erro ao atribuir corretor.",
      details: error.message
    });
  }
}

async function updateLeadDetails(req, res) {
  try {
    const { id } = req.params;

    const existingLead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!existingLead) {
      return res.status(404).json({
        error: "Lead não encontrado."
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      existingLead.assignedToId !== req.user.id
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar este lead."
      });
    }

    const {
      temperature,

      monthlyIncome,
      familyIncome,
      downPayment,
      hasFgts,
      fgtsValue,
      needsFinancing,
      financingApproved,

      desiredRegion,
      desiredCity,
      purchaseTime,

      notes,
      lossReason,

      campaignId,
      campaignName,

      adSetId,
      adSetName,

      adId,
      adName,

      metaLeadId,
      metaCampaignId,
      metaAdSetId,
      metaAdId,

      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,

      propertyId,
      sourceDetail
    } = req.body;

    const data = {};

    if (temperature !== undefined) {
      data.temperature = temperature || "FRIO";
    }

    if (monthlyIncome !== undefined) {
      data.monthlyIncome =
        monthlyIncome === "" || monthlyIncome === null
          ? null
          : Number(monthlyIncome);
    }

    if (familyIncome !== undefined) {
      data.familyIncome =
        familyIncome === "" || familyIncome === null
          ? null
          : Number(familyIncome);
    }

    if (downPayment !== undefined) {
      data.downPayment =
        downPayment === "" || downPayment === null
          ? null
          : Number(downPayment);
    }

    if (hasFgts !== undefined) {
      data.hasFgts =
        hasFgts === "" || hasFgts === null
          ? null
          : typeof hasFgts === "boolean"
          ? hasFgts
          : String(hasFgts).toLowerCase() === "true";
    }

    if (fgtsValue !== undefined) {
      data.fgtsValue =
        fgtsValue === "" || fgtsValue === null
          ? null
          : Number(fgtsValue);
    }

    if (needsFinancing !== undefined) {
      data.needsFinancing =
        needsFinancing === "" || needsFinancing === null
          ? null
          : typeof needsFinancing === "boolean"
          ? needsFinancing
          : String(needsFinancing).toLowerCase() === "true";
    }

    if (financingApproved !== undefined) {
      data.financingApproved =
        financingApproved === "" || financingApproved === null
          ? null
          : typeof financingApproved === "boolean"
          ? financingApproved
          : String(financingApproved).toLowerCase() === "true";
    }

    if (desiredRegion !== undefined) {
      data.desiredRegion = desiredRegion || null;
    }

    if (desiredCity !== undefined) {
      data.desiredCity = desiredCity || null;
    }

    if (purchaseTime !== undefined) {
      data.purchaseTime = purchaseTime || null;
    }

    if (notes !== undefined) {
      data.notes = notes || null;
    }

    if (lossReason !== undefined) {
      data.lossReason = lossReason || null;
    }

    if (campaignId !== undefined) {
      data.campaignId = campaignId || null;
    }

    if (campaignName !== undefined) {
      data.campaignName = campaignName || null;
    }

    if (adSetId !== undefined) {
      data.adSetId = adSetId || null;
    }

    if (adSetName !== undefined) {
      data.adSetName = adSetName || null;
    }

    if (adId !== undefined) {
      data.adId = adId || null;
    }

    if (adName !== undefined) {
      data.adName = adName || null;
    }

    if (metaLeadId !== undefined) {
      data.metaLeadId = metaLeadId || null;
    }

    if (metaCampaignId !== undefined) {
      data.metaCampaignId = metaCampaignId || null;
    }

    if (metaAdSetId !== undefined) {
      data.metaAdSetId = metaAdSetId || null;
    }

    if (metaAdId !== undefined) {
      data.metaAdId = metaAdId || null;
    }

    if (utmSource !== undefined) {
      data.utmSource = utmSource || null;
    }

    if (utmMedium !== undefined) {
      data.utmMedium = utmMedium || null;
    }

    if (utmCampaign !== undefined) {
      data.utmCampaign = utmCampaign || null;
    }

    if (utmContent !== undefined) {
      data.utmContent = utmContent || null;
    }

    if (utmTerm !== undefined) {
      data.utmTerm = utmTerm || null;
    }

    if (propertyId !== undefined) {
      data.propertyId = propertyId || null;
    }

    if (sourceDetail !== undefined) {
      data.sourceDetail = sourceDetail || null;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            online: true
          }
        },
        property: true
      }
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error("Erro ao salvar dados do lead:", error);

    return res.status(500).json({
      error: "Erro ao salvar dados do lead.",
      details: error.message
    });
  }
}

module.exports = {
  createLeadWithRotation,
  listLeads,
  updateLeadStatus,
  assignLeadBroker,
  updateLeadDetails
};