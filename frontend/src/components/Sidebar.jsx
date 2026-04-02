import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar({ open = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [openGroups, setOpenGroups] = useState({
    clientes: true,
    imoveis: true,
    atendimento: true,
    negocios: false,
    relatorios: false,
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

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: open ? "300px" : "0",
        overflow: "hidden"
      }}
    >
      {open && (
        <>
          <div style={styles.userHeader}>
            <div style={styles.avatarArea}>
              <div style={styles.avatarCircle}>👤</div>
              <button style={styles.changePhotoButton} type="button">
                Alterar
              </button>
            </div>

            <div style={styles.userInfo}>
              <div style={styles.userName}>
                {user.name || "Administrador"}
              </div>
              <div style={styles.userEmail}>
                {user.email || "email@empresa.com"}
              </div>
              <div style={styles.userNameSmall}>Perfil do sistema</div>
            </div>

            <button
              type="button"
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              SAIR
            </button>
          </div>

          <div style={styles.menuBody}>
            <MenuItem icon="🎓" label="Vídeos e treinamentos" />

            <MenuGroup
              icon="👤"
              label="Clientes"
              open={openGroups.clientes}
              onToggle={() => toggleGroup("clientes")}
            >
              <MenuLink
                to="/clientes"
                label="Clientes"
                active={isActive("/clientes")}
              />
            </MenuGroup>

            <MenuGroup
              icon="🏠"
              label="Imóveis"
              open={openGroups.imoveis}
              onToggle={() => toggleGroup("imoveis")}
            >
              <MenuLink
                to="/imoveis"
                label="Imóveis"
                active={isActive("/imoveis")}
              />
            </MenuGroup>

            <MenuItem icon="🏢" label="Condomínios/Empreendimentos" />

            <Divider />

            <MenuLink
              to="/agendamentos"
              label="Minha agenda"
              active={isActive("/agendamentos")}
              icon="📅"
            />

            <MenuItem icon="✉️" label="Gestão de leads" />

            <MenuGroup
              icon="🎧"
              label="Atendimentos"
              open={openGroups.atendimento}
              onToggle={() => toggleGroup("atendimento")}
            >
              <MenuLink
                to="/clientes"
                label="Atendimento clientes"
                active={false}
              />
              <MenuLink
                to="/solicitacoes"
                label="Solicitações"
                active={isActive("/solicitacoes")}
                icon="📨"
              />
            </MenuGroup>

            <MenuGroup
              icon="💲"
              label="Central de negócios"
              open={openGroups.negocios}
              onToggle={() => toggleGroup("negocios")}
            >
              <MenuLink
                to="/proprietarios"
                label="Proprietários"
                active={isActive("/proprietarios")}
              />
              <MenuLink
                to="/propostas"
                label="Propostas"
                active={isActive("/propostas")}
                icon="💰"
              />
            </MenuGroup>

            <MenuItem icon="🪙" label="Financiamentos" />
            <MenuItem icon="☑️" label="Sistema Vistoria" />

            <Divider />

            <MenuItem icon="👥" label="Cadastro de usuários" />
            <MenuItem icon="🏢" label="Dados da empresa" />
            <MenuItem icon="☁️" label="JB Docs" />

            <MenuLink
              to="/documentos"
              label="Documentos e contratos"
              active={isActive("/documentos")}
              icon="📄"
            />

            <MenuItem icon="🌍" label="Portais" />
            <MenuItem icon="💬" label="JB Chat" />
            <MenuItem icon="📝" label="Anotações pessoais" />

            <MenuGroup
              icon="😊"
              label="JB social life"
              open={false}
              onToggle={() => {}}
            />

            <MenuGroup
              icon="🖨️"
              label="Relatórios"
              open={openGroups.relatorios}
              onToggle={() => toggleGroup("relatorios")}
            />

            <MenuGroup
              icon="📑"
              label="Cadastros auxiliares"
              open={false}
              onToggle={() => {}}
            />

            <Divider />

            <MenuGroup
              icon="⚙️"
              label="Configurações"
              open={openGroups.configuracoes}
              onToggle={() => toggleGroup("configuracoes")}
            />

            <MenuItem icon="🪟" label="Configurações do site" />
            <MenuItem icon="❓" label="Ajuda, solicitações e boletos" />
          </div>
        </>
      )}
    </aside>
  );
}

function MenuItem({ icon, label }) {
  return (
    <button
      type="button"
      style={styles.menuItem}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f3f7fc";
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
        style={styles.menuItem}
        onClick={onToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f7fc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span style={styles.icon}>{icon}</span>
        <span style={styles.menuLabel}>{label}</span>
        <span style={styles.arrow}>{open ? "▾" : "▸"}</span>
      </button>

      {open && children && <div style={styles.submenu}>{children}</div>}
    </div>
  );
}

function Divider() {
  return <div style={styles.divider} />;
}

const styles = {
  sidebar: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    flexShrink: 0,
    transition: "0.25s ease",
    boxShadow: "2px 0 12px rgba(0, 0, 0, 0.04)"
  },
  userHeader: {
    background: "linear-gradient(180deg, #2d8be0 0%, #1d6fbd 100%)",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "78px 1fr auto",
    gap: "12px",
    alignItems: "center",
    padding: "16px 14px"
  },
  avatarArea: {
    textAlign: "center"
  },
  avatarCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    margin: "0 auto 6px auto",
    border: "2px solid rgba(255,255,255,0.3)"
  },
  changePhotoButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  },
  userInfo: {
    minWidth: 0
  },
  userName: {
    fontWeight: "700",
    fontSize: "16px",
    marginBottom: "4px"
  },
  userEmail: {
    fontSize: "13px",
    marginBottom: "4px",
    opacity: 0.95,
    wordBreak: "break-word"
  },
  userNameSmall: {
    fontSize: "12px",
    opacity: 0.9
  },
  logoutButton: {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "12px",
    padding: "8px 10px",
    borderRadius: "10px",
    cursor: "pointer"
  },
  menuBody: {
    padding: "10px 8px 16px"
  },
  groupWrapper: {
    marginBottom: "2px"
  },
  menuItem: {
    width: "100%",
    minHeight: "48px",
    padding: "0 14px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#1f2937",
    fontSize: "15px",
    cursor: "pointer",
    textAlign: "left",
    borderRadius: "12px",
    transition: "all 0.2s ease"
  },
  menuItemActive: {
    backgroundColor: "#e8f1fd",
    color: "#1565c0",
    fontWeight: "700",
    boxShadow: "inset 4px 0 0 #1565c0"
  },
  icon: {
    width: "22px",
    textAlign: "center",
    fontSize: "18px",
    flexShrink: 0
  },
  menuLabel: {
    flex: 1,
    fontWeight: "600"
  },
  arrow: {
    color: "#6b7280",
    fontSize: "14px"
  },
  submenu: {
    marginLeft: "18px",
    paddingLeft: "10px",
    borderLeft: "2px solid #e5e7eb"
  },
  divider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "10px 8px"
  }
};

export default Sidebar;