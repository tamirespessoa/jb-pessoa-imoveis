const prisma = require("../config/prisma");

async function createProperty(req, res) {
  try {
    const {
      title,
      code,
      description,
      purpose,
      type,
      price,
      condominiumFee,
      iptuValue,
      status,
      bedrooms,
      bathrooms,
      suites,
      parkingSpaces,
      builtArea,
      landArea,
      zipCode,
      street,
      number,
      district,
      city,
      state,
      ownerId
    } = req.body;

    if (!title || !code) {
      return res.status(400).json({
        error: "Título e código são obrigatórios."
      });
    }

    const property = await prisma.property.create({
      data: {
        title,
        code,
        description,
        purpose,
        type,
        price:
          price !== undefined && price !== null && price !== ""
            ? Number(price)
            : null,
        condominiumFee:
          condominiumFee !== undefined &&
          condominiumFee !== null &&
          condominiumFee !== ""
            ? Number(condominiumFee)
            : null,
        iptuValue:
          iptuValue !== undefined && iptuValue !== null && iptuValue !== ""
            ? Number(iptuValue)
            : null,
        status,
        bedrooms:
          bedrooms !== undefined && bedrooms !== null && bedrooms !== ""
            ? Number(bedrooms)
            : null,
        bathrooms:
          bathrooms !== undefined && bathrooms !== null && bathrooms !== ""
            ? Number(bathrooms)
            : null,
        suites:
          suites !== undefined && suites !== null && suites !== ""
            ? Number(suites)
            : null,
        parkingSpaces:
          parkingSpaces !== undefined &&
          parkingSpaces !== null &&
          parkingSpaces !== ""
            ? Number(parkingSpaces)
            : null,
        builtArea:
          builtArea !== undefined && builtArea !== null && builtArea !== ""
            ? Number(builtArea)
            : null,
        landArea:
          landArea !== undefined && landArea !== null && landArea !== ""
            ? Number(landArea)
            : null,
        zipCode,
        street,
        number,
        district,
        city,
        state,
        ownerId:
          ownerId !== undefined && ownerId !== null && ownerId !== ""
            ? Number(ownerId)
            : null
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
        id: "asc"
      },
      include: {
        owner: true,
        documents: true
      }
    });

    return res.json(properties);
  } catch (error) {
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
        id: Number(id)
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
      description,
      purpose,
      type,
      price,
      condominiumFee,
      iptuValue,
      status,
      bedrooms,
      bathrooms,
      suites,
      parkingSpaces,
      builtArea,
      landArea,
      zipCode,
      street,
      number,
      district,
      city,
      state,
      ownerId
    } = req.body;

    const propertyExists = await prisma.property.findUnique({
      where: { id: Number(id) }
    });

    if (!propertyExists) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    const property = await prisma.property.update({
      where: {
        id: Number(id)
      },
      data: {
        title,
        code,
        description,
        purpose,
        type,
        price:
          price !== undefined && price !== null && price !== ""
            ? Number(price)
            : null,
        condominiumFee:
          condominiumFee !== undefined &&
          condominiumFee !== null &&
          condominiumFee !== ""
            ? Number(condominiumFee)
            : null,
        iptuValue:
          iptuValue !== undefined && iptuValue !== null && iptuValue !== ""
            ? Number(iptuValue)
            : null,
        status,
        bedrooms:
          bedrooms !== undefined && bedrooms !== null && bedrooms !== ""
            ? Number(bedrooms)
            : null,
        bathrooms:
          bathrooms !== undefined && bathrooms !== null && bathrooms !== ""
            ? Number(bathrooms)
            : null,
        suites:
          suites !== undefined && suites !== null && suites !== ""
            ? Number(suites)
            : null,
        parkingSpaces:
          parkingSpaces !== undefined &&
          parkingSpaces !== null &&
          parkingSpaces !== ""
            ? Number(parkingSpaces)
            : null,
        builtArea:
          builtArea !== undefined && builtArea !== null && builtArea !== ""
            ? Number(builtArea)
            : null,
        landArea:
          landArea !== undefined && landArea !== null && landArea !== ""
            ? Number(landArea)
            : null,
        zipCode,
        street,
        number,
        district,
        city,
        state,
        ownerId:
          ownerId !== undefined && ownerId !== null && ownerId !== ""
            ? Number(ownerId)
            : null
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
      where: { id: Number(id) }
    });

    if (!propertyExists) {
      return res.status(404).json({
        error: "Imóvel não encontrado."
      });
    }

    await prisma.property.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({
      message: "Imóvel excluído com sucesso."
    });
  } catch (error) {
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