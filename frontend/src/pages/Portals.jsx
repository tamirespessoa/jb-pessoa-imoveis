import { useEffect, useMemo, useState } from "react";
import "./Portals.css";

export default function Portals() {
  const [portals, setPortals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [summary, setSummary] = useState({
    activePortals: 0,
    publishedOnSite: 0,
    publishedOnPortals: 0,
    notPublished: 0
  });

  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3001";

  useEffect(() => {
    loadPortals();
  }, []);

  async function loadPortals() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${apiBaseUrl}/portals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar portais.");
      }

      setPortals(data.portals || []);

      setSummary({
        activePortals: data.summary?.activePortals || 0,
        publishedOnSite: data.summary?.publishedOnSite || 0,
        publishedOnPortals: data.summary?.publishedOnPortals || 0,
        notPublished: data.summary?.notPublished || 0
      });
    } catch (error) {
      console.error("Erro ao carregar portais:", error);
      setErrorMessage(
        error.message ||
          "Não foi possível carregar os dados reais dos portais."
      );
      setPortals([]);
      setSummary({
        activePortals: 0,
        publishedOnSite: 0,
        publishedOnPortals: 0,
        notPublished: 0
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredPortals = useMemo(() => {
    return portals.filter((portal) =>
      String(portal.name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [portals, search]);

  function handleOpenHistory(portal) {
    alert(`Histórico de cargas: ${portal.name}`);
  }

  function handleOpenProperties(portal) {
    alert(`Imóveis enviados para: ${portal.name}`);
  }

  function handleOpenSettings(portal) {
    alert(`Configurações do portal: ${portal.name}`);
  }

  return (
    <div className="portals-page">
      <div className="portals-header">
        <div>
          <span className="portals-badge">Integrações</span>
          <h1>Portais imobiliários</h1>
          <p>
            Acompanhe os portais ativos, imóveis publicados, destaques e última
            atualização das integrações.
          </p>
        </div>

        <button className="portals-add-button" type="button">
          + Adicionar portal
        </button>
      </div>

      <div className="portals-summary-card">
        <div className="portals-summary-item">
          <div className="summary-icon">🌐</div>
          <strong>{summary.activePortals}</strong>
          <span>portais ativos</span>
        </div>

        <div className="portals-summary-item">
          <div className="summary-icon">🏠</div>
          <strong>{summary.publishedOnSite}</strong>
          <span>publicados no site</span>
        </div>

        <div className="portals-summary-item">
          <div className="summary-icon">🏘️</div>
          <strong>{summary.publishedOnPortals}</strong>
          <span>publicados nos portais</span>
        </div>

        <div className="portals-summary-item danger">
          <div className="summary-icon">🚫</div>
          <strong>{summary.notPublished}</strong>
          <span>não publicados portais</span>
        </div>
      </div>

      <div className="portals-toolbar">
        <input
          type="text"
          placeholder="Buscar portal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="button" onClick={loadPortals} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {errorMessage && (
        <div className="portals-empty">
          {errorMessage}
        </div>
      )}

      <div className="portals-list">
        {loading && filteredPortals.length === 0 && (
          <div className="portals-empty">
            Carregando portais...
          </div>
        )}

        {!loading &&
          filteredPortals.map((portal) => (
            <div key={portal.id} className="portal-row">
              <div className="portal-brand">
                <div className="portal-logo">
                  <span>{portal.icon}</span>
                </div>

                <div>
                  <h3>{portal.name}</h3>
                  <p>{portal.active ? "Integração ativa" : "Integração inativa"}</p>
                </div>
              </div>

              <div className="portal-metric">
                <div className="metric-icon">🏠</div>
                <strong>{portal.sentProperties}</strong>
                <span>imóveis enviados</span>
              </div>

              <div className="portal-metric">
                <div className="metric-icon">☆</div>
                <strong>{portal.highlights}</strong>
                <span>imóveis em destaque</span>
              </div>

              <div className="portal-metric update">
                <div className="metric-icon">🕒</div>
                <strong>{portal.lastUpdate}</strong>
                <span>última atualização</span>
              </div>

              <div className="portal-status-area">
                <span className={portal.active ? "portal-status active" : "portal-status inactive"}>
                  {portal.active ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              <div className="portal-actions">
                <button type="button" onClick={() => handleOpenHistory(portal)}>
                  Histórico
                </button>

                <button type="button" onClick={() => handleOpenProperties(portal)}>
                  Imóveis enviados
                </button>

                <button type="button" onClick={() => handleOpenSettings(portal)}>
                  Configurações
                </button>
              </div>
            </div>
          ))}

        {!loading && filteredPortals.length === 0 && !errorMessage && (
          <div className="portals-empty">
            Nenhum portal encontrado.
          </div>
        )}
      </div>
    </div>
  );
}