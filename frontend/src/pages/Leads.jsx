import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function getLeadField(message, label) {
  if (!message) return "";

  const parts = String(message).split(" | ");
  const found = parts.find((part) => part.startsWith(`${label}:`));

  if (!found) return "";

  return found.replace(`${label}:`, "").trim();
}

function getLeadAnalysis(message) {
  const status = getLeadField(message, "Análise automática");
  const score = getLeadField(message, "Score estimado");
  const commitment = getLeadField(message, "Comprometimento de renda");
  const installment = getLeadField(message, "Parcela estimada");

  if (status.includes("Boa chance")) {
    return {
      label: "🟢 Alta prioridade",
      description: "Cliente com ótimo perfil para atendimento",
      color: "#166534",
      background: "#dcfce7",
      score,
      commitment,
      installment
    };
  }

  if (status.includes("Atenção")) {
    return {
      label: "🟡 Média prioridade",
      description: "Cliente precisa de análise mais cuidadosa",
      color: "#92400e",
      background: "#fef3c7",
      score,
      commitment,
      installment
    };
  }

  if (status.includes("Alto risco")) {
    return {
      label: "🔴 Baixa prioridade",
      description: "Cliente pode precisar de ajuste na entrada ou valor do imóvel",
      color: "#991b1b",
      background: "#fee2e2",
      score,
      commitment,
      installment
    };
  }

  return {
    label: "⚪ Sem análise",
    description: "Lead sem dados completos de financiamento",
    color: "#475569",
    background: "#f1f5f9",
    score,
    commitment,
    installment
  };
}

function Leads() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [leads, setLeads] = useState([]);
  const [onlineBrokers, setOnlineBrokers] = useState([]);
  const [assignableBrokers, setAssignableBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [assignLoadingId, setAssignLoadingId] = useState("");
  const [search, setSearch] = useState("");

  async function loadData(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const requests = [api.get("/leads")];

      if (user.role === "ADMIN") {
        requests.push(api.get("/users/online-brokers"));
        requests.push(api.get("/users/assignable-brokers"));
      }

      const responses = await Promise.all(requests);

      setLeads(responses[0].data || []);

      if (user.role === "ADMIN") {
        setOnlineBrokers(responses[1].data || []);
        setAssignableBrokers(responses[2].data || []);
      } else {
        setOnlineBrokers([]);
        setAssignableBrokers([]);
      }
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      alert(error.response?.data?.error || "Erro ao carregar leads.");
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

  async function handleAssignBroker(id, brokerId) {
    try {
      setAssignLoadingId(id);

      await api.patch(`/leads/${id}/assign`, {
        brokerId: brokerId || null
      });

      await loadData(false);
    } catch (error) {
      console.error("Erro ao atribuir corretor:", error);
      alert(error.response?.data?.error || "Erro ao atribuir corretor.");
    } finally {
      setAssignLoadingId("");
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
      return {
        background: "rgba(37, 99, 235, 0.12)",
        color: "#1d4ed8",
        border: "1px solid rgba(37, 99, 235, 0.18)"
      };
    }

    if (status === "EM_ATENDIMENTO") {
      return {
        background: "rgba(217, 119, 6, 0.12)",
        color: "#b45309",
        border: "1px solid rgba(217, 119, 6, 0.18)"
      };
    }

    if (status === "ATENDIDO") {
      return {
        background: "rgba(22, 163, 74, 0.12)",
        color: "#166534",
        border: "1px solid rgba(22, 163, 74, 0.18)"
      };
    }

    if (status === "DESCARTADO") {
      return {
        background: "rgba(220, 38, 38, 0.12)",
        color: "#b91c1c",
        border: "1px solid rgba(220, 38, 38, 0.18)"
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #e5e7eb"
    };
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
          <span style={styles.sectionBadge}>Painel comercial</span>
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
            <div>
              <h2 style={styles.onlineTitle}>Corretores online</h2>
              <p style={styles.onlineSubtitle}>
                Usuários disponíveis para receber atendimento
              </p>
            </div>
            <span style={styles.onlineCount}>{onlineBrokers.length}</span>
          </div>

          {onlineBrokers.length === 0 ? (
            <p style={styles.emptyText}>Nenhum corretor online no momento.</p>
          ) : (
            <div style={styles.brokersGrid}>
              {onlineBrokers.map((broker) => (
                <div key={broker.id} style={styles.brokerCard}>
                  <div style={styles.brokerAvatar}>
                    {broker.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>

                  <div style={styles.brokerInfo}>
                    <strong style={styles.brokerName}>{broker.name}</strong>
                    <span style={styles.brokerEmail}>
                      {broker.email} ({broker.role})
                    </span>
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
          <p style={styles.loadingText}>Carregando leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p style={styles.loadingText}>Nenhum lead encontrado.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Contato</th>
                  <th style={styles.th}>Mensagem</th>
                  <th style={styles.th}>Corretor</th>
                  {user.role === "ADMIN" && (
                    <th style={styles.th}>Atribuir corretor</th>
                  )}
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const analysis = getLeadAnalysis(lead.message);

                  return (
                    <tr key={lead.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.clientBlock}>
                          <div style={styles.clientAvatar}>
                            {lead.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <div style={styles.mainText}>{lead.name}</div>
                            <div style={styles.subText}>
                              {new Date(lead.createdAt).toLocaleString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.contactPrimary}>{lead.phone || "-"}</div>
                        <div style={styles.subText}>{lead.email || "-"}</div>
                      </td>

                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.analysisBox,
                            background: analysis.background,
                            color: analysis.color
                          }}
                        >
                          <strong>{analysis.label}</strong>
                          <span>{analysis.description}</span>
                          <small>
                            Score: {analysis.score || "-"} | Parcela:{" "}
                            {analysis.installment || "-"} | Renda:{" "}
                            {analysis.commitment || "-"}
                          </small>
                        </div>

                        <div style={styles.messageBox}>
                          {lead.message || "Sem mensagem"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.assignedBox}>
                          {lead.assignedTo?.name || "Não atribuído"}
                        </div>
                      </td>

                      {user.role === "ADMIN" && (
                        <td style={styles.td}>
                          <select
                            style={styles.select}
                            value={lead.assignedTo?.id || ""}
                            onChange={(e) =>
                              handleAssignBroker(lead.id, e.target.value)
                            }
                            disabled={assignLoadingId === lead.id}
                          >
                            <option value="">Não atribuído</option>
                            {assignableBrokers.map((broker) => (
                              <option key={broker.id} value={broker.id}>
                                {broker.name} ({broker.role})
                                {broker.online ? " - online" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

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
                  );
                })}
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
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #f3f4f6 38%, #eef2f7 100%)",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap"
  },
  sectionBadge: {
    display: "inline-block",
    marginBottom: "12px",
    padding: "7px 14px",
    borderRadius: "999px",
    background: "#f4ead0",
    color: "#8a6a12",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.02em"
  },
  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.08,
    color: "#0f172a",
    fontWeight: "800"
  },
  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "17px"
  },
  refreshButton: {
    padding: "14px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px"
  },
  statCard: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(6px)",
    borderRadius: "22px",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    padding: "22px"
  },
  statLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "10px",
    fontWeight: "700"
  },
  statValue: {
    fontSize: "32px",
    color: "#0f172a",
    fontWeight: "800"
  },
  onlineSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "24px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
    padding: "24px"
  },
  onlineHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "18px",
    flexWrap: "wrap"
  },
  onlineTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#0f172a",
    fontWeight: "800"
  },
  onlineSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px"
  },
  onlineCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "900",
    fontSize: "18px",
    padding: "0 14px"
  },
  brokersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "14px"
  },
  brokerCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    background: "#f8fafc",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)"
  },
  brokerAvatar: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px",
    flexShrink: 0,
    boxShadow: "0 10px 20px rgba(37,99,235,0.18)"
  },
  brokerInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column"
  },
  brokerName: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "800"
  },
  brokerEmail: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  onlinePill: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
    padding: "24px"
  },
  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "22px",
    flexWrap: "wrap"
  },
  searchInput: {
    flex: 1,
    minWidth: "280px",
    padding: "15px 16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    fontSize: "15px",
    outline: "none"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 14px"
  },
  th: {
    textAlign: "left",
    padding: "0 14px 8px",
    color: "#475569",
    fontSize: "14px",
    whiteSpace: "nowrap",
    fontWeight: "800"
  },
  tr: {
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
  },
  td: {
    padding: "18px 14px",
    color: "#111827",
    fontSize: "14px",
    verticalAlign: "top",
    borderTop: "1px solid #eef2f7",
    borderBottom: "1px solid #eef2f7"
  },
  clientBlock: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  clientAvatar: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0
  },
  mainText: {
    fontWeight: "800",
    fontSize: "16px",
    color: "#0f172a",
    lineHeight: 1.3
  },
  contactPrimary: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px"
  },
  subText: {
    color: "#64748b",
    fontSize: "13px",
    marginTop: "4px",
    lineHeight: 1.5
  },
  messageBox: {
    maxWidth: "320px",
    lineHeight: 1.55,
    color: "#1e293b",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "12px 14px",
    borderRadius: "14px",
    whiteSpace: "pre-line"
  },
  analysisBox: {
    maxWidth: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    lineHeight: 1.45,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    padding: "12px 14px",
    borderRadius: "14px",
    marginBottom: "10px"
  },
  assignedBox: {
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 1.45
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  whatsButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "44px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #16a34a 0%, #16a34a 100%)",
    color: "#fff",
    fontWeight: "800",
    textDecoration: "none",
    boxShadow: "0 10px 20px rgba(22,163,74,0.16)"
  },
  select: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    minWidth: "220px",
    background: "#fff",
    fontSize: "14px",
    outline: "none"
  },
  loadingText: {
    color: "#64748b",
    margin: 0
  },
  emptyText: {
    color: "#64748b",
    margin: 0
  }
};

export default Leads;