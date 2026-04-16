import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar({ open = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [openGroups, setOpenGroups] = useState({
    dashboard: true,
    crm: true,
    imoveis: true,
    operacao: true,
    administracao: true,
    configuracoes: false
  });

  function toggleGroup(group) {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group]
    }));
  }

  function isActive(path) {
    return location.pathname === path;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  }

  const profileLabel = useMemo(() => {
    if (user.role === "ADMIN") return "Administrador";
    if (user.role === "CORRETOR") return "Corretor";
    return "Usuário do sistema";
  }, [user.role]);

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: open ? "310px" : "0",
        overflow: "hidden"
      }}
    >
      {open && (
        <>
          <div style={styles.topBrand}>
            <div style={styles.brandLogo}>JB</div>
            <div>
              <div style={styles.brandTitle}>JB Pessoa Imóveis</div>
              <div style={styles.brandSubtitle}>Painel de gestão</div>
            </div>
          </div>

          <div style={styles.userCard}>
            <div style={styles.avatar}>👤</div>

            <div style={styles.userTextArea}>
              <div style={styles.userName}>{user.name || "Usuário"}</div>
              <div style={styles.userEmail}>
                {user.email || "email@empresa.com"}
              </div>
              <div style={styles.userRole}>{profileLabel}</div>
            </div>

            <button
              type="button"
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>

          <div style={styles.menuBody}>
            <MenuGroup
              icon="📊"
              label="Visão geral"
              open={openGroups.dashboard}
              onToggle={() => toggleGroup("dashboard")}
            >
              <MenuLink
                to="/dashboard"
                label="Dashboard"
                active={isActive("/dashboard")}
                icon="🏠"
              />
            </MenuGroup>

            <SectionTitle title="CRM" />

            <MenuGroup
              icon="👥"
              label="Clientes e negócios"
              open={openGroups.crm}
              onToggle={() => toggleGroup("crm")}
            >
              <MenuLink
                to="/clientes"
                label="Clientes"
                active={isActive("/clientes")}
                icon="👤"
              />
              <MenuLink
                to="/proprietarios"
                label="Proprietários"
                active={isActive("/proprietarios")}
                icon="🏢"
              />
              <MenuLink
                to="/propostas"
                label="Propostas"
                active={isActive("/propostas")}
                icon="💰"
              />
              <MenuLink
                to="/solicitacoes"
                label="Solicitações"
                active={isActive("/solicitacoes")}
                icon="📨"
              />
              <MenuLink
                to="/financiamentos"
                label="Financiamentos"
                active={isActive("/financiamentos")}
                icon="🏦"
              />
            </MenuGroup>

            <SectionTitle title="Imóveis" />

            <MenuGroup
              icon="🏘️"
              label="Gestão de imóveis"
              open={openGroups.imoveis}
              onToggle={() => toggleGroup("imoveis")}
            >
              <MenuLink
                to="/imoveis"
                label="Imóveis"
                active={isActive("/imoveis")}
                icon="🏠"
              />
              <MenuButton
                icon="🌐"
                label="Portal imobiliário"
                onClick={() => navigate("/site")}
              />
              <MenuButton
                icon="📌"
                label="Condomínios"
                onClick={() => alert("Esta área será ligada depois.")}
              />
            </MenuGroup>

            <SectionTitle title="Operação" />

            <MenuGroup
              icon="🧩"
              label="Rotina e documentos"
              open={openGroups.operacao}
              onToggle={() => toggleGroup("operacao")}
            >
              <MenuLink
                to="/agendamentos"
                label="Agenda"
                active={isActive("/agendamentos")}
                icon="📅"
              />
              <MenuLink
                to="/documentos"
                label="Documentos"
                active={isActive("/documentos")}
                icon="📄"
              />
              <MenuLink
                to="/leads"
                label="Leads e WhatsApp"
                active={isActive("/leads")}
                icon="💬"
              />
            </MenuGroup>

            {user.role === "ADMIN" && (
              <>
                <SectionTitle title="Administração" />

                <MenuGroup
                  icon="⚙️"
                  label="Administração do sistema"
                  open={openGroups.administracao}
                  onToggle={() => toggleGroup("administracao")}
                >
                  <MenuLink
                    to="/usuarios"
                    label="Usuários"
                    active={isActive("/usuarios")}
                    icon="👥"
                  />

                  <MenuLink
                    to="/dados-empresa"
                    label="Dados da empresa"
                    active={isActive("/dados-empresa")}
                    icon="🏢"
                  />

                  <MenuButton
                    icon="📈"
                    label="Relatórios"
                    onClick={() => alert("Esta área será ligada depois.")}
                  />
                </MenuGroup>
              </>
            )}

            <SectionTitle title="Configurações" />

            <MenuGroup
              icon="🔧"
              label="Preferências"
              open={openGroups.configuracoes}
              onToggle={() => toggleGroup("configuracoes")}
            >
              <MenuButton
                icon="🪟"
                label="Configurações do site"
                onClick={() => alert("Esta área será ligada depois.")}
              />
              <MenuButton
                icon="❓"
                label="Ajuda e suporte"
                onClick={() => alert("Esta área será ligada depois.")}
              />
            </MenuGroup>
          </div>
        </>
      )}
    </aside>
  );
}

function SectionTitle({ title }) {
  return <div style={styles.sectionTitle}>{title}</div>;
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      style={styles.menuItem}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f8fafc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={styles.icon}>{icon}</span>
      <span style={styles.menuLabel}>{label}</span>
    </button>
  );
}

function MenuLink({ to, label, active, icon = "•" }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.menuItem,
        ...(active ? styles.menuItemActive : {})
      }}
    >
      <span style={styles.icon}>{icon}</span>
      <span style={styles.menuLabel}>{label}</span>
    </Link>
  );
}

function MenuGroup({ icon, label, open, onToggle, children }) {
  return (
    <div style={styles.groupWrapper}>
      <button
        type="button"
        style={{
          ...styles.groupButton,
          ...(open ? styles.groupButtonOpen : {})
        }}
        onClick={onToggle}
      >
        <span style={styles.icon}>{icon}</span>
        <span style={styles.menuLabel}>{label}</span>
        <span style={styles.arrow}>{open ? "▾" : "▸"}</span>
      </button>

      {open && children && <div style={styles.submenu}>{children}</div>}
    </div>
  );
}

const styles = {
  sidebar: {
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    flexShrink: 0,
    transition: "0.25s ease",
    boxShadow: "2px 0 18px rgba(15, 23, 42, 0.06)"
  },

  topBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px 18px 14px",
    borderBottom: "1px solid #eef2f7"
  },
  brandLogo: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "16px",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.18)"
  },
  brandTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a"
  },
  brandSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px"
  },

  userCard: {
    margin: "14px 14px 8px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
    border: "1px solid #dbeafe",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "52px 1fr",
    gap: "12px",
    alignItems: "center"
  },
  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },
  userTextArea: {
    minWidth: 0
  },
  userName: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a"
  },
  userEmail: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "3px",
    wordBreak: "break-word"
  },
  userRole: {
    marginTop: "8px",
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#e0e7ff",
    color: "#3730a3",
    fontSize: "11px",
    fontWeight: "700"
  },
  logoutButton: {
    gridColumn: "1 / -1",
    marginTop: "6px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: "12px",
    minHeight: "40px",
    fontWeight: "700",
    cursor: "pointer"
  },

  menuBody: {
    padding: "8px 10px 18px"
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#94a3b8",
    padding: "14px 10px 8px"
  },

  groupWrapper: {
    marginBottom: "6px"
  },
  groupButton: {
    width: "100%",
    minHeight: "48px",
    padding: "0 14px",
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#0f172a",
    fontSize: "15px",
    cursor: "pointer",
    textAlign: "left",
    borderRadius: "14px",
    transition: "0.2s ease",
    fontWeight: "700"
  },
  groupButtonOpen: {
    backgroundColor: "#f8fafc"
  },

  menuItem: {
    width: "100%",
    minHeight: "46px",
    padding: "0 14px",
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#1f2937",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    borderRadius: "12px",
    transition: "all 0.2s ease"
  },
  menuItemActive: {
    backgroundColor: "#e8f1fd",
    color: "#1565c0",
    fontWeight: "800",
    boxShadow: "inset 4px 0 0 #1565c0"
  },

  icon: {
    width: "22px",
    textAlign: "center",
    fontSize: "17px",
    flexShrink: 0
  },
  menuLabel: {
    flex: 1
  },
  arrow: {
    color: "#6b7280",
    fontSize: "14px"
  },
  submenu: {
    marginLeft: "14px",
    paddingLeft: "10px",
    borderLeft: "2px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "6px"
  }
};

export default Sidebar;