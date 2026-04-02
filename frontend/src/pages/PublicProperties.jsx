import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./PublicProperties.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://jb-pessoa-imoveis.onrender.com";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Valor sob consulta";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return value;
  }

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getMainImage(property) {
  if (property?.images && property.images.length > 0) {
    return property.images[0].url || property.images[0];
  }

  if (property?.imageUrl) {
    return property.imageUrl;
  }

  return "https://via.placeholder.com/600x400?text=Sem+Imagem";
}

export default function PublicProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/properties`);
      setProperties(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar imóveis públicos:", err);
      setError("Não foi possível carregar os imóveis no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  return (
    <div className="public-properties-page">
      <header className="public-header">
        <div className="public-header-content">
          <div>
            <h1>Imóveis disponíveis</h1>
            <p>Veja os imóveis disponíveis na JB Pessoa Imóveis.</p>
          </div>

          <div className="public-header-actions">
            <Link to="/" className="outline-btn">
              Voltar ao início
            </Link>
          </div>
        </div>
      </header>

      <main className="public-main">
        {loading && <p className="feedback">Carregando imóveis...</p>}

        {error && <p className="feedback error">{error}</p>}

        {!loading && !error && properties.length === 0 && (
          <p className="feedback">Nenhum imóvel encontrado.</p>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="property-grid">
            {properties.map((property) => (
              <article className="property-card" key={property.id}>
                <img
                  src={getMainImage(property)}
                  alt={property.title || "Imóvel"}
                  className="property-image"
                />

                <div className="property-card-body">
                  <span className="property-type">
                    {property.category || property.type || "Imóvel"}
                  </span>

                  <h2>{property.title || "Imóvel sem título"}</h2>

                  <p className="property-location">
                    {property.neighborhood || property.city || "Localização não informada"}
                  </p>

                  <p className="property-price">
                    {formatCurrency(property.price)}
                  </p>

                  <div className="property-info">
                    <span>{property.bedrooms ?? 0} quartos</span>
                    <span>{property.bathrooms ?? 0} banheiros</span>
                    <span>{property.area ?? 0} m²</span>
                  </div>

                  <div className="property-actions">
                    <Link to={`/imoveis/${property.id}`} className="primary-btn">
                      Ver detalhes
                    </Link>

                    <a
                      href={`https://wa.me/5511983185430?text=${encodeURIComponent(
                        `Olá, tenho interesse no imóvel ${property.title || property.id}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-btn"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}