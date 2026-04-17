import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import publicApi from "../../services/publicApi";
import "./FeaturedProperties.css";

function formatCurrency(value) {
  const number = Number(value || 0);

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function getApiBaseUrl() {
  return publicApi.defaults.baseURL || "http://localhost:3001";
}

function getWhatsAppLink(property) {
  const phone = "5511983185430";
  const text = `Olá! Tenho interesse no imóvel "${property.title}".`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function getMainImage(property) {
  const base = getApiBaseUrl();

  if (Array.isArray(property.images) && property.images.length > 0) {
    const firstImage = property.images[0];

    if (typeof firstImage === "string") {
      if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
        return firstImage;
      }

      return `${base}${firstImage}`;
    }

    if (firstImage?.url) {
      if (
        String(firstImage.url).startsWith("http://") ||
        String(firstImage.url).startsWith("https://")
      ) {
        return firstImage.url;
      }

      return `${base}${firstImage.url}`;
    }
  }

  if (property.coverImage) {
    if (
      String(property.coverImage).startsWith("http://") ||
      String(property.coverImage).startsWith("https://")
    ) {
      return property.coverImage;
    }

    return `${base}${property.coverImage}`;
  }

  if (property.imageUrl) {
    return property.imageUrl;
  }

  return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
}

function getTypeLabel(property) {
  return property.type || "Imóvel";
}

function getLocation(property) {
  const parts = [
    property.neighborhood || property.district,
    property.city
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "Localização não informada";
}

function getBedrooms(property) {
  return property.bedrooms ?? property.rooms ?? 0;
}

function getGarage(property) {
  return property.garageSpots ?? property.garage ?? 0;
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFeaturedProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await publicApi.get("/properties/public");
        const payload = response.data;

        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setProperties(data);
      } catch (err) {
        console.error("Erro ao carregar imóveis em destaque:", err);
        setError("Não foi possível carregar os imóveis em destaque.");
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedProperties();
  }, []);

  const featuredProperties = useMemo(() => {
    const highlighted = properties.filter((property) => property.featured);

    if (highlighted.length > 0) {
      return highlighted.slice(0, 3);
    }

    return properties.slice(0, 3);
  }, [properties]);

  return (
    <section className="featured-properties-section">
      <div className="site-container">
        <div className="featured-properties-header">
          <div>
            <h2>Imóveis em destaque</h2>
            <p>
              Confira oportunidades cadastradas no sistema para morar ou investir
              com segurança e exclusividade.
            </p>
          </div>

          <Link to="/site/imoveis" className="featured-properties-link">
            Ver todos os imóveis
          </Link>
        </div>

        {loading ? (
          <div className="featured-properties-feedback">
            Carregando imóveis...
          </div>
        ) : error ? (
          <div className="featured-properties-feedback error">{error}</div>
        ) : featuredProperties.length === 0 ? (
          <div className="featured-properties-feedback">
            Nenhum imóvel cadastrado no sistema ainda.
          </div>
        ) : (
          <div className="featured-properties-grid">
            {featuredProperties.map((property) => (
              <article className="featured-property-card" key={property.id}>
                <div className="featured-property-image-wrap">
                  <img
                    src={getMainImage(property)}
                    alt={property.title}
                    className="featured-property-image"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />

                  <span className="featured-property-badge">
                    {getTypeLabel(property)}
                  </span>

                  {property.featured && (
                    <span className="featured-property-star">Destaque</span>
                  )}
                </div>

                <div className="featured-property-content">
                  <h3>{property.title}</h3>

                  <p className="featured-property-location">
                    {getLocation(property)}
                  </p>

                  <strong className="featured-property-price">
                    {formatCurrency(property.price)}
                  </strong>

                  <div className="featured-property-meta">
                    <span>{getBedrooms(property)} quartos</span>
                    <span>{property.bathrooms ?? 0} banheiros</span>
                    <span>{property.area ?? 0} m²</span>
                    <span>
                      {getGarage(property)} vaga
                      {getGarage(property) === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="featured-property-actions">
                    <Link
                      to={`/site/imoveis/${property.id}`}
                      className="featured-btn featured-btn-dark"
                    >
                      Ver detalhes
                    </Link>

                    <a
                      href={getWhatsAppLink(property)}
                      target="_blank"
                      rel="noreferrer"
                      className="featured-btn featured-btn-green"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}