import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [owners, setOwners] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [propertiesRes, personsRes, usersRes] = await Promise.all([
        api.get("/properties"),
        api.get("/persons"),
        user.role === "ADMIN" ? api.get("/users") : Promise.resolve({ data: [] })
      ]);

      const persons = personsRes.data || [];
      const allProperties = propertiesRes.data || [];

      setProperties(allProperties);
      setClients(persons.filter((item) => item.type === "CLIENTE"));
      setOwners(persons.filter((item) => item.type === "PROPRIETARIO"));
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const available = properties.filter(
      (item) => item.status === "DISPONIVEL"
    ).length;

    const rented = properties.filter(
      (item) => item.status === "ALUGADO"
    ).length;

    const sold = properties.filter(
      (item) => item.status === "VENDIDO"
    ).length;

    return {
      totalProperties: properties.length,
      totalClients: clients.length,
      totalOwners: owners.length,
      totalUsers: users.length,
      available,
      rented,
      sold
    };
  }, [properties, clients, owners, users]);

  const recentProperties = useMemo(() => {
    return [...properties].slice(0, 5);
  }, [properties]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.heroTitle}>
            Olá, {user.name || "Usuário"}
          </h1>
          <p style={styles.heroSubtitle}>
            Bem-vindo ao painel da JB Pessoa Imóveis
          </p>
        </div>

        <div style={styles.heroBadge}>
          {user.role === "ADMIN" ? "Administrador" : "Corretor"}
        </div>
      </div>

      <div style={styles.cardsGrid}>
        <StatCard
          title="Imóveis cadastrados"
          value={stats.totalProperties}
          subtitle="Base total do sistema"
        />
        <StatCard
          title="Clientes"
          value={stats.totalClients}
          subtitle="Clientes cadastrados"
        />
        <StatCard
          title="Proprietários"
          value={stats.totalOwners}
          subtitle="Proprietários cadastrados"
        />
        {user.role === "ADMIN" && (
          <StatCard
            title="Usuários"
            value={stats.totalUsers}
            subtitle="Admins e corretores"
          />
        )}
      </div>

      <div style={styles.statusGrid}>
        <StatusCard
          title="Disponíveis"
          value={stats.available}
          tone="blue"
        />
        <StatusCard
          title="Alugados"
          value={stats.rented}
          tone="green"
        />
        <StatusCard
          title="Vendidos"
          value={stats.sold}
          tone="purple"
        />
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Atalhos rápidos</h2>
          </div>

          <div style={styles.quickGrid}>
            <QuickAction title="Novo cliente" path="/clientes" />
            <QuickAction title="Novo proprietário" path="/proprietarios" />
            <QuickAction title="Novo imóvel" path="/imoveis" />
            <QuickAction title="Documentos" path="/documentos" />
            <QuickAction title="Agenda" path="/agendamentos" />
            {user.role === "ADMIN" && (
              <QuickAction title="Usuários" path="/usuarios" />
            )}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Imóveis recentes</h2>
          </div>

          {recentProperties.length === 0 ? (
            <div style={styles.emptyState}>Nenhum imóvel cadastrado.</div>
          ) : (
            <div style={styles.recentList}>
              {recentProperties.map((property) => (
                <div key={property.id} style={styles.recentItem}>
                  <div>
                    <div style={styles.recentTitle}>
                      {property.title || "Imóvel sem título"}
                    </div>
                    <div style={styles.recentMeta}>
                      {property.city || "-"} / {property.state || "-"} •{" "}
                      {property.type || "-"}
                    </div>
                  </div>

                  <div style={styles.recentRight}>
                    <div style={styles.price}>
                      {formatCurrency(property.price)}
                    </div>
                    <div style={styles.statusBadge(property.status)}>
                      {property.status || "SEM STATUS"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statSubtitle}>{subtitle}</div>
    </div>
  );
}

function StatusCard({ title, value, tone }) {
  return (
    <div
      style={{
        ...styles.statusCard,
        ...(tone === "blue"
          ? styles.toneBlue
          : tone === "green"
          ? styles.toneGreen
          : styles.tonePurple)
      }}
    >
      <div style={styles.statusTitle}>{title}</div>
      <div style={styles.statusValue}>{value}</div>
    </div>
  );
}

function QuickAction({ title, path }) {
  return (
    <a href={path} style={styles.quickAction}>
      {title}
    </a>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";

  const number = Number(value);
  if (Number.isNaN(number)) return value;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

const styles = {
  page: {
    padding: "24px",
    backgroundColor: "#f5f7fb",
    minHeight: "100vh"
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "32px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)"
  },
  hero: {
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "#fff",
    borderRadius: "24px",
    padding: "28px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
    boxShadow: "0 12px 36px rgba(29, 78, 216, 0.20)"
  },
  heroTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800"
  },
  heroSubtitle: {
    margin: "8px 0 0",
    fontSize: "15px",
    opacity: 0.92
  },
  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "700"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "18px"
  },
  statCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb"
  },
  statTitle: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "12px",
    fontWeight: "600"
  },
  statValue: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#0f172a"
  },
  statSubtitle: {
    marginTop: "8px",
    color: "#94a3b8",
    fontSize: "13px"
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "24px"
  },
  statusCard: {
    borderRadius: "18px",
    padding: "20px",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
  },
  toneBlue: {
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
  },
  toneGreen: {
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)"
  },
  tonePurple: {
    background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)"
  },
  statusTitle: {
    fontSize: "14px",
    opacity: 0.95
  },
  statusValue: {
    marginTop: "10px",
    fontSize: "30px",
    fontWeight: "800"
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "18px"
  },
  panel: {
    background: "#fff",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb"
  },
  panelHeader: {
    marginBottom: "16px"
  },
  panelTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a"
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  quickAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "56px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: "700"
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  recentItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    padding: "16px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0"
  },
  recentTitle: {
    fontWeight: "700",
    color: "#0f172a"
  },
  recentMeta: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "13px"
  },
  recentRight: {
    textAlign: "right"
  },
  price: {
    fontWeight: "800",
    color: "#0f172a"
  },
  statusBadge: (status) => ({
    marginTop: "8px",
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor:
      status === "DISPONIVEL"
        ? "#dbeafe"
        : status === "ALUGADO"
        ? "#dcfce7"
        : status === "VENDIDO"
        ? "#ede9fe"
        : "#e5e7eb",
    color:
      status === "DISPONIVEL"
        ? "#1d4ed8"
        : status === "ALUGADO"
        ? "#166534"
        : status === "VENDIDO"
        ? "#6d28d9"
        : "#374151"
  }),
  emptyState: {
    color: "#64748b",
    padding: "18px 0"
  }
};

export default Dashboard;