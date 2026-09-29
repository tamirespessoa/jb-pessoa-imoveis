import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./TrafficDashboard.css";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function number(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function percent(value) {
  return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

function todayMinus(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function TrafficDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    startDate: todayMinus(30),
    endDate: new Date().toISOString().slice(0, 10)
  });

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/traffic/dashboard", { params: filters });
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Não foi possível carregar a Central de Tráfego.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return <div className="traffic-page"><div className="traffic-loading">Carregando Central de Tráfego...</div></div>;
  }

  const summary = data?.summary || {};
  const funnel = data?.funnel || {};
  const campaigns = data?.campaigns || [];
  const sources = data?.sources || [];
  const recentLeads = data?.recentLeads || [];

  return (
    <div className="traffic-page">
      <div className="traffic-hero">
        <div>
          <div className="traffic-kicker">MARKETING E PERFORMANCE</div>
          <h1>Central de Tráfego</h1>
          <p>Veja quanto a JB investe, quantos leads chegam e quais campanhas realmente viram negócios.</p>
        </div>
        <button className="traffic-primary" onClick={() => navigate("/campanhas")}>+ Nova campanha</button>
      </div>

      <div className="traffic-filterbar">
        <label>
          De
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
        </label>
        <label>
          Até
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
        </label>
        <button onClick={load}>Aplicar período</button>
      </div>

      {error && <div className="traffic-error">{error}</div>}

      <div className="traffic-cards">
        <Metric title="Investimento" value={money(summary.spent)} detail="Valor gasto nas campanhas" />
        <Metric title="Leads" value={number(summary.leads)} detail={`CPL ${money(summary.cpl)}`} />
        <Metric title="Qualificados" value={number(summary.qualified)} detail="Leads com potencial real" />
        <Metric title="Visitas" value={number(summary.visits)} detail="Agendadas/realizadas" />
        <Metric title="Propostas" value={number(summary.proposals)} detail="Em negociação" />
        <Metric title="Vendas" value={number(summary.sales)} detail={`Conversão ${percent(summary.conversionRate)}`} />
        <Metric title="Comissão gerada" value={money(summary.commissionGenerated)} detail={`ROI ${percent(summary.roi)}`} highlight />
        <Metric title="Custo por venda" value={money(summary.costPerSale)} detail="Investimento ÷ vendas" />
      </div>

      <div className="traffic-grid-2">
        <section className="traffic-panel">
          <div className="traffic-panel-title">
            <div>
              <h2>Funil comercial</h2>
              <p>Da entrada do lead até a conversão</p>
            </div>
          </div>
          <Funnel label="Leads recebidos" value={funnel.leads} max={funnel.leads} />
          <Funnel label="Qualificados" value={funnel.qualified} max={funnel.leads} />
          <Funnel label="Visitas" value={funnel.visits} max={funnel.leads} />
          <Funnel label="Propostas" value={funnel.proposals} max={funnel.leads} />
          <Funnel label="Vendas" value={funnel.sales} max={funnel.leads} />
        </section>

        <section className="traffic-panel">
          <div className="traffic-panel-title">
            <div>
              <h2>Origem dos leads</h2>
              <p>Onde os contatos estão chegando</p>
            </div>
          </div>
          {sources.length === 0 ? (
            <div className="traffic-empty">Ainda não há leads no período.</div>
          ) : (
            <div className="source-list">
              {sources.map((item) => (
                <div className="source-row" key={item.source}>
                  <span>{item.source}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="traffic-panel traffic-table-panel">
        <div className="traffic-panel-title traffic-title-actions">
          <div>
            <h2>Performance por campanha</h2>
            <p>Compare gasto, CPL e resultado comercial</p>
          </div>
          <button className="traffic-link-button" onClick={() => navigate("/campanhas")}>Gerenciar campanhas</button>
        </div>
        <div className="traffic-table-wrap">
          <table className="traffic-table">
            <thead>
              <tr>
                <th>Campanha</th><th>Plataforma</th><th>Gasto</th><th>Leads</th><th>CPL</th><th>Qualif.</th><th>Visitas</th><th>Propostas</th><th>Vendas</th><th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan="10" className="traffic-empty-cell">Nenhuma campanha cadastrada.</td></tr>
              ) : campaigns.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><small>{item.property?.code ? `${item.property.code} · ` : ""}{item.property?.title || "Sem imóvel vinculado"}</small></td>
                  <td>{item.platform}</td>
                  <td>{money(item.spent)}</td>
                  <td>{item.leads}</td>
                  <td>{money(item.cpl)}</td>
                  <td>{item.qualified}</td>
                  <td>{item.visits}</td>
                  <td>{item.proposals}</td>
                  <td><strong>{item.sales}</strong></td>
                  <td className={Number(item.roi) >= 0 ? "roi-positive" : "roi-negative"}>{percent(item.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="traffic-panel">
        <div className="traffic-panel-title">
          <div>
            <h2>Leads recentes</h2>
            <p>Últimos contatos recebidos no período</p>
          </div>
        </div>
        <div className="recent-leads">
          {recentLeads.length === 0 ? <div className="traffic-empty">Nenhum lead recente.</div> : recentLeads.map((lead) => (
            <div className="recent-lead" key={lead.id}>
              <div>
                <strong>{lead.name}</strong>
                <span>{lead.campaignName || lead.source || "Origem não informada"}</span>
              </div>
              <div className="recent-lead-right">
                <span>{lead.property?.code || "Sem imóvel"}</span>
                <b>{lead.status}</b>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, detail, highlight = false }) {
  return <div className={`traffic-metric ${highlight ? "traffic-metric-highlight" : ""}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Funnel({ label, value = 0, max = 0 }) {
  const width = max > 0 ? Math.max(4, (Number(value || 0) / max) * 100) : 0;
  return <div className="funnel-row"><div className="funnel-label"><span>{label}</span><strong>{value || 0}</strong></div><div className="funnel-track"><div className="funnel-bar" style={{ width: `${width}%` }} /></div></div>;
}
