function Perfil() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Meu Perfil</h1>

        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>Nome</span>
            <strong style={styles.value}>{user.name || "-"}</strong>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>E-mail</span>
            <strong style={styles.value}>{user.email || "-"}</strong>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Perfil</span>
            <strong style={styles.value}>{user.role || "-"}</strong>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Código</span>
            <strong style={styles.value}>{user.code || user.id || "-"}</strong>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Status</span>
            <strong style={styles.value}>
              {user.online ? "Online" : "Offline"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%"
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)"
  },
  title: {
    marginTop: 0,
    marginBottom: "24px",
    color: "#0f172a"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px"
  },
  field: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px"
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: "0.06em"
  },
  value: {
    color: "#0f172a",
    fontSize: "16px"
  }
};

export default Perfil;