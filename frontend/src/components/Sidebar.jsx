import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ open = true }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [openGroups, setOpenGroups] = useState({
    clientes: true,
    imoveis: true,
    atendimento: false,
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

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: open ? "380px" : "0",
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
              <div style={styles.userNameSmall}>
                {user.name || "Administrador"}
              </div>
            </div>

            <div style={styles.logoutText}>SAIR</div>
          </div>

          <div style={styles.menuBody}>
            <MenuItem icon="🎓" label="Vídeos e treinamentos" />
            <MenuGroup
              icon="👤"
              label="Clientes"
              open={openGroups.clientes}
              onToggle={() => toggleGroup("clientes")}
            >
              <MenuLink to="/clientes" label="Clientes" active={isActive("/clientes")} />
            </MenuGroup>

            <MenuGroup
              icon="🏠"
              label="Imóveis"
              open={openGroups.imoveis}
              onToggle={() => toggleGroup("imoveis")}
            >
              <MenuLink to="/imoveis" label="Imóveis" active={isActive("/imoveis")} />
            </MenuGroup>

            <MenuItem icon="🏢" label="Condomínios/Empreendimentos" />

            <Divider />

            <MenuItem icon="📅" label="Minha agenda" />
            <MenuItem icon="✉️" label="Gestão de leads" />

            <MenuGroup
              icon="🎧"
              label="Atendimentos"
              open={openGroups.atendimento}
              onToggle={() => toggleGroup("atendimento")}
            >
              <MenuLink to="/clientes" label="Atendimento clientes" active={false} />
            </MenuGroup>

            <MenuGroup
              icon="💲"
              label="Central de negócios"
              open={openGroups.negocios}
              onToggle={() => toggleGroup("negocios")}
            >
              <MenuLink to="/proprietarios" label="Proprietários" active={isActive("/proprietarios")} />
            </MenuGroup>

            <MenuItem icon="🪙" label="Financiamentos" />
            <MenuItem icon="☑️" label="Sistema Vistoria" />

            <Divider />

            <MenuItem icon="👥" label="Cadastro de usuários" />
            <MenuItem icon="🏢" label="Dados da empresa" />
            <MenuItem icon="☁️" label="JB Docs" />
            <MenuLink to="/documentos" label="Documentos e contratos" active={isActive("/documentos")} icon="📄" />
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
    <button type="button" style={styles.menuItem}>
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
    <div>
      <button type="button" style={styles.menuItem} onClick={onToggle}>
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
    backgroundColor: "#f6f6f6",
    borderRight: "1px solid #d9d9d9",
    flexShrink: 0,
    transition: "0.25s ease"
  },
  userHeader: {
    backgroundColor: "#2d8be0",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "90px 1fr auto",
    gap: "14px",
    alignItems: "start",
    padding: "16px 12px"
  },
  avatarArea: {
    textAlign: "center"
  },
  avatarCircle: {
    width: "74px",
    height: "74px",
    borderRadius: "50%",
    backgroundColor: "#ffffff55",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    margin: "0 auto 6px auto"
  },
  changePhotoButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px"
  },
  userInfo: {
    paddingTop: "8px"
  },
  userName: {
    fontWeight: "700",
    fontSize: "16px",
    marginBottom: "4px"
  },
  userEmail: {
    fontSize: "14px",
    marginBottom: "4px"
  },
  userNameSmall: {
    fontSize: "14px"
  },
  logoutText: {
    fontWeight: "700",
    fontSize: "14px",
    paddingTop: "6px"
  },
  menuBody: {
    padding: "6px 0"
  },
  menuItem: {
    width: "100%",
    minHeight: "58px",
    padding: "0 18px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textDecoration: "none",
    color: "#222",
    fontSize: "16px",
    cursor: "pointer",
    borderBottom: "1px solid #ececec",
    textAlign: "left"
  },
  menuItemActive: {
    backgroundColor: "#ececec",
    fontWeight: "700"
  },
  icon: {
    width: "24px",
    textAlign: "center",
    fontSize: "22px",
    opacity: 0.7
  },
  menuLabel: {
    flex: 1,
    fontWeight: "600"
  },
  arrow: {
    color: "#888",
    fontSize: "14px"
  },
  submenu: {
    backgroundColor: "#fafafa"
  },
  divider: {
    height: "10px",
    backgroundColor: "#f0f0f0",
    borderTop: "1px solid #e4e4e4",
    borderBottom: "1px solid #e4e4e4"
  }
};

export default Sidebar;