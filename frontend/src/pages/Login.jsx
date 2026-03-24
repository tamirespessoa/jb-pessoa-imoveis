import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        alert("E-mail ou senha inválidos.");
      } else {
        alert("Erro ao conectar com o backend.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>JB Pessoa Imóveis</h1>
        <p style={styles.subtitle}>Acesse o sistema</p>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            value={form.email}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Digite sua senha"
            value={form.password}
            onChange={handleChange}
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef"
  },
  card: {
    width: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    textAlign: "center"
  },
  logo: {
    margin: 0,
    fontSize: "56px",
    lineHeight: "0.95",
    color: "#c99a1a",
    fontWeight: "700"
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "30px",
    fontSize: "18px",
    color: "#444"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #d1d1d1",
    fontSize: "16px",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#c99a1a",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};

export default Login;