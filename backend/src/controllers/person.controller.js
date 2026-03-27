const prisma = require("../config/prisma");

async function createPerson(req, res) {
  try {
    const {
      type,
      fullName,
      cpf,
      rg,
      email,
      phone,
      company,
      commercialPhone,
      residentialPhone,
      contactPhone,
      whatsapp
    } = req.body;

    if (!type || !fullName) {
      return res.status(400).json({
        error: "Tipo e nome completo são obrigatórios."
      });
    }

    const person = await prisma.person.create({
      data: {
        type,
        fullName,
        cpf,
        rg,
        email,
        phone,
        company,
        commercialPhone,
        residentialPhone,
        contactPhone,
        whatsapp
      }
    });

    return res.status(201).json({
      message: "Pessoa cadastrada com sucesso.",
      person
    });
  } catch (error) {
    console.error("Erro em createPerson:", error);
    return res.status(500).json({
      error: "Erro ao cadastrar pessoa.",
      details: error.message
    });
  }
}

async function listPersons(req, res) {
  try {
    const persons = await prisma.person.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        documents: true,
        properties: true,
        clientAppointments: true
      }
    });

    return res.json(persons);
  } catch (error) {
    console.error("Erro em listPersons:", error);
    return res.status(500).json({
      error: "Erro ao listar pessoas.",
      details: error.message
    });
  }
}

async function getPersonById(req, res) {
  try {
    const { id } = req.params;

    const person = await prisma.person.findUnique({
      where: {
        id: id
      },
      include: {
        documents: true,
        properties: true,
        clientAppointments: true
      }
    });

    if (!person) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    return res.json(person);
  } catch (error) {
    console.error("Erro em getPersonById:", error);
    return res.status(500).json({
      error: "Erro ao buscar pessoa.",
      details: error.message
    });
  }
}

async function updatePerson(req, res) {
  try {
    const { id } = req.params;

    const {
      type,
      fullName,
      cpf,
      rg,
      email,
      phone,
      company,
      commercialPhone,
      residentialPhone,
      contactPhone,
      whatsapp
    } = req.body;

    const personExists = await prisma.person.findUnique({
      where: { id: id }
    });

    if (!personExists) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    const person = await prisma.person.update({
      where: {
        id: id
      },
      data: {
        type,
        fullName,
        cpf,
        rg,
        email,
        phone,
        company,
        commercialPhone,
        residentialPhone,
        contactPhone,
        whatsapp
      }
    });

    return res.json({
      message: "Pessoa atualizada com sucesso.",
      person
    });
  } catch (error) {
    console.error("Erro em updatePerson:", error);
    return res.status(500).json({
      error: "Erro ao atualizar pessoa.",
      details: error.message
    });
  }
}

async function deletePerson(req, res) {
  try {
    const { id } = req.params;

    const personExists = await prisma.person.findUnique({
      where: { id: id }
    });

    if (!personExists) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    await prisma.person.delete({
      where: {
        id: id
      }
    });

    return res.json({
      message: "Pessoa excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro em deletePerson:", error);
    return res.status(500).json({
      error: "Erro ao excluir pessoa.",
      details: error.message
    });
  }
}

module.exports = {
  createPerson,
  listPersons,
  getPersonById,
  updatePerson,
  deletePerson
};