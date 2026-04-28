const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function normalizeEmail(value) {
  const email = normalizeString(value);
  return email ? email.toLowerCase() : null;
}

function onlyNumbers(value) {
  if (value === undefined || value === null) return null;
  const numbers = String(value).replace(/\D/g, "");
  return numbers === "" ? null : numbers;
}

function normalizeCpf(value) {
  return onlyNumbers(value);
}

function normalizePhone(value) {
  return normalizeString(value);
}

function normalizeWhatsapp(value) {
  if (
    value === true ||
    value === "true" ||
    value === "Sim" ||
    value === "sim" ||
    value === "SIM" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  return false;
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePersonPayload(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.type !== undefined) {
    if (!data.type || !String(data.type).trim()) {
      errors.push("Tipo é obrigatório.");
    }
  }

  if (!isUpdate || data.fullName !== undefined) {
    if (!data.fullName || !String(data.fullName).trim()) {
      errors.push("Nome completo é obrigatório.");
    }
  }

  const email = normalizeEmail(data.email);

  if (email && !isValidEmail(email)) {
    errors.push("E-mail inválido.");
  }

  return errors;
}

function buildCreatePersonData(body) {
  return {
    type: String(body.type).trim(),
    fullName: String(body.fullName).trim(),
    cpf: normalizeCpf(body.cpf),
    rg: normalizeString(body.rg),
    email: normalizeEmail(body.email),
    phone: normalizePhone(body.phone),
    company: normalizeString(body.company),
    commercialPhone: normalizePhone(body.commercialPhone),
    residentialPhone: normalizePhone(body.residentialPhone),
    contactPhone: normalizePhone(body.contactPhone),
    whatsapp: normalizeWhatsapp(body.whatsapp),
    category: normalizeString(body.category),
    firstContact: normalizeString(body.firstContact),
    notes: normalizeString(body.notes),
    isActive:
      body.isActive !== undefined && body.isActive !== null
        ? Boolean(body.isActive)
        : true,
    createReminder:
      body.createReminder !== undefined && body.createReminder !== null
        ? Boolean(body.createReminder)
        : false
  };
}

function buildUpdatePersonData(body) {
  const data = {};

  if (body.type !== undefined) data.type = String(body.type).trim();
  if (body.fullName !== undefined) data.fullName = String(body.fullName).trim();
  if (body.cpf !== undefined) data.cpf = normalizeCpf(body.cpf);
  if (body.rg !== undefined) data.rg = normalizeString(body.rg);
  if (body.email !== undefined) data.email = normalizeEmail(body.email);
  if (body.phone !== undefined) data.phone = normalizePhone(body.phone);
  if (body.company !== undefined) data.company = normalizeString(body.company);
  if (body.commercialPhone !== undefined)
    data.commercialPhone = normalizePhone(body.commercialPhone);
  if (body.residentialPhone !== undefined)
    data.residentialPhone = normalizePhone(body.residentialPhone);
  if (body.contactPhone !== undefined)
    data.contactPhone = normalizePhone(body.contactPhone);
  if (body.whatsapp !== undefined)
    data.whatsapp = normalizeWhatsapp(body.whatsapp);
  if (body.category !== undefined)
    data.category = normalizeString(body.category);
  if (body.firstContact !== undefined)
    data.firstContact = normalizeString(body.firstContact);
  if (body.notes !== undefined)
    data.notes = normalizeString(body.notes);
  if (body.isActive !== undefined)
    data.isActive = Boolean(body.isActive);
  if (body.createReminder !== undefined)
    data.createReminder = Boolean(body.createReminder);

  return data;
}


function getAuthUser(req) {
  const user = req.user || {};
  return {
    id: user.id || user.userId || null,
    role: user.role || "USER",
    name: user.name || user.fullName || user.email || ""
  };
}

function handlePrismaError(error, res, defaultMessage) {
  console.error(defaultMessage, error);

  if (error.code === "P2002") {
    return res.status(400).json({
      error: "Já existe uma pessoa cadastrada com este CPF ou e-mail.",
      details: error.meta
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      error: "Registro não encontrado.",
      details: error.message
    });
  }

  return res.status(500).json({
    error: defaultMessage,
    details: error.message
  });
}

async function createPerson(req, res) {
  try {
    const errors = validatePersonPayload(req.body, false);

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Dados inválidos.",
        details: errors
      });
    }

    const authUser = getAuthUser(req);
    const createData = buildCreatePersonData(req.body);

    if (authUser.id) {
      createData.createdById = authUser.id;
    }

    const person = await prisma.person.create({
      data: createData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Pessoa cadastrada com sucesso.",
      person
    });
  } catch (error) {
    return handlePrismaError(error, res, "Erro ao cadastrar pessoa.");
  }
}

async function listPersons(req, res) {
  try {
    const { type, search } = req.query;

    const where = {};

    if (type) {
      where.type = String(type).trim();
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();

      where.OR = [
        { fullName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { cpf: { contains: term } },
        { phone: { contains: term, mode: "insensitive" } },
        { contactPhone: { contains: term, mode: "insensitive" } }
      ];
    }

    const authUser = getAuthUser(req);

    const secureWhere = {
      ...where,
      ...(authUser.role === "ADMIN" || !authUser.id
        ? {}
        : { createdById: authUser.id })
    };

    const persons = await prisma.person.findMany({
      where: secureWhere,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(persons);
  } catch (error) {
    return handlePrismaError(error, res, "Erro ao listar pessoas.");
  }
}

async function getPersonById(req, res) {
  try {
    const { id } = req.params;

    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        properties: true,
        documents: true,
        appointments: true,
        proposals: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!person) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    const authUser = getAuthUser(req);

    if (
      authUser.id &&
      authUser.role !== "ADMIN" &&
      person.createdById &&
      person.createdById !== authUser.id
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para visualizar este cliente."
      });
    }

    return res.json(person);
  } catch (error) {
    return handlePrismaError(error, res, "Erro ao buscar pessoa.");
  }
}

async function updatePerson(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.person.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    const authUser = getAuthUser(req);

    if (
      authUser.id &&
      authUser.role !== "ADMIN" &&
      existing.createdById &&
      existing.createdById !== authUser.id
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para editar este cliente."
      });
    }

    const errors = validatePersonPayload(
      {
        ...existing,
        ...req.body
      },
      true
    );

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Dados inválidos.",
        details: errors
      });
    }

    const person = await prisma.person.update({
      where: { id },
      data: buildUpdatePersonData(req.body),
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      message: "Pessoa atualizada com sucesso.",
      person
    });
  } catch (error) {
    return handlePrismaError(error, res, "Erro ao atualizar pessoa.");
  }
}

async function deletePerson(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.person.findUnique({
      where: { id },
      include: {
        properties: true,
        documents: true,
        appointments: true,
        proposals: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Pessoa não encontrada."
      });
    }

    const authUser = getAuthUser(req);

    if (
      authUser.id &&
      authUser.role !== "ADMIN" &&
      existing.createdById &&
      existing.createdById !== authUser.id
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para excluir este cliente."
      });
    }

    if (existing.properties && existing.properties.length > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir esta pessoa porque ela possui imóveis vinculados."
      });
    }

    if (existing.documents && existing.documents.length > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir esta pessoa porque ela possui documentos vinculados."
      });
    }

    if (existing.appointments && existing.appointments.length > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir esta pessoa porque ela possui agendamentos vinculados."
      });
    }

    if (existing.proposals && existing.proposals.length > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir esta pessoa porque ela possui propostas vinculadas."
      });
    }

    await prisma.person.delete({
      where: { id }
    });

    return res.json({
      message: "Pessoa excluída com sucesso."
    });
  } catch (error) {
    return handlePrismaError(error, res, "Erro ao excluir pessoa.");
  }
}

module.exports = {
  createPerson,
  listPersons,
  getPersonById,
  updatePerson,
  deletePerson
};