import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo-jb.png";
import "./SiteRegisterProperty.css";

const initialForm = {
  ownerName: "",
  phone: "",
  whatsapp: "",
  email: "",
  propertyType: "",
  purpose: "",
  city: "",
  neighborhood: "",
  address: "",
  bedrooms: "",
  bathrooms: "",
  parkingSpots: "",
  area: "",
  price: "",
  description: ""
};

export default function SiteRegisterProperty() {
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setSubmitted(false);
      setErrorMessage("");

      await axios.post("http://localhost:3001/property-requests", formData);

      setSubmitted(true);
      setFormData(initialForm);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);

      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Não foi possível enviar o cadastro do imóvel.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site-register-page">
      <header className="site-header">
        <div className="site-container">
          <Link to="/site" className="site-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className="site-nav">
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Cadastre seu imóvel</Link>
            <a href="/site#sobre">Sobre</a>
            <a href="/site#contato">Contato</a>
          </nav>
        </div>
      </header>

      <section className="register-property-hero">
        <div className="site-container">
          <span className="register-property-badge">Para proprietários</span>
          <h1>Cadastre seu imóvel conosco</h1>
          <p>
            Preencha o formulário abaixo para que nossa equipe avalie seu imóvel e
            entre em contato com você.
          </p>
        </div>
      </section>

      <section className="register-property-section">
        <div className="site-container">
          <div className="register-property-layout">
            <div className="register-property-info-card">
              <h2>Como funciona</h2>
              <p>
                Você preenche as informações principais do imóvel e nossa equipe
                entra em contato para confirmar os dados, solicitar fotos e
                orientar sobre os próximos passos.
              </p>

              <ul>
                <li>Cadastro rápido e simples</li>
                <li>Análise da equipe imobiliária</li>
                <li>Contato para continuidade do atendimento</li>
                <li>Mais segurança no processo de anúncio</li>
              </ul>
            </div>

            <div className="register-property-form-card">
              {submitted && (
                <div className="register-success-message">
                  Cadastro enviado com sucesso! Em breve entraremos em contato.
                </div>
              )}

              {errorMessage && (
                <div className="register-error-message">
                  {errorMessage}
                </div>
              )}

              <form className="register-property-form" onSubmit={handleSubmit}>
                <div className="register-form-grid">
                  <div className="form-group">
                    <label htmlFor="ownerName">Nome do proprietário</label>
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Telefone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="text"
                      value={formData.whatsapp}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="propertyType">Tipo do imóvel</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Cobertura">Cobertura</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Sala comercial">Sala comercial</option>
                      <option value="Sobrado">Sobrado</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="purpose">Finalidade</label>
                    <select
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="Venda">Venda</option>
                      <option value="Aluguel">Aluguel</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">Cidade</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="neighborhood">Bairro</label>
                    <input
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">Endereço</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bedrooms">Quartos</label>
                    <input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bathrooms">Banheiros</label>
                    <input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="parkingSpots">Vagas</label>
                    <input
                      id="parkingSpots"
                      name="parkingSpots"
                      type="number"
                      min="0"
                      value={formData.parkingSpots}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="area">Área (m²)</label>
                    <input
                      id="area"
                      name="area"
                      type="number"
                      min="0"
                      value={formData.area}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="price">Valor desejado</label>
                    <input
                      id="price"
                      name="price"
                      type="text"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Ex: R$ 450.000"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Descrição do imóvel</label>
                    <textarea
                      id="description"
                      name="description"
                      rows="6"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Descreva os principais diferenciais do imóvel"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="register-submit-button"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar cadastro"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}