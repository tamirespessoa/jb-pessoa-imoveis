const prisma = require("../config/prisma");

// CRIAR IMÓVEL
async function createProperty(req, res) {
  try {
    const {
      title,
      description,
      type,
      purpose,
      price,
      bedrooms,
      bathrooms,
      garages,
      area,
      neighborhood,
      city,
      state,
      address,
      number,
      zipCode,
      coverImage,
      images,
      ownerId,
      isPublished
    } = req.body;

    const property = await prisma.property.create({
      data: {
        title,
        description,
        type,
        purpose,
        price: price ? Number(price) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        garages: garages ? Number(garages) : null,
        area: area ? Number(area) : null,
        neighborhood,
        city,
        state,
        address,
        number,
        zipCode,
        coverImage,
        images: images || [],
        ownerId: ownerId || null,
        isPublished: isPublished ?? true
      }
    });

    return res.status(201).json(property);
  } catch (error) {
    console.error("Erro ao criar imóvel:", error);
    return res.status(500).json({ error: "Erro ao criar imóvel." });
  }
}

// LISTAR IMÓVEIS DO SISTEMA
async function listProperties(req, res) {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(properties);
  } catch (error) {
    console.error("Erro ao listar imóveis:", error);
    return res.status(500).json({ error: "Erro ao listar imóveis." });
  }
}

// BUSCAR IMÓVEL DO SISTEMA POR ID
async function getPropertyById(req, res) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    return res.json(property);
  } catch (error) {
    console.error("Erro ao buscar imóvel:", error);
    return res.status(500).json({ error: "Erro ao buscar imóvel." });
  }
}

// ATUALIZAR IMÓVEL
async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      purpose,
      price,
      bedrooms,
      bathrooms,
      garages,
      area,
      neighborhood,
      city,
      state,
      address,
      number,
      zipCode,
      coverImage,
      images,
      ownerId,
      isPublished
    } = req.body;

    const property = await prisma.property.update({
      where: { id },
      data: {
        title,
        description,
        type,
        purpose,
        price: price !== undefined && price !== null && price !== ""
          ? Number(price)
          : null,
        bedrooms: bedrooms !== undefined && bedrooms !== null && bedrooms !== ""
          ? Number(bedrooms)
          : null,
        bathrooms: bathrooms !== undefined && bathrooms !== null && bathrooms !== ""
          ? Number(bathrooms)
          : null,
        garages: garages !== undefined && garages !== null && garages !== ""
          ? Number(garages)
          : null,
        area: area !== undefined && area !== null && area !== ""
          ? Number(area)
          : null,
        neighborhood,
        city,
        state,
        address,
        number,
        zipCode,
        coverImage,
        images: images || [],
        ownerId: ownerId || null,
        isPublished: isPublished ?? true
      }
    });

    return res.json(property);
  } catch (error) {
    console.error("Erro ao atualizar imóvel:", error);
    return res.status(500).json({ error: "Erro ao atualizar imóvel." });
  }
}

// EXCLUIR IMÓVEL
async function deleteProperty(req, res) {
  try {
    const { id } = req.params;

    await prisma.property.delete({
      where: { id }
    });

    return res.json({ message: "Imóvel excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir imóvel:", error);
    return res.status(500).json({ error: "Erro ao excluir imóvel." });
  }
}

// LISTAR IMÓVEIS PÚBLICOS
async function listPublicProperties(req, res) {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(properties);
  } catch (error) {
    console.error("Erro ao listar imóveis públicos:", error);
    return res.status(500).json({ error: "Erro ao listar imóveis públicos." });
  }
}

// BUSCAR IMÓVEL PÚBLICO POR ID
async function getPublicPropertyById(req, res) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    return res.json(property);
  } catch (error) {
    console.error("Erro ao buscar imóvel público:", error);
    return res.status(500).json({ error: "Erro ao buscar imóvel público." });
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