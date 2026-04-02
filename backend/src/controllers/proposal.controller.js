const prisma = require("../config/prisma");

async function createProposal(req, res) {
  try {
    const { propertyId, clientId, value, status, notes } = req.body;

    if (!propertyId || !clientId || value === undefined || value === null) {
      return res.status(400).json({
        error: "propertyId, clientId e value são obrigatórios."
      });
    }

    const propertyExists = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!propertyExists) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    const clientExists = await prisma.person.findUnique({
      where: { id: clientId }
    });

    if (!clientExists) {
      return res.status(404).json({
        error: "Cliente não encontrado."
      });
    }

    const proposal = await prisma.proposal.create({
      data: {
        propertyId,
        clientId,
        value: Number(value),
        status: status || "PENDENTE",
        notes: notes || null
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.status(201).json(proposal);
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return res.status(500).json({
      error: "Erro ao criar proposta."
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
      error: "Erro ao listar propostas."
    });
  }
}

async function getProposalById(req, res) {
  try {
    const { id } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
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
      error: "Erro ao buscar proposta."
    });
  }
}

async function updateProposal(req, res) {
  try {
    const { id } = req.params;
    const { propertyId, clientId, value, status, notes } = req.body;

    const existingProposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (!existingProposal) {
      return res.status(404).json({
        error: "Proposta não encontrada."
      });
    }

    if (propertyId) {
      const propertyExists = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!propertyExists) {
        return res.status(404).json({
          error: "Imóvel não encontrado."
        });
      }
    }

    if (clientId) {
      const clientExists = await prisma.person.findUnique({
        where: { id: clientId }
      });

      if (!clientExists) {
        return res.status(404).json({
          error: "Cliente não encontrado."
        });
      }
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        propertyId: propertyId !== undefined ? propertyId : existingProposal.propertyId,
        clientId: clientId !== undefined ? clientId : existingProposal.clientId,
        value:
          value !== undefined && value !== null
            ? Number(value)
            : existingProposal.value,
        status: status !== undefined ? status : existingProposal.status,
        notes: notes !== undefined ? notes : existingProposal.notes
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.json(updatedProposal);
  } catch (error) {
    console.error("Erro ao atualizar proposta:", error);
    return res.status(500).json({
      error: "Erro ao atualizar proposta."
    });
  }
}

async function deleteProposal(req, res) {
  try {
    const { id } = req.params;

    const existingProposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (!existingProposal) {
      return res.status(404).json({
        error: "Proposta não encontrada."
      });
    }

    await prisma.proposal.delete({
      where: { id }
    });

    return res.json({
      message: "Proposta excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir proposta:", error);
    return res.status(500).json({
      error: "Erro ao excluir proposta."
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