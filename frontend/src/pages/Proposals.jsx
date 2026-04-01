import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientId: "",
    propertyId: "",
    value: "",
    status: "PENDENTE",
    notes: ""
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

  async function loadProposals() {
    try {
      const response = await api.get("/proposals");
      setProposals(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar propostas:", err.response?.data || err.message);
    }
  }

  useEffect(() => {
    loadClients();
    loadProperties();
    loadProposals();
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
      value: "",
      status: "PENDENTE",
      notes: ""
    });
  }

  function handleEdit(proposal) {
    setEditingId(proposal.id);
    setError("");

    setForm({
      clientId: proposal.clientId || "",
      propertyId: proposal.propertyId || "",
      value: proposal.value ?? "",
      status: proposal.status || "PENDENTE",
      notes: proposal.notes || ""
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

    if (!form.value) {
      setError("Informe o valor da proposta.");
      return;
    }

    try {
      setError("");

      const payload = {
        clientId: String(form.clientId).trim(),
        propertyId: String(form.propertyId).trim(),
        value: Number(form.value),
        status: form.status || "PENDENTE",
        notes: form.notes?.trim() || null
      };

      console.log("Payload da proposta:", JSON.stringify(payload, null, 2));

      if (editingId) {
        await api.put(`/proposals/${editingId}`, payload);
        alert("Proposta atualizada com sucesso.");
      } else {
        await api.post("/proposals", payload);
        alert("Proposta criada com sucesso.");
      }

      await loadProposals();
      handleNew();
    } catch (err) {
      console.error("Erro ao salvar proposta:", err);
      console.error("Status:", err.response?.status);
      console.error(
        "Resposta da API:",
        JSON.stringify(err.response?.data, null, 2)
      );

      const apiMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message;

      alert(`Erro ao salvar proposta:\n${apiMessage}`);
      setError(apiMessage || "Erro ao salvar proposta.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Deseja excluir esta proposta?");
    if (!confirmed) return;

    try {
      await api.delete(`/proposals/${id}`);
      alert("Proposta excluída com sucesso.");
      await loadProposals();

      if (editingId === id) {
        handleNew();
      }
    } catch (err) {
      console.error("Erro ao excluir proposta:", err.response?.data || err.message);
      setError("Erro ao excluir proposta.");
    }
  }

  const orderedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [proposals]);

  function formatMoney(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }

    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Propostas</h1>

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
          type="number"
          name="value"
          value={form.value}
          onChange={handleChange}
          placeholder="Valor da proposta"
          style={styles.input}
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="PENDENTE">PENDENTE</option>
          <option value="ACEITA">ACEITA</option>
          <option value="RECUSADA">RECUSADA</option>
          <option value="EM_ANALISE">EM_ANALISE</option>
          <option value="CONTRAPROPOSTA">CONTRAPROPOSTA</option>
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
        {orderedProposals.length === 0 ? (
          <p>Nenhuma proposta.</p>
        ) : (
          orderedProposals.map((proposal) => (
            <div key={proposal.id} style={styles.card}>
              <div style={styles.cardTitle}>
                {proposal.client?.fullName || "-"} — {proposal.property?.title || "-"}
              </div>

              <div style={styles.cardText}>
                <strong>Valor:</strong> {formatMoney(proposal.value)}
              </div>

              <div style={styles.cardText}>
                <strong>Status:</strong> {proposal.status || "-"}
              </div>

              <div style={styles.cardText}>
                <strong>Observações:</strong> {proposal.notes || "-"}
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => handleEdit(proposal)}
                  style={styles.smallButton}
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(proposal.id)}
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

export default Proposals;