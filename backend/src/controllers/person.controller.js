const prisma = require("../config/prisma");

async function createPerson(req, res) {
  try {
    const {
      type,
      fullName,
      cpf,
      rg,
      phone,
      email,
      maritalStatus,
      profession,
      monthlyIncome,
      fgtsBalance,
      hasDependents,
      dependentsCount,
      addressZipCode,
      addressStreet,
      addressNumber,
      addressDistrict,
      addressCity,
      addressState,
      notes,
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
        phone,
        email,
        maritalStatus,
        profession,
        monthlyIncome:
          monthlyIncome !== undefined && monthlyIncome !== null && monthlyIncome !== ""
            ? Number(monthlyIncome)
            : null,
        fgtsBalance:
          fgtsBalance !== undefined && fgtsBalance !== null && fgtsBalance !== ""
            ? Number(fgtsBalance)
            : null,
        hasDependents: hasDependents === true || hasDependents === "true",
        dependentsCount:
          dependentsCount !== undefined && dependentsCount !== null && dependentsCount !== ""
            ? Number(dependentsCount)
            : 0,
        addressZipCode,
        addressStreet,
        addressNumber,
        addressDistrict,
        addressCity,
        addressState,
        notes,
        company,
        commercialPhone,
        residentialPhone,
        contactPhone,
        whatsapp: whatsapp === true || whatsapp === "true"
      }
    });

    return res.status(201).json({
      message: "Pessoa cadastrada com sucesso.",
      person
    });
  } catch (error) {
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
        id: "asc"
      },
      include: {
        documents: true,
        propertiesOwned: true
      }
    });

    return res.json(persons);
  } catch (error) {
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
        id: Number(id)
      },
      include: {
        documents: true,
        propertiesOwned: true
      }
    });

    if (!person) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    return res.json(person);
  } catch (error) {
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
      phone,
      email,
      maritalStatus,
      profession,
      monthlyIncome,
      fgtsBalance,
      hasDependents,
      dependentsCount,
      addressZipCode,
      addressStreet,
      addressNumber,
      addressDistrict,
      addressCity,
      addressState,
      notes,
      company,
      commercialPhone,
      residentialPhone,
      contactPhone,
      whatsapp
    } = req.body;

    const personExists = await prisma.person.findUnique({
      where: { id: Number(id) }
    });

    if (!personExists) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    const person = await prisma.person.update({
      where: {
        id: Number(id)
      },
      data: {
        type,
        fullName,
        cpf,
        rg,
        phone,
        email,
        maritalStatus,
        profession,
        monthlyIncome:
          monthlyIncome !== undefined && monthlyIncome !== null && monthlyIncome !== ""
            ? Number(monthlyIncome)
            : null,
        fgtsBalance:
          fgtsBalance !== undefined && fgtsBalance !== null && fgtsBalance !== ""
            ? Number(fgtsBalance)
            : null,
        hasDependents: hasDependents === true || hasDependents === "true",
        dependentsCount:
          dependentsCount !== undefined && dependentsCount !== null && dependentsCount !== ""
            ? Number(dependentsCount)
            : 0,
        addressZipCode,
        addressStreet,
        addressNumber,
        addressDistrict,
        addressCity,
        addressState,
        notes,
        company,
        commercialPhone,
        residentialPhone,
        contactPhone,
        whatsapp: whatsapp === true || whatsapp === "true"
      }
    });

    return res.json({
      message: "Pessoa atualizada com sucesso.",
      person
    });
  } catch (error) {
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
      where: { id: Number(id) }
    });

    if (!personExists) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    await prisma.person.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({
      message: "Pessoa excluída com sucesso."
    });
  } catch (error) {
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