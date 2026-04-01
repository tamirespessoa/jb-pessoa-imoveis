const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toFloat(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function toInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? null : number;
}

async function createProperty(req, res) {
  try {
    const {
      title,
      code,
      type,
      status,
      price,
      rentPrice,
      area,
      rooms,
      bathrooms,
      garage,
      street,
      number,
      complement,
      zipCode,
      district,
      city,
      state,
      description,
      ownerId
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        error: "Título é obrigatório."
      });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({
        error: "Código é obrigatório."
      });
    }

    if (!type || !String(type).trim()) {
      return res.status(400).json({
        error: "Tipo é obrigatório."
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        error: "Preço é obrigatório."
      });
    }

    if (area === undefined || area === null || area === "") {
      return res.status(400).json({
        error: "Área é obrigatória."
      });
    }

    if (rooms === undefined || rooms === null || rooms === "") {
      return res.status(400).json({
        error: "Quartos é obrigatório."
      });
    }

    if (bathrooms === undefined || bathrooms === null || bathrooms === "") {
      return res.status(400).json({
        error: "Banheiros é obrigatório."
      });
    }

    if (!street || !String(street).trim()) {
      return res.status(400).json({
        error: "Rua é obrigatória."
      });
    }

    if (!number || !String(number).trim()) {
      return res.status(400).json({
        error: "Número é obrigatório."
      });
    }

    if (!zipCode || !String(zipCode).trim()) {
      return res.status(400).json({
        error: "CEP é obrigatório."
      });
    }

    if (!district || !String(district).trim()) {
      return res.status(400).json({
        error: "Bairro é obrigatório."
      });
    }

    if (!city || !String(city).trim()) {
      return res.status(400).json({
        error: "Cidade é obrigatória."
      });
    }

    if (!state || !String(state).trim()) {
      return res.status(400).json({
        error: "Estado é obrigatório."
      });
    }

    if (!ownerId || !String(ownerId).trim()) {
      return res.status(400).json({
        error: "Proprietário é obrigatório."
      });
    }

    const parsedPrice = Number(price);
    const parsedArea = Number(area);
    const parsedRooms = parseInt(rooms, 10);
    const parsedBathrooms = parseInt(bathrooms, 10);

    if (Number.isNaN(parsedPrice)) {
      return res.status(400).json({
        error: "Preço inválido."
      });
    }

    if (Number.isNaN(parsedArea)) {
      return res.status(400).json({
        error: "Área inválida."
      });
    }

    if (Number.isNaN(parsedRooms)) {
      return res.status(400).json({
        error: "Quartos inválido."
      });
    }

    if (Number.isNaN(parsedBathrooms)) {
      return res.status(400).json({
        error: "Banheiros inválido."
      });
    }

    const ownerExists = await prisma.person.findUnique({
      where: {
        id: String(ownerId).trim()
      }
    });

    if (!ownerExists) {
      return res.status(400).json({
        error: "Proprietário não encontrado."
      });
    }

    const property = await prisma.property.create({
      data: {
        title: String(title).trim(),
        code: String(code).trim(),
        type: String(type).trim(),
        status: normalizeString(status) || "DISPONIVEL",
        price: parsedPrice,
        rentPrice: toFloat(rentPrice),
        area: parsedArea,
        rooms: parsedRooms,
        bathrooms: parsedBathrooms,
        garage: toInt(garage),
        street: String(street).trim(),
        number: String(number).trim(),
        complement: normalizeString(complement),
        zipCode: String(zipCode).trim(),
        district: String(district).trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        description: normalizeString(description),
        ownerId: String(ownerId).trim()
      },
      include: {
        owner: true,
        documents: true
      }
    });

    return res.status(201).json({
      message: "Imóvel cadastrado com sucesso.",
      property
    });
  } catch (error) {
    console.error("Erro ao cadastrar imóvel:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Já existe um imóvel com esse código.",
        details: error.meta
      });
    }

    return res.status(500).json({
      error: "Erro ao cadastrar imóvel.",
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
        owner: true,
        documents: true
      }
    });

    return res.json(properties);
  } catch (error) {
    console.error("Erro ao listar imóveis:", error);

    return res.status(500).json({
      error: "Erro ao listar imóveis.",
      details: error.message
    });
  }
}

async function getPropertyById(req, res) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: {
        id: String(id)
      },
      include: {
        owner: true,
        documents: true
      }
    });

    if (!property) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    return res.json(property);
  } catch (error) {
    console.error("Erro ao buscar imóvel:", error);

    return res.status(500).json({
      error: "Erro ao buscar imóvel.",
      details: error.message
    });
  }
}

async function updateProperty(req, res) {
  try {
    const { id } = req.params;

    const {
      title,
      code,
      type,
      status,
      price,
      rentPrice,
      area,
      rooms,
      bathrooms,
      garage,
      street,
      number,
      complement,
      zipCode,
      district,
      city,
      state,
      description,
      ownerId
    } = req.body;

    const propertyExists = await prisma.property.findUnique({
      where: { id: String(id) }
    });

    if (!propertyExists) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    let finalOwnerId = propertyExists.ownerId;

    if (ownerId !== undefined) {
      if (!ownerId || !String(ownerId).trim()) {
        return res.status(400).json({
          error: "Proprietário é obrigatório."
        });
      }

      const ownerExists = await prisma.person.findUnique({
        where: {
          id: String(ownerId).trim()
        }
      });

      if (!ownerExists) {
        return res.status(400).json({
          error: "Proprietário não encontrado."
        });
      }

      finalOwnerId = String(ownerId).trim();
    }

    const property = await prisma.property.update({
      where: {
        id: String(id)
      },
      data: {
        title:
          title !== undefined ? String(title).trim() : propertyExists.title,
        code: code !== undefined ? String(code).trim() : propertyExists.code,
        type: type !== undefined ? String(type).trim() : propertyExists.type,
        status:
          status !== undefined
            ? normalizeString(status) || "DISPONIVEL"
            : propertyExists.status,
        price:
          price !== undefined ? Number(price) : propertyExists.price,
        rentPrice:
          rentPrice !== undefined
            ? toFloat(rentPrice)
            : propertyExists.rentPrice,
        area: area !== undefined ? Number(area) : propertyExists.area,
        rooms:
          rooms !== undefined ? parseInt(rooms, 10) : propertyExists.rooms,
        bathrooms:
          bathrooms !== undefined
            ? parseInt(bathrooms, 10)
            : propertyExists.bathrooms,
        garage:
          garage !== undefined ? toInt(garage) : propertyExists.garage,
        street:
          street !== undefined ? String(street).trim() : propertyExists.street,
        number:
          number !== undefined ? String(number).trim() : propertyExists.number,
        complement:
          complement !== undefined
            ? normalizeString(complement)
            : propertyExists.complement,
        zipCode:
          zipCode !== undefined
            ? String(zipCode).trim()
            : propertyExists.zipCode,
        district:
          district !== undefined
            ? String(district).trim()
            : propertyExists.district,
        city:
          city !== undefined ? String(city).trim() : propertyExists.city,
        state:
          state !== undefined ? String(state).trim() : propertyExists.state,
        description:
          description !== undefined
            ? normalizeString(description)
            : propertyExists.description,
        ownerId: finalOwnerId
      },
      include: {
        owner: true,
        documents: true
      }
    });

    return res.json({
      message: "Imóvel atualizado com sucesso.",
      property
    });
  } catch (error) {
    console.error("Erro ao atualizar imóvel:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Já existe um imóvel com esse código.",
        details: error.meta
      });
    }

    return res.status(500).json({
      error: "Erro ao atualizar imóvel.",
      details: error.message
    });
  }
}

async function deleteProperty(req, res) {
  try {
    const { id } = req.params;

    const propertyExists = await prisma.property.findUnique({
      where: { id: String(id) }
    });

    if (!propertyExists) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    await prisma.property.delete({
      where: {
        id: String(id)
      }
    });

    return res.json({
      message: "Imóvel excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir imóvel:", error);

    return res.status(500).json({
      error: "Erro ao excluir imóvel.",
      details: error.message
    });
  }
}

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};