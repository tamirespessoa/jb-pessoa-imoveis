import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import publicApi from "../services/publicApi";
import SiteLayout from "../components/SiteLayout";
import "./SitePropertyDetails.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

function getImageUrl(path) {
  if (!path) return "/sem-imagem.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

export default function SitePropertyDetails() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [sendingLead, setSendingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState("");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await publicApi.get(`/properties/public/${id}`);
        const data = response.data;

        setProperty(data);

        const firstImage = data?.coverImage
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

  async function handleLeadSubmit(e) {
    e.preventDefault();

    setLeadSuccess("");
    setLeadError("");

    if (!leadForm.name.trim()) {
      setLeadError("Informe seu nome.");
      return;
    }

    if (!leadForm.phone.trim()) {
      setLeadError("Informe seu telefone.");
      return;
    }

    try {
      setSendingLead(true);

      await publicApi.post("/leads", {
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim() || null,
        message: leadForm.message.trim() || null,
        propertyId: property?.id || null
      });

      setLeadSuccess(
        "Contato enviado com sucesso. Um corretor falará com você em breve."
      );

      setLeadForm({
        name: "",
        phone: "",
        email: "",
        message: ""
      });
    } catch (err) {
      console.error("Erro ao enviar lead:", err);
      setLeadError(
        err.response?.data?.error || "Não foi possível enviar seu contato."
      );
    } finally {
      setSendingLead(false);
    }
  }

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
    `Olá! Tenho interesse no imóvel "${property.title}". Link: ${window.location.href}`
  );

  const whatsappLink = `https://wa.me/5511983185430?text=${whatsappMessage}`;

  return (
    <SiteLayout>
      <div className="site-property-details-page">
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
              <div className="site-property-details-hero-info">
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
                  Valor do imóvel
                </span>
                <strong>{formattedPrice}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="site-property-details-content-section">
          <div className="site-property-details-container">
            <div className="site-property-details-grid">
              <div className="site-property-details-main">
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
                        type="button"
                        className={`site-property-details-thumb ${
                          selectedImage === img ? "active" : ""
                        }`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <img src={img} alt={`Imagem ${i + 1} do imóvel`} />
                      </button>
                    ))}
                  </div>
                </div>

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

                <div className="site-property-details-section-card">
                  <h2>Descrição</h2>
                  <p className="site-property-details-description">
                    {property.description || "Sem descrição."}
                  </p>
                </div>
              </div>

              <aside className="site-property-details-sidebar">
                <div className="site-property-details-contact-card">
                  <span className="site-property-details-contact-label">
                    Atendimento
                  </span>

                  <h3>JB Pessoa Imóveis</h3>

                  <p>Entre em contato agora e agende uma visita.</p>

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

                <div className="site-property-details-contact-card">
                  <span className="site-property-details-contact-label">
                    Receber contato
                  </span>

                  <h3>Fale com um corretor</h3>

                  <p>
                    Preencha seus dados e o sistema enviará seu contato para o
                    próximo corretor disponível.
                  </p>

                  <form
                    onSubmit={handleLeadSubmit}
                    className="site-property-details-lead-form"
                  >
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={leadForm.name}
                      onChange={(e) =>
                        setLeadForm((prev) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                    />

                    <input
                      type="text"
                      placeholder="Seu telefone"
                      value={leadForm.phone}
                      onChange={(e) =>
                        setLeadForm((prev) => ({
                          ...prev,
                          phone: e.target.value
                        }))
                      }
                    />

                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      value={leadForm.email}
                      onChange={(e) =>
                        setLeadForm((prev) => ({
                          ...prev,
                          email: e.target.value
                        }))
                      }
                    />

                    <textarea
                      placeholder="Mensagem"
                      rows="4"
                      value={leadForm.message}
                      onChange={(e) =>
                        setLeadForm((prev) => ({
                          ...prev,
                          message: e.target.value
                        }))
                      }
                    />

                    {leadSuccess && (
                      <div className="site-property-details-success-message">
                        {leadSuccess}
                      </div>
                    )}

                    {leadError && (
                      <div className="site-property-details-error-message">
                        {leadError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="site-property-details-send-button"
                      disabled={sendingLead}
                    >
                      {sendingLead
                        ? "Enviando..."
                        : "Quero falar com um corretor"}
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}