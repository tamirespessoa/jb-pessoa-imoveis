import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Leads.css";

const STATUS_OPTIONS = [
  ["NOVO", "Novo"],
  ["CONTATO_REALIZADO", "Contato realizado"],
  ["EM_ATENDIMENTO", "Em atendimento"],
  ["QUALIFICADO", "Qualificado"],
  ["SIMULACAO", "Simulação"],
  ["VISITA_AGENDADA", "Visita agendada"],
  ["VISITA_REALIZADA", "Visita realizada"],
  ["PROPOSTA", "Proposta"],
  ["DOCUMENTACAO", "Documentação"],
  ["CONVERTIDO", "Vendido / Convertido"],
  ["ATENDIDO", "Atendido (legado)"],
  ["SEM_RESPOSTA", "Sem resposta"],
  ["SEM_RENDA", "Sem renda"],
  ["SEM_ENTRADA", "Sem entrada"],
  ["NAO_INTERESSADO", "Não interessado"],
  ["INVALIDO", "Inválido"],
  ["DESCARTADO", "Descartado (legado)"],
  ["PERDIDO", "Perdido"]
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS);

const CLOSED_LOST = new Set([
  "SEM_RESPOSTA",
  "SEM_RENDA",
  "SEM_ENTRADA",
  "NAO_INTERESSADO",
  "INVALIDO",
  "DESCARTADO",
  "PERDIDO"
]);

function getLeadField(message, label) {
  if (!message) return "";
  const parts = String(message).split(" | ");
  const found = parts.find((part) => part.startsWith(`${label}:`));
  return found ? found.replace(`${label}:`, "").trim() : "";
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";

  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getLeadAnalysis(lead) {
  if (lead.temperature === "QUENTE") {
    return {
      label: "🔥 Quente",
      description: "Alta prioridade",
      className: "lead-priority lead-priority-hot"
    };
  }

  if (lead.temperature === "MORNO") {
    return {
      label: "🟡 Morno",
      description: "Média prioridade",
      className: "lead-priority lead-priority-warm"
    };
  }

  const automaticStatus = getLeadField(lead.message, "Análise automática");

  if (automaticStatus.includes("Boa chance")) {
    return {
      label: "🟢 Alta prioridade",
      description: "Bom perfil na pré-análise",
      className: "lead-priority lead-priority-good"
    };
  }

  if (automaticStatus.includes("Atenção")) {
    return {
      label: "🟡 Média prioridade",
      description: "Precisa de análise",
      className: "lead-priority lead-priority-warm"
    };
  }

  if (automaticStatus.includes("Alto risco")) {
    return {
      label: "🔴 Baixa prioridade",
      description: "Revisar condições",
      className: "lead-priority lead-priority-low"
    };
  }

  return {
    label: "⚪ Frio",
    description: "Ainda não qualificado",
    className: "lead-priority"
  };
}

function statusClass(status) {
  if (status === "NOVO") return "status-badge status-new";

  if (
    [
      "CONTATO_REALIZADO",
      "EM_ATENDIMENTO",
      "SIMULACAO",
      "VISITA_AGENDADA",
      "VISITA_REALIZADA"
    ].includes(status)
  ) {
    return "status-badge status-progress";
  }

  if (["QUALIFICADO", "PROPOSTA", "DOCUMENTACAO"].includes(status)) {
    return "status-badge status-qualified";
  }

  if (["CONVERTIDO", "ATENDIDO"].includes(status)) {
    return "status-badge status-won";
  }

  if (CLOSED_LOST.has(status)) return "status-badge status-lost";

  return "status-badge";
}

function Leads() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canManageAll = ["ADMIN", "GERENTE"].includes(user.role);

  const [leads, setLeads] = useState([]);
  const [onlineBrokers, setOnlineBrokers] = useState([]);
  const [assignableBrokers, setAssignableBrokers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [assignLoadingId, setAssignLoadingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [temperatureFilter, setTemperatureFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [savingLead, setSavingLead] = useState(false);

  async function loadData(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      const requests = [api.get("/leads")];

      if (canManageAll) {
        requests.push(api.get("/users/online-brokers"));
        requests.push(api.get("/users/assignable-brokers"));
        requests.push(api.get("/traffic/campaigns"));
      }

      const responses = await Promise.all(requests);

      setLeads(responses[0].data || []);

      if (canManageAll) {
        setOnlineBrokers(responses[1].data || []);
        setAssignableBrokers(responses[2].data || []);
        setCampaigns(responses[3].data || []);
      } else {
        setOnlineBrokers([]);
        setAssignableBrokers([]);
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      alert(error.response?.data?.error || "Erro ao carregar leads.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const sources = useMemo(() => {
    return [...new Set(leads.map((lead) => lead.source).filter(Boolean))].sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !term ||
        `${lead.name || ""} ${lead.phone || ""} ${lead.email || ""} ${
          lead.message || ""
        } ${lead.assignedTo?.name || ""} ${lead.property?.code || ""} ${
          lead.property?.title || ""
        } ${lead.campaignName || ""} ${lead.source || ""}`
          .toLowerCase()
          .includes(term);

      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesSource = !sourceFilter || lead.source === sourceFilter;
      const matchesTemperature =
        !temperatureFilter || lead.temperature === temperatureFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesTemperature
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
    temperatureFilter
  ]);

  const stats = useMemo(() => {
    const won = leads.filter((lead) =>
      ["CONVERTIDO", "ATENDIDO"].includes(lead.status)
    ).length;

    const lost = leads.filter((lead) => CLOSED_LOST.has(lead.status)).length;

    return {
      total: leads.length,
      novos: leads.filter((lead) => lead.status === "NOVO").length,
      qualificados: leads.filter((lead) => lead.status === "QUALIFICADO").length,
      visitas: leads.filter((lead) =>
        ["VISITA_AGENDADA", "VISITA_REALIZADA"].includes(lead.status)
      ).length,
      propostas: leads.filter((lead) => lead.status === "PROPOSTA").length,
      won,
      lost
    };
  }, [leads]);

  async function handleStatusChange(id, status) {
    try {
      setStatusLoadingId(id);
      await api.patch(`/leads/${id}/status`, { status });
      await loadData(false);

      setSelectedLead((current) =>
        current?.id === id ? { ...current, status } : current
      );
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
    const rawPhone = String(lead.phone || "").replace(/\D/g, "");
    const phone =
      rawPhone.startsWith("55") && rawPhone.length >= 12
        ? rawPhone
        : `55${rawPhone}`;

    const brokerName = lead.assignedTo?.name || user.name || "corretor";
    const propertyRef = lead.property?.code
      ? ` sobre o imóvel ${lead.property.code}`
      : "";

    const message = `Olá, ${lead.name}. Sou ${brokerName} da JB Pessoa Imóveis e estou entrando em contato${propertyRef}.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  async function openLead(lead) {
    try {
      const response = await api.get(`/leads/${lead.id}`);
      setSelectedLead(response.data);
    } catch (error) {
      console.error("Erro ao abrir lead:", error);
      setSelectedLead(lead);
    }
  }

  function updateSelectedField(field, value) {
    setSelectedLead((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveSelectedLead() {
    if (!selectedLead) return;

    try {
      setSavingLead(true);

      const payload = {
        temperature: selectedLead.temperature || "FRIO",
        monthlyIncome: selectedLead.monthlyIncome,
        familyIncome: selectedLead.familyIncome,
        downPayment: selectedLead.downPayment,
        hasFgts: selectedLead.hasFgts,
        fgtsValue: selectedLead.fgtsValue,
        needsFinancing: selectedLead.needsFinancing,
        financingApproved: selectedLead.financingApproved,
        desiredRegion: selectedLead.desiredRegion,
        desiredCity: selectedLead.desiredCity,
        purchaseTime: selectedLead.purchaseTime,
        notes: selectedLead.notes,
        lossReason: selectedLead.lossReason,
        campaignId: selectedLead.campaignId,
        campaignName: selectedLead.campaignName,
        adSetName: selectedLead.adSetName,
        adName: selectedLead.adName
      };

      const response = await api.patch(`/leads/${selectedLead.id}`, payload);

      setSelectedLead(response.data);
      await loadData(false);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      alert(error.response?.data?.error || "Erro ao salvar dados do lead.");
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <div className="leads-page-v2">
      <section className="leads-hero">
        <div>
          <span className="leads-kicker">CRM • FUNIL COMERCIAL</span>
          <h1>{canManageAll ? "Central de Leads" : "Meus Leads"}</h1>
          <p>
            Acompanhe origem, qualificação, imóvel, corretor e evolução de cada
            oportunidade até a venda.
          </p>
        </div>

        <button
          type="button"
          className="leads-refresh"
          onClick={() => loadData(true)}
        >
          Atualizar
        </button>
      </section>

      <section className="lead-stat-grid">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Novos" value={stats.novos} />
        <StatCard label="Qualificados" value={stats.qualificados} />
        <StatCard label="Visitas" value={stats.visitas} />
        <StatCard label="Propostas" value={stats.propostas} />
        <StatCard label="Convertidos" value={stats.won} highlight />
        <StatCard label="Perdidos" value={stats.lost} />
      </section>

      {canManageAll && (
        <section className="online-brokers-panel">
          <div>
            <strong>Corretores online</strong>
            <span>
              {onlineBrokers.length
                ? onlineBrokers.map((broker) => broker.name).join(" • ")
                : "Nenhum corretor online no momento"}
            </span>
          </div>
          <div className="online-counter">{onlineBrokers.length}</div>
        </section>
      )}

      <section className="lead-filters">
        <input
          placeholder="Buscar nome, telefone, imóvel, campanha ou corretor..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
        >
          <option value="">Todas as origens</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        <select
          value={temperatureFilter}
          onChange={(event) => setTemperatureFilter(event.target.value)}
        >
          <option value="">Todas as temperaturas</option>
          <option value="QUENTE">Quente</option>
          <option value="MORNO">Morno</option>
          <option value="FRIO">Frio</option>
        </select>
      </section>

      <section className="leads-table-card">
        {loading ? (
          <div className="leads-loading">Carregando leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="leads-loading">Nenhum lead encontrado.</div>
        ) : (
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Origem / Campanha</th>
                  <th>Imóvel</th>
                  <th>Prioridade</th>
                  <th>Corretor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => {
                  const analysis = getLeadAnalysis(lead);

                  return (
                    <tr key={lead.id}>
                      <td>
                        <button
                          type="button"
                          className="lead-client-button"
                          onClick={() => openLead(lead)}
                        >
                          <span className="lead-avatar">
                            {lead.name?.charAt(0)?.toUpperCase() || "L"}
                          </span>
                          <span>
                            <strong>{lead.name}</strong>
                            <small>{lead.phone || "-"}</small>
                            <small>
                              {new Date(lead.createdAt).toLocaleString("pt-BR")}
                            </small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <strong>{lead.source || "Não informado"}</strong>
                        <small className="table-subline">
                          {lead.campaignName ||
                            lead.sourceDetail ||
                            "Sem campanha identificada"}
                        </small>
                      </td>

                      <td>
                        {lead.property ? (
                          <>
                            <strong>
                              {lead.property.code || lead.property.title}
                            </strong>
                            <small className="table-subline">
                              {lead.property.district || lead.property.city || ""}
                            </small>
                          </>
                        ) : (
                          <span className="muted">Não vinculado</span>
                        )}
                      </td>

                      <td>
                        <div className={analysis.className}>
                          <strong>{analysis.label}</strong>
                          <small>{analysis.description}</small>
                        </div>
                      </td>

                      <td>
                        {canManageAll ? (
                          <select
                            className="table-select"
                            value={lead.assignedTo?.id || ""}
                            onChange={(event) =>
                              handleAssignBroker(lead.id, event.target.value)
                            }
                            disabled={assignLoadingId === lead.id}
                          >
                            <option value="">Não atribuído</option>
                            {assignableBrokers.map((broker) => (
                              <option key={broker.id} value={broker.id}>
                                {broker.name}
                                {broker.online ? " • online" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          lead.assignedTo?.name || "Não atribuído"
                        )}
                      </td>

                      <td>
                        <select
                          className={`${statusClass(lead.status)} status-select`}
                          value={lead.status}
                          onChange={(event) =>
                            handleStatusChange(lead.id, event.target.value)
                          }
                          disabled={statusLoadingId === lead.id}
                        >
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <div className="lead-actions">
                          <button
                            type="button"
                            className="lead-details-button"
                            onClick={() => openLead(lead)}
                          >
                            Ver ficha
                          </button>

                          <a
                            className="lead-whatsapp-button"
                            href={getWhatsAppUrl(lead)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedLead && (
        <div
          className="lead-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLead(null);
          }}
        >
          <div className="lead-modal">
            <header className="lead-modal-header">
              <div>
                <span className="leads-kicker">FICHA DO LEAD</span>
                <h2>{selectedLead.name}</h2>
                <p>
                  {selectedLead.source || "Origem não informada"} •{" "}
                  {STATUS_LABELS[selectedLead.status] || selectedLead.status}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedLead(null)}
              >
                ×
              </button>
            </header>

            <div className="lead-modal-grid">
              <div className="lead-form-section">
                <h3>Qualificação</h3>

                <label>
                  Temperatura
                  <select
                    value={selectedLead.temperature || "FRIO"}
                    onChange={(event) =>
                      updateSelectedField("temperature", event.target.value)
                    }
                  >
                    <option value="FRIO">Frio</option>
                    <option value="MORNO">Morno</option>
                    <option value="QUENTE">Quente</option>
                  </select>
                </label>

                <div className="two-columns">
                  <label>
                    Renda mensal
                    <input
                      type="number"
                      value={selectedLead.monthlyIncome ?? ""}
                      onChange={(event) =>
                        updateSelectedField("monthlyIncome", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Renda familiar
                    <input
                      type="number"
                      value={selectedLead.familyIncome ?? ""}
                      onChange={(event) =>
                        updateSelectedField("familyIncome", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Entrada disponível
                    <input
                      type="number"
                      value={selectedLead.downPayment ?? ""}
                      onChange={(event) =>
                        updateSelectedField("downPayment", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Valor de FGTS
                    <input
                      type="number"
                      value={selectedLead.fgtsValue ?? ""}
                      onChange={(event) =>
                        updateSelectedField("fgtsValue", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="two-columns">
                  <BooleanSelect
                    label="Possui FGTS?"
                    value={selectedLead.hasFgts}
                    onChange={(value) => updateSelectedField("hasFgts", value)}
                  />

                  <BooleanSelect
                    label="Precisa financiar?"
                    value={selectedLead.needsFinancing}
                    onChange={(value) =>
                      updateSelectedField("needsFinancing", value)
                    }
                  />

                  <BooleanSelect
                    label="Financiamento aprovado?"
                    value={selectedLead.financingApproved}
                    onChange={(value) =>
                      updateSelectedField("financingApproved", value)
                    }
                  />
                </div>
              </div>

              <div className="lead-form-section">
                <h3>Interesse</h3>

                <label>
                  Região desejada
                  <input
                    value={selectedLead.desiredRegion || ""}
                    onChange={(event) =>
                      updateSelectedField("desiredRegion", event.target.value)
                    }
                  />
                </label>

                <label>
                  Cidade
                  <input
                    value={selectedLead.desiredCity || ""}
                    onChange={(event) =>
                      updateSelectedField("desiredCity", event.target.value)
                    }
                  />
                </label>

                <label>
                  Prazo para compra
                  <select
                    value={selectedLead.purchaseTime || ""}
                    onChange={(event) =>
                      updateSelectedField("purchaseTime", event.target.value)
                    }
                  >
                    <option value="">Não informado</option>
                    <option value="AGORA">Agora</option>
                    <option value="ATE_3_MESES">Até 3 meses</option>
                    <option value="3_A_6_MESES">3 a 6 meses</option>
                    <option value="MAIS_DE_6_MESES">Mais de 6 meses</option>
                  </select>
                </label>

                <div className="lead-property-box">
                  <span>Imóvel de interesse</span>
                  <strong>
                    {selectedLead.property
                      ? selectedLead.property.code ||
                        selectedLead.property.title
                      : "Não vinculado"}
                  </strong>
                  {selectedLead.property?.price && (
                    <small>{formatCurrency(selectedLead.property.price)}</small>
                  )}
                </div>
              </div>

              <div className="lead-form-section">
                <h3>Marketing</h3>

                <label>
                  Campanha
                  {canManageAll ? (
                    <select
                      value={selectedLead.campaignId || ""}
                      onChange={(event) => {
                        const campaignId = event.target.value;
                        const campaign = campaigns.find((item) => item.id === campaignId);
                        setSelectedLead((current) => ({
                          ...current,
                          campaignId: campaignId || null,
                          campaignName: campaign?.name || ""
                        }));
                      }}
                    >
                      <option value="">Sem campanha vinculada</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={selectedLead.campaignName || ""} readOnly />
                  )}
                </label>

                <label>
                  Conjunto de anúncios
                  <input
                    value={selectedLead.adSetName || ""}
                    onChange={(event) =>
                      updateSelectedField("adSetName", event.target.value)
                    }
                  />
                </label>

                <label>
                  Anúncio
                  <input
                    value={selectedLead.adName || ""}
                    onChange={(event) =>
                      updateSelectedField("adName", event.target.value)
                    }
                  />
                </label>

                <div className="tracking-box">
                  <span>Origem</span>
                  <strong>{selectedLead.source || "-"}</strong>
                  <small>
                    UTM: {selectedLead.utmSource || "-"} /{" "}
                    {selectedLead.utmCampaign || "-"}
                  </small>
                </div>
              </div>

              <div className="lead-form-section">
                <h3>Anotações</h3>

                <label>
                  Observações internas
                  <textarea
                    rows="7"
                    value={selectedLead.notes || ""}
                    onChange={(event) =>
                      updateSelectedField("notes", event.target.value)
                    }
                  />
                </label>

                <label>
                  Motivo da perda
                  <input
                    value={selectedLead.lossReason || ""}
                    onChange={(event) =>
                      updateSelectedField("lossReason", event.target.value)
                    }
                  />
                </label>

                {selectedLead.message && (
                  <div className="original-message">
                    <span>Mensagem original</span>
                    <p>{selectedLead.message}</p>
                  </div>
                )}
              </div>
            </div>

            <footer className="lead-modal-footer">
              <a
                className="lead-whatsapp-button"
                href={getWhatsAppUrl(selectedLead)}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>

              <button
                type="button"
                className="save-lead-button"
                onClick={saveSelectedLead}
                disabled={savingLead}
              >
                {savingLead ? "Salvando..." : "Salvar ficha"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function BooleanSelect({ label, value, onChange }) {
  return (
    <label>
      {label}
      <select
        value={value === true ? "true" : value === false ? "false" : ""}
        onChange={(event) => {
          if (event.target.value === "") {
            onChange(null);
          } else {
            onChange(event.target.value === "true");
          }
        }}
      >
        <option value="">Não informado</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>
    </label>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`lead-stat-card ${highlight ? "lead-stat-highlight" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Leads;
