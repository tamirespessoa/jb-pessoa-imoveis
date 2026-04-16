import { Link } from "react-router-dom";
import publicApi from "../../services/publicApi";
import "./PropertyCard.css";

function getApiBaseUrl() {
  return publicApi.defaults.baseURL || "http://localhost:3001";
}

function getImage(property) {
  if (property.image) return property.image;
  if (property.imageUrl) return property.imageUrl;

  if (property.coverImage) {
    if (String(property.coverImage).startsWith("http")) {
      return property.coverImage;
    }

    return `${getApiBaseUrl()}/uploads/${property.coverImage}`;
  }

  if (property.images && property.images.length > 0) {
    const firstImage = property.images[0];

    if (typeof firstImage === "string") {
      if (firstImage.startsWith("http")) {
        return firstImage;
      }

      return `${getApiBaseUrl()}/uploads/${firstImage}`;
    }

    if (firstImage?.url) {
      return firstImage.url;
    }
  }

  return "https://via.placeholder.com/800x500?text=Sem+Imagem";
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Valor sob consulta";
  }

  const value = Number(price);

  if (Number.isNaN(value)) {
    return price;
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getBedrooms(property) {
  return property.bedrooms ?? property.rooms ?? 0;
}

function getGarage(property) {
  return property.garageSpots ?? property.garage ?? 0;
}

export default function PropertyCard({ property }) {
  return (
    <div className="property-card">
      <div className="property-card-image-wrapper">
        <img
          src={getImage(property)}
          alt={property.title || "Imóvel"}
          className="property-card-image"
        />

        <span className="property-card-type">
          {property.type || property.category || "Imóvel"}
        </span>

        {property.featured && (
          <span className="property-card-featured">Destaque</span>
        )}
      </div>

      <div className="property-card-content">
        <h3 className="property-card-title">
          {property.title || "Imóvel sem título"}
        </h3>

        <p className="property-card-location">
          {property.neighborhood || property.district || "Bairro não informado"}
          {property.city ? ` - ${property.city}` : ""}
        </p>

        <p className="property-card-price">{formatPrice(property.price)}</p>

        <div className="property-card-info">
          <span>{getBedrooms(property)} quartos</span>
          <span>{property.bathrooms ?? 0} banheiros</span>
          <span>{property.area ?? 0} m²</span>
          <span>{getGarage(property)} vaga{getGarage(property) === 1 ? "" : "s"}</span>
        </div>

        <div className="property-card-actions">
          <Link
            to={`/site/imoveis/${property.id}`}
            className="property-card-button"
          >
            Ver detalhes
          </Link>

          <a
            href={`https://wa.me/5511983185430?text=${encodeURIComponent(
              `Olá! Tenho interesse no imóvel "${property.title || ""}".`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="property-card-whatsapp"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}