import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Leads() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [leads, setLeads] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [search, setSearch] = useState("");

  async function loadData(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const requests = [api.get("/leads")];

      if (user.role === "ADMIN") {
        requests.push(api.get("/users/online-brokers"));
      }

      const responses = await Promise.all(requests);

      setLeads(responses[0].data || []);
      setBrokers(user.role === "ADMIN" ? responses[1].data || [] : []);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      alert("Erro ao carregar leads.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) =>
      `${lead.name || ""} ${lead.phone || ""} ${lead.email || ""} ${lead.message || ""} ${lead.assignedTo?.name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [leads, search]);

  async function handleStatusChange(id, status) {
    try {
      setStatusLoadingId(id);
      await api.patch(`/leads/${id}/status`, { status });
      await loadData(false);
    } catch (error) {
      console.error("Erro ao atualizar status do lead:", error);
      alert(error.response?.data?.error || "Erro ao atualizar status.");
    } finally {
      setStatusLoadingId("");
    }
  }

  function getWhatsAppUrl(lead) {
    const phone = String(lead.phone || "").replace(/\D/g, "");
    const brokerName = lead.assignedTo?.name || user.name || "corretor";

    const message = `Olá, ${lead.name}. Sou ${brokerName} da JB Pessoa Imóveis e estou entrando em contato sobre seu interesse.`;

    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  function getStatusLabel(status) {
    if (status === "NOVO") return "Novo";
    if (status === "EM_ATENDIMENTO") return "Em atendimento";
    if (status === "ATENDIDO") return "Atendido";
    if (status === "DESCARTADO") return "Descartado";
    return status;
  }

  function getStatusStyle(status) {
    if (status === "NOVO") {
      return { background: "#dbeafe", color: "#1d4ed8" };
    }

    if (status === "EM_ATENDIMENTO") {
      return { background: "#fef3c7", color: "#b45309" };
    }

    if (status === "ATENDIDO") {
      return { background: "#dcfce7", color: "#166534" };
    }

    if (status === "DESCARTADO") {
      return { background: "#fee2e2", color: "#b91c1c" };
    }

    return { background: "#f3f4f6", color: "#374151" };
  }

  const stats = useMemo(() => {
    return {
      total: leads.length,
      novos: leads.filter((lead) => lead.status === "NOVO").length,
      emAtendimento: leads.filter((lead) => lead.status === "EM_ATENDIMENTO").length,
      atendidos: leads.filter((lead) => lead.status === "ATENDIDO").length,
      descartados: leads.filter((lead) => lead.status === "DESCARTADO").length
    };
  }, [leads]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {user.role === "ADMIN" ? "Leads do sistema" : "Meus leads"}
          </h1>
          <p style={styles.subtitle}>
            Leads distribuídos automaticamente pela roleta de atendimento
          </p>
        </div>

        <button style={styles.refreshButton} onClick={() => loadData(true)}>
          Atualizar
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Novos" value={stats.novos} />
        <StatCard label="Em atendimento" value={stats.emAtendimento} />
        <StatCard label="Atendidos" value={stats.atendidos} />
        <StatCard label="Descartados" value={stats.descartados} />
      </div>

      {user.role === "ADMIN" && (
        <div style={styles.onlineSection}>
          <div style={styles.onlineHeader}>
            <h2 style={styles.onlineTitle}>Corretores online</h2>
            <span style={styles.onlineCount}>{brokers.length}</span>
          </div>

          {brokers.length === 0 ? (
            <p style={styles.emptyText}>Nenhum corretor online no momento.</p>
          ) : (
            <div style={styles.brokersGrid}>
              {brokers.map((broker) => (
                <div key={broker.id} style={styles.brokerCard}>
                  <div style={styles.brokerAvatar}>
                    {broker.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>

                  <div style={styles.brokerInfo}>
                    <strong style={styles.brokerName}>{broker.name}</strong>
                    <span style={styles.brokerEmail}>{broker.email}</span>
                  </div>

                  <span style={styles.onlinePill}>Online</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Buscar por nome, telefone, email, mensagem ou corretor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Carregando leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p>Nenhum lead encontrado.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Contato</th>
                  <th style={styles.th}>Mensagem</th>
                  <th style={styles.th}>Corretor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td style={styles.td}>
                      <div style={styles.mainText}>{lead.name}</div>
                      <div style={styles.subText}>
                        {new Date(lead.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>{lead.phone || "-"}</div>
                      <div style={styles.subText}>{lead.email || "-"}</div>
                    </td>

                    <td style={styles.td}>
                      {lead.message || "Sem mensagem"}
                    </td>

                    <td style={styles.td}>
                      {lead.assignedTo?.name || "Não atribuído"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...getStatusStyle(lead.status)
                        }}
                      >
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <a
                          href={getWhatsAppUrl(lead)}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.whatsButton}
                        >
                          WhatsApp
                        </a>

                        <select
                          style={styles.select}
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value)
                          }
                          disabled={statusLoadingId === lead.id}
                        >
                          <option value="NOVO">Novo</option>
                          <option value="EM_ATENDIMENTO">
                            Em atendimento
                          </option>
                          <option value="ATENDIDO">Atendido</option>
                          <option value="DESCARTADO">Descartado</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  refreshButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px"
  },

  statCard: {
    background: "#fff",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    padding: "18px"
  },

  statLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: "700"
  },

  statValue: {
    fontSize: "28px",
    color: "#111827"
  },

  onlineSection: {
    background: "#fff",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    padding: "20px"
  },

  onlineHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },

  onlineTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#111827"
  },

  onlineCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "28px",
    height: "28px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "800",
    padding: "0 10px"
  },

  brokersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px"
  },

  brokerCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e5e7eb"
  },

  brokerAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800"
  },

  brokerInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column"
  },

  brokerName: {
    color: "#111827"
  },

  brokerEmail: {
    color: "#6b7280",
    fontSize: "13px",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  onlinePill: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "800"
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    padding: "20px"
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap"
  },

  searchInput: {
    flex: 1,
    minWidth: "280px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db"
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
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "14px"
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: "14px",
    verticalAlign: "top"
  },

  mainText: {
    fontWeight: "700"
  },

  subText: {
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "4px"
  },

  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  whatsButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "700",
    textDecoration: "none"
  },

  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db"
  },

  emptyText: {
    color: "#6b7280",
    margin: 0
  }
};

export default Leads;