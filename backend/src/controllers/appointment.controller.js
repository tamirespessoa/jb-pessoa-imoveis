const prisma = require("../lib/prisma");

class AppointmentController {
  async list(req, res) {
    try {
      const appointments = await prisma.appointment.findMany({
        orderBy: {
          createdAt: "desc"
        }
      });

      return res.json(appointments);
    } catch (error) {
      console.error("Erro ao listar agendamentos:", error);
      return res.status(500).json({
        error: "Erro ao listar agendamentos."
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: {
          id: Number(id)
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
        error: "Erro ao buscar agendamento."
      });
    }
  }

  async create(req, res) {
    try {
      const {
        clientName,
        clientPhone,
        clientEmail,
        propertyId,
        date,
        time,
        notes,
        status
      } = req.body;

      if (!clientName || !date || !time) {
        return res.status(400).json({
          error: "clientName, date e time são obrigatórios."
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          clientName,
          clientPhone: clientPhone || null,
          clientEmail: clientEmail || null,
          propertyId: propertyId ? Number(propertyId) : null,
          date: new Date(date),
          time,
          notes: notes || null,
          status: status || "PENDING"
        }
      });

      return res.status(201).json({
        message: "Agendamento criado com sucesso.",
        appointment
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      return res.status(500).json({
        error: "Erro ao criar agendamento."
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        clientName,
        clientPhone,
        clientEmail,
        propertyId,
        date,
        time,
        notes,
        status
      } = req.body;

      const existingAppointment = await prisma.appointment.findUnique({
        where: {
          id: Number(id)
        }
      });

      if (!existingAppointment) {
        return res.status(404).json({
          error: "Agendamento não encontrado."
        });
      }

      const appointment = await prisma.appointment.update({
        where: {
          id: Number(id)
        },
        data: {
          clientName,
          clientPhone,
          clientEmail,
          propertyId: propertyId ? Number(propertyId) : null,
          date: date ? new Date(date) : undefined,
          time,
          notes,
          status
        }
      });

      return res.json({
        message: "Agendamento atualizado com sucesso.",
        appointment
      });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      return res.status(500).json({
        error: "Erro ao atualizar agendamento."
      });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;

      const existingAppointment = await prisma.appointment.findUnique({
        where: {
          id: Number(id)
        }
      });

      if (!existingAppointment) {
        return res.status(404).json({
          error: "Agendamento não encontrado."
        });
      }

      await prisma.appointment.delete({
        where: {
          id: Number(id)
        }
      });

      return res.json({
        message: "Agendamento removido com sucesso."
      });
    } catch (error) {
      console.error("Erro ao remover agendamento:", error);
      return res.status(500).json({
        error: "Erro ao remover agendamento."
      });
    }
  }
}

module.exports = new AppointmentController();