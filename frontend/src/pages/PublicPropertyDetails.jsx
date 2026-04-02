import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./PublicPropertyDetails.css";

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

function getImages(property) {
  if (property?.images && property.images.length > 0) {
    return property.images.map((img) => img.url || img);
  }

  if (property?.imageUrl) {
    return [property.imageUrl];
  }

  return ["https://via.placeholder.com/900x600?text=Sem+Imagem"];
}

export default function PublicPropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/properties/${id}`);
        const propertyData = response.data;

        setProperty(propertyData);

        const images = getImages(propertyData);
        setSelectedImage(images[0]);
      } catch (err) {
        console.error("Erro ao carregar detalhes do imóvel:", err);
        setError("Não foi possível carregar os detalhes do imóvel.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-container">
          <p>Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="details-page">
        <div className="details-container">
          <p>{error || "Imóvel não encontrado."}</p>
          <Link to="/imoveis" className="back-link">
            Voltar para imóveis
          </Link>
        </div>
      </div>
    );
  }

  const images = getImages(property);

  return (
    <div className="details-page">
      <div className="details-container">
        <div className="details-top">
          <Link to="/imoveis" className="back-link">
            ← Voltar para imóveis
          </Link>
        </div>

        <div className="details-grid">
          <section className="details-gallery">
            <img
              src={selectedImage}
              alt={property.title || "Imóvel"}
              className="details-main-image"
            />

            <div className="details-thumbs">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={index}
                  className={`details-thumb ${
                    selectedImage === image ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`Imagem ${index + 1}`} />
                </button>
              ))}
            </div>
          </section>

          <aside className="details-info-card">
            <span className="details-badge">
              {property.category || property.type || "Imóvel"}
            </span>

            <h1>{property.title || "Imóvel sem título"}</h1>

            <p className="details-location">
              {property.address ||
                property.neighborhood ||
                property.city ||
                "Localização não informada"}
            </p>

            <p className="details-price">{formatCurrency(property.price)}</p>

            <div className="details-highlights">
              <div>
                <strong>Quartos</strong>
                <span>{property.bedrooms ?? 0}</span>
              </div>
              <div>
                <strong>Banheiros</strong>
                <span>{property.bathrooms ?? 0}</span>
              </div>
              <div>
                <strong>Área</strong>
                <span>{property.area ?? 0} m²</span>
              </div>
              <div>
                <strong>Vagas</strong>
                <span>{property.garageSpots ?? 0}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/5511983185430?text=${encodeURIComponent(
                `Olá, tenho interesse no imóvel ${property.title || property.id}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="details-whatsapp"
            >
              Falar no WhatsApp
            </a>
          </aside>
        </div>

        <section className="details-description-card">
          <h2>Descrição</h2>
          <p>
            {property.description ||
              "Este imóvel ainda não possui descrição cadastrada."}
          </p>
        </section>
      </div>
    </div>
  );
}