const prisma = require("../config/prisma");

function parseImages(images) {
  if (!images) return [];

  if (Array.isArray(images)) return images;

  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeType(type) {
  if (!type) return undefined;

  const value = String(type).trim().toUpperCase();

  if (value === "VENDA" || value === "SALE") return "SALE";
  if (value === "ALUGUEL" || value === "RENT") return "RENT";

  return value;
}

function getPriceRangeFilter(priceRange) {
  if (!priceRange) return undefined;

  if (priceRange === "ate-200") {
    return { gte: 1, lte: 200000 };
  }

  if (priceRange === "200-500") {
    return { gt: 200000, lte: 500000 };
  }

  if (priceRange === "500-1000") {
    return { gt: 500000, lte: 1000000 };
  }

  if (priceRange === "acima-1000") {
    return { gt: 1000000 };
  }

  return undefined;
}

function getOrderBy(sort) {
  if (sort === "menor-preco") return { price: "asc" };
  if (sort === "maior-preco") return { price: "desc" };
  if (sort === "maior-area") return { area: "desc" };
  if (sort === "a-z") return { title: "asc" };
  if (sort === "z-a") return { title: "desc" };

  return { createdAt: "desc" };
}

function mapProperty(property) {
  return {
    ...property,
    images: parseImages(property.images)
  };
}

async function createProperty(req, res) {
  try {
    const {
      title,
      description,
      price,
      type,
      address,
      street,
      number,
      complement,
      district,
      neighborhood,
      city,
      state,
      zipCode,
      rooms,
      bathrooms,
      garage,
      area,
      coverImage,
      images
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Título é obrigatório." });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: price ? Number(price) : null,
        type: normalizeType(type),
        address,
        street,
        number,
        complement,
        district,
        neighborhood,
        city,
        state,
        zipCode,
        rooms: rooms ? Number(rooms) : 0,
        bathrooms: bathrooms ? Number(bathrooms) : 0,
        garage: garage ? Number(garage) : 0,
        area: area ? Number(area) : 0,
        coverImage,
        images: JSON.stringify(Array.isArray(images) ? images : [])
      }
    });

    return res.status(201).json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao criar imóvel:", error);
    return res.status(500).json({ error: "Erro ao criar imóvel." });
  }
}

async function listProperties(req, res) {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.json(properties.map(mapProperty));
  } catch (error) {
    console.error("Erro ao listar imóveis:", error);
    return res.status(500).json({ error: "Erro ao listar imóveis." });
  }
}

async function getPropertyById(req, res) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    return res.json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao buscar imóvel:", error);
    return res.status(500).json({ error: "Erro ao buscar imóvel." });
  }
}

async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      type,
      address,
      street,
      number,
      complement,
      district,
      neighborhood,
      city,
      state,
      zipCode,
      rooms,
      bathrooms,
      garage,
      area,
      coverImage,
      images
    } = req.body;

    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        title,
        description,
        price: price !== undefined ? Number(price || 0) : undefined,
        type: type !== undefined ? normalizeType(type) : undefined,
        address,
        street,
        number,
        complement,
        district,
        neighborhood,
        city,
        state,
        zipCode,
        rooms: rooms !== undefined ? Number(rooms || 0) : undefined,
        bathrooms: bathrooms !== undefined ? Number(bathrooms || 0) : undefined,
        garage: garage !== undefined ? Number(garage || 0) : undefined,
        area: area !== undefined ? Number(area || 0) : undefined,
        coverImage,
        images:
          images !== undefined
            ? JSON.stringify(Array.isArray(images) ? images : [])
            : undefined
      }
    });

    return res.json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao atualizar imóvel:", error);
    return res.status(500).json({ error: "Erro ao atualizar imóvel." });
  }
}

async function deleteProperty(req, res) {
  try {
    const { id } = req.params;

    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    await prisma.property.delete({
      where: { id }
    });

    return res.json({ message: "Imóvel excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir imóvel:", error);
    return res.status(500).json({ error: "Erro ao excluir imóvel." });
  }
}

async function listPublicProperties(req, res) {
  try {
    const {
      search = "",
      type = "",
      city = "",
      priceRange = "",
      sort = "recentes",
      page = "1",
      limit = "9"
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 9, 1), 30);
    const skip = (currentPage - 1) * perPage;

    const normalizedType = normalizeType(type);
    const priceFilter = getPriceRangeFilter(priceRange);

    const where = {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
                { district: { contains: search, mode: "insensitive" } },
                { neighborhood: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                { street: { contains: search, mode: "insensitive" } },
                { id: { contains: search, mode: "insensitive" } }
              ]
            }
          : {},
        normalizedType ? { type: normalizedType } : {},
        city ? { city: { equals: city, mode: "insensitive" } } : {},
        priceFilter ? { price: priceFilter } : {}
      ]
    };

    const [total, properties, cityList] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: getOrderBy(sort),
        skip,
        take: perPage
      }),
      prisma.property.findMany({
        select: { city: true },
        distinct: ["city"],
        where: {
          city: {
            not: null
          }
        },
        orderBy: {
          city: "asc"
        }
      })
    ]);

    return res.json({
      data: properties.map(mapProperty),
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.max(Math.ceil(total / perPage), 1)
      },
      filters: {
        cities: cityList.map((item) => item.city).filter(Boolean)
      }
    });
  } catch (error) {
    console.error("Erro ao listar imóveis públicos:", error);
    return res
      .status(500)
      .json({ error: "Erro ao listar imóveis públicos." });
  }
}

async function getPublicPropertyById(req, res) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    return res.json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao buscar imóvel público:", error);
    return res.status(500).json({ error: "Erro ao buscar imóvel." });
  }
}

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  listPublicProperties,
  getPublicPropertyById
};