import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientId: "",
    propertyId: "",
    date: "",
    time: "",
    status: "AGENDADO",
    notes: "",
    outcome: ""
  });

  async function loadClients() {
    try {
      const response = await api.get("/persons");
      const list = (response.data || []).filter(
        (item) => item.type === "CLIENTE"
      );
      setClients(list);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err.response?.data || err.message);
    }
  }

  async function loadProperties() {
    try {
      const response = await api.get("/properties");
      setProperties(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar imóveis:", err.response?.data || err.message);
    }
  }

  async function loadAppointments() {
    try {
      const response = await api.get("/appointments");
      setAppointments(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err.response?.data || err.message);
    }
  }

  useEffect(() => {
    loadClients();
    loadProperties();
    loadAppointments();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleNew() {
    setEditingId(null);
    setError("");
    setForm({
      clientId: "",
      propertyId: "",
      date: "",
      time: "",
      status: "AGENDADO",
      notes: "",
      outcome: ""
    });
  }

  function formatDateToInput(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function formatTimeToInput(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function handleEdit(appointment) {
    setEditingId(appointment.id);
    setError("");

    setForm({
      clientId: appointment.clientId || "",
      propertyId: appointment.propertyId || "",
      date: formatDateToInput(appointment.appointmentDate),
      time: formatTimeToInput(appointment.appointmentDate),
      status: appointment.status || "AGENDADO",
      notes: appointment.notes || "",
      outcome: appointment.outcome || ""
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.clientId) {
      setError("Selecione o cliente.");
      return;
    }

    if (!form.propertyId) {
      setError("Selecione o imóvel.");
      return;
    }

    if (!form.date) {
      setError("Selecione a data.");
      return;
    }

    if (!form.time) {
      setError("Selecione o horário.");
      return;
    }

    try {
      setError("");

      const payload = {
        clientId: String(form.clientId).trim(),
        propertyId: String(form.propertyId).trim(),
        appointmentDate: `${form.date}T${form.time}:00`,
        duration: 60,
        status: form.status || "AGENDADO",
        notes: form.notes?.trim() || null,
        outcome: form.outcome?.trim() || null
      };

      console.log("Payload do agendamento:", JSON.stringify(payload, null, 2));

      if (editingId) {
        await api.put(`/appointments/${editingId}`, payload);
        alert("Agendamento atualizado com sucesso.");
      } else {
        await api.post("/appointments", payload);
        alert("Agendamento criado com sucesso.");
      }

      await loadAppointments();
      handleNew();
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      console.error("Status:", err.response?.status);
      console.error(
        "Resposta da API:",
        JSON.stringify(err.response?.data, null, 2)
      );

      const apiMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message;

      alert(`Erro ao salvar agendamento:\n${apiMessage}`);
      setError(apiMessage || "Erro ao salvar agendamento.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Deseja excluir este agendamento?");
    if (!confirmed) return;

    try {
      await api.delete(`/appointments/${id}`);
      alert("Agendamento excluído com sucesso.");
      await loadAppointments();

      if (editingId === id) {
        handleNew();
      }
    } catch (err) {
      console.error("Erro ao excluir agendamento:", err.response?.data || err.message);
      setError("Erro ao excluir agendamento.");
    }
  }

  const orderedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
    );
  }, [appointments]);

  function formatDateTime(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Agendamentos / Visitas</h1>

      <form onSubmit={handleSubmit} style={styles.formRow}>
        <select
          name="clientId"
          value={form.clientId}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Selecione o cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
        </select>

        <select
          name="propertyId"
          value={form.propertyId}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Selecione o imóvel</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          style={styles.input}
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="AGENDADO">AGENDADO</option>
          <option value="CONFIRMADO">CONFIRMADO</option>
          <option value="CANCELADO">CANCELADO</option>
          <option value="REALIZADO">REALIZADO</option>
          <option value="NAO_COMPARECEU">NAO_COMPARECEU</option>
        </select>

        <input
          type="text"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Observações"
          style={styles.inputNotes}
        />

        <button type="submit" style={styles.button}>
          {editingId ? "Atualizar" : "Criar"}
        </button>

        <button type="button" onClick={handleNew} style={styles.buttonSecondary}>
          Novo
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.list}>
        {orderedAppointments.length === 0 ? (
          <p>Nenhum agendamento.</p>
        ) : (
          orderedAppointments.map((appointment) => (
            <div key={appointment.id} style={styles.card}>
              <div style={styles.cardTitle}>
                {appointment.client?.fullName || "-"} — {appointment.property?.title || "-"}
              </div>

              <div style={styles.cardText}>
                <strong>Data:</strong> {formatDateTime(appointment.appointmentDate)}
              </div>

              <div style={styles.cardText}>
                <strong>Status:</strong> {appointment.status || "-"}
              </div>

              <div style={styles.cardText}>
                <strong>Observações:</strong> {appointment.notes || "-"}
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => handleEdit(appointment)}
                  style={styles.smallButton}
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(appointment.id)}
                  style={styles.smallDelete}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px"
  },
  title: {
    marginBottom: "24px",
    fontSize: "28px"
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    marginBottom: "20px"
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    minWidth: "180px"
  },
  inputNotes: {
    padding: "10px",
    fontSize: "16px",
    minWidth: "220px"
  },
  button: {
    padding: "10px 16px",
    border: "none",
    cursor: "pointer"
  },
  buttonSecondary: {
    padding: "10px 16px",
    border: "none",
    cursor: "pointer"
  },
  error: {
    color: "red",
    marginBottom: "16px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  card: {
    border: "1px solid #ddd",
    padding: "14px",
    borderRadius: "8px"
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: "8px"
  },
  cardText: {
    marginBottom: "6px"
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "10px"
  },
  smallButton: {
    padding: "8px 12px",
    border: "none",
    cursor: "pointer"
  },
  smallDelete: {
    padding: "8px 12px",
    border: "none",
    cursor: "pointer"
  }
};

export default Appointments;