import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bath, BedDouble, CarFront, MapPin, MoveUpRight, Ruler } from "lucide-react";
import publicApi from "../../services/publicApi";
import SiteWatermark from "../SiteWatermark";
import "./FeaturedProperties.css";

function formatCurrency(value) {
  if (!value) return "Valor a consultar";

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function getApiBaseUrl() {
  return publicApi.defaults.baseURL || "http://localhost:3001";
}

function getMainImage(property) {
  const base = getApiBaseUrl();
  const candidates = [];

  if (property?.coverImage) candidates.push(property.coverImage);

  if (Array.isArray(property?.images)) {
    property.images.forEach((item) => {
      if (typeof item === "string") candidates.push(item);
      else if (item?.url) candidates.push(item.url);
      else if (item?.path) candidates.push(item.path);
    });
  }

  const raw = candidates.find(Boolean);

  if (!raw) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
  }

  const value = String(raw).trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
}

function getLocation(property) {
  return [property?.district || property?.neighborhood, property?.city]
    .filter(Boolean)
    .join(" · ") || "Localização não informada";
}

function getTypeLabel(property) {
  if (property?.type === "SALE") return "Venda";
  if (property?.type === "RENT") return "Aluguel";
  return property?.type || "Imóvel";
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await publicApi.get("/properties/public", {
          params: { page: 1, limit: 12, sort: "recentes" }
        });

        const payload = response.data;
        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setProperties(data);
      } catch (err) {
        console.error("Erro ao carregar imóveis em destaque:", err);
        setError("Não foi possível carregar os imóveis agora.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  const featuredProperties = useMemo(() => {
    const highlighted = properties.filter(
      (property) => property.featured || property.siteHighlight
    );

    const source = highlighted.length > 0 ? highlighted : properties;
    return source.slice(0, 6);
  }, [properties]);

  if (loading) {
    return (
      <div className="modern-properties-shell">
        <div className="modern-properties-state">Carregando imóveis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-properties-shell">
        <div className="modern-properties-state modern-properties-state-error">{error}</div>
      </div>
    );
  }

  if (featuredProperties.length === 0) {
    return (
      <div className="modern-properties-shell">
        <div className="modern-properties-state">Nenhum imóvel disponível no momento.</div>
      </div>
    );
  }

  return (
    <div className="modern-properties-shell">
      <div className="modern-properties-grid">
        {featuredProperties.map((property) => (
          <article className="modern-property-card" key={property.id}>
            <Link to={`/site/imoveis/${property.id}`} className="modern-property-image-wrap" style={{ position: "relative", overflow: "hidden" }}>
              <img
                src={getMainImage(property)}
                alt={property.title || "Imóvel"}
                className="modern-property-image"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
                }}
              />

              <SiteWatermark size="30%" opacity={0.30} />

              <span className="modern-property-type">{getTypeLabel(property)}</span>
              {(property.featured || property.siteHighlight) && (
                <span className="modern-property-featured">Destaque</span>
              )}
            </Link>

            <div className="modern-property-body">
              <div className="modern-property-topline">
                <p className="modern-property-location">
                  <MapPin size={15} />
                  {getLocation(property)}
                </p>
                {property.code && <span className="modern-property-code">{property.code}</span>}
              </div>

              <Link to={`/site/imoveis/${property.id}`} className="modern-property-title">
                {property.title || property.type || "Imóvel"}
              </Link>

              <strong className="modern-property-price">
                {formatCurrency(property.price)}
              </strong>

              <div className="modern-property-meta">
                <span title="Quartos">
                  <BedDouble size={17} />
                  {property.bedrooms ?? property.rooms ?? 0}
                </span>
                <span title="Banheiros">
                  <Bath size={17} />
                  {property.bathrooms ?? 0}
                </span>
                <span title="Vagas">
                  <CarFront size={17} />
                  {property.garageSpots ?? property.garage ?? 0}
                </span>
                <span title="Área">
                  <Ruler size={17} />
                  {property.area ?? property.totalArea ?? 0} m²
                </span>
              </div>

              <Link to={`/site/imoveis/${property.id}`} className="modern-property-link">
                Ver detalhes
                <MoveUpRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
