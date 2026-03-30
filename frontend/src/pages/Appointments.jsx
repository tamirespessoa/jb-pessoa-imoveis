import { useEffect, useState } from "react";
import api from "../services/api";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]); // sempre array!
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    clientId: "",
    propertyId: "",
    date: "",
    time: "",
    status: "PENDENTE",
    notes: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [a, c, p] = await Promise.all([
        api.get("/appointments"),
        api.get("/persons"),
        api.get("/properties"),
      ]);
      // Corrige: se data NÃO é array, tente a.data.data ou []
      setAppointments(
        Array.isArray(a.data)
          ? a.data
          : Array.isArray(a.data.data)
          ? a.data.data
          : []
      );
      setClients(
        Array.isArray(c.data)
          ? c.data.filter((cl) => cl.type === "CLIENTE")
          : Array.isArray(c.data.data)
          ? c.data.data.filter((cl) => cl.type === "CLIENTE")
          : []
      );
      setProperties(
        Array.isArray(p.data)
          ? p.data
          : Array.isArray(p.data.data)
          ? p.data.data
          : []
      );
      setLoading(false);
    } catch (err) {
      setAppointments([]);
      setClients([]);
      setProperties([]);
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEdit(app) {
    setEditingId(app.id);
    setForm({
      clientId: app.clientId || "",
      propertyId: app.propertyId || "",
      date: app.date ? app.date.slice(0, 10) : "",
      time: app.date ? app.date.slice(11, 16) : "",
      status: app.status || "PENDENTE",
      notes: app.notes || ""
    });
    setFormMsg("");
  }

  function handleNew() {
    setEditingId(null);
    setForm({
      clientId: "",
      propertyId: "",
      date: "",
      time: "",
      status: "PENDENTE",
      notes: ""
    });
    setFormMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormMsg("");
    const fullDate = form.date && form.time ? `${form.date}T${form.time}` : "";
    const payload = {
      clientId: form.clientId,
      propertyId: form.propertyId,
      date: fullDate,
      status: form.status,
      notes: form.notes
    };

    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, payload);
        setFormMsg("Agendamento atualizado!");
      } else {
        await api.post("/appointments", payload);
        setFormMsg("Agendamento criado!");
      }
      handleNew();
      fetchAll();
    } catch {
      setFormMsg("Erro ao salvar agendamento!");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir este agendamento?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      fetchAll();
    } catch {
      alert("Erro ao excluir agendamento!");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Agendamentos / Visitas</h1>
      <form onSubmit={handleSubmit} style={{ background: "#eee", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <select required name="clientId" value={form.clientId} onChange={handleChange} style={{ marginRight: 8 }}>
          <option value="">Cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
        <select required name="propertyId" value={form.propertyId} onChange={handleChange} style={{ marginRight: 8 }}>
          <option value="">Imóvel</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input required name="date" type="date" value={form.date} onChange={handleChange} style={{ marginRight: 8 }} />
        <input required name="time" type="time" value={form.time} onChange={handleChange} style={{ marginRight: 8, width: 120 }} />
        <select name="status" value={form.status} onChange={handleChange} style={{ marginRight: 8 }}>
          <option value="PENDENTE">PENDENTE</option>
          <option value="REALIZADO">REALIZADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </select>
        <input name="notes" placeholder="Observações" value={form.notes} onChange={handleChange} style={{ marginRight: 8, width: 200 }} />
        <button type="submit">{editingId ? "Atualizar" : "Criar"}</button>
        <button type="button" onClick={handleNew} style={{ marginLeft: 8 }}>Novo</button>
        {formMsg && <span style={{ marginLeft: 12, color: formMsg.includes("Erro") ? "red" : "green" }}>{formMsg}</span>}
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : appointments.length === 0 ? (
        <p>Nenhum agendamento.</p>
      ) : (
        <table border={1} cellPadding={6} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Imóvel</th>
              <th>Data</th>
              <th>Status</th>
              <th>Obs</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Só faz o .map se for array! */}
            {Array.isArray(appointments) &&
              appointments.map((app) => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td>{app.client?.fullName || "-"}</td>
                  <td>{app.property?.title || "-"}</td>
                  <td>
                    {app.date
                      ? new Date(app.date).toLocaleString("pt-BR")
                      : ""}
                  </td>
                  <td>{app.status}</td>
                  <td>{app.notes}</td>
                  <td>
                    <button onClick={() => handleEdit(app)} style={{ marginRight: 8 }}>Editar</button>
                    <button onClick={() => handleDelete(app.id)} style={{ color: "red" }}>Excluir</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}