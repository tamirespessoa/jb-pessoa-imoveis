const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");

// CREATE - Agendar visita
router.post("/", auth, async (req, res) => {
  try {
    const { propertyId, clientId, appointmentDate, notes, duration } = req.body;

    if (!propertyId || !clientId || !appointmentDate) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const appointment = new Appointment({
      propertyId,
      clientId,
      appointmentDate,
      notes,
      duration: duration || 60
    });

    await appointment.save();
    await appointment.populate(["propertyId", "clientId"]);

    res.status(201).json({ appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ ALL - Listar todos agendamentos
router.get("/", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("propertyId", "title code")
      .populate("clientId", "fullName email phone")
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - Listar agendamentos por imóvel
router.get("/property/:propertyId", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      propertyId: req.params.propertyId
    })
      .populate("clientId", "fullName email phone")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - Listar agendamentos por cliente
router.get("/client/:clientId", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      clientId: req.params.clientId
    })
      .populate("propertyId", "title code city")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Atualizar agendamento
router.put("/:id", auth, async (req, res) => {
  try {
    const { status, appointmentDate, notes, outcome, duration } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        appointmentDate,
        notes,
        outcome,
        duration,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate(["propertyId", "clientId"]);

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Cancelar agendamento
router.delete("/:id", auth, async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "CANCELADO" },
      { new: true }
    );

    res.json({ message: "Agendamento cancelado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;