import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Requests.css";

const STATUS_OPTIONS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: ""
  });

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/requests");
      setRequests(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
      setError("Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleStatusChange(id, newStatus) {
    try {
      setSavingId(id);

      const response = await api.put(`/requests/${id}`, {
        status: newStatus
      });

      setRequests((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Não foi possível atualizar o status da solicitação.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta solicitação?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/requests/${id}`);
      setRequests((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Erro ao excluir solicitação:", err);
      alert("Não foi possível excluir a solicitação.");
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const text = `${item.name || ""} ${item.phone || ""} ${item.email || ""} ${item.message || ""} ${item.property?.title || ""}`.toLowerCase();

      const matchSearch = text.includes(filters.search.toLowerCase());
      const matchStatus = filters.status ? item.status === filters.status : true;

      return matchSearch && matchStatus;
    });
  }, [requests, filters]);

  function getStatusLabel(status) {
    switch (status) {
      case "PENDENTE":
        return "Pendente";
      case "EM_ANDAMENTO":
        return "Em andamento";
      case "CONCLUIDA":
        return "Concluída";
      case "CANCELADA":
        return "Cancelada";
      default:
        return status;
    }
  }

  return (
    <div className="requests-page">
      <div className="requests-header">
        <div>
          <h1>Solicitações</h1>
          <p>Gerencie os pedidos recebidos no painel.</p>
        </div>
      </div>

      <div className="requests-filters">
        <input
          type="text"
          placeholder="Buscar por nome, telefone, email ou imóvel"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="requests-empty">Carregando solicitações...</div>
      ) : error ? (
        <div className="requests-empty error">{error}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="requests-empty">Nenhuma solicitação encontrada.</div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((item) => (
            <div className="request-card" key={item.id}>
              <div className="request-card-top">
                <div>
                  <h3>{item.name || "Sem nome"}</h3>
                  <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              <div className="request-info">
                <p>
                  <strong>Telefone:</strong> {item.phone || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {item.email || "-"}
                </p>
                <p>
                  <strong>Imóvel:</strong> {item.property?.title || "-"}
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
                <p>
                  <strong>Mensagem:</strong>
                </p>
                <div className="request-message">
                  {item.message || "Sem mensagem."}
                </div>
              </div>

              <div className="request-actions">
                <select
                  value={item.status}
                  disabled={savingId === item.id}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(item.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}