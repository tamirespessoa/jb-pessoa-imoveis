import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post("http://localhost:3001/auth/login", {
        email,
        password
      });

      const token = response.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      onLogin();
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.error || "Erro no login.");
      } else {
        alert("Erro ao conectar com o backend.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>JB Pessoa Imóveis</h1>
        <p style={styles.subtitle}>Acesse o sistema</p>

        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDEDED",
    padding: "20px"
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
  },
  title: {
    margin: 0,
    marginBottom: "8px",
    color: "#C79A2B",
    textAlign: "center"
  },
  subtitle: {
    marginTop: 0,
    marginBottom: "24px",
    textAlign: "center",
    color: "#555"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #CCC",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#C79A2B",
    color: "#FFF",
    fontWeight: "bold",
    cursor: "pointer"
  }
};

export default Login;