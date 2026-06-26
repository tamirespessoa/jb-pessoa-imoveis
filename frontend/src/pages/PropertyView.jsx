import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function PropertyView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || api.defaults.baseURL || "http://localhost:3001";

  const siteBaseUrl =
    import.meta.env.VITE_SITE_URL ||
    window.location.origin ||
    "https://www.jbpessoaimoveis.com.br";

  useEffect(() => {
    loadProperty();
  }, [id]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [lightboxOpen, lightboxIndex]);

  async function loadProperty() {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      const data = response.data;

      setProperty(data);

      if (data?.images?.length > 0) {
        setSelectedImage(data.images[0]);
      } else if (data?.coverImage) {
        setSelectedImage(data.coverImage);
      } else {
        setSelectedImage("");
      }
    } catch (error) {
      console.error("Erro ao carregar imóvel:", error.response?.data || error);
      alert("Erro ao carregar imóvel.");
      navigate("/imoveis");
    } finally {
      setLoading(false);
    }
  }

  function getImageUrl(imagePath) {
    if (!imagePath) return "";

    if (typeof imagePath !== "string") return "";

    const cleanPath = imagePath.trim();

    if (!cleanPath) return "";

    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }

    if (cleanPath.startsWith("/")) {
      return `${apiBaseUrl}${cleanPath}`;
    }

    return `${apiBaseUrl}/${cleanPath}`;
  }

  const galleryImages = useMemo(() => {
    if (!property) return [];

    const images = [];

    if (property.coverImage) {
      images.push(property.coverImage);
    }

    if (Array.isArray(property.images)) {
      property.images.forEach((image) => {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      });
    }

    return images.filter(Boolean);
  }, [property]);

  const formattedPrice = useMemo(() => {
    if (!property?.price && property?.price !== 0) return "-";

    return Number(property.price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }, [property]);

  const formattedRentPrice = useMemo(() => {
    if (!property?.rentPrice && property?.rentPrice !== 0) return null;

    return Number(property.rentPrice).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }, [property]);

  function getPublicPropertyUrl() {
    if (!property?.id) return `${siteBaseUrl}/site/imoveis`;
    return `${siteBaseUrl}/site/imoveis/${property.id}`;
  }

  function handleBack() {
    navigate("/imoveis");
  }

  function handleEdit() {
    navigate(`/imoveis/${id}/editar`);
  }

  async function handleShare() {
    if (!property) return;

    const text = `
Imóvel: ${property.title || "-"}
Código: ${property.code || "-"}
Tipo: ${property.type || "-"}
Cidade: ${property.city || "-"}
Estado: ${property.state || "-"}
Preço: ${formattedPrice}
Link: ${getPublicPropertyUrl()}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do imóvel copiado.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function handlePrint() {
    window.print();
  }

  function openLightbox(imagePath = selectedImage) {
    if (!galleryImages.length) return;

    const index = galleryImages.findIndex((image) => image === imagePath);
    setLightboxIndex(index >= 0 ? index : 0);
    setZoom(1);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setZoom(1);
  }

  function showNextImage() {
    if (!galleryImages.length) return;

    setLightboxIndex((prev) => {
      const next = prev + 1 >= galleryImages.length ? 0 : prev + 1;
      setSelectedImage(galleryImages[next]);
      setZoom(1);
      return next;
    });
  }

  function showPreviousImage() {
    if (!galleryImages.length) return;

    setLightboxIndex((prev) => {
      const next = prev - 1 < 0 ? galleryImages.length - 1 : prev - 1;
      setSelectedImage(galleryImages[next]);
      setZoom(1);
      return next;
    });
  }

  function selectLightboxImage(index) {
    setLightboxIndex(index);
    setSelectedImage(galleryImages[index]);
    setZoom(1);
  }

  function handleLightboxWheel(event) {
    event.preventDefault();

    setZoom((prev) => {
      const next = event.deltaY < 0 ? prev + 0.12 : prev - 0.12;
      return Math.min(2.4, Math.max(1, Number(next.toFixed(2))));
    });
  }

  function copyPublicLink() {
    navigator.clipboard
      .writeText(getPublicPropertyUrl())
      .then(() => alert("Link do imóvel copiado."))
      .catch(() => alert("Não foi possível copiar o link."));
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingText}>Carregando imóvel...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingText}>Imóvel não encontrado.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <button type="button" style={styles.topIconButton} onClick={handleBack}>
            ←
          </button>

          <span style={styles.topTitle}>
            {property.code || "Sem código"} {property.title ? `- ${property.title}` : ""}
          </span>
        </div>

        <div style={styles.topRight}>
          <button type="button" style={styles.topIconButton} onClick={handleShare}>
            ⤴
          </button>
          <button type="button" style={styles.topIconButton} onClick={handleEdit}>
            ✎
          </button>
          <button type="button" style={styles.topIconButton} onClick={handlePrint}>
            🖨
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.galleryColumn}>
          <div style={styles.galleryHeader}>
            <span style={styles.galleryTitle}>
              Fotos ({galleryImages.length || 0})
            </span>

            {galleryImages.length > 0 && (
              <button
                type="button"
                style={styles.galleryOpenButton}
                onClick={() => openLightbox(selectedImage || galleryImages[0])}
              >
                Ver galeria
              </button>
            )}
          </div>

          <div
            style={styles.mainImageBox}
            onClick={() => openLightbox(selectedImage || galleryImages[0])}
            title="Clique para abrir a galeria"
          >
            {selectedImage ? (
              <>
                <img
                  src={getImageUrl(selectedImage)}
                  alt={property.title || "Imóvel"}
                  style={styles.mainImage}
                />
                <div style={styles.mainImageOverlay}>📷 Abrir galeria</div>
              </>
            ) : (
              <div style={styles.noMainImage}>Sem imagem</div>
            )}
          </div>

          {galleryImages.length > 0 && (
            <div style={styles.thumbnailGrid}>
              {galleryImages.map((imagePath, index) => (
                <button
                  key={`${imagePath}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(imagePath)}
                  onDoubleClick={() => openLightbox(imagePath)}
                  style={{
                    ...styles.thumbButton,
                    ...(selectedImage === imagePath ? styles.thumbButtonActive : {})
                  }}
                >
                  <img
                    src={getImageUrl(imagePath)}
                    alt={`Foto ${index + 1}`}
                    style={styles.thumbnail}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.detailsColumn}>
          <div style={styles.heroCard}>
            <div
              style={styles.heroImageArea}
              onClick={() => openLightbox(selectedImage || galleryImages[0])}
              title="Clique para abrir a galeria"
            >
              {selectedImage ? (
                <img
                  src={getImageUrl(selectedImage)}
                  alt={property.title || "Imóvel"}
                  style={styles.heroImage}
                />
              ) : (
                <div style={styles.heroNoImage}>Sem imagem</div>
              )}

              <button
                type="button"
                style={styles.viewPhotosButton}
                onClick={(event) => {
                  event.stopPropagation();
                  openLightbox(selectedImage || galleryImages[0]);
                }}
              >
                📷 Ver todas as fotos
              </button>

              <div style={styles.heroOverlay}>
                <div style={styles.heroTitle}>
                  {property.title || property.type || "Imóvel"} - {property.city || "-"} - {property.state || "-"}
                </div>

                <div style={styles.heroBadges}>
                  <span style={styles.badge}>
                    ● {property.type || "Imóvel"} | {property.code || "-"}
                  </span>

                  <span style={styles.badge}>
                    📷 {galleryImages.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.summaryGrid}>
              <div style={styles.priceCard}>
                <div style={styles.priceLabel}>Venda</div>
                <div style={styles.priceValue}>{formattedPrice}</div>

                {formattedRentPrice && (
                  <div style={styles.rentValue}>Aluguel: {formattedRentPrice}</div>
                )}

                <div style={styles.addressBlock}>
                  <div style={styles.addressLine}>
                    {property.street || "-"}, {property.number || "-"}
                    {property.complement ? `, ${property.complement}` : ""}
                  </div>
                  <div style={styles.addressStrong}>
                    {property.district || "-"}
                  </div>
                  <div style={styles.addressMuted}>
                    {property.city || "-"} - {property.state || "-"}
                  </div>
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.metricsGrid}>
                  <div style={styles.metricItem}>
                    <div style={styles.metricIcon}>⛶</div>
                    <div style={styles.metricLabel}>Área</div>
                    <div style={styles.metricValue}>
                      {property.area ? `${property.area}m²` : "-"}
                    </div>
                  </div>

                  <div style={styles.metricItem}>
                    <div style={styles.metricIcon}>🛏</div>
                    <div style={styles.metricLabel}>Quartos</div>
                    <div style={styles.metricValue}>{property.rooms ?? "-"}</div>
                  </div>

                  <div style={styles.metricItem}>
                    <div style={styles.metricIcon}>🚗</div>
                    <div style={styles.metricLabel}>Vagas</div>
                    <div style={styles.metricValue}>{property.garage ?? "-"}</div>
                  </div>

                  <div style={styles.metricItem}>
                    <div style={styles.metricIcon}>🛁</div>
                    <div style={styles.metricLabel}>Banheiros</div>
                    <div style={styles.metricValue}>{property.bathrooms ?? "-"}</div>
                  </div>
                </div>

                <div style={styles.descriptionBox}>
                  <div style={styles.descriptionHeader}>
                    <h3 style={styles.descriptionTitle}>Descrição</h3>

                    <div style={styles.descriptionActions}>
                      <a
                        href={getPublicPropertyUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.publicSiteLink}
                      >
                        Ver imóvel no site
                      </a>

                      <button
                        type="button"
                        style={styles.editLink}
                        onClick={handleEdit}
                      >
                        Editar imóvel
                      </button>
                    </div>
                  </div>

                  <div style={styles.descriptionText}>
                    {property.description || "Sem descrição cadastrada."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.extraInfoGrid}>
            <div style={styles.extraCard}>
              <h3 style={styles.extraTitle}>Informações do imóvel</h3>
              <p><strong>Código:</strong> {property.code || "-"}</p>
              <p><strong>Tipo:</strong> {property.type || "-"}</p>
              <p><strong>Status:</strong> {property.status || "-"}</p>
              <p><strong>Preço:</strong> {formattedPrice}</p>
              <p><strong>Aluguel:</strong> {formattedRentPrice || "-"}</p>
            </div>

            <div style={styles.extraCard}>
              <h3 style={styles.extraTitle}>Localização</h3>
              <p><strong>CEP:</strong> {property.zipCode || "-"}</p>
              <p><strong>Rua:</strong> {property.street || "-"}</p>
              <p><strong>Número:</strong> {property.number || "-"}</p>
              <p><strong>Complemento:</strong> {property.complement || "-"}</p>
              <p><strong>Bairro:</strong> {property.district || "-"}</p>
              <p><strong>Cidade:</strong> {property.city || "-"}</p>
              <p><strong>Estado:</strong> {property.state || "-"}</p>
            </div>

            <div style={styles.extraCard}>
              <h3 style={styles.extraTitle}>Proprietário</h3>
              <p><strong>Nome:</strong> {property.owner?.fullName || "-"}</p>
              <p><strong>Email:</strong> {property.owner?.email || "-"}</p>
              <p><strong>Telefone:</strong> {property.owner?.phone || "-"}</p>
              <p><strong>CPF:</strong> {property.owner?.cpf || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && galleryImages.length > 0 && (
        <div style={styles.lightboxOverlay} onClick={closeLightbox}>
          <div style={styles.lightboxHeader} onClick={(event) => event.stopPropagation()}>
            <div style={styles.lightboxTitle}>
              {property.title || property.type || "Imóvel"} • {lightboxIndex + 1} / {galleryImages.length}
            </div>

            <div style={styles.lightboxActions}>
              <button type="button" style={styles.lightboxSmallButton} onClick={() => setZoom((prev) => Math.min(2.4, prev + 0.2))}>
                + Zoom
              </button>
              <button type="button" style={styles.lightboxSmallButton} onClick={() => setZoom(1)}>
                Resetar
              </button>
              <button type="button" style={styles.lightboxSmallButton} onClick={copyPublicLink}>
                Copiar link
              </button>
              <button type="button" style={styles.lightboxCloseButton} onClick={closeLightbox}>
                ×
              </button>
            </div>
          </div>

          <button
            type="button"
            style={{ ...styles.lightboxArrow, ...styles.lightboxArrowLeft }}
            onClick={(event) => {
              event.stopPropagation();
              showPreviousImage();
            }}
          >
            ‹
          </button>

          <div
            style={styles.lightboxImageStage}
            onClick={(event) => event.stopPropagation()}
            onWheel={handleLightboxWheel}
          >
            <img
              src={getImageUrl(galleryImages[lightboxIndex])}
              alt={`Foto ${lightboxIndex + 1}`}
              style={{
                ...styles.lightboxImage,
                transform: `scale(${zoom})`
              }}
            />
          </div>

          <button
            type="button"
            style={{ ...styles.lightboxArrow, ...styles.lightboxArrowRight }}
            onClick={(event) => {
              event.stopPropagation();
              showNextImage();
            }}
          >
            ›
          </button>

          <div style={styles.lightboxThumbs} onClick={(event) => event.stopPropagation()}>
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                style={{
                  ...styles.lightboxThumbButton,
                  ...(index === lightboxIndex ? styles.lightboxThumbButtonActive : {})
                }}
                onClick={() => selectLightboxImage(index)}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`Miniatura ${index + 1}`}
                  style={styles.lightboxThumbImage}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" style={styles.floatingEditButton} onClick={handleEdit}>
        ✎
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef2f7",
    fontFamily: "Arial, sans-serif"
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef2f7"
  },
  loadingText: {
    fontSize: "20px",
    color: "#444"
  },
  topBar: {
    height: "62px",
    background: "#2f86d6",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px"
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  topIconButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer"
  },
  topTitle: {
    fontSize: "18px",
    fontWeight: "bold"
  },
  content: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "18px",
    padding: "18px"
  },
  galleryColumn: {
    background: "#fff",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #ddd",
    alignSelf: "start"
  },
  galleryHeader: {
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px"
  },
  galleryTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#2f86d6"
  },
  galleryOpenButton: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  mainImageBox: {
    position: "relative",
    marginBottom: "14px",
    cursor: "zoom-in",
    overflow: "hidden",
    borderRadius: "12px"
  },
  mainImage: {
    width: "100%",
    height: "255px",
    objectFit: "cover",
    borderRadius: "12px",
    display: "block"
  },
  mainImageOverlay: {
    position: "absolute",
    left: "12px",
    bottom: "12px",
    background: "rgba(15, 23, 42, 0.82)",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "800"
  },
  noMainImage: {
    width: "100%",
    height: "255px",
    borderRadius: "12px",
    background: "#e9e9e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666"
  },
  thumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  thumbButton: {
    border: "2px solid transparent",
    background: "#fff",
    padding: 0,
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer"
  },
  thumbButtonActive: {
    border: "2px solid #2f86d6"
  },
  thumbnail: {
    width: "100%",
    height: "130px",
    objectFit: "cover",
    display: "block"
  },
  detailsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  heroCard: {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #ddd"
  },
  heroImageArea: {
    position: "relative",
    height: "360px",
    background: "#ddd",
    cursor: "zoom-in"
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  heroNoImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    background: "#ececec"
  },
  viewPhotosButton: {
    position: "absolute",
    right: "18px",
    top: "18px",
    zIndex: 5,
    border: "none",
    background: "rgba(15, 23, 42, 0.88)",
    color: "#fff",
    borderRadius: "999px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)"
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "18px",
    background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.05))",
    color: "#fff"
  },
  heroTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "12px"
  },
  heroBadges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  badge: {
    background: "rgba(0,0,0,0.45)",
    padding: "8px 12px",
    borderRadius: "10px",
    fontSize: "15px"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    padding: "18px"
  },
  priceCard: {
    background: "#fafafa",
    borderRadius: "14px",
    padding: "22px",
    border: "1px solid #e6e6e6"
  },
  priceLabel: {
    fontSize: "18px",
    color: "#777",
    marginBottom: "10px"
  },
  priceValue: {
    fontSize: "28px",
    color: "#2f86d6",
    fontWeight: "bold",
    marginBottom: "18px"
  },
  rentValue: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "18px"
  },
  addressBlock: {
    paddingTop: "16px",
    borderTop: "1px solid #ddd"
  },
  addressLine: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333"
  },
  addressStrong: {
    marginTop: "8px",
    fontSize: "16px",
    color: "#444"
  },
  addressMuted: {
    marginTop: "6px",
    color: "#777"
  },
  infoCard: {
    background: "#fafafa",
    borderRadius: "14px",
    padding: "22px",
    border: "1px solid #e6e6e6"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "18px"
  },
  metricItem: {
    textAlign: "center",
    color: "#333"
  },
  metricIcon: {
    fontSize: "25px",
    marginBottom: "6px"
  },
  metricLabel: {
    fontSize: "13px",
    color: "#777"
  },
  metricValue: {
    marginTop: "8px",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111"
  },
  descriptionBox: {
    borderTop: "1px solid #ddd",
    paddingTop: "18px"
  },
  descriptionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
    flexWrap: "wrap"
  },
  descriptionActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  descriptionTitle: {
    margin: 0,
    fontSize: "22px"
  },
  publicSiteLink: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "15px",
    fontWeight: "800",
    textDecoration: "underline",
    cursor: "pointer"
  },
  editLink: {
    border: "none",
    background: "transparent",
    color: "#2f86d6",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  descriptionText: {
    color: "#555",
    lineHeight: 1.6
  },
  extraInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px"
  },
  extraCard: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #ddd",
    padding: "18px"
  },
  extraTitle: {
    margin: "0 0 12px",
    color: "#2f86d6"
  },
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2, 6, 23, 0.96)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "82px 96px 130px"
  },
  lightboxHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    minHeight: "70px",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    color: "#fff",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0))"
  },
  lightboxTitle: {
    fontSize: "18px",
    fontWeight: "900"
  },
  lightboxActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  lightboxSmallButton: {
    minHeight: "38px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: "999px",
    padding: "0 14px",
    fontWeight: "800",
    cursor: "pointer"
  },
  lightboxCloseButton: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: "#fff",
    color: "#111827",
    fontSize: "32px",
    lineHeight: 1,
    cursor: "pointer"
  },
  lightboxImageStage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  lightboxImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 0.15s ease"
  },
  lightboxArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "48px",
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 10
  },
  lightboxArrowLeft: {
    left: "24px"
  },
  lightboxArrowRight: {
    right: "24px"
  },
  lightboxThumbs: {
    position: "absolute",
    left: "24px",
    right: "24px",
    bottom: "22px",
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    padding: "10px",
    background: "rgba(15, 23, 42, 0.72)",
    borderRadius: "16px"
  },
  lightboxThumbButton: {
    width: "96px",
    height: "68px",
    flex: "0 0 auto",
    border: "2px solid transparent",
    borderRadius: "10px",
    overflow: "hidden",
    padding: 0,
    background: "transparent",
    cursor: "pointer"
  },
  lightboxThumbButtonActive: {
    borderColor: "#facc15"
  },
  lightboxThumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  floatingEditButton: {
    position: "fixed",
    right: "28px",
    bottom: "24px",
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    border: "none",
    background: "#ff4b3e",
    color: "#fff",
    fontSize: "30px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
  }
};

export default PropertyView;
