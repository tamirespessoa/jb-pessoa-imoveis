import { useEffect, useState } from "react";
import api from "../services/api";

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulário de cadastro
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("PENDENTE");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    // Busca propostas, clientes e imoveis em paralelo
    const [proposalsRes, clientsRes, propertiesRes] = await Promise.all([
      api.get("/proposals"),
      api.get("/persons"),
      api.get("/properties"),
    ]);
    setProposals(proposalsRes.data);
    setClients(clientsRes.data);
    setProperties(propertiesRes.data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormMsg("");
    try {
      await api.post("/proposals", {
        value: Number(value),
        status,
        notes,
        clientId,
        propertyId,
      });
      setFormMsg("Proposta cadastrada com sucesso!");
      setValue(""); setStatus("PENDENTE"); setNotes(""); setClientId(""); setPropertyId("");
      fetchAll();
    } catch {
      setFormMsg("Erro ao cadastrar proposta.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta proposta?")) return;
    try {
      await api.delete(`/proposals/${id}`);
      setProposals(proposals => proposals.filter(p => p.id !== id));
    } catch {
      alert("Erro ao excluir proposta.");
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await api.patch(`/proposals/${id}`, { status: newStatus });
      setProposals(old =>
        old.map(p =>
          p.id === id ? { ...p, status: newStatus } : p
        )
      );
    } catch {
      alert("Erro ao atualizar status.");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Propostas</h1>

      <form style={{ marginBottom: 32, background: "#eee", padding: 16, borderRadius: 8 }} onSubmit={handleSubmit}>
        <strong>Cadastrar nova proposta</strong>
        <br />
        <select required value={clientId} onChange={e => setClientId(e.target.value)} style={{ marginRight: 8 }}>
          <option value="">Cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select required value={propertyId} onChange={e => setPropertyId(e.target.value)} style={{ marginRight: 8 }}>
          <option value="">Imóvel</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <input
          required
          type="number"
          min={0}
          placeholder="Valor"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ marginRight: 8, width: 100 }}
        />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginRight: 8 }}>
          <option value="PENDENTE">PENDENTE</option>
          <option value="ACEITA">ACEITA</option>
          <option value="RECUSADA">RECUSADA</option>
        </select>
        <input
          type="text"
          placeholder="Observações"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ marginRight: 8, width: 160 }}
        />
        <button type="submit">Cadastrar</button>
        {formMsg && <span style={{ marginLeft: 8, color: formMsg.includes("sucesso") ? "green" : "red" }}>{formMsg}</span>}
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : proposals.length === 0 ? (
        <p>Nenhuma proposta cadastrada.</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Imóvel</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Observações</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.client?.name || "-"}</td>
                <td>{p.property?.title || "-"}</td>
                <td>R$ {p.value?.toLocaleString("pt-BR")}</td>
                <td>
                  <select
                    value={p.status}
                    onChange={e => handleStatusChange(p.id, e.target.value)}
                    style={{ background: "#fff" }}
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="ACEITA">ACEITA</option>
                    <option value="RECUSADA">RECUSADA</option>
                  </select>
                </td>
                <td>{p.notes}</td>
                <td>
                  <button onClick={() => handleDelete(p.id)} style={{ color: "red" }}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}