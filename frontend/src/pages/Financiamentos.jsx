import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import publicApi from "../services/publicApi";

const STORAGE_KEY = "financiamentos_data_v2";
const INITIAL_ITEMS = [];

function getTodayString() {
  return new Date().toLocaleDateString("pt-BR");
}

function loadInitialItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return INITIAL_ITEMS;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : INITIAL_ITEMS;
  } catch (error) {
    console.error("Erro ao carregar financiamentos:", error);
    return INITIAL_ITEMS;
  }
}

export default function Financiamentos() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [items, setItems] = useState(loadInitialItems);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const [newFinancing, setNewFinancing] = useState({
    clientId: "",
    propertyId: "",
    valorTotal: "",
    financiado: "",
    etapa: "Lead de simulação",
    status: "Não atendido"
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    loadClients();
    loadProperties();
  }, []);

  async function loadClients() {
    try {
      setLoadingClients(true);
      const response = await api.get("/persons");
      const onlyClients = (response.data || []).filter(
        (item) => item.type === "CLIENTE"
      );
      setClients(onlyClients);
    } catch (error) {
      console.error(
        "Erro ao carregar clientes:",
        error.response?.data || error.message
      );
      alert("Erro ao carregar clientes.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadProperties() {
    try {
      setLoadingProperties(true);
      const response = await publicApi.get("/properties/public");
      const list = response.data?.data || response.data || [];
      setProperties(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(
        "Erro ao carregar imóveis:",
        error.response?.data || error.message
      );
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function handleOpenModal() {
    setNewFinancing({
      clientId: "",
      propertyId: "",
      valorTotal: "",
      financiado: "",
      etapa: "Lead de simulação",
      status: "Não atendido"
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
  }

  function handleChangeNewFinancing(e) {
    const { name, value } = e.target;

    setNewFinancing((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleSelectProperty(propertyId) {
    const selectedProperty = properties.find(
      (item) => String(item.id) === String(propertyId)
    );

    setNewFinancing((prev) => ({
      ...prev,
      propertyId,
      valorTotal: selectedProperty?.price ? String(selectedProperty.price) : "",
      financiado: selectedProperty?.price ? String(selectedProperty.price) : ""
    }));
  }

  function handleCreateFinancing() {
    const selectedClient = clients.find(
      (item) => String(item.id) === String(newFinancing.clientId)
    );

    const selectedProperty = properties.find(
      (item) => String(item.id) === String(newFinancing.propertyId)
    );

    if (!selectedClient) {
      alert("Selecione um cliente.");
      return;
    }

    const valorTotal =
      Number(newFinancing.valorTotal) || Number(selectedProperty?.price) || 0;

    const valorFinanciado =
      Number(newFinancing.financiado) || Number(selectedProperty?.price) || 0;

    const alreadyExists = items.some(
      (item) =>
        String(item.clienteId) === String(selectedClient.id) &&
        String(item.propertyId || "") === String(selectedProperty?.id || "")
    );

    if (alreadyExists) {
      alert("Este cliente já está vinculado a este imóvel em financiamento.");
      return;
    }

    const newItem = {
      id: Date.now(),
      etapa: newFinancing.etapa,
      valorTotal,
      financiado: valorFinanciado,
      cliente: selectedClient.fullName || "Cliente sem nome",
      clienteId: selectedClient.id,
      imovel: selectedProperty
        ? selectedProperty.code ||
          selectedProperty.title ||
          "Imóvel não informado"
        : "Sem imóvel",
      propertyId: selectedProperty?.id || null,
      corretor:
        selectedClient.assignedTo?.name ||
        user?.name ||
        "Usuário do sistema",
      visualizadoPor: user?.name || "Usuário do sistema",
      dataVisualizacao: getTodayString(),
      atendidoPor: "",
      status: newFinancing.status,
      phone: selectedClient.phone || "",
      email: selectedClient.email || "",
      cpf: selectedClient.cpf || ""
    };

    setItems((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setShowModal(false);
    alert("Financiamento criado com sucesso.");
  }

  const summary = useMemo(() => {
    const total = items.length;
    const emAtendimento = items.filter(
      (item) => item.status === "Em atendimento"
    ).length;
    const naoAtendidos = items.filter(
      (item) => item.status === "Não atendido"
    ).length;
    const valorTotal = items.reduce(
      (acc, item) => acc + Number(item.financiado || 0),
      0
    );

    return {
      total,
      emAtendimento,
      naoAtendidos,
      valorTotal
    };
  }, [items]);

  function handleIniciarAtendimento(id) {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Em atendimento",
              etapa: "Em atendimento",
              atendidoPor: user?.name || "Usuário do sistema"
            }
          : item
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function handleExcluir(id) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este financiamento?"
    );

    if (!confirmed) return;

    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financiamentos</h1>
          <p style={styles.subtitle}>
            Gestão de simulações, atendimentos e processos de financiamento.
          </p>
        </div>

        <div style={styles.headerButtons}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleOpenModal}
          >
            Novo financiamento
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => alert("Aqui você poderá gerar o link do simulador.")}
          >
            Gerar link do simulador
          </button>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Total</span>
          <strong style={styles.summaryValue}>{summary.total}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Não atendidos</span>
          <strong style={styles.summaryValue}>{summary.naoAtendidos}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Em atendimento</span>
          <strong style={styles.summaryValue}>{summary.emAtendimento}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Valor financiado</span>
          <strong style={styles.summaryValue}>
            {formatCurrency(summary.valorTotal)}
          </strong>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <div style={styles.tableTitle}>Processos encontrados</div>
          <div style={styles.tableCount}>{items.length} encontrados</div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Etapa/Data</th>
                <th style={styles.th}>Imóvel/Financiar</th>
                <th style={styles.th}>Interessado</th>
                <th style={styles.th}>Imóvel/Corretor</th>
                <th style={styles.th}>Visualizado por</th>
                <th style={styles.th}>Atendido por</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyCell}>
                    Nenhum financiamento encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <div
                        style={{
                          ...styles.stageBadge,
                          ...(item.status === "Em atendimento"
                            ? styles.stageBadgeBlue
                            : {})
                        }}
                      >
                        {item.etapa}
                      </div>
                      <div style={styles.mutedText}>{item.dataVisualizacao}</div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.strongText}>
                        {formatCurrency(item.valorTotal)}
                      </div>
                      <div style={styles.blueText}>
                        {formatCurrency(item.financiado)}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>{item.cliente}</div>
                      {item.cpf && (
                        <div style={styles.mutedText}>CPF: {item.cpf}</div>
                      )}
                      {item.phone && (
                        <div style={styles.mutedText}>Tel: {item.phone}</div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.strongText}>{item.imovel}</div>
                      <div style={styles.mutedText}>{item.corretor}</div>
                    </td>

                    <td style={styles.td}>
                      <div>{item.visualizadoPor}</div>
                      <div style={styles.mutedText}>{item.dataVisualizacao}</div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.strongText}>{item.status}</div>
                      <div style={styles.mutedText}>
                        {item.atendidoPor || "-"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionsColumn}>
                        <button
                          type="button"
                          style={{
                            ...styles.actionButton,
                            ...(item.status === "Em atendimento"
                              ? styles.actionButtonDisabled
                              : {})
                          }}
                          onClick={() => handleIniciarAtendimento(item.id)}
                          disabled={item.status === "Em atendimento"}
                        >
                          {item.status === "Em atendimento"
                            ? "Em atendimento"
                            : "Iniciar atendimento"}
                        </button>

                        <button
                          type="button"
                          style={styles.deleteButton}
                          onClick={() => handleExcluir(item.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Novo financiamento</h2>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Cliente cadastrado</label>
              <select
                name="clientId"
                value={newFinancing.clientId}
                onChange={handleChangeNewFinancing}
                style={styles.modalInput}
                disabled={loadingClients}
              >
                <option value="">
                  {loadingClients
                    ? "Carregando clientes..."
                    : "Selecione um cliente"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Imóvel</label>
              <select
                name="propertyId"
                value={newFinancing.propertyId}
                onChange={(e) => handleSelectProperty(e.target.value)}
                style={styles.modalInput}
                disabled={loadingProperties}
              >
                <option value="">
                  {loadingProperties
                    ? "Carregando imóveis..."
                    : "Selecione um imóvel"}
                </option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.code} - {property.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Valor do imóvel</label>
                <input
                  type="number"
                  name="valorTotal"
                  value={newFinancing.valorTotal}
                  onChange={handleChangeNewFinancing}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Valor financiado</label>
                <input
                  type="number"
                  name="financiado"
                  value={newFinancing.financiado}
                  onChange={handleChangeNewFinancing}
                  style={styles.modalInput}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={handleCloseModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                style={styles.saveButton}
                onClick={handleCreateFinancing}
              >
                Salvar financiamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "20px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#1f2937"
  },

  subtitle: {
    margin: "8px 0 0 0",
    fontSize: "14px",
    color: "#6b7280"
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  primaryButton: {
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },

  secondaryButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#1f2937",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px"
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
  },

  summaryLabel: {
    display: "block",
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "8px"
  },

  summaryValue: {
    fontSize: "22px",
    color: "#111827"
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.05)"
  },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    gap: "12px",
    flexWrap: "wrap"
  },

  tableTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827"
  },

  tableCount: {
    fontSize: "14px",
    color: "#6b7280"
  },

  tableWrapper: {
    overflowX: "auto"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },

  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    fontSize: "14px",
    color: "#1f2937"
  },

  stageBadge: {
    display: "inline-block",
    backgroundColor: "#10b981",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "8px"
  },

  stageBadgeBlue: {
    backgroundColor: "#2563eb"
  },

  mutedText: {
    color: "#6b7280",
    marginTop: "4px"
  },

  strongText: {
    fontWeight: "700",
    color: "#111827"
  },

  blueText: {
    color: "#2563eb",
    fontWeight: "700",
    marginTop: "4px"
  },

  actionsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "160px"
  },

  actionButton: {
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer"
  },

  actionButtonDisabled: {
    backgroundColor: "#94a3b8",
    cursor: "not-allowed"
  },

  deleteButton: {
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer"
  },

  emptyCell: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999
  },

  modal: {
    width: "100%",
    maxWidth: "620px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.18)"
  },

  modalTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    color: "#111827"
  },

  modalField: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "14px"
  },

  modalLabel: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "6px"
  },

  modalInput: {
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "15px",
    outline: "none"
  },

  modalRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px"
  },

  cancelButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#1f2937",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  },

  saveButton: {
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  }
};