const prisma = require("../config/prisma");

const ALLOWED_ROLES = ["ADMIN", "GERENTE"];
const CAMPAIGN_STATUSES = ["RASCUNHO", "ATIVA", "PAUSADA", "FINALIZADA", "ARQUIVADA"];
const PLATFORMS = ["META_ADS", "GOOGLE_ADS", "INSTAGRAM", "FACEBOOK", "OUTRO"];

function ensureManager(req, res) {
  if (!ALLOWED_ROLES.includes(req.user?.role)) {
    res.status(403).json({ error: "Acesso permitido apenas para administrador ou gerente." });
    return false;
  }
  return true;
}

function nullableString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const campaignInclude = {
  property: {
    select: {
      id: true,
      code: true,
      title: true,
      price: true,
      district: true,
      city: true,
      coverImage: true
    }
  }
};

function buildCampaignData(body = {}) {
  const data = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) data.name = nullableString(body.name);
  if (Object.prototype.hasOwnProperty.call(body, "objective")) data.objective = nullableString(body.objective);
  if (Object.prototype.hasOwnProperty.call(body, "notes")) data.notes = nullableString(body.notes);
  if (Object.prototype.hasOwnProperty.call(body, "externalCampaignId")) data.externalCampaignId = nullableString(body.externalCampaignId);
  if (Object.prototype.hasOwnProperty.call(body, "propertyId")) data.propertyId = nullableString(body.propertyId);

  if (Object.prototype.hasOwnProperty.call(body, "platform")) {
    data.platform = PLATFORMS.includes(body.platform) ? body.platform : "OUTRO";
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (!CAMPAIGN_STATUSES.includes(body.status)) throw new Error("Status de campanha inválido.");
    data.status = body.status;
  }

  for (const field of ["budget", "spent", "revenueGenerated", "commissionGenerated"]) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = nullableNumber(body[field]) ?? 0;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "startDate")) data.startDate = parseDate(body.startDate);
  if (Object.prototype.hasOwnProperty.call(body, "endDate")) data.endDate = parseDate(body.endDate);

  return data;
}

async function listCampaigns(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    const campaigns = await prisma.marketingCampaign.findMany({
      include: campaignInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });

    const ids = campaigns.map((item) => item.id);
    const leads = ids.length
      ? await prisma.lead.findMany({
          where: { campaignId: { in: ids } },
          select: { id: true, campaignId: true, status: true }
        })
      : [];

    const metricsByCampaign = leads.reduce((acc, lead) => {
      if (!lead.campaignId) return acc;
      if (!acc[lead.campaignId]) acc[lead.campaignId] = { leads: 0, qualified: 0, visits: 0, proposals: 0, sales: 0 };
      const m = acc[lead.campaignId];
      m.leads += 1;
      if (["QUALIFICADO", "SIMULACAO", "VISITA_AGENDADA", "VISITA_REALIZADA", "PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"].includes(lead.status)) m.qualified += 1;
      if (["VISITA_AGENDADA", "VISITA_REALIZADA", "PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"].includes(lead.status)) m.visits += 1;
      if (["PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"].includes(lead.status)) m.proposals += 1;
      if (lead.status === "CONVERTIDO") m.sales += 1;
      return acc;
    }, {});

    return res.json(
      campaigns.map((campaign) => {
        const metrics = metricsByCampaign[campaign.id] || { leads: 0, qualified: 0, visits: 0, proposals: 0, sales: 0 };
        return {
          ...campaign,
          metrics: {
            ...metrics,
            cpl: metrics.leads > 0 ? campaign.spent / metrics.leads : 0,
            costPerSale: metrics.sales > 0 ? campaign.spent / metrics.sales : 0,
            roi: campaign.spent > 0 ? ((campaign.commissionGenerated - campaign.spent) / campaign.spent) * 100 : 0
          }
        };
      })
    );
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    return res.status(500).json({ error: "Erro ao listar campanhas.", details: error.message });
  }
}

async function createCampaign(req, res) {
  try {
    if (!ensureManager(req, res)) return;
    const data = buildCampaignData(req.body);

    if (!data.name) return res.status(400).json({ error: "Nome da campanha é obrigatório." });

    const campaign = await prisma.marketingCampaign.create({ data, include: campaignInclude });
    return res.status(201).json(campaign);
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return res.status(500).json({ error: "Erro ao criar campanha.", details: error.message });
  }
}

async function updateCampaign(req, res) {
  try {
    if (!ensureManager(req, res)) return;
    const data = buildCampaignData(req.body);

    const campaign = await prisma.marketingCampaign.update({
      where: { id: req.params.id },
      data,
      include: campaignInclude
    });

    return res.json(campaign);
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return res.status(500).json({ error: "Erro ao atualizar campanha.", details: error.message });
  }
}

async function deleteCampaign(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    const linkedLeads = await prisma.lead.count({ where: { campaignId: req.params.id } });
    if (linkedLeads > 0) {
      return res.status(409).json({ error: "Esta campanha possui leads vinculados. Arquive-a em vez de excluir." });
    }

    await prisma.marketingCampaign.delete({ where: { id: req.params.id } });
    return res.json({ message: "Campanha excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return res.status(500).json({ error: "Erro ao excluir campanha.", details: error.message });
  }
}

async function getTrafficDashboard(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    const campaignWhere = {};
    const leadWhere = {};

    if (startDate || endDate) {
      leadWhere.createdAt = {};
      if (startDate) leadWhere.createdAt.gte = startDate;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        leadWhere.createdAt.lte = end;
      }
    }

    const [campaigns, leads] = await Promise.all([
      prisma.marketingCampaign.findMany({ include: campaignInclude, where: campaignWhere, orderBy: { createdAt: "desc" } }),
      prisma.lead.findMany({
        where: leadWhere,
        include: {
          assignedTo: { select: { id: true, name: true } },
          property: { select: { id: true, code: true, title: true, price: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const totalSpent = campaigns.reduce((sum, item) => sum + Number(item.spent || 0), 0);
    const totalCommission = campaigns.reduce((sum, item) => sum + Number(item.commissionGenerated || 0), 0);
    const totalRevenue = campaigns.reduce((sum, item) => sum + Number(item.revenueGenerated || 0), 0);
    const qualifiedStatuses = ["QUALIFICADO", "SIMULACAO", "VISITA_AGENDADA", "VISITA_REALIZADA", "PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"];
    const visitStatuses = ["VISITA_AGENDADA", "VISITA_REALIZADA", "PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"];
    const proposalStatuses = ["PROPOSTA", "DOCUMENTACAO", "CONVERTIDO"];

    const qualified = leads.filter((l) => qualifiedStatuses.includes(l.status)).length;
    const visits = leads.filter((l) => visitStatuses.includes(l.status)).length;
    const proposals = leads.filter((l) => proposalStatuses.includes(l.status)).length;
    const sales = leads.filter((l) => l.status === "CONVERTIDO").length;

    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
    const campaignMetrics = {};

    for (const lead of leads) {
      const key = lead.campaignId || "SEM_CAMPANHA";
      if (!campaignMetrics[key]) {
        campaignMetrics[key] = { leads: 0, qualified: 0, visits: 0, proposals: 0, sales: 0 };
      }
      const m = campaignMetrics[key];
      m.leads += 1;
      if (qualifiedStatuses.includes(lead.status)) m.qualified += 1;
      if (visitStatuses.includes(lead.status)) m.visits += 1;
      if (proposalStatuses.includes(lead.status)) m.proposals += 1;
      if (lead.status === "CONVERTIDO") m.sales += 1;
    }

    const campaignRows = campaigns.map((campaign) => {
      const m = campaignMetrics[campaign.id] || { leads: 0, qualified: 0, visits: 0, proposals: 0, sales: 0 };
      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        property: campaign.property,
        spent: campaign.spent,
        commissionGenerated: campaign.commissionGenerated,
        ...m,
        cpl: m.leads > 0 ? campaign.spent / m.leads : 0,
        costPerSale: m.sales > 0 ? campaign.spent / m.sales : 0,
        conversionRate: m.leads > 0 ? (m.sales / m.leads) * 100 : 0,
        roi: campaign.spent > 0 ? ((campaign.commissionGenerated - campaign.spent) / campaign.spent) * 100 : 0
      };
    });

    const sourceMap = leads.reduce((acc, lead) => {
      const key = lead.source || "NÃO INFORMADO";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      summary: {
        spent: totalSpent,
        leads: leads.length,
        cpl: leads.length > 0 ? totalSpent / leads.length : 0,
        qualified,
        visits,
        proposals,
        sales,
        costPerSale: sales > 0 ? totalSpent / sales : 0,
        conversionRate: leads.length > 0 ? (sales / leads.length) * 100 : 0,
        revenueGenerated: totalRevenue,
        commissionGenerated: totalCommission,
        roi: totalSpent > 0 ? ((totalCommission - totalSpent) / totalSpent) * 100 : 0
      },
      funnel: {
        leads: leads.length,
        qualified,
        visits,
        proposals,
        sales
      },
      campaigns: campaignRows,
      sources: Object.entries(sourceMap)
        .map(([source, total]) => ({ source, total }))
        .sort((a, b) => b.total - a.total),
      recentLeads: leads.slice(0, 8).map((lead) => ({
        id: lead.id,
        name: lead.name,
        status: lead.status,
        source: lead.source,
        campaignId: lead.campaignId,
        campaignName: lead.campaignId ? campaignMap.get(lead.campaignId)?.name || lead.campaignName : lead.campaignName,
        assignedTo: lead.assignedTo,
        property: lead.property,
        createdAt: lead.createdAt
      }))
    });
  } catch (error) {
    console.error("Erro ao carregar Central de Tráfego:", error);
    return res.status(500).json({ error: "Erro ao carregar Central de Tráfego.", details: error.message });
  }
}

module.exports = {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getTrafficDashboard
};
