import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Portals() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);

  const [portals, setPortals] = useState([
    {
      id: "site",
      name: "Site da Imobiliária",
      icon: "🏠",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Imóveis publicados diretamente no seu site oficial.",
      url: "/imoveis"
    },
    {
      id: "facebook-marketplace",
      name: "Facebook Marketplace",
      icon: "📘",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Publicação manual ou catálogo pelo Facebook Business.",
      url: "https://www.facebook.com/marketplace"
    },
    {
      id: "facebook-grupos",
      name: "Grupos do Facebook",
      icon: "👥",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Divulgação em grupos de bairro, compra, venda e aluguel.",
      url: "https://www.facebook.com/groups"
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📸",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Divulgação em posts, reels, stories e destaques.",
      url: "https://www.instagram.com"
    },
    {
      id: "whatsapp-status",
      name: "WhatsApp Status",
      icon: "🟢",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Divulgação rápida dos imóveis nos status do WhatsApp.",
      url: "https://web.whatsapp.com"
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "✈️",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Publicação em canais e grupos do Telegram.",
      url: "https://web.telegram.org"
    },
    {
      id: "olx",
      name: "OLX",
      icon: "🟠",
      type: "Gratuito / Pago",
      status: "ATIVO",
      configured: true,
      description: "Cadastro manual de anúncios; planos pagos aumentam alcance.",
      url: "https://www.olx.com.br"
    },
    {
      id: "google-business",
      name: "Google Perfil da Empresa",
      icon: "🔎",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Publicações no Perfil da Empresa para aparecer no Google.",
      url: "https://business.google.com"
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Vídeos curtos mostrando imóveis, bairros e oportunidades.",
      url: "https://www.tiktok.com"
    },
    {
      id: "youtube-shorts",
      name: "YouTube Shorts",
      icon: "▶️",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Vídeos curtos com tour dos imóveis e chamada para WhatsApp.",
      url: "https://www.youtube.com"
    },
    {
      id: "pinterest",
      name: "Pinterest",
      icon: "📌",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Divulgação de imagens dos imóveis e links para o site.",
      url: "https://www.pinterest.com"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      type: "Gratuito",
      status: "ATIVO",
      configured: true,
      description: "Divulgação institucional e imóveis comerciais.",
      url: "https://www.linkedin.com"
    },
    {
      id: "zap",
      name: "Zap Imóveis",
      icon: "⭐",
      type: "Pago",
      status: "INATIVO",
      configured: false,
      description: "Portal pago. Precisa de contrato/plano e integração liberada.",
      url: "https://www.zapimoveis.com.br"
    },
    {
      id: "vivareal",
      name: "VivaReal",
      icon: "🌟",
      type: "Pago",
      status: "INATIVO",
      configured: false,
      description: "Portal pago do grupo OLX/Zap. Precisa de plano comercial.",
      url: "https://www.vivareal.com.br"
    },
    {
      id: "imovelweb",
      name: "Imovelweb",
      icon: "🏢",
      type: "Pago",
      status: "INATIVO",
      configured: false,
      description: "Portal profissional. Ative quando contratar o plano.",
      url: "https://www.imovelweb.com.br"
    }
  ]);

  async function loadProperties() {
    try {
      const response = await api.get("/properties");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.properties || [];

      setProperties(data);
    } catch (error) {
      console.error("Erro ao carregar imóveis:", error.response?.data || error.message);
      setProperties([]);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  const activeProperties = useMemo(() => {
    return properties.filter((property) => {
      const status = String(property.status || "").toUpperCase();
      return (
        status === "DISPONIVEL" ||
        status === "DISPONÍVEL" ||
        status === "ATIVO" ||
        status === "PUBLICADO" ||
        !status
      );
    });
  }, [properties]);

  const highlightedProperties = useMemo(() => {
    return properties.filter(
      (property) =>
        property.featured === true ||
        property.isFeatured === true ||
        property.highlight === true ||
        property.destaque === true
    );
  }, [properties]);

  const filteredPortals = useMemo(() => {
    return portals.filter((portal) => {
      const matchesSearch = `${portal.name} ${portal.type} ${portal.status}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFree = onlyFree
        ? portal.type.toLowerCase().includes("gratuito")
        : true;

      return matchesSearch && matchesFree;
    });
  }, [portals, search, onlyFree]);

  function getSentCount(portal) {
    if (portal.status !== "ATIVO") return 0;

    if (portal.id === "facebook-marketplace") return Math.min(activeProperties.length, 10);
    if (portal.id === "facebook-grupos") return Math.min(activeProperties.length, 20);
    if (["instagram", "tiktok", "youtube-shorts"].includes(portal.id)) {
      return Math.min(activeProperties.length, 12);
    }

    return activeProperties.length;
  }

  function getFeaturedCount(portal) {
    if (portal.status !== "ATIVO") return 0;
    return highlightedProperties.length;
  }

  function getLastUpdate(portal) {
    if (!portal.configured) return "Não configurado";

    const dates = properties
      .map((property) => property.updatedAt || property.createdAt)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (dates.length === 0) return "Hoje";

    const latest = dates.sort((a, b) => b.getTime() - a.getTime())[0];

    return latest.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function togglePortalStatus(id) {
    setPortals((prev) =>
      prev.map((portal) => {
        if (portal.id !== id) return portal;

        const newStatus = portal.status === "ATIVO" ? "INATIVO" : "ATIVO";

        return {
          ...portal,
          status: newStatus,
          configured: newStatus === "ATIVO"
        };
      })
    );
  }

  function openPortal(portal) {
    if (portal.url.startsWith("/")) {
      navigate(portal.url);
      return;
    }

    window.open(portal.url, "_blank", "noopener,noreferrer");
  }

  function createPostText(portal) {
    return `JB Pessoa Imóveis\n\nTemos ${activeProperties.length} imóveis disponíveis para venda e locação.\n\nEntre em contato pelo WhatsApp e agende uma visita.\n\nPortal: ${portal.name}`;
  }

  async function copyPostText(portal) {
    try {
      await navigator.clipboard.writeText(createPostText(portal));
      alert(`Texto para ${portal.name} copiado com sucesso.`);
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
      alert("Não foi possível copiar o texto.");
    }
  }

  function renderPortalRow(portal) {
    const isActive = portal.status === "ATIVO";

    return (
      <div key={portal.id} style={styles.portalRow}>
        <div style={styles.portalNameBox}>
          <div style={styles.portalIconCircle}>{portal.icon}</div>

          <div>
            <h3 style={styles.portalTitle}>{portal.name}</h3>
            <p style={styles.portalSubtitle}>
              {portal.configured ? "Integração ativa" : "Integração inativa"}
            </p>
            <p style={styles.portalDescription}>{portal.description}</p>
            <span
              style={{
                ...styles.portalType,
                ...(portal.type.toLowerCase().includes("gratuito")
                  ? styles.portalTypeFree
                  : styles.portalTypePaid)
              }}
            >
              {portal.type}
            </span>
          </div>
        </div>

        <div style={styles.portalMetric}>
          <div style={styles.metricIcon}>🏠</div>
          <strong style={styles.metricNumber}>{getSentCount(portal)}</strong>
          <span style={styles.metricLabel}>imóveis enviados</span>
        </div>

        <div style={styles.portalMetric}>
          <div style={styles.metricIcon}>☆</div>
          <strong style={styles.metricNumber}>{getFeaturedCount(portal)}</strong>
          <span style={styles.metricLabel}>imóveis em destaque</span>
        </div>

        <div style={styles.portalMetric}>
          <div style={styles.metricIcon}>🕒</div>
          <strong
            style={{
              ...styles.lastUpdate,
              ...(!portal.configured ? styles.notConfigured : {})
            }}
          >
            {getLastUpdate(portal)}
          </strong>
          <span style={styles.metricLabel}>última atualização</span>
        </div>

        <div style={styles.statusBox}>
          <span
            style={{
              ...styles.statusText,
              ...(isActive ? styles.activeText : styles.inactiveText)
            }}
          >
            {portal.status}
          </span>

          <button
            type="button"
            style={{
              ...styles.toggleButton,
              ...(isActive ? styles.toggleButtonActive : styles.toggleButtonInactive)
            }}
            onClick={() => togglePortalStatus(portal.id)}
          >
            {isActive ? "Desativar" : "Ativar"}
          </button>

          <button type="button" style={styles.openButton} onClick={() => openPortal(portal)}>
            Abrir
          </button>

          <button type="button" style={styles.copyButton} onClick={() => copyPostText(portal)}>
            Copiar texto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button type="button" style={styles.backButton} onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <h1 style={styles.topTitle}>Portais e divulgações</h1>

        <button type="button" style={styles.refreshButton} onClick={loadProperties}>
          ↻
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Central de Portais</h2>
            <p style={styles.subtitle}>
              Gerencie os canais de divulgação gratuitos e pagos da imobiliária.
            </p>
          </div>

          <button type="button" style={styles.primaryButton} onClick={() => navigate("/imoveis")}>
            + Cadastrar imóvel
          </button>
        </div>

        <div style={styles.cardsGrid}>
          <div style={styles.summaryCard}>
            <strong>{activeProperties.length}</strong>
            <span>imóveis disponíveis</span>
          </div>

          <div style={styles.summaryCard}>
            <strong>{highlightedProperties.length}</strong>
            <span>imóveis em destaque</span>
          </div>

          <div style={styles.summaryCard}>
            <strong>{portals.filter((portal) => portal.status === "ATIVO").length}</strong>
            <span>canais ativos</span>
          </div>

          <div style={styles.summaryCard}>
            <strong>
              {portals.filter((portal) => portal.type.toLowerCase().includes("gratuito")).length}
            </strong>
            <span>portais gratuitos</span>
          </div>
        </div>

        <div style={styles.infoBox}>
          <strong>Importante:</strong> portais gratuitos como Facebook, Instagram,
          WhatsApp, Telegram, TikTok, YouTube Shorts e Google Perfil da Empresa
          exigem publicação manual ou catálogo. Portais como Zap e VivaReal
          dependem de contrato/plano comercial.
        </div>

        <div style={styles.filters}>
          <input
            style={styles.searchInput}
            placeholder="Buscar portal por nome, tipo ou status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={onlyFree}
              onChange={(event) => setOnlyFree(event.target.checked)}
            />
            Mostrar apenas gratuitos
          </label>
        </div>

        <div style={styles.portalList}>
          {filteredPortals.length === 0 ? (
            <div style={styles.emptyState}>Nenhum portal encontrado.</div>
          ) : (
            filteredPortals.map(renderPortalRow)
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#eeeeee",
    color: "#111827"
  },
  topBar: {
    height: "58px",
    backgroundColor: "#1e88e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "0 22px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
  },
  backButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer"
  },
  topTitle: {
    flex: 1,
    margin: 0,
    fontSize: "22px",
    fontWeight: "700"
  },
  refreshButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer"
  },
  content: {
    maxWidth: "1360px",
    margin: "0 auto",
    padding: "28px 18px 70px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "22px",
    marginBottom: "22px"
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "500"
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "16px"
  },
  primaryButton: {
    backgroundColor: "#d4a62a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px 20px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(212,166,42,0.25)"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "18px"
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  infoBox: {
    backgroundColor: "#fff8e1",
    border: "1px solid #f3d27a",
    borderRadius: "12px",
    padding: "14px 18px",
    color: "#6b4e00",
    marginBottom: "18px",
    lineHeight: 1.5
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "18px"
  },
  searchInput: {
    flex: 1,
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fff"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    fontWeight: "600",
    color: "#374151"
  },
  portalList: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
    overflow: "hidden"
  },
  portalRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1.1fr 1.1fr 1.3fr 1.1fr",
    alignItems: "center",
    gap: "14px",
    padding: "26px 28px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#fff"
  },
  portalNameBox: {
    display: "grid",
    gridTemplateColumns: "78px 1fr",
    alignItems: "center",
    gap: "18px"
  },
  portalIconCircle: {
    width: "74px",
    height: "74px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px"
  },
  portalTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "500"
  },
  portalSubtitle: {
    margin: "5px 0 4px",
    color: "#8b8b8b",
    fontSize: "14px"
  },
  portalDescription: {
    margin: "0 0 8px",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.35
  },
  portalType: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "800"
  },
  portalTypeFree: {
    backgroundColor: "#dcfce7",
    color: "#166534"
  },
  portalTypePaid: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  },
  portalMetric: {
    minHeight: "86px",
    borderLeft: "1px solid #eeeeee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  metricIcon: {
    fontSize: "26px",
    lineHeight: 1
  },
  metricNumber: {
    color: "#1e88e5",
    fontSize: "34px",
    fontWeight: "400",
    lineHeight: 1
  },
  metricLabel: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center"
  },
  lastUpdate: {
    color: "#1e88e5",
    fontSize: "16px",
    textAlign: "center"
  },
  notConfigured: {
    color: "#1e88e5"
  },
  statusBox: {
    minHeight: "86px",
    borderLeft: "1px solid #eeeeee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  statusText: {
    fontSize: "18px",
    fontWeight: "500"
  },
  activeText: {
    color: "#00a000"
  },
  inactiveText: {
    color: "#e11d22"
  },
  toggleButton: {
    width: "110px",
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  toggleButtonActive: {
    backgroundColor: "#ef4444"
  },
  toggleButtonInactive: {
    backgroundColor: "#16a34a"
  },
  openButton: {
    width: "110px",
    border: "1px solid #d4a62a",
    borderRadius: "8px",
    padding: "7px 10px",
    color: "#a16207",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  copyButton: {
    width: "110px",
    border: "1px solid #1e88e5",
    borderRadius: "8px",
    padding: "7px 10px",
    color: "#1e88e5",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280"
  }
};

export default Portals;
