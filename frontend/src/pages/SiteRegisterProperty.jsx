import { useState } from "react";
import SiteLayout from "../components/SiteLayout";
import publicApi from "../services/publicApi";
import "./SiteRegisterProperty.css";

const initialForm = {
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  title: "",
  type: "SALE",
  price: "",
  description: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
  rooms: "",
  bathrooms: "",
  garage: "",
  area: ""
};

export default function SiteRegisterProperty() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        ownerName: formData.ownerName.trim(),
        phone: formData.ownerPhone.trim(),
        whatsapp: formData.ownerPhone.trim(),
        email: formData.ownerEmail.trim(),
        propertyType: formData.title.trim() || "Imóvel",
        purpose: formData.type === "RENT" ? "ALUGUEL" : "VENDA",
        city: formData.city.trim(),
        neighborhood: formData.district.trim(),
        address: [formData.street, formData.number, formData.complement]
          .filter(Boolean)
          .join(", "),
        bedrooms: formData.rooms ? Number(formData.rooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        parkingSpots: formData.garage ? Number(formData.garage) : null,
        area: formData.area ? Number(formData.area) : null,
        price: formData.price ? String(formData.price) : null,
        description: [
          formData.description?.trim(),
          formData.state ? `Estado: ${formData.state}` : "",
          formData.zipCode ? `CEP: ${formData.zipCode}` : ""
        ]
          .filter(Boolean)
          .join("\n")
      };

      await publicApi.post("/property-requests", payload);

      setSuccessMessage(
        "Seu imóvel foi enviado com sucesso. Nossa equipe entrará em contato em breve."
      );
      setFormData(initialForm);
    } catch (error) {
      console.error("Erro ao enviar cadastro de imóvel:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Não foi possível enviar o cadastro agora. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="site-register-property-page">
        <section className="site-register-property-hero">
          <div className="site-register-property-container">
            <span className="site-register-property-badge">
              Para proprietários
            </span>

            <h1>Cadastre seu imóvel</h1>

            <p>
              Envie as informações do seu imóvel e nossa equipe entrará em
              contato para orientar você sobre venda ou locação.
            </p>
          </div>
        </section>

        <section className="site-register-property-content">
          <div className="site-register-property-container">
            <div className="site-register-property-grid">
              <div className="site-register-property-info-card">
                <h2>Por que anunciar conosco?</h2>

                <ul>
                  <li>Atendimento personalizado</li>
                  <li>Suporte durante todo o processo</li>
                  <li>Apresentação profissional do imóvel</li>
                  <li>Mais credibilidade na negociação</li>
                </ul>

                <div className="site-register-property-contact-box">
                  <span>Atendimento</span>
                  <strong>(11) 98318-5430</strong>
                  <p>Se preferir, também podemos atender pelo WhatsApp.</p>
                </div>
              </div>

              <form
                className="site-register-property-form-card"
                onSubmit={handleSubmit}
              >
                <div className="site-register-property-section">
                  <h2>Dados do proprietário</h2>

                  <div className="site-register-property-fields two-columns">
                    <div className="site-register-property-field">
                      <label htmlFor="ownerName">Nome completo</label>
                      <input
                        id="ownerName"
                        name="ownerName"
                        type="text"
                        value={formData.ownerName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="ownerPhone">Telefone / WhatsApp</label>
                      <input
                        id="ownerPhone"
                        name="ownerPhone"
                        type="text"
                        value={formData.ownerPhone}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="site-register-property-field full-width">
                      <label htmlFor="ownerEmail">E-mail</label>
                      <input
                        id="ownerEmail"
                        name="ownerEmail"
                        type="email"
                        value={formData.ownerEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="site-register-property-section">
                  <h2>Dados do imóvel</h2>

                  <div className="site-register-property-fields two-columns">
                    <div className="site-register-property-field full-width">
                      <label htmlFor="title">Título do anúncio</label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ex: Casa ampla com 3 quartos"
                        required
                      />
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="type">Tipo de negócio</label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <option value="SALE">Venda</option>
                        <option value="RENT">Aluguel</option>
                      </select>
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="price">Valor</label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Ex: 350000"
                      />
                    </div>

                    <div className="site-register-property-field full-width">
                      <label htmlFor="description">Descrição</label>
                      <textarea
                        id="description"
                        name="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descreva o imóvel, diferenciais, acabamento, localização..."
                      />
                    </div>
                  </div>
                </div>

                <div className="site-register-property-section">
                  <h2>Endereço</h2>

                  <div className="site-register-property-fields two-columns">
                    <div className="site-register-property-field">
                      <label htmlFor="street">Rua / Avenida</label>
                      <input
                        id="street"
                        name="street"
                        type="text"
                        value={formData.street}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="number">Número</label>
                      <input
                        id="number"
                        name="number"
                        type="text"
                        value={formData.number}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="complement">Complemento</label>
                      <input
                        id="complement"
                        name="complement"
                        type="text"
                        value={formData.complement}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="site-register-property-field">
                      <label htmlFor="district">Bairro</label>
                      <input
                        id="district"
                        name="district"
                        type="text"
                        value={formData.district}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="site-register-property-field">
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

                    <div className="site-register-property-field">
                      <label htmlFor="state">Estado</label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="SP"
                      />
                    </div>

                    <div className="site-register-property-field full-width">
                      <label htmlFor="zipCode">CEP</label>
                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="site-register-property-section">
                  <h2>Características</h2>

                  <div className="site-register-property-fields four-columns">
                    <div className="site-register-property-field">
                      <label htmlFor="rooms">Quartos</label>
                      <input
                        id="rooms"
                        name="rooms"
                        type="number"
                        min="0"
                        value={formData.rooms}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="site-register-property-field">
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

                    <div className="site-register-property-field">
                      <label htmlFor="garage">Vagas</label>
                      <input
                        id="garage"
                        name="garage"
                        type="number"
                        min="0"
                        value={formData.garage}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="site-register-property-field">
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
                  </div>
                </div>

                {successMessage ? (
                  <div className="site-register-property-alert success">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="site-register-property-alert error">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="site-register-property-actions">
                  <button
                    type="submit"
                    className="site-register-property-submit"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar cadastro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}