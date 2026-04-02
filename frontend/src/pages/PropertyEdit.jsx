import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function PropertyEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = !!id;

  const [owners, setOwners] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");

  const [form, setForm] = useState({
    title: "",
    code: "",
    type: "",
    status: "DISPONIVEL",
    price: "",
    rentPrice: "",
    area: "",
    rooms: "",
    bathrooms: "",
    garage: "",
    street: "",
    number: "",
    complement: "",
    zipCode: "",
    district: "",
    city: "",
    state: "",
    description: "",
    ownerId: "",
    images: []
  });

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || api.defaults.baseURL || "http://localhost:3001";

  useEffect(() => {
    loadOwners();

    if (isEditing) {
      loadProperty();
    }
  }, [id]);

  function getImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${apiBaseUrl}${imagePath}`;
  }

  async function loadOwners() {
    try {
      const response = await api.get("/persons");
      const filtered = (response.data || []).filter(
        (item) => item.type === "PROPRIETARIO"
      );
      setOwners(filtered);
    } catch (error) {
      console.error("Erro ao carregar proprietários:", error.response?.data || error);
      alert("Erro ao carregar proprietários.");
    }
  }

  async function loadProperty() {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      const data = response.data;

      setProperty(data);
      setForm({
        title: data.title || "",
        code: data.code || "",
        type: data.type || "",
        status: data.status || "DISPONIVEL",
        price: data.price ?? "",
        rentPrice: data.rentPrice ?? "",
        area: data.area ?? "",
        rooms: data.rooms ?? "",
        bathrooms: data.bathrooms ?? "",
        garage: data.garage ?? "",
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        zipCode: data.zipCode || "",
        district: data.district || "",
        city: data.city || "",
        state: data.state || "",
        description: data.description || "",
        ownerId: data.ownerId || "",
        images: data.images || []
      });

      if (data.images?.length > 0) {
        setSelectedImage(data.images[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar imóvel:", error.response?.data || error);
      alert("Erro ao carregar imóvel.");
      navigate("/imoveis");
    } finally {
      setLoading(false);
    }
  }

  function normalizeString(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function intOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  }

  function removeExistingImage(imagePath) {
    const newList = form.images.filter((img) => img !== imagePath);

    setForm((prev) => ({
      ...prev,
      images: newList
    }));

    if (selectedImage === imagePath) {
      setSelectedImage(newList[0] || "");
    }
  }

  function removeNewImage(indexToRemove) {
    setNewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) return alert("Título do imóvel é obrigatório.");
    if (!form.code.trim()) return alert("Código é obrigatório.");
    if (!form.type.trim()) return alert("Tipo é obrigatório.");
    if (!form.price.toString().trim()) return alert("Preço é obrigatório.");
    if (!form.area.toString().trim()) return alert("Área é obrigatória.");
    if (!form.rooms.toString().trim()) return alert("Quantidade de quartos é obrigatória.");
    if (!form.bathrooms.toString().trim()) return alert("Quantidade de banheiros é obrigatória.");
    if (!form.street.trim()) return alert("Rua é obrigatória.");
    if (!form.number.trim()) return alert("Número é obrigatório.");
    if (!form.zipCode.trim()) return alert("CEP é obrigatório.");
    if (!form.district.trim()) return alert("Bairro é obrigatório.");
    if (!form.city.trim()) return alert("Cidade é obrigatória.");
    if (!form.state.trim()) return alert("Estado é obrigatório.");
    if (!form.ownerId) return alert("Selecione o proprietário.");

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("code", form.code.trim());
    payload.append("type", form.type.trim());
    payload.append("status", normalizeString(form.status) || "DISPONIVEL");
    payload.append("price", numberOrNull(form.price));
    payload.append("rentPrice", numberOrNull(form.rentPrice) ?? "");
    payload.append("area", numberOrNull(form.area));
    payload.append("rooms", intOrNull(form.rooms));
    payload.append("bathrooms", intOrNull(form.bathrooms));
    payload.append("garage", intOrNull(form.garage) ?? "");
    payload.append("street", form.street.trim());
    payload.append("number", form.number.trim());
    payload.append("complement", normalizeString(form.complement) || "");
    payload.append("zipCode", form.zipCode.trim());
    payload.append("district", form.district.trim());
    payload.append("city", form.city.trim());
    payload.append("state", form.state.trim());
    payload.append("description", normalizeString(form.description) || "");
    payload.append("ownerId", form.ownerId);
    payload.append("existingImages", JSON.stringify(form.images || []));

    newImages.forEach((file) => {
      payload.append("images", file);
    });

    try {
      setLoading(true);

      if (isEditing) {
        await api.put(`/properties/${id}`, payload);
        alert("Imóvel atualizado com sucesso.");
        navigate(`/imoveis/${id}`);
      } else {
        const response = await api.post("/properties", payload);
        const createdId = response.data?.property?.id;
        alert("Imóvel cadastrado com sucesso.");
        navigate(createdId ? `/imoveis/${createdId}` : "/imoveis");
      }
    } catch (error) {
      console.error("Erro ao salvar imóvel:", error.response?.data || error);
      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        "Erro ao salvar imóvel.";
      alert(apiMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEditing) {
      alert("Esse imóvel ainda não foi salvo.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este imóvel?");
    if (!confirmed) return;

    try {
      await api.delete(`/properties/${id}`);
      alert("Imóvel excluído com sucesso.");
      navigate("/imoveis");
    } catch (error) {
      console.error("Erro ao excluir imóvel:", error.response?.data || error);
      alert("Erro ao excluir imóvel.");
    }
  }

  const previewImages = useMemo(() => {
    return newImages.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
  }, [newImages]);

  if (loading && isEditing && !property) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingText}>Carregando imóvel...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <button type="button" style={styles.topIconButton} onClick={() => navigate(isEditing ? `/imoveis/${id}` : "/imoveis")}>
            ←
          </button>

          <span style={styles.topTitle}>
            {isEditing
              ? `${form.code || "Sem código"} (${form.title || "Imóvel"})`
              : "Novo imóvel"}
          </span>
        </div>

        <div style={styles.topRight}>
          <button
            type="button"
            style={styles.topIconButton}
            onClick={() => navigate(isEditing ? `/imoveis/${id}` : "/imoveis")}
          >
            👁
          </button>
          <button
            type="button"
            style={styles.topIconButton}
            onClick={() => window.print()}
          >
            🖨
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <aside style={styles.leftColumn}>
          <div style={styles.photoHeader}>
            <span style={styles.photoTitle}>
              Fotos ({(form.images?.length || 0) + newImages.length})
            </span>
          </div>

          <div style={styles.bigPreviewBox}>
            {selectedImage ? (
              <img
                src={getImageUrl(selectedImage)}
                alt="Selecionada"
                style={styles.bigPreviewImage}
              />
            ) : previewImages[0] ? (
              <img
                src={previewImages[0].url}
                alt="Nova imagem"
                style={styles.bigPreviewImage}
              />
            ) : (
              <div style={styles.noImageBox}>Sem imagem selecionada</div>
            )}
          </div>

          {form.images?.length > 0 && (
            <div style={styles.thumbGrid}>
              {form.images.map((imagePath, index) => (
                <div key={`${imagePath}-${index}`} style={styles.thumbCard}>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(imagePath)}
                    style={styles.thumbImageButton}
                  >
                    <img
                      src={getImageUrl(imagePath)}
                      alt={`Imagem ${index + 1}`}
                      style={styles.thumbImage}
                    />
                  </button>

                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => removeExistingImage(imagePath)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {previewImages.length > 0 && (
            <div style={styles.thumbGrid}>
              {previewImages.map((image, index) => (
                <div key={`${image.name}-${index}`} style={styles.thumbCard}>
                  <button
                    type="button"
                    onClick={() => setSelectedImage("")}
                    style={styles.thumbImageButton}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      style={styles.thumbImage}
                    />
                  </button>

                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => removeNewImage(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main style={styles.mainColumn}>
          <div style={styles.mainHeader}>
            <div style={styles.greenDot}></div>
            <h1 style={styles.mainTitle}>Cadastro</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid3}>
              <div style={styles.field}>
                <label style={styles.label}>*Tipo</label>
                <input
                  style={styles.lineInput}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="Apartamento, Casa..."
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>*Código</label>
                <input
                  style={styles.lineInput}
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>*Status</label>
                <select
                  style={styles.lineInput}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="DISPONIVEL">Disponível</option>
                  <option value="VENDIDO">Vendido</option>
                  <option value="ALUGADO">Alugado</option>
                  <option value="ARQUIVADO">Arquivado</option>
                </select>
              </div>
            </div>

            <div style={styles.formGrid1}>
              <div style={styles.field}>
                <label style={styles.label}>*Título do imóvel</label>
                <input
                  style={styles.lineInput}
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.sectionTitle}>Valores</div>

            <div style={styles.formGrid4}>
              <div style={styles.field}>
                <label style={styles.label}>*Venda</label>
                <input
                  style={styles.lineInput}
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Locação</label>
                <input
                  style={styles.lineInput}
                  name="rentPrice"
                  value={form.rentPrice}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Área</label>
                <input
                  style={styles.lineInput}
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Garagem</label>
                <input
                  style={styles.lineInput}
                  name="garage"
                  value={form.garage}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.formGrid4}>
              <div style={styles.field}>
                <label style={styles.label}>Quartos</label>
                <input
                  style={styles.lineInput}
                  name="rooms"
                  value={form.rooms}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Banheiros</label>
                <input
                  style={styles.lineInput}
                  name="bathrooms"
                  value={form.bathrooms}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Condomínio</label>
                <input
                  style={styles.lineInput}
                  placeholder="Opcional"
                  disabled
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>IPTU</label>
                <input
                  style={styles.lineInput}
                  placeholder="Opcional"
                  disabled
                />
              </div>
            </div>

            <div style={styles.sectionTitle}>Localização</div>

            <div style={styles.formGrid2}>
              <div style={styles.field}>
                <label style={styles.label}>CEP</label>
                <input
                  style={styles.lineInput}
                  name="zipCode"
                  value={form.zipCode}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Número</label>
                <input
                  style={styles.lineInput}
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.formGrid2}>
              <div style={styles.field}>
                <label style={styles.label}>Rua</label>
                <input
                  style={styles.lineInput}
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Complemento</label>
                <input
                  style={styles.lineInput}
                  name="complement"
                  value={form.complement}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.formGrid3}>
              <div style={styles.field}>
                <label style={styles.label}>Bairro</label>
                <input
                  style={styles.lineInput}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Cidade</label>
                <input
                  style={styles.lineInput}
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Estado</label>
                <input
                  style={styles.lineInput}
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.sectionTitle}>Detalhes</div>

            <div style={styles.formGrid2}>
              <div style={styles.field}>
                <label style={styles.label}>Descrição</label>
                <textarea
                  style={styles.textArea}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>*Proprietário</label>
                <select
                  style={styles.lineInput}
                  name="ownerId"
                  value={form.ownerId}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.sectionTitle}>Imagens</div>

            <div style={styles.formGrid1}>
              <div style={styles.field}>
                <label style={styles.label}>Adicionar imagens</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  style={styles.fileInput}
                />
              </div>
            </div>

            <div style={styles.actionRow}>
              {isEditing && (
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={handleDelete}
                >
                  Excluir
                </button>
              )}
            </div>

            <button
              type="submit"
              style={{
                ...styles.floatingSaveButton,
                ...(loading ? styles.floatingSaveButtonDisabled : {})
              }}
              disabled={loading}
            >
              💾
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    fontFamily: "Arial, sans-serif"
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5"
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
    gridTemplateColumns: "430px 1fr",
    minHeight: "calc(100vh - 62px)"
  },
  leftColumn: {
    background: "#fff",
    borderRight: "1px solid #e4e4e4",
    padding: "18px",
    overflowY: "auto"
  },
  photoHeader: {
    marginBottom: "16px"
  },
  photoTitle: {
    fontSize: "18px",
    color: "#2f86d6",
    fontWeight: "bold"
  },
  bigPreviewBox: {
    marginBottom: "16px"
  },
  bigPreviewImage: {
    width: "100%",
    height: "255px",
    objectFit: "cover",
    borderRadius: "14px",
    display: "block"
  },
  noImageBox: {
    width: "100%",
    height: "255px",
    borderRadius: "14px",
    background: "#ececec",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777"
  },
  thumbGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "14px"
  },
  thumbCard: {
    background: "#f8f0d8",
    border: "1px solid #e0d2a9",
    borderRadius: "12px",
    padding: "10px"
  },
  thumbImageButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer"
  },
  thumbImage: {
    width: "100%",
    height: "130px",
    objectFit: "cover",
    borderRadius: "10px",
    display: "block",
    marginBottom: "10px"
  },
  removeButton: {
    width: "100%",
    background: "#df463d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "15px"
  },
  mainColumn: {
    background: "#fffefb",
    padding: "24px 38px",
    overflowY: "auto",
    position: "relative"
  },
  mainHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "26px"
  },
  greenDot: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#98cf98"
  },
  mainTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "normal"
  },
  sectionTitle: {
    marginTop: "26px",
    marginBottom: "18px",
    fontSize: "20px",
    color: "#2f86d6"
  },
  formGrid1: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "28px",
    marginBottom: "24px"
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    marginBottom: "24px"
  },
  formGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "40px",
    marginBottom: "24px"
  },
  formGrid4: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "30px",
    marginBottom: "24px"
  },
  field: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "15px",
    color: "#94815a",
    marginBottom: "8px"
  },
  lineInput: {
    border: "none",
    borderBottom: "1px solid #d7c6a0",
    background: "transparent",
    fontSize: "18px",
    padding: "8px 0 10px 0",
    outline: "none"
  },
  textArea: {
    minHeight: "120px",
    border: "1px solid #d7c6a0",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "16px",
    outline: "none",
    resize: "vertical",
    background: "#fff"
  },
  fileInput: {
    fontSize: "16px"
  },
  actionRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-start"
  },
  deleteButton: {
    background: "#d6453d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: "15px"
  },
  floatingSaveButton: {
    position: "fixed",
    right: "28px",
    bottom: "24px",
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    border: "none",
    background: "#ff4b3e",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
  },
  floatingSaveButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed"
  }
};

export default PropertyEdit;