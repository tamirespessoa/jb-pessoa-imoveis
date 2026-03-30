const prisma = require("../config/prisma");

async function createProposal(req, res) {
  try {
    const { propertyId, clientId, value, status, notes } = req.body;
    const proposal = await prisma.proposal.create({
      data: {
        propertyId,
        clientId,
        value,
        status: status || "PENDENTE",
        notes: notes || ""
      }
    });
    return res.status(201).json(proposal);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar proposta", details: error.message });
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
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar propostas", details: error.message });
  }
}

async function getProposalById(req, res) {
  try {
    const { id } = req.params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { property: true, client: true }
    });
    if (!proposal) return res.status(404).json({ error: "Proposta não encontrada" });
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar proposta", details: error.message });
  }
}

async function updateProposal(req, res) {
  try {
    const { id } = req.params;
    const { propertyId, clientId, value, status, notes } = req.body;
    const proposal = await prisma.proposal.update({
      where: { id },
      data: { propertyId, clientId, value, status, notes }
    });
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: "Erro ao editar proposta", details: error.message });
  }
}

async function deleteProposal(req, res) {
  try {
    const { id } = req.params;
    await prisma.proposal.delete({ where: { id } });
    res.json({ message: "Proposta excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir proposta", details: error.message });
  }
}

module.exports = {
  createProposal,
  listProposals,
  getProposalById,
  updateProposal,
  deleteProposal
};