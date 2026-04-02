const prisma = require("../config/prisma");

async function listPropertyRequests(req, res) {
  try {
    const requests = await prisma.propertyRequest.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(requests);
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    return res.status(500).json({
      error: "Erro ao listar solicitações."
    });
  }
}

async function createPropertyRequest(req, res) {
  try {
    const {
      ownerName,
      phone,
      whatsapp,
      email,
      propertyType,
      purpose,
      city,
      neighborhood,
      address,
      bedrooms,
      bathrooms,
      parkingSpots,
      area,
      price,
      description,
      status
    } = req.body;

    if (
      !ownerName ||
      !phone ||
      !email ||
      !propertyType ||
      !purpose ||
      !city ||
      !neighborhood
    ) {
      return res.status(400).json({
        error:
          "ownerName, phone, email, propertyType, purpose, city e neighborhood são obrigatórios."
      });
    }

    const request = await prisma.propertyRequest.create({
      data: {
        ownerName,
        phone,
        whatsapp: whatsapp || null,
        email,
        propertyType,
        purpose,
        city,
        neighborhood,
        address: address || null,
        bedrooms:
          bedrooms !== undefined && bedrooms !== null && bedrooms !== ""
            ? Number(bedrooms)
            : null,
        bathrooms:
          bathrooms !== undefined && bathrooms !== null && bathrooms !== ""
            ? Number(bathrooms)
            : null,
        parkingSpots:
          parkingSpots !== undefined &&
          parkingSpots !== null &&
          parkingSpots !== ""
            ? Number(parkingSpots)
            : null,
        area:
          area !== undefined && area !== null && area !== ""
            ? Number(area)
            : null,
        price: price || null,
        description: description || null,
        status: status || "PENDENTE"
      }
    });

    return res.status(201).json(request);
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    return res.status(500).json({
      error: "Erro ao criar solicitação."
    });
  }
}

async function updatePropertyRequest(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingRequest = await prisma.propertyRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: "Solicitação não encontrada."
      });
    }

    const updatedRequest = await prisma.propertyRequest.update({
      where: { id },
      data: {
        ownerName:
          data.ownerName !== undefined
            ? data.ownerName
            : existingRequest.ownerName,
        phone: data.phone !== undefined ? data.phone : existingRequest.phone,
        whatsapp:
          data.whatsapp !== undefined
            ? data.whatsapp
            : existingRequest.whatsapp,
        email: data.email !== undefined ? data.email : existingRequest.email,
        propertyType:
          data.propertyType !== undefined
            ? data.propertyType
            : existingRequest.propertyType,
        purpose:
          data.purpose !== undefined ? data.purpose : existingRequest.purpose,
        city: data.city !== undefined ? data.city : existingRequest.city,
        neighborhood:
          data.neighborhood !== undefined
            ? data.neighborhood
            : existingRequest.neighborhood,
        address:
          data.address !== undefined ? data.address : existingRequest.address,
        bedrooms:
          data.bedrooms !== undefined
            ? data.bedrooms === "" || data.bedrooms === null
              ? null
              : Number(data.bedrooms)
            : existingRequest.bedrooms,
        bathrooms:
          data.bathrooms !== undefined
            ? data.bathrooms === "" || data.bathrooms === null
              ? null
              : Number(data.bathrooms)
            : existingRequest.bathrooms,
        parkingSpots:
          data.parkingSpots !== undefined
            ? data.parkingSpots === "" || data.parkingSpots === null
              ? null
              : Number(data.parkingSpots)
            : existingRequest.parkingSpots,
        area:
          data.area !== undefined
            ? data.area === "" || data.area === null
              ? null
              : Number(data.area)
            : existingRequest.area,
        price: data.price !== undefined ? data.price : existingRequest.price,
        description:
          data.description !== undefined
            ? data.description
            : existingRequest.description,
        status: data.status !== undefined ? data.status : existingRequest.status
      }
    });

    return res.json(updatedRequest);
  } catch (error) {
    console.error("Erro ao atualizar solicitação:", error);
    return res.status(500).json({
      error: "Erro ao atualizar solicitação."
    });
  }
}

async function deletePropertyRequest(req, res) {
  try {
    const { id } = req.params;

    const existingRequest = await prisma.propertyRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: "Solicitação não encontrada."
      });
    }

    await prisma.propertyRequest.delete({
      where: { id }
    });

    return res.json({
      message: "Solicitação excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error);
    return res.status(500).json({
      error: "Erro ao excluir solicitação."
    });
  }
}

module.exports = {
  listPropertyRequests,
  createPropertyRequest,
  updatePropertyRequest,
  deletePropertyRequest
};