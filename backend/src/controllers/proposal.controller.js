const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

async function createProposal(req, res) {
  try {
    const {
      propertyId,
      clientId,
      value,
      status,
      notes
    } = req.body;

    if (!propertyId || !String(propertyId).trim()) {
      return res.status(400).json({
        error: "Imóvel é obrigatório."
      });
    }

    if (!clientId || !String(clientId).trim()) {
      return res.status(400).json({
        error: "Cliente é obrigatório."
      });
    }

    if (value === undefined || value === null || value === "") {
      return res.status(400).json({
        error: "Valor da proposta é obrigatório."
      });
    }

    const propertyExists = await prisma.property.findUnique({
      where: { id: String(propertyId).trim() }
    });

    if (!propertyExists) {
      return res.status(400).json({
        error: "Imóvel não encontrado."
      });
    }

    const clientExists = await prisma.person.findUnique({
      where: { id: String(clientId).trim() }
    });

    if (!clientExists) {
      return res.status(400).json({
        error: "Cliente não encontrado."
      });
    }

    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return res.status(400).json({
        error: "Valor da proposta inválido."
      });
    }

    const validStatuses = [
      "PENDENTE",
      "ACEITA",
      "RECUSADA",
      "EM_ANALISE",
      "CONTRAPROPOSTA"
    ];

    const finalStatus = normalizeString(status) || "PENDENTE";

    if (!validStatuses.includes(finalStatus)) {
      return res.status(400).json({
        error: "Status inválido."
      });
    }

    const proposal = await prisma.proposal.create({
      data: {
        propertyId: String(propertyId).trim(),
        clientId: String(clientId).trim(),
        value: parsedValue,
        status: finalStatus,
        notes: normalizeString(notes)
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.status(201).json({
      message: "Proposta cadastrada com sucesso.",
      proposal
    });
  } catch (error) {
    console.error("Erro ao cadastrar proposta:", error);

    return res.status(500).json({
      error: "Erro ao cadastrar proposta.",
      details: error.message
    });
  }
}

async function listProposals(req, res) {
  try {
    const proposals = await prisma.proposal.findMany({
      include: {
        property: true,
        client: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(proposals);
  } catch (error) {
    console.error("Erro ao listar propostas:", error);

    return res.status(500).json({
      error: "Erro ao listar propostas.",
      details: error.message
    });
  }
}

async function getProposalById(req, res) {
  try {
    const { id } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { id: String(id) },
      include: {
        property: true,
        client: true
      }
    });

    if (!proposal) {
      return res.status(404).json({
        error: "Proposta não encontrada."
      });
    }

    return res.json(proposal);
  } catch (error) {
    console.error("Erro ao buscar proposta:", error);

    return res.status(500).json({
      error: "Erro ao buscar proposta.",
      details: error.message
    });
  }
}

async function updateProposal(req, res) {
  try {
    const { id } = req.params;
    const {
      propertyId,
      clientId,
      value,
      status,
      notes
    } = req.body;

    const existing = await prisma.proposal.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Proposta não encontrada."
      });
    }

    let finalPropertyId = existing.propertyId;
    let finalClientId = existing.clientId;

    if (propertyId !== undefined) {
      const propertyExists = await prisma.property.findUnique({
        where: { id: String(propertyId).trim() }
      });

      if (!propertyExists) {
        return res.status(400).json({
          error: "Imóvel não encontrado."
        });
      }

      finalPropertyId = String(propertyId).trim();
    }

    if (clientId !== undefined) {
      const clientExists = await prisma.person.findUnique({
        where: { id: String(clientId).trim() }
      });

      if (!clientExists) {
        return res.status(400).json({
          error: "Cliente não encontrado."
        });
      }

      finalClientId = String(clientId).trim();
    }

    let finalValue = existing.value;

    if (value !== undefined) {
      const parsedValue = Number(value);

      if (Number.isNaN(parsedValue)) {
        return res.status(400).json({
          error: "Valor da proposta inválido."
        });
      }

      finalValue = parsedValue;
    }

    const validStatuses = [
      "PENDENTE",
      "ACEITA",
      "RECUSADA",
      "EM_ANALISE",
      "CONTRAPROPOSTA"
    ];

    let finalStatus = existing.status;

    if (status !== undefined) {
      const normalizedStatus = normalizeString(status) || "PENDENTE";

      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          error: "Status inválido."
        });
      }

      finalStatus = normalizedStatus;
    }

    const proposal = await prisma.proposal.update({
      where: { id: String(id) },
      data: {
        propertyId: finalPropertyId,
        clientId: finalClientId,
        value: finalValue,
        status: finalStatus,
        notes: notes !== undefined ? normalizeString(notes) : existing.notes
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.json({
      message: "Proposta atualizada com sucesso.",
      proposal
    });
  } catch (error) {
    console.error("Erro ao atualizar proposta:", error);

    return res.status(500).json({
      error: "Erro ao atualizar proposta.",
      details: error.message
    });
  }
}

async function deleteProposal(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.proposal.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Proposta não encontrada."
      });
    }

    await prisma.proposal.delete({
      where: { id: String(id) }
    });

    return res.json({
      message: "Proposta excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir proposta:", error);

    return res.status(500).json({
      error: "Erro ao excluir proposta.",
      details: error.message
    });
  }
}

module.exports = {
  createProposal,
  listProposals,
  getProposalById,
  updateProposal,
  deleteProposal
};