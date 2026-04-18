import { useEffect, useState } from "react";
import api from "../services/api";

function getRoleLabel(role) {
  if (role === "ADMIN") return "Administrador";
  if (role === "CORRETOR") return "Corretor";
  if (role === "ANALISTA_CREDITO") return "Analista de Crédito";
  if (role === "RECEPCIONISTA") return "Recepcionista";
  return role || "-";
}

function getRoleBadgeStyle(role) {
  const base = {
    ...styles.badge
  };

  if (role === "ADMIN") {
    return {
      ...base,
      background: "#ede9fe",
      color: "#5b21b6"
    };
  }

  if (role === "CORRETOR") {
    return {
      ...base,
      background: "#dbeafe",
      color: "#1d4ed8"
    };
  }

  if (role === "ANALISTA_CREDITO") {
    return {
      ...base,
      background: "#ecfdf5",
      color: "#047857"
    };
  }

  if (role === "RECEPCIONISTA") {
    return {
      ...base,
      background: "#fff7ed",
      color: "#c2410c"
    };
  }

  return {
    ...base,
    background: "#f3f4f6",
    color: "#374151"
  };
}

function Users() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CORRETOR"
  });

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "CORRETOR"
    });
    setEditingId("");
  }

  function handleEditUser(user) {
    setEditingId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "CORRETOR"
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      alert("Preencha nome e email.");
      return;
    }

    if (!editingId && !form.password.trim()) {
      alert("A senha é obrigatória para criar usuário.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        alert("Usuário atualizado com sucesso.");
      } else {
        await api.post("/users", payload);
        alert("Usuário criado com sucesso.");
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert(
        error.response?.data?.error ||
          (editingId ? "Erro ao atualizar usuário." : "Erro ao criar usuário.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(userId, userName) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o usuário "${userName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(userId);
      await api.delete(`/users/${userId}`);
      alert("Usuário excluído com sucesso.");

      if (editingId === userId) {
        resetForm();
      }

      await loadUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert(error.response?.data?.error || "Erro ao excluir usuário.");
    } finally {
      setDeletingId("");
    }
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <div style={styles.page}>
        <div style={styles.blocked}>
          <h2>Acesso negado</h2>
          <p>Somente administradores podem acessar essa página.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Usuários do sistema</h1>
        <p style={styles.subtitle}>
          Gerencie administradores, corretores, analistas de crédito e
          recepcionistas
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingId ? "Editar usuário" : "Novo usuário"}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              name="name"
              placeholder="Nome"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="email"
              placeholder="E-mail"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              type="password"
              name="password"
              placeholder={
                editingId
                  ? "Nova senha (deixe em branco para manter)"
                  : "Senha"
              }
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="CORRETOR">Corretor</option>
              <option value="ADMIN">Administrador</option>
              <option value="ANALISTA_CREDITO">Analista de Crédito</option>
              <option value="RECEPCIONISTA">Recepcionista</option>
            </select>

            <div style={styles.formActions}>
              <button style={styles.primaryButton} disabled={saving}>
                {saving
                  ? editingId
                    ? "Salvando..."
                    : "Criando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Criar usuário"}
              </button>

              {editingId && (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Usuários cadastrados</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : users.length === 0 ? (
            <p>Nenhum usuário cadastrado.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Perfil</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => {
                    const isCurrentUser = u.id === currentUser.id;

                    return (
                      <tr key={u.id}>
                        <td style={styles.td}>{u.name}</td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>
                          <span style={getRoleBadgeStyle(u.role)}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionsCell}>
                            <button
                              type="button"
                              style={styles.editButton}
                              onClick={() => handleEditUser(u)}
                            >
                              Editar
                            </button>

                            {isCurrentUser ? (
                              <span style={styles.selfLabel}>Usuário atual</span>
                            ) : (
                              <button
                                type="button"
                                style={styles.deleteButton}
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={deletingId === u.id}
                              >
                                {deletingId === u.id ? "Excluindo..." : "Excluir"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px"
  },
  header: {
    marginBottom: "20px"
  },
  title: {
    margin: 0,
    fontSize: "24px",
    color: "#1f2937"
  },
  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "20px"
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb"
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#111827"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px"
  },
  formActions: {
    display: "flex",
    gap: "10px"
  },
  primaryButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    flex: 1
  },
  secondaryButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "14px"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
    color: "#111827",
    verticalAlign: "middle"
  },
  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block"
  },
  actionsCell: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  editButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },
  deleteButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },
  selfLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600"
  },
  blocked: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px"
  }
};

export default Users;