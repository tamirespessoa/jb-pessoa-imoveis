const prisma = require("../config/prisma");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

function normalizePage(page) {
  if (!page) return "/site";
  return String(page).slice(0, 500);
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function recordSiteVisit(req, res) {
  try {
    const {
      page,
      eventType = "PAGE_VIEW",
      propertyId,
      source,
      referrer
    } = req.body || {};

    const visit = await prisma.siteVisit.create({
      data: {
        page: normalizePage(page),
        eventType: String(eventType || "PAGE_VIEW").slice(0, 80),
        propertyId: propertyId ? String(propertyId) : null,
        source: source ? String(source).slice(0, 120) : null,
        referrer: referrer ? String(referrer).slice(0, 500) : null,
        userAgent: req.headers["user-agent"]
          ? String(req.headers["user-agent"]).slice(0, 500)
          : null,
        ip: getClientIp(req)
      }
    });

    return res.status(201).json({
      success: true,
      id: visit.id
    });
  } catch (error) {
    console.error("Erro ao registrar visita do site:", error);

    return res.status(500).json({
      error: "Erro ao registrar acesso do site.",
      details: error.message
    });
  }
}

async function getSiteVisitDashboard(req, res) {
  try {
    const today = getStartOfToday();
    const month = getStartOfMonth();

    const [
      totalVisits,
      visitsToday,
      visitsThisMonth,
      whatsappClicks,
      propertyViews,
      topPages,
      topProperties,
      topSources,
      recentVisits
    ] = await Promise.all([
      prisma.siteVisit.count(),
      prisma.siteVisit.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.siteVisit.count({
        where: {
          createdAt: {
            gte: month
          }
        }
      }),
      prisma.siteVisit.count({
        where: {
          eventType: "WHATSAPP_CLICK"
        }
      }),
      prisma.siteVisit.count({
        where: {
          eventType: "PROPERTY_VIEW"
        }
      }),
      prisma.siteVisit.groupBy({
        by: ["page"],
        _count: {
          page: true
        },
        orderBy: {
          _count: {
            page: "desc"
          }
        },
        take: 10
      }),
      prisma.siteVisit.groupBy({
        by: ["propertyId"],
        where: {
          propertyId: {
            not: null
          }
        },
        _count: {
          propertyId: true
        },
        orderBy: {
          _count: {
            propertyId: "desc"
          }
        },
        take: 10
      }),
      prisma.siteVisit.groupBy({
        by: ["source"],
        where: {
          source: {
            not: null
          }
        },
        _count: {
          source: true
        },
        orderBy: {
          _count: {
            source: "desc"
          }
        },
        take: 10
      }),
      prisma.siteVisit.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      })
    ]);

    const propertyIds = topProperties
      .map((item) => item.propertyId)
      .filter(Boolean);

    const properties = propertyIds.length
      ? await prisma.property.findMany({
          where: {
            id: {
              in: propertyIds
            }
          },
          select: {
            id: true,
            title: true,
            code: true,
            city: true,
            district: true,
            price: true
          }
        })
      : [];

    const propertyMap = new Map(
      properties.map((property) => [property.id, property])
    );

    return res.json({
      totals: {
        totalVisits,
        visitsToday,
        visitsThisMonth,
        whatsappClicks,
        propertyViews
      },
      topPages: topPages.map((item) => ({
        page: item.page,
        total: item._count.page
      })),
      topProperties: topProperties.map((item) => ({
        propertyId: item.propertyId,
        total: item._count.propertyId,
        property: propertyMap.get(item.propertyId) || null
      })),
      topSources: topSources.map((item) => ({
        source: item.source,
        total: item._count.source
      })),
      recentVisits
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard de acessos:", error);

    return res.status(500).json({
      error: "Erro ao carregar relatório de acessos.",
      details: error.message
    });
  }
}

module.exports = {
  recordSiteVisit,
  getSiteVisitDashboard
};
