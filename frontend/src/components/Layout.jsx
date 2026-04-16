import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  useEffect(() => {
    function syncUser() {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    }

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const topTabs = useMemo(
    () => [
      { label: "DASHBOARD", path: "/dashboard" },
      { label: "GESTÃO DE LEADS", path: "/clientes" },
      { label: "ATENDIMENTOS", path: "/clientes" },
      { label: "CENTRAL DE NEGÓCIOS", path: "/imoveis" },
      { label: "PROPRIETÁRIOS", path: "/proprietarios" },
      { label: "AGENDAMENTOS", path: "/agendamentos" },
      { label: "PORTAIS", path: "/documentos" },
      { label: "MEU SITE", path: "/site" }
    ],
    []
  );

  return (
    <div style={styles.container}>
      <Sidebar open={sidebarOpen} />

      <div style={styles.main}>
        <div style={styles.inner}>
          <div style={styles.topBarWrapper}>
            <div style={styles.topBar}>
              <button
                type="button"
                style={styles.menuButton}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </button>

              <div style={styles.searchWrapper}>
                <input
                  style={styles.searchInput}
                  placeholder="Pesquisar imóveis, leads ou clientes..."
                />
              </div>

              <div style={styles.topIcons}>
                <span style={styles.icon}>🏠</span>
                <span style={styles.icon}>👤</span>
                <span style={styles.icon}>🗓️</span>
                <span style={styles.icon}>💬</span>
                <span style={styles.icon}>🔔</span>
              </div>
            </div>

            <div style={styles.topTabs}>
              {topTabs.map((tab) => {
                const active = location.pathname === tab.path;

                return (
                  <button
                    key={`${tab.label}-${tab.path}`}
                    type="button"
                    onClick={() => navigate(tab.path)}
                    style={{
                      ...styles.topTabButton,
                      ...(active ? styles.topTabActive : {})
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.headerInfo}>
            <div style={styles.titleBlock}>
              <h1 style={styles.pageTitle}>JB Pessoa Imóveis</h1>
              <p style={styles.subtitle}>
                Sistema online para gestão de corretores, leads e imóveis
              </p>
            </div>

            <div style={styles.userBox}>
              <ProfileMenu user={user} />
            </div>
          </div>

          <main style={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#efefef",
    overflowX: "hidden"
  },

  main: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden"
  },

  inner: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    boxSizing: "border-box"
  },

  topBarWrapper: {
    width: "100%",
    padding: "22px 16px 0 16px",
    boxSizing: "border-box"
  },

  topBar: {
    width: "100%",
    minHeight: "76px",
    backgroundColor: "#06153b",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "14px 18px",
    boxSizing: "border-box",
    flexWrap: "wrap"
  },

  menuButton: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    flexShrink: 0
  },

  searchWrapper: {
    flex: 1,
    minWidth: "220px"
  },

  searchInput: {
    width: "100%",
    minWidth: 0,
    height: "42px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    padding: "0 18px",
    fontSize: "16px",
    boxSizing: "border-box"
  },

  topIcons: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    color: "#fff",
    fontSize: "22px",
    flexWrap: "wrap",
    flexShrink: 0
  },

  icon: {
    cursor: "pointer"
  },

  topTabs: {
    display: "flex",
    gap: "28px",
    padding: "18px 0 14px 0",
    borderBottom: "1px solid #bdbdbd",
    marginTop: "10px",
    overflowX: "auto",
    whiteSpace: "nowrap",
    width: "100%",
    boxSizing: "border-box"
  },

  topTabButton: {
    border: "none",
    background: "transparent",
    color: "#4f5965",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    padding: 0,
    flexShrink: 0
  },

  topTabActive: {
    color: "#c7a22b"
  },

  headerInfo: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "12px 16px 0 16px",
    boxSizing: "border-box",
    flexWrap: "wrap"
  },

  titleBlock: {
    minWidth: 0
  },

  pageTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#404040"
  },

  subtitle: {
    margin: "4px 0 0",
    color: "#667085",
    fontSize: "14px"
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap"
  },

  content: {
    width: "100%",
    maxWidth: "100%",
    padding: "18px 16px 24px 16px",
    boxSizing: "border-box",
    overflowX: "hidden"
  }
};

export default Layout;