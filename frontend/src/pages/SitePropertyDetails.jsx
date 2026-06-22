import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import publicApi from "../services/publicApi";
import SiteChatWidget from "../components/SiteChatWidget";
import logo from "../assets/logo-jb.png";
import "./SitePropertyDetails.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://jb-pessoa-imoveis.onrender.com";

function formatPrice(value) {
  if (!value) return "Valor a consultar";

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getImageUrl(path) {
  if (!path) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
  }

  const value = String(path).trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  return `${API_BASE_URL}/${value}`;
}

function getPropertyImages(property) {
  const images = [];

  if (property?.coverImage) {
    images.push(property.coverImage);
  }

  if (Array.isArray(property?.images)) {
    property.images.forEach((item) => {
      if (typeof item === "string") {
        images.push(item);
      } else if (item?.url) {
        images.push(item.url);
      } else if (item?.path) {
        images.push(item.path);
      }
    });
  }

  const validImages = images
    .filter(Boolean)
    .filter((item) => {
      const value = String(item).toLowerCase();

      return (
        !value.includes("logo") &&
        !value.includes("favicon") &&
        !value.includes("watermark")
      );
    });

  if (validImages.length === 0) {
    return [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
    ];
  }

  return [...new Set(validImages)].map(getImageUrl);
}

function getLocation(property) {
  return [
    property?.address,
    property?.district || property?.neighborhood,
    property?.city,
    property?.state
  ]
    .filter(Boolean)
    .join(" - ");
}

function getTypeLabel(type) {
  if (!type) return "Imóvel";
  if (type === "SALE") return "Venda";
  if (type === "RENT") return "Locação";
  return type;
}

function getWhatsAppLink(property) {
  const phone = "5511983416160";
  const message = `Olá! Tenho interesse no imóvel ${property?.code || property?.title || ""} - ${window.location.href}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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

  const [leadStatus, setLeadStatus] = useState("");
  const [sendingLead, setSendingLead] = useState(false);

  const images = useMemo(() => getPropertyImages(property), [property]);

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        let response;

        try {
          response = await publicApi.get(`/properties/public/${id}`);
        } catch (firstError) {
          response = await publicApi.get(`/properties/${id}`);
        }

        const data = response.data?.data || response.data;

        if (!data || !data.id) {
          setError("Imóvel não encontrado.");
          return;
        }

        setProperty(data);
        setSelectedImage(getPropertyImages(data)[0]);
      } catch (err) {
        console.error("Erro ao carregar imóvel:", err);
        setError("Não foi possível carregar as informações deste imóvel.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProperty();
    }
  }, [id]);

  function handleLeadChange(event) {
    const { name, value } = event.target;

    setLeadForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();

    if (!leadForm.name.trim()) {
      setLeadStatus("Informe seu nome.");
      return;
    }

    if (!leadForm.phone.trim()) {
      setLeadStatus("Informe seu telefone.");
      return;
    }

    try {
      setSendingLead(true);
      setLeadStatus("");

      await publicApi.post("/leads", {
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim() || null,
        message:
          leadForm.message.trim() ||
          `Tenho interesse no imóvel ${property?.code || property?.title || id}.`,
        propertyId: property?.id || id
      });

      setLeadStatus("Contato enviado com sucesso. Um corretor falará com você em breve.");
      setLeadForm({
        name: "",
        phone: "",
        email: "",
        message: ""
      });
    } catch (err) {
      console.error("Erro ao enviar lead:", err);
      setLeadStatus("Não foi possível enviar agora. Tente pelo WhatsApp.");
    } finally {
      setSendingLead(false);
    }
  }

  if (loading) {
    return (
      <div className="property-details-page">
        <div className="property-details-loading">Carregando imóvel...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-page">
        <div className="property-details-error">
          <img src={logo} alt="JB Pessoa Imóveis" />
          <h1>Imóvel não encontrado</h1>
          <p>{error || "Não encontramos este imóvel no site."}</p>
          <Link to="/site/imoveis">Voltar para imóveis</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="property-details-page">
      <header className="property-details-header">
        <div className="property-details-container property-details-header-content">
          <Link to="/site" className="property-details-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className="property-details-nav">
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Cadastre seu imóvel</Link>
            <a href="/site#contato">Contato</a>
          </nav>

          <a
            href={getWhatsAppLink(property)}
            target="_blank"
            rel="noreferrer"
            className="property-details-header-button"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <main>
        <section className="property-details-hero">
          <div className="property-details-container">
            <div className="property-details-breadcrumb">
              <Link to="/site">Início</Link>
              <span>/</span>
              <Link to="/site/imoveis">Imóveis</Link>
              <span>/</span>
              <span>{property.title || property.code || "Detalhes"}</span>
            </div>

            <div className="property-details-title-row">
              <div>
                <span className="property-details-tag">
                  {property.category || getTypeLabel(property.type)}
                </span>

                <h1>{property.title || property.category || "Imóvel"}</h1>

                <p>{getLocation(property) || "Localização não informada"}</p>
              </div>

              <div className="property-details-price-card">
                <span>Valor do imóvel</span>
                <strong>{formatPrice(property.price)}</strong>
                {property.code ? <small>Código: {property.code}</small> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="property-details-content">
          <div className="property-details-container property-details-grid">
            <div>
              <div className="property-details-gallery">
                <div className="property-details-main-image">
                  <img
                    src={selectedImage || images[0]}
                    alt={property.title || "Imóvel"}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                </div>

                {images.length > 1 && (
                  <div className="property-details-thumbs">
                    {images.map((image) => (
                      <button
                        key={image}
                        type="button"
                        className={selectedImage === image ? "active" : ""}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img src={image} alt="Miniatura do imóvel" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="property-details-card">
                <h2>Características</h2>

                <div className="property-details-features">
                  <div>
                    <span>Quartos</span>
                    <strong>{property.rooms || property.bedrooms || 0}</strong>
                  </div>

                  <div>
                    <span>Banheiros</span>
                    <strong>{property.bathrooms || 0}</strong>
                  </div>

                  <div>
                    <span>Vagas</span>
                    <strong>{property.garage || property.garageSpots || 0}</strong>
                  </div>

                  <div>
                    <span>Área</span>
                    <strong>{property.area || 0} m²</strong>
                  </div>
                </div>
              </div>

              <div className="property-details-card">
                <h2>Descrição</h2>

                <p className="property-details-description">
                  {property.description ||
                    "Entre em contato com a JB Pessoa Imóveis para mais informações sobre este imóvel."}
                </p>
              </div>
            </div>

            <aside className="property-details-sidebar">
              <div className="property-details-contact-card">
                <span>Atendimento</span>
                <h3>Gostou deste imóvel?</h3>
                <p>
                  Fale com um corretor da JB Pessoa Imóveis e tire suas dúvidas.
                </p>

                <a
                  href={getWhatsAppLink(property)}
                  target="_blank"
                  rel="noreferrer"
                  className="property-details-whatsapp"
                >
                  Chamar no WhatsApp
                </a>

                <Link to="/site/imoveis" className="property-details-outline">
                  Ver outros imóveis
                </Link>
              </div>

              <form className="property-details-contact-card" onSubmit={handleLeadSubmit}>
                <span>Tenho interesse</span>
                <h3>Solicitar contato</h3>

                <input
                  name="name"
                  placeholder="Seu nome"
                  value={leadForm.name}
                  onChange={handleLeadChange}
                />

                <input
                  name="phone"
                  placeholder="Telefone / WhatsApp"
                  value={leadForm.phone}
                  onChange={handleLeadChange}
                />

                <input
                  name="email"
                  placeholder="E-mail"
                  value={leadForm.email}
                  onChange={handleLeadChange}
                />

                <textarea
                  name="message"
                  placeholder="Mensagem"
                  value={leadForm.message}
                  onChange={handleLeadChange}
                />

                {leadStatus && <p className="property-details-status">{leadStatus}</p>}

                <button type="submit" disabled={sendingLead}>
                  {sendingLead ? "Enviando..." : "Enviar contato"}
                </button>
              </form>
            </aside>
          </div>
        </section>
      </main>

      <SiteChatWidget />
    </div>
  );
}
