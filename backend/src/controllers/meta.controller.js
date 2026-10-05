const prisma = require("../config/prisma");

function normalizeFieldData(fieldData = []) {
  const result = {};

  for (const field of fieldData) {
    const key = String(field.name || "").toLowerCase();
    const value = Array.isArray(field.values)
      ? field.values.join(", ")
      : field.values;

    result[key] = value;
  }

  return result;
}

function pickField(fields, possibleNames = []) {
  for (const name of possibleNames) {
    if (fields[name] !== undefined && fields[name] !== null) {
      return fields[name];
    }
  }

  return null;
}

async function getAvailableBrokers() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["CORRETOR", "ADMIN"]
      },
      online: true,
      active: true
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
}

async function getNextBrokerByRotation() {
  const onlineBrokers = await getAvailableBrokers();

  if (onlineBrokers.length === 0) {
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

  let selectedBroker;

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

async function verifyWebhook(req, res) {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === process.env.META_VERIFY_TOKEN
    ) {
      console.log("Webhook Meta verificado com sucesso.");
      return res.status(200).send(challenge);
    }

    console.warn("Falha na verificação do webhook Meta.");

    return res.sendStatus(403);
  } catch (error) {
    console.error("Erro ao verificar webhook Meta:", error);
    return res.sendStatus(500);
  }
}

async function fetchLeadFromMeta(leadgenId) {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION;

  if (!accessToken) {
    throw new Error("META_PAGE_ACCESS_TOKEN não configurado.");
  }

  if (!graphVersion) {
    throw new Error("META_GRAPH_VERSION não configurado.");
  }

  const fields = [
    "id",
    "created_time",
    "ad_id",
    "ad_name",
    "adset_id",
    "adset_name",
    "campaign_id",
    "campaign_name",
    "form_id",
    "field_data"
  ].join(",");

  const url =
    `https://graph.facebook.com/${graphVersion}/${leadgenId}` +
    `?fields=${encodeURIComponent(fields)}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro retornado pela Meta:", data);

    throw new Error(
      data?.error?.message ||
        "Erro ao buscar dados do lead na Meta."
    );
  }

  return data;
}

async function findLocalCampaign(metaCampaignId, campaignName) {
  if (!metaCampaignId && !campaignName) {
    return null;
  }

  try {
    if (metaCampaignId) {
      const byExternalId = await prisma.marketingCampaign.findFirst({
        where: {
          externalCampaignId: String(metaCampaignId)
        }
      });

      if (byExternalId) {
        return byExternalId;
      }
    }

    if (campaignName) {
      const byName = await prisma.marketingCampaign.findFirst({
        where: {
          name: campaignName
        }
      });

      if (byName) {
        return byName;
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao localizar campanha local:", error);
    return null;
  }
}

async function processMetaLead(leadgenId) {
  const existingLead = await prisma.lead.findFirst({
    where: {
      metaLeadId: String(leadgenId)
    }
  });

  if (existingLead) {
    console.log(
      `Lead Meta ${leadgenId} já existe no CRM. Ignorando duplicidade.`
    );

    return existingLead;
  }

  const metaLead = await fetchLeadFromMeta(leadgenId);

  const fields = normalizeFieldData(metaLead.field_data || []);

  const name =
    pickField(fields, [
      "full_name",
      "nome_completo",
      "name",
      "nome"
    ]) || "Lead Meta";

  const phone = pickField(fields, [
    "phone_number",
    "telefone",
    "phone",
    "whatsapp"
  ]);

  const email = pickField(fields, [
    "email",
    "email_address"
  ]);

  const desiredRegion = pickField(fields, [
    "bairro",
    "regiao",
    "região",
    "desired_region"
  ]);

  const desiredCity = pickField(fields, [
    "cidade",
    "city"
  ]);

  const monthlyIncomeRaw = pickField(fields, [
    "renda",
    "renda_mensal",
    "monthly_income"
  ]);

  const downPaymentRaw = pickField(fields, [
    "entrada",
    "valor_entrada",
    "down_payment"
  ]);

  const broker = await getNextBrokerByRotation();

  const localCampaign = await findLocalCampaign(
    metaLead.campaign_id,
    metaLead.campaign_name
  );

  const monthlyIncome = monthlyIncomeRaw
    ? Number(
        String(monthlyIncomeRaw)
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      )
    : null;

  const downPayment = downPaymentRaw
    ? Number(
        String(downPaymentRaw)
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      )
    : null;

  const leadData = {
    name: String(name).trim(),
    phone: phone ? String(phone).trim() : null,
    email: email ? String(email).trim() : null,

    source: "META_LEAD_ADS",
    sourceDetail: "Facebook / Instagram Lead Ads",

    status: "NOVO",
    temperature: "FRIO",

    monthlyIncome:
      Number.isFinite(monthlyIncome) ? monthlyIncome : null,

    downPayment:
      Number.isFinite(downPayment) ? downPayment : null,

    desiredRegion: desiredRegion || null,
    desiredCity: desiredCity || null,

    campaignId: localCampaign?.id || null,
    campaignName:
      localCampaign?.name ||
      metaLead.campaign_name ||
      null,

    adSetId: metaLead.adset_id || null,
    adSetName: metaLead.adset_name || null,

    adId: metaLead.ad_id || null,
    adName: metaLead.ad_name || null,

    metaLeadId: metaLead.id || String(leadgenId),
    metaCampaignId: metaLead.campaign_id || null,
    metaAdSetId: metaLead.adset_id || null,
    metaAdId: metaLead.ad_id || null,

    assignedToId: broker?.id || null
  };

  const createdLead = await prisma.lead.create({
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

  console.log(
    `Lead Meta ${createdLead.id} criado com sucesso.`,
    {
      metaLeadId: createdLead.metaLeadId,
      campaign: createdLead.campaignName,
      broker: createdLead.assignedTo?.name || null
    }
  );

  return createdLead;
}

async function receiveWebhook(req, res) {
  try {
    /*
      É importante responder rapidamente à Meta.
      Primeiro confirmamos o recebimento e depois processamos.
    */
    res.sendStatus(200);

    const body = req.body;

    if (!body || body.object !== "page") {
      return;
    }

    const entries = Array.isArray(body.entry)
      ? body.entry
      : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes)
        ? entry.changes
        : [];

      for (const change of changes) {
        if (change.field !== "leadgen") {
          continue;
        }

        const value = change.value || {};
        const leadgenId = value.leadgen_id;

        if (!leadgenId) {
          console.warn(
            "Webhook leadgen recebido sem leadgen_id.",
            value
          );
          continue;
        }

        try {
          await processMetaLead(leadgenId);
        } catch (error) {
          console.error(
            `Erro ao processar lead Meta ${leadgenId}:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error("Erro geral no webhook Meta:", error);
  }
}

async function testMetaIntegration(req, res) {
  try {
    return res.json({
      ok: true,
      message: "Rota de integração Meta ativa.",
      configured: {
        verifyToken: Boolean(process.env.META_VERIFY_TOKEN),
        accessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
        graphVersion: Boolean(process.env.META_GRAPH_VERSION)
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao testar integração Meta.",
      details: error.message
    });
  }
}

module.exports = {
  verifyWebhook,
  receiveWebhook,
  testMetaIntegration
};