import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import publicApi from "../services/publicApi";
import SiteLayout from "../components/SiteLayout";
import "./SitePropertyDetails.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

function getImageUrl(path) {
  if (!path) return "/sem-imagem.png";
  return `${API_BASE_URL}${path}`;
}

export default function SitePropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await publicApi.get(`/properties/public/${id}`);
        const data = response.data;

        setProperty(data);

        const firstImage =
          data?.coverImage
            ? getImageUrl(data.coverImage)
            : data?.images?.length > 0
            ? getImageUrl(data.images[0])
            : "/sem-imagem.png";

        setSelectedImage(firstImage);
      } catch (err) {
        console.error("Erro ao carregar imóvel:", err);
        setError("Não foi possível carregar este imóvel.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!property) return [];

    const images = [];

    if (property.coverImage) {
      images.push(getImageUrl(property.coverImage));
    }

    if (property.images?.length > 0) {
      property.images.forEach((img) => {
        const full = getImageUrl(img);
        if (!images.includes(full)) images.push(full);
      });
    }

    if (images.length === 0) {
      images.push("/sem-imagem.png");
    }

    return images;
  }, [property]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="site-property-details-page">
          <div className="site-property-details-container">
            <div className="site-property-details-message">
              Carregando imóvel...
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !property) {
    return (
      <SiteLayout>
        <div className="site-property-details-page">
          <div className="site-property-details-container">
            <div className="site-property-details-message site-property-details-message-error">
              <h2>Imóvel não encontrado</h2>
              <p>{error || "Este imóvel não está disponível."}</p>

              <Link
                to="/site/imoveis"
                className="site-property-details-back-button"
              >
                Voltar para imóveis
              </Link>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const formattedPrice = property.price
    ? Number(property.price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    : "Valor a consultar";

  const locationText = [
    property.street || property.address,
    property.number,
    property.complement,
    property.district || property.neighborhood,
    property.city,
    property.state
  ]
    .filter(Boolean)
    .join(", ");

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no imóvel "${property.title}".`
  );

  const whatsappLink = `https://wa.me/5511983185430?text=${whatsappMessage}`;

  return (
    <SiteLayout>
      <div className="site-property-details-page">

        {/* HERO */}
        <section className="site-property-details-hero">
          <div className="site-property-details-container">

            <div className="site-property-details-breadcrumb">
              <Link to="/site">Início</Link>
              <span>/</span>
              <Link to="/site/imoveis">Imóveis</Link>
              <span>/</span>
              <strong>{property.title}</strong>
            </div>

            <div className="site-property-details-hero-top">
              <div>
                <span className="site-property-details-tag">
                  {property.type || "Imóvel"}
                </span>

                <h1>{property.title}</h1>

                <p className="site-property-details-location">
                  {locationText || "Localização não informada"}
                </p>
              </div>

              <div className="site-property-details-price-box">
                <span className="site-property-details-price-label">
                  Valor
                </span>
                <strong>{formattedPrice}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="site-property-details-content-section">
          <div className="site-property-details-container">
            <div className="site-property-details-grid">

              {/* LEFT */}
              <div className="site-property-details-main">

                {/* GALERIA */}
                <div className="site-property-details-gallery">
                  <div className="site-property-details-main-image-wrap">
                    <img
                      src={selectedImage}
                      alt={property.title}
                      className="site-property-details-main-image"
                    />
                  </div>

                  <div className="site-property-details-thumbs">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        className={`site-property-details-thumb ${
                          selectedImage === img ? "active" : ""
                        }`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARACTERÍSTICAS */}
                <div className="site-property-details-section-card">
                  <h2>Características</h2>

                  <div className="site-property-details-features">
                    <div className="site-property-details-feature">
                      <span className="label">Quartos</span>
                      <strong>{property.rooms || 0}</strong>
                    </div>

                    <div className="site-property-details-feature">
                      <span className="label">Banheiros</span>
                      <strong>{property.bathrooms || 0}</strong>
                    </div>

                    <div className="site-property-details-feature">
                      <span className="label">Vagas</span>
                      <strong>{property.garage || 0}</strong>
                    </div>

                    <div className="site-property-details-feature">
                      <span className="label">Área</span>
                      <strong>{property.area || 0} m²</strong>
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div className="site-property-details-section-card">
                  <h2>Descrição</h2>
                  <p className="site-property-details-description">
                    {property.description || "Sem descrição."}
                  </p>
                </div>

              </div>

              {/* SIDEBAR */}
              <aside className="site-property-details-sidebar">
                <div className="site-property-details-contact-card">

                  <span className="site-property-details-contact-label">
                    Atendimento
                  </span>

                  <h3>JB Pessoa Imóveis</h3>

                  <p>
                    Entre em contato agora e agende uma visita.
                  </p>

                  <div className="site-property-details-contact-info">
                    <span>Telefone / WhatsApp</span>
                    <strong>(11) 98318-5430</strong>
                  </div>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="site-property-details-whatsapp-button"
                  >
                    Falar no WhatsApp
                  </a>

                  <Link
                    to="/site/imoveis"
                    className="site-property-details-outline-button"
                  >
                    Ver outros imóveis
                  </Link>

                </div>
              </aside>

            </div>
          </div>
        </section>

      </div>
    </SiteLayout>
  );
}