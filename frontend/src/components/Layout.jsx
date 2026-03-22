import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  }

  const topTabs = [
    { label: "DASHBOARD", path: "/dashboard" },
    { label: "GESTÃO DE LEADS", path: "/clientes" },
    { label: "ATENDIMENTOS", path: "/proprietarios" },
    { label: "CENTRAL DE NEGÓCIOS", path: "/imoveis" },
    { label: "PORTAIS", path: "/documentos" },
    { label: "MEU SITE", path: "/dashboard" }
  ];

  return (
    <div style={styles.container}>
      <Sidebar open={sidebarOpen} />

      <div style={styles.main}>
        <div style={styles.topBarWrapper}>
          <div style={styles.topBar}>
            <button
              type="button"
              style={styles.menuButton}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <input
              style={styles.searchInput}
              placeholder="Pesquisar imóveis ou clientes..."
            />

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
          <div>
            <h1 style={styles.pageTitle}>JB Pessoa Imóveis</h1>
          </div>

          <div style={styles.userBox}>
            <div style={styles.userInfo}>
              <strong>{user.name || "Administrador"}</strong>
              <div style={styles.userRole}>{user.role || "GERENTE"}</div>
            </div>

            <button style={styles.logoutButton} onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#efefef"
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column"
  },
  topBarWrapper: {
    padding: "22px 24px 0 24px"
  },
  topBar: {
    height: "76px",
    backgroundColor: "#06153b",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "0 18px"
  },
  menuButton: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer"
  },
  searchInput: {
    flex: 1,
    maxWidth: "650px",
    height: "42px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    padding: "0 18px",
    fontSize: "16px"
  },
  topIcons: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    color: "#fff",
    fontSize: "22px"
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
    overflowX: "auto"
  },
  topTabButton: {
    border: "none",
    background: "transparent",
    color: "#4f5965",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    padding: 0
  },
  topTabActive: {
    color: "#c7a22b"
  },
  headerInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 24px 0 24px"
  },
  pageTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#404040"
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  userInfo: {
    textAlign: "right",
    color: "#54607a"
  },
  userRole: {
    marginTop: "4px",
    color: "#777"
  },
  logoutButton: {
    backgroundColor: "#cfa52b",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 18px",
    fontWeight: "700",
    cursor: "pointer"
  },
  content: {
    padding: "18px 24px 24px 24px"
  }
};

export default Layout;