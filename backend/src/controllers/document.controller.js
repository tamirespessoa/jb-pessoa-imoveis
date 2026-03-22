const prisma = require("../config/prisma");

async function uploadDocument(req, res) {
  try {
    const { title, type, personId, propertyId } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        error: "Título e tipo do documento são obrigatórios."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo foi enviado."
      });
    }

    const document = await prisma.document.create({
      data: {
        title,
        type,
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        personId: personId ? Number(personId) : null,
        propertyId: propertyId ? Number(propertyId) : null
      }
    });

    return res.status(201).json({
      message: "Documento enviado com sucesso.",
      document
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao enviar documento.",
      details: error.message
    });
  }
}

async function listDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        id: "asc"
      },
      include: {
        person: true,
        property: true
      }
    });

    return res.json(documents);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao listar documentos.",
      details: error.message
    });
  }
}

module.exports = {
  uploadDocument,
  listDocuments
};