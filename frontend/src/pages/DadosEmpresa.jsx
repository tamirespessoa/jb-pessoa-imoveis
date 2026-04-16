import { useEffect, useState } from "react";

export default function DadosEmpresa() {
  const [form, setForm] = useState({
    companyName: "",
    tradeName: "",
    cnpj: "",
    creci: "",
    email: "",
    phone: "",
    whatsapp: "",
    website: "",
    instagram: "",
    facebook: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
    businessHours: "",
    description: ""
  });

  // CARREGAR DADOS SALVOS
  useEffect(() => {
    const saved = localStorage.getItem("companyData");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    localStorage.setItem("companyData", JSON.stringify(form));

    alert("Dados da empresa salvos com sucesso.");
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dados da Empresa</h1>

      <form onSubmit={handleSubmit} style={styles.card}>
        {/* INFORMAÇÕES PRINCIPAIS */}
        <h2 style={styles.section}>Informações</h2>

        <div style={styles.grid2}>
          <input
            style={styles.input}
            name="companyName"
            placeholder="Razão social"
            value={form.companyName}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="tradeName"
            placeholder="Nome fantasia"
            value={form.tradeName}
            onChange={handleChange}
          />
        </div>

        <div style={styles.grid3}>
          <input
            style={styles.input}
            name="cnpj"
            placeholder="CNPJ"
            value={form.cnpj}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="creci"
            placeholder="CRECI"
            value={form.creci}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div style={styles.grid3}>
          <input
            style={styles.input}
            name="phone"
            placeholder="Telefone"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="whatsapp"
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="website"
            placeholder="Site"
            value={form.website}
            onChange={handleChange}
          />
        </div>

        {/* ENDEREÇO */}
        <h2 style={styles.section}>Endereço</h2>

        <div style={styles.grid3}>
          <input
            style={styles.input}
            name="street"
            placeholder="Rua"
            value={form.street}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="number"
            placeholder="Número"
            value={form.number}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="complement"
            placeholder="Complemento"
            value={form.complement}
            onChange={handleChange}
          />
        </div>

        <div style={styles.grid4}>
          <input
            style={styles.input}
            name="district"
            placeholder="Bairro"
            value={form.district}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="city"
            placeholder="Cidade"
            value={form.city}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="state"
            placeholder="Estado"
            value={form.state}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="zipCode"
            placeholder="CEP"
            value={form.zipCode}
            onChange={handleChange}
          />
        </div>

        {/* DESCRIÇÃO */}
        <h2 style={styles.section}>Descrição</h2>

        <textarea
          style={styles.textarea}
          name="description"
          placeholder="Descrição da empresa"
          value={form.description}
          onChange={handleChange}
        />

        {/* BOTÃO */}
        <button type="submit" style={styles.button}>
          Salvar dados
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f6f8",
    minHeight: "100vh"
  },

  title: {
    fontSize: "28px",
    marginBottom: "20px"
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
  },

  section: {
    marginTop: "20px",
    marginBottom: "10px"
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginTop: "10px"
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "10px",
    marginTop: "10px"
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "10px"
  },

  button: {
    marginTop: "20px",
    padding: "12px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  }
};