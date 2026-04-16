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
  if (!type) return "";

  return String(type).trim();
}

function normalizeStatus(status) {
  if (!status) return "DISPONIVEL";

  const value = String(status).trim().toUpperCase();

  if (value === "DISPONIVEL") return "DISPONIVEL";
  if (value === "RESERVADO") return "RESERVADO";
  if (value === "EM_ANALISE") return "EM_ANALISE";

  return "DISPONIVEL";
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
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
  const images = parseImages(property.images);

  return {
    ...property,
    images,
    featured: false,
    bedrooms: property.rooms ?? 0,
    garageSpots: property.garage ?? 0,
    cep: property.zipCode ?? "",
    neighborhood: property.district ?? "",
    address: `${property.street || ""}, ${property.number || ""}`
      .trim()
      .replace(/^,\s*/, ""),
    coverImage: images.length ? images[0] : null
  };
}

async function createProperty(req, res) {
  try {
    const {
      title,
      code,
      description,
      price,
      rentPrice,
      type,
      status,
      street,
      number,
      complement,
      district,
      neighborhood,
      city,
      state,
      zipCode,
      cep,
      rooms,
      bedrooms,
      bathrooms,
      garage,
      garageSpots,
      area,
      images,
      ownerId
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Título é obrigatório." });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: "Código é obrigatório." });
    }

    if (!type || !String(type).trim()) {
      return res.status(400).json({ error: "Tipo é obrigatório." });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({ error: "Preço é obrigatório." });
    }

    if (area === undefined || area === null || area === "") {
      return res.status(400).json({ error: "Área é obrigatória." });
    }

    if (
      (rooms === undefined || rooms === null || rooms === "") &&
      (bedrooms === undefined || bedrooms === null || bedrooms === "")
    ) {
      return res
        .status(400)
        .json({ error: "Quantidade de quartos é obrigatória." });
    }

    if (bathrooms === undefined || bathrooms === null || bathrooms === "") {
      return res
        .status(400)
        .json({ error: "Quantidade de banheiros é obrigatória." });
    }

    if (!street || !String(street).trim()) {
      return res.status(400).json({ error: "Rua é obrigatória." });
    }

    if (!number || !String(number).trim()) {
      return res.status(400).json({ error: "Número é obrigatório." });
    }

    if (!(zipCode || cep) || !String(zipCode || cep).trim()) {
      return res.status(400).json({ error: "CEP é obrigatório." });
    }

    if (!(district || neighborhood) || !String(district || neighborhood).trim()) {
      return res.status(400).json({ error: "Bairro é obrigatório." });
    }

    if (!city || !String(city).trim()) {
      return res.status(400).json({ error: "Cidade é obrigatória." });
    }

    if (!state || !String(state).trim()) {
      return res.status(400).json({ error: "Estado é obrigatório." });
    }

    if (!ownerId || !String(ownerId).trim()) {
      return res.status(400).json({ error: "Proprietário é obrigatório." });
    }

    const ownerExists = await prisma.person.findUnique({
      where: { id: String(ownerId).trim() }
    });

    if (!ownerExists) {
      return res.status(400).json({ error: "Proprietário não encontrado." });
    }

    const property = await prisma.property.create({
      data: {
        title: String(title).trim(),
        code: String(code).trim(),
        description: description ? String(description).trim() : null,
        price: Number(price),
        rentPrice: toNullableNumber(rentPrice),
        type: normalizeType(type),
        status: normalizeStatus(status),
        street: String(street).trim(),
        number: String(number).trim(),
        complement: complement ? String(complement).trim() : null,
        district: String(district || neighborhood).trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        zipCode: String(zipCode || cep).trim(),
        rooms: Number(rooms ?? bedrooms),
        bathrooms: Number(bathrooms),
        garage: toNullableNumber(garage ?? garageSpots),
        area: Number(area),
        ownerId: String(ownerId).trim(),
        images: Array.isArray(images) ? images : []
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return res.status(201).json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao criar imóvel:", error);
    return res.status(500).json({
      error: "Erro ao criar imóvel.",
      details: error.message
    });
  }
}

async function listProperties(req, res) {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
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
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
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
      code,
      description,
      price,
      rentPrice,
      type,
      status,
      street,
      number,
      complement,
      district,
      neighborhood,
      city,
      state,
      zipCode,
      cep,
      rooms,
      bedrooms,
      bathrooms,
      garage,
      garageSpots,
      area,
      images,
      ownerId
    } = req.body;

    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    if (ownerId !== undefined && ownerId !== null && ownerId !== "") {
      const ownerExists = await prisma.person.findUnique({
        where: { id: String(ownerId).trim() }
      });

      if (!ownerExists) {
        return res.status(400).json({ error: "Proprietário não encontrado." });
      }
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        code: code !== undefined ? String(code).trim() : undefined,
        description:
          description !== undefined
            ? description
              ? String(description).trim()
              : null
            : undefined,
        price: price !== undefined ? Number(price) : undefined,
        rentPrice:
          rentPrice !== undefined ? toNullableNumber(rentPrice) : undefined,
        type: type !== undefined ? normalizeType(type) : undefined,
        status: status !== undefined ? normalizeStatus(status) : undefined,
        street: street !== undefined ? String(street).trim() : undefined,
        number: number !== undefined ? String(number).trim() : undefined,
        complement:
          complement !== undefined
            ? complement
              ? String(complement).trim()
              : null
            : undefined,
        district:
          district !== undefined
            ? district
              ? String(district).trim()
              : null
            : neighborhood !== undefined
              ? neighborhood
                ? String(neighborhood).trim()
                : null
              : undefined,
        city:
          city !== undefined
            ? city
              ? String(city).trim()
              : null
            : undefined,
        state:
          state !== undefined
            ? state
              ? String(state).trim()
              : null
            : undefined,
        zipCode:
          zipCode !== undefined
            ? zipCode
              ? String(zipCode).trim()
              : null
            : cep !== undefined
              ? cep
                ? String(cep).trim()
                : null
              : undefined,
        rooms:
          rooms !== undefined || bedrooms !== undefined
            ? Number(rooms ?? bedrooms)
            : undefined,
        bathrooms:
          bathrooms !== undefined ? Number(bathrooms) : undefined,
        garage:
          garage !== undefined || garageSpots !== undefined
            ? toNullableNumber(garage ?? garageSpots)
            : undefined,
        area: area !== undefined ? Number(area) : undefined,
        ownerId:
          ownerId !== undefined && ownerId !== null && ownerId !== ""
            ? String(ownerId).trim()
            : undefined,
        images:
          images !== undefined
            ? Array.isArray(images)
              ? images
              : []
            : undefined
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return res.json(mapProperty(property));
  } catch (error) {
    console.error("Erro ao atualizar imóvel:", error);
    return res.status(500).json({
      error: "Erro ao atualizar imóvel.",
      details: error.message
    });
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

    const andFilters = [{ status: "DISPONIVEL" }];

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
          { district: { contains: search, mode: "insensitive" } },
          { street: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    if (normalizedType) {
      andFilters.push({
        type: { equals: normalizedType, mode: "insensitive" }
      });
    }

    if (city) {
      andFilters.push({
        city: { equals: city, mode: "insensitive" }
      });
    }

    if (priceFilter) {
      andFilters.push({
        price: priceFilter
      });
    }

    const where = {
      AND: andFilters
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
          status: "DISPONIVEL",
          NOT: [{ city: "" }]
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
    return res.status(500).json({
      error: "Erro ao listar imóveis públicos."
    });
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

    if (property.status && property.status !== "DISPONIVEL") {
      return res.status(404).json({ error: "Imóvel não disponível." });
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