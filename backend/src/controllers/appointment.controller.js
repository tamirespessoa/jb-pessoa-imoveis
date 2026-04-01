const prisma = require("../config/prisma");

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toInt(value, defaultValue = null) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? defaultValue : number;
}

async function createAppointment(req, res) {
  try {
    const {
      propertyId,
      clientId,
      appointmentDate,
      duration,
      status,
      notes,
      outcome
    } = req.body;

    if (!propertyId || !String(propertyId).trim()) {
      return res.status(400).json({
        error: "Imóvel é obrigatório."
      });
    }

    if (!clientId || !String(clientId).trim()) {
      return res.status(400).json({
        error: "Cliente é obrigatório."
      });
    }

    if (!appointmentDate || !String(appointmentDate).trim()) {
      return res.status(400).json({
        error: "Data do agendamento é obrigatória."
      });
    }

    const propertyExists = await prisma.property.findUnique({
      where: { id: String(propertyId).trim() }
    });

    if (!propertyExists) {
      return res.status(400).json({
        error: "Imóvel não encontrado."
      });
    }

    const clientExists = await prisma.person.findUnique({
      where: { id: String(clientId).trim() }
    });

    if (!clientExists) {
      return res.status(400).json({
        error: "Cliente não encontrado."
      });
    }

    const parsedDate = new Date(appointmentDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: "Data do agendamento inválida."
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        propertyId: String(propertyId).trim(),
        clientId: String(clientId).trim(),
        appointmentDate: parsedDate,
        duration: toInt(duration, 60),
        status: normalizeString(status) || "AGENDADO",
        notes: normalizeString(notes),
        outcome: normalizeString(outcome)
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.status(201).json({
      message: "Agendamento cadastrado com sucesso.",
      appointment
    });
  } catch (error) {
    console.error("Erro ao cadastrar agendamento:", error);

    return res.status(500).json({
      error: "Erro ao cadastrar agendamento.",
      details: error.message
    });
  }
}

async function listAppointments(req, res) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        property: true,
        client: true
      },
      orderBy: {
        appointmentDate: "asc"
      }
    });

    return res.json(appointments);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);

    return res.status(500).json({
      error: "Erro ao listar agendamentos.",
      details: error.message
    });
  }
}

async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: String(id) },
      include: {
        property: true,
        client: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        error: "Agendamento não encontrado."
      });
    }

    return res.json(appointment);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);

    return res.status(500).json({
      error: "Erro ao buscar agendamento.",
      details: error.message
    });
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const {
      propertyId,
      clientId,
      appointmentDate,
      duration,
      status,
      notes,
      outcome
    } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Agendamento não encontrado."
      });
    }

    let finalPropertyId = existing.propertyId;
    let finalClientId = existing.clientId;

    if (propertyId !== undefined) {
      const propertyExists = await prisma.property.findUnique({
        where: { id: String(propertyId).trim() }
      });

      if (!propertyExists) {
        return res.status(400).json({
          error: "Imóvel não encontrado."
        });
      }

      finalPropertyId = String(propertyId).trim();
    }

    if (clientId !== undefined) {
      const clientExists = await prisma.person.findUnique({
        where: { id: String(clientId).trim() }
      });

      if (!clientExists) {
        return res.status(400).json({
          error: "Cliente não encontrado."
        });
      }

      finalClientId = String(clientId).trim();
    }

    let finalDate = existing.appointmentDate;

    if (appointmentDate !== undefined) {
      const parsedDate = new Date(appointmentDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: "Data do agendamento inválida."
        });
      }

      finalDate = parsedDate;
    }

    const appointment = await prisma.appointment.update({
      where: { id: String(id) },
      data: {
        propertyId: finalPropertyId,
        clientId: finalClientId,
        appointmentDate: finalDate,
        duration:
          duration !== undefined ? toInt(duration, 60) : existing.duration,
        status:
          status !== undefined
            ? normalizeString(status) || "AGENDADO"
            : existing.status,
        notes:
          notes !== undefined ? normalizeString(notes) : existing.notes,
        outcome:
          outcome !== undefined ? normalizeString(outcome) : existing.outcome
      },
      include: {
        property: true,
        client: true
      }
    });

    return res.json({
      message: "Agendamento atualizado com sucesso.",
      appointment
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);

    return res.status(500).json({
      error: "Erro ao atualizar agendamento.",
      details: error.message
    });
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.appointment.findUnique({
      where: { id: String(id) }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Agendamento não encontrado."
      });
    }

    await prisma.appointment.delete({
      where: { id: String(id) }
    });

    return res.json({
      message: "Agendamento excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);

    return res.status(500).json({
      error: "Erro ao excluir agendamento.",
      details: error.message
    });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
};