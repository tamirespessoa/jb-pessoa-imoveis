const prisma = require("../config/prisma");
const fs = require("fs");
const path = require("path");

async function getDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      include: {
        person: true,
        property: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(documents);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return res.status(500).json({
      error: "Erro ao buscar documentos.",
      details: error.message
    });
  }
}

async function createDocument(req, res) {
  try {
    const body = req.body || {};
    const { title, type, personId, propertyId } = body;

    if (!title || !type) {
      return res.status(400).json({
        error: "Título e tipo são obrigatórios."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Selecione um arquivo."
      });
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        type,
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        personId: personId || null,
        propertyId: propertyId || null
      },
      include: {
        person: true,
        property: true
      }
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error("Erro ao criar documento:", error);
    return res.status(500).json({
      error: "Erro ao criar documento.",
      details: error.message
    });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    const existingDocument = await prisma.document.findUnique({
      where: { id }
    });

    if (!existingDocument) {
      return res.status(404).json({
        error: "Documento não encontrado."
      });
    }

    if (existingDocument.filePath) {
      const fileName = existingDocument.filePath.replace("/uploads/", "");
      const absolutePath = path.join(__dirname, "../../uploads", fileName);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await prisma.document.delete({
      where: { id }
    });

    return res.json({
      message: "Documento excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return res.status(500).json({
      error: "Erro ao excluir documento.",
      details: error.message
    });
  }
}

module.exports = {
  getDocuments,
  createDocument,
  deleteDocument
};