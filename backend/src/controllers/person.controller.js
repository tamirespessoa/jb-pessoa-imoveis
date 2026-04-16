const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function normalizeWhatsapp(value) {
  if (
    value === true ||
    value === "true" ||
    value === "Sim" ||
    value === "sim" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "Não" ||
    value === "não" ||
    value === "nao" ||
    value === 0 ||
    value === "0" ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  return Boolean(value);
}

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
      whatsapp,
      category,
      firstContact,
      isActive,
      notes,
      createReminder
    } = req.body;

    if (!type || !String(type).trim()) {
      return res.status(400).json({ error: "Tipo é obrigatório." });
    }

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: "Nome completo é obrigatório." });
    }

    const person = await prisma.person.create({
      data: {
        type: String(type).trim(),
        fullName: String(fullName).trim(),
        cpf: normalizeString(cpf),
        rg: normalizeString(rg),
        email: normalizeString(email),
        phone: normalizeString(phone),
        company: normalizeString(company),
        commercialPhone: normalizeString(commercialPhone),
        residentialPhone: normalizeString(residentialPhone),
        contactPhone: normalizeString(contactPhone),
        whatsapp: normalizeWhatsapp(whatsapp),
        category: normalizeString(category),
        firstContact: normalizeString(firstContact),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        notes: normalizeString(notes),
        createReminder:
          createReminder !== undefined ? Boolean(createReminder) : false
      }
    });

    return res.status(201).json({
      message: "Pessoa cadastrada com sucesso.",
      person
    });
  } catch (error) {
    console.error("Erro ao cadastrar pessoa:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Já existe um registro com CPF ou e-mail informado.",
        details: error.meta
      });
    }

    return res.status(500).json({
      error: "Erro ao cadastrar pessoa.",
      details: error.message
    });
  }
}

async function listPersons(req, res) {
  try {
    const persons = await prisma.person.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.json(persons);
  } catch (error) {
    console.error("Erro ao listar pessoas:", error);
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
      where: { id }
    });

    if (!person) {
      return res.status(404).json({ error: "Pessoa não encontrada." });
    }

    return res.json(person);
  } catch (error) {
    console.error("Erro ao buscar pessoa:", error);
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
      whatsapp,
      category,
      firstContact,
      isActive,
      notes,
      createReminder
    } = req.body;

    const existing = await prisma.person.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Pessoa não encontrada." });
    }

    const person = await prisma.person.update({
      where: { id },
      data: {
        type: type !== undefined ? String(type).trim() : existing.type,
        fullName:
          fullName !== undefined ? String(fullName).trim() : existing.fullName,
        cpf: cpf !== undefined ? normalizeString(cpf) : existing.cpf,
        rg: rg !== undefined ? normalizeString(rg) : existing.rg,
        email: email !== undefined ? normalizeString(email) : existing.email,
        phone: phone !== undefined ? normalizeString(phone) : existing.phone,
        company:
          company !== undefined ? normalizeString(company) : existing.company,
        commercialPhone:
          commercialPhone !== undefined
            ? normalizeString(commercialPhone)
            : existing.commercialPhone,
        residentialPhone:
          residentialPhone !== undefined
            ? normalizeString(residentialPhone)
            : existing.residentialPhone,
        contactPhone:
          contactPhone !== undefined
            ? normalizeString(contactPhone)
            : existing.contactPhone,
        whatsapp:
          whatsapp !== undefined
            ? normalizeWhatsapp(whatsapp)
            : existing.whatsapp,
        category:
          category !== undefined ? normalizeString(category) : existing.category,
        firstContact:
          firstContact !== undefined
            ? normalizeString(firstContact)
            : existing.firstContact,
        isActive:
          isActive !== undefined ? Boolean(isActive) : existing.isActive,
        notes: notes !== undefined ? normalizeString(notes) : existing.notes,
        createReminder:
          createReminder !== undefined
            ? Boolean(createReminder)
            : existing.createReminder
      }
    });

    return res.json({
      message: "Pessoa atualizada com sucesso.",
      person
    });
  } catch (error) {
    console.error("Erro ao atualizar pessoa:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Já existe um registro com CPF ou e-mail informado.",
        details: error.meta
      });
    }

    return res.status(500).json({
      error: "Erro ao atualizar pessoa.",
      details: error.message
    });
  }
}

async function deletePerson(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.person.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Pessoa não encontrada." });
    }

    await prisma.person.delete({
      where: { id }
    });

    return res.json({ message: "Pessoa excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir pessoa:", error);
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