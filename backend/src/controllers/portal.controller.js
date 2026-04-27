const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function formatDateBR(date) {
  if (!date) return "Não atualizado";

  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function listPortals(req, res) {
  try {
    // 🔥 BUSCAR IMÓVEIS REAIS
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalProperties = properties.length;

    // 🔥 PUBLICADOS NO SITE (DISPONÍVEL)
    const publishedOnSite = properties.filter((property) => {
      if (!property.status) return true;
      return String(property.status).toUpperCase() === "DISPONIVEL";
    }).length;

    // 🔥 PUBLICADOS NOS PORTAIS (NOVO CAMPO)
    const publishedOnPortals = properties.filter(
      (property) => property.publishOnPortals === true
    ).length;

    // 🔥 DESTAQUES
    const highlightedProperties = properties.filter(
      (property) => property.highlightOnPortals === true
    ).length;

    // 🔥 NÃO PUBLICADOS
    const notPublished = totalProperties - publishedOnPortals;

    // 🔥 ÚLTIMA ATUALIZAÇÃO REAL
    const lastProperty = properties[0];
    const baseLastUpdate =
      lastProperty?.updatedAt || lastProperty?.createdAt || null;

    // 🔥 LISTA DE PORTAIS
    const portals = [
      {
        id: 1,
        name: "123i",
        icon: "🌐",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 2,
        name: "All in Storage",
        icon: "🌐",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 3,
        name: "Ape 11",
        icon: "🏠",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 4,
        name: "Buskaza",
        icon: "⚠️",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 5,
        name: "Chaves na Mão",
        icon: "🔑",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 6,
        name: "Facebook Marketplace",
        icon: "📘",
        active: false,
        sentProperties: 0,
        highlights: 0,
        lastUpdate: "Não configurado"
      },
      {
        id: 7,
        name: "Imovelweb",
        icon: "🏢",
        active: true,
        sentProperties: publishedOnPortals,
        highlights: highlightedProperties,
        lastUpdate: formatDateBR(baseLastUpdate)
      },
      {
        id: 8,
        name: "VivaReal",
        icon: "⭐",
        active: false,
        sentProperties: 0,
        highlights: 0,
        lastUpdate: "Não configurado"
      }
    ];

    return res.json({
      summary: {
        activePortals: portals.filter((p) => p.active).length,
        publishedOnSite,
        publishedOnPortals,
        notPublished
      },
      portals
    });
  } catch (error) {
    console.error("Erro ao listar portais:", error);

    return res.status(500).json({
      error: "Erro ao carregar portais",
      details: error.message
    });
  }
}

module.exports = {
  listPortals
};