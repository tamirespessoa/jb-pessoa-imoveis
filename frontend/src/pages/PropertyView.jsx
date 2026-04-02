import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function PropertyView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || api.defaults.baseURL || "http://localhost:3001";

  useEffect(() => {
    loadProperty();
  }, [id]);

  async function loadProperty() {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      const data = response.data;

      setProperty(data);

      if (data?.images?.length > 0) {
        setSelectedImage(data.images[0]);
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
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${apiBaseUrl}${imagePath}`;
  }

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

  function handleBack() {
    navigate("/imoveis");
  }

  function handleEdit() {
    navigate(`/imoveis/${id}/editar`);
  }

  async function handleShare() {
    if (!property) return;

    const text = `
Imóvel: ${property.title}
Código: ${property.code || "-"}
Tipo: ${property.type || "-"}
Cidade: ${property.city || "-"}
Estado: ${property.state || "-"}
Preço: ${formattedPrice}
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
              Fotos ({property.images?.length || 0})
            </span>
          </div>

          <div style={styles.mainImageBox}>
            {selectedImage ? (
              <img
                src={getImageUrl(selectedImage)}
                alt={property.title}
                style={styles.mainImage}
              />
            ) : (
              <div style={styles.noMainImage}>Sem imagem</div>
            )}
          </div>

          {property.images?.length > 0 && (
            <div style={styles.thumbnailGrid}>
              {property.images.map((imagePath, index) => (
                <button
                  key={`${imagePath}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(imagePath)}
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
            <div style={styles.heroImageArea}>
              {selectedImage ? (
                <img
                  src={getImageUrl(selectedImage)}
                  alt={property.title}
                  style={styles.heroImage}
                />
              ) : (
                <div style={styles.heroNoImage}>Sem imagem</div>
              )}

              <div style={styles.heroOverlay}>
                <div style={styles.heroTitle}>
                  {property.title} - {property.city} - {property.state}
                </div>

                <div style={styles.heroBadges}>
                  <span style={styles.badge}>
                    ● {property.type || "Imóvel"} | {property.code || "-"}
                  </span>

                  <span style={styles.badge}>
                    📷 {property.images?.length || 0}
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

                    <button
                      type="button"
                      style={styles.editLink}
                      onClick={handleEdit}
                    >
                      Editar imóvel
                    </button>
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
    marginBottom: "14px"
  },
  galleryTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#2f86d6"
  },
  mainImageBox: {
    marginBottom: "14px"
  },
  mainImage: {
    width: "100%",
    height: "255px",
    objectFit: "cover",
    borderRadius: "12px",
    display: "block"
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
    background: "#ddd"
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
    borderTop: "1px solid #e5e5e5",
    paddingTop: "18px"
  },
  addressLine: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "8px"
  },
  addressStrong: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6px"
  },
  addressMuted: {
    color: "#777",
    fontSize: "17px"
  },
  infoCard: {
    background: "#fafafa",
    borderRadius: "14px",
    padding: "22px",
    border: "1px solid #e6e6e6"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "10px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e4e4e4"
  },
  metricItem: {
    textAlign: "center"
  },
  metricIcon: {
    fontSize: "28px",
    marginBottom: "8px"
  },
  metricLabel: {
    color: "#777",
    marginBottom: "8px",
    fontSize: "16px"
  },
  metricValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#222"
  },
  descriptionBox: {
    paddingTop: "18px"
  },
  descriptionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px"
  },
  descriptionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "normal"
  },
  editLink: {
    border: "none",
    background: "transparent",
    color: "#2f86d6",
    cursor: "pointer",
    fontSize: "16px",
    textDecoration: "underline"
  },
  descriptionText: {
    fontSize: "18px",
    color: "#555",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap"
  },
  extraInfoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "18px"
  },
  extraCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #ddd"
  },
  extraTitle: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#2f86d6",
    fontSize: "20px"
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