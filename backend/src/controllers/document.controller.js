const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? null : number;
}

async function createDocument(req, res) {
  try {
    const {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      personId,
      propertyId
    } = req.body;

    if (!fileName || !String(fileName).trim()) {
      return res.status(400).json({ error: "Nome do arquivo é obrigatório." });
    }

    if (!fileUrl || !String(fileUrl).trim()) {
      return res.status(400).json({ error: "URL do arquivo é obrigatória." });
    }

    if (!fileType || !String(fileType).trim()) {
      return res.status(400).json({ error: "Tipo do arquivo é obrigatório." });
    }

    if (fileSize === undefined || fileSize === null || fileSize === "") {
      return res.status(400).json({ error: "Tamanho do arquivo é obrigatório." });
    }

    if (!personId && !propertyId) {
      return res.status(400).json({
        error: "Vincule o documento a um cliente/proprietário ou a um imóvel."
      });
    }

    let finalPersonId = null;
    let finalPropertyId = null;

    if (personId) {
      const personExists = await prisma.person.findUnique({
        where: { id: String(personId).trim() }
      });

      if (!personExists) {
        return res.status(400).json({ error: "Pessoa não encontrada." });
      }

      finalPersonId = String(personId).trim();
    }

    if (propertyId) {
      const propertyExists = await prisma.property.findUnique({
        where: { id: String(propertyId).trim() }
      });

      if (!propertyExists) {
        return res.status(400).json({ error: "Imóvel não encontrado." });
      }

      finalPropertyId = String(propertyId).trim();
    }

    const document = await prisma.document.create({
      data: {
        fileName: String(fileName).trim(),
        fileUrl: String(fileUrl).trim(),
        fileType: String(fileType).trim(),
        fileSize: toInt(fileSize),
        personId: finalPersonId,
        propertyId: finalPropertyId
      },
      include: {
        person: true,
        property: true
      }
    });

    return res.status(201).json({
      message: "Documento cadastrado com sucesso.",
      document
    });
  } catch (error) {
    console.error("Erro ao cadastrar documento:", error);
    return res.status(500).json({
      error: "Erro ao cadastrar documento.",
      details: error.message
    });
  }
}

async function listDocuments(req, res) {
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
    console.error("Erro ao listar documentos:", error);
    return res.status(500).json({
      error: "Erro ao listar documentos.",
      details: error.message
    });
  }
}

async function getDocumentById(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        person: true,
        property: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    return res.json(document);
  } catch (error) {
    console.error("Erro ao buscar documento:", error);
    return res.status(500).json({
      error: "Erro ao buscar documento.",
      details: error.message
    });
  }
}

async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      personId,
      propertyId
    } = req.body;

    const existing = await prisma.document.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    let finalPersonId = existing.personId;
    let finalPropertyId = existing.propertyId;

    if (personId !== undefined) {
      if (personId === null || personId === "") {
        finalPersonId = null;
      } else {
        const personExists = await prisma.person.findUnique({
          where: { id: String(personId).trim() }
        });

        if (!personExists) {
          return res.status(400).json({ error: "Pessoa não encontrada." });
        }

        finalPersonId = String(personId).trim();
      }
    }

    if (propertyId !== undefined) {
      if (propertyId === null || propertyId === "") {
        finalPropertyId = null;
      } else {
        const propertyExists = await prisma.property.findUnique({
          where: { id: String(propertyId).trim() }
        });

        if (!propertyExists) {
          return res.status(400).json({ error: "Imóvel não encontrado." });
        }

        finalPropertyId = String(propertyId).trim();
      }
    }

    if (!finalPersonId && !finalPropertyId) {
      return res.status(400).json({
        error: "Vincule o documento a um cliente/proprietário ou a um imóvel."
      });
    }

    const document = await prisma.document.update({
      where: { id: String(id) },
      data: {
        fileName: fileName !== undefined ? String(fileName).trim() : existing.fileName,
        fileUrl: fileUrl !== undefined ? String(fileUrl).trim() : existing.fileUrl,
        fileType: fileType !== undefined ? String(fileType).trim() : existing.fileType,
        fileSize: fileSize !== undefined ? toInt(fileSize) : existing.fileSize,
        personId: finalPersonId,
        propertyId: finalPropertyId
      },
      include: {
        person: true,
        property: true
      }
    });

    return res.json({
      message: "Documento atualizado com sucesso.",
      document
    });
  } catch (error) {
    console.error("Erro ao atualizar documento:", error);
    return res.status(500).json({
      error: "Erro ao atualizar documento.",
      details: error.message
    });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.document.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    await prisma.document.delete({
      where: { id: String(id) }
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
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
};