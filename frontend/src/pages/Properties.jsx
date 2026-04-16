import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

function Properties() {
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [viewMode, setViewMode] = useState("list");

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
    import.meta.env.VITE_API_URL ||
    api.defaults.baseURL ||
    "http://localhost:3001";

  function normalizeString(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(String(value).replace(/\./g, "").replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  }

  function intOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function getImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${apiBaseUrl}${imagePath}`;
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === "") return "-";
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getAddressLine(property) {
    const parts = [
      property.street,
      property.number,
      property.complement
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  }

  function getMainImage(property) {
    if (!property?.images?.length) return "";
    return getImageUrl(property.images[0]);
  }

  async function loadProperties(selectId = null) {
    try {
      const response = await api.get("/properties");
      const list = response.data || [];
      setProperties(list);

      if (selectId) {
        const found = list.find((item) => item.id === selectId);
        if (found) {
          handleSelectProperty(found, false);
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar imóveis:",
        error.response?.data || error.message
      );
      alert("Erro ao carregar imóveis.");
    }
  }

  async function loadOwners() {
    try {
      const response = await api.get("/persons");
      const filtered = (response.data || []).filter(
        (item) => item.type === "PROPRIETARIO"
      );
      setOwners(filtered);
    } catch (error) {
      console.error(
        "Erro ao carregar proprietários:",
        error.response?.data || error.message
      );
      alert("Erro ao carregar proprietários.");
    }
  }

  useEffect(() => {
    loadProperties();
    loadOwners();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) =>
      `${property.title || ""} ${property.code || ""} ${property.city || ""} ${
        property.district || ""
      } ${property.owner?.fullName || ""} ${property.street || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [properties, search]);

  function fillFormFromProperty(property) {
    setForm({
      title: property.title || "",
      code: property.code || "",
      type: property.type || "",
      status: property.status || "DISPONIVEL",
      price: property.price ?? "",
      rentPrice: property.rentPrice ?? "",
      area: property.area ?? "",
      rooms: property.rooms ?? "",
      bathrooms: property.bathrooms ?? "",
      garage: property.garage ?? "",
      street: property.street || "",
      number: property.number || "",
      complement: property.complement || "",
      zipCode: property.zipCode || "",
      district: property.district || "",
      city: property.city || "",
      state: property.state || "",
      description: property.description || "",
      ownerId: property.ownerId ? String(property.ownerId) : "",
      images: property.images || []
    });
  }

  function handleSelectProperty(property, openForm = false) {
    setSelectedProperty(property);
    setEditingId(property.id);
    setNewImages([]);
    fillFormFromProperty(property);

    if (openForm) {
      setViewMode("form");
    }
  }

  function handleOpenEdit(property) {
    if (user.role !== "ADMIN") return;
    handleSelectProperty(property, true);
  }

  function handleOpenDetails(property) {
    setSelectedProperty(property);
    setEditingId(property.id);
    setNewImages([]);
    fillFormFromProperty(property);
    setViewMode("details");
  }

  function handleNewProperty() {
    if (user.role !== "ADMIN") return;

    setSelectedProperty(null);
    setEditingId(null);
    setShowMenu(false);
    setNewImages([]);
    setViewMode("form");

    setForm({
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
  }

  function handleBackToList() {
    setViewMode("list");
    setShowMenu(false);
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
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imagePath)
    }));
  }

  function removeNewImage(indexToRemove) {
    setNewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (user.role !== "ADMIN") {
      alert("Somente administradores podem salvar imóveis.");
      return;
    }

    if (!form.title.trim()) return alert("Título do imóvel é obrigatório.");
    if (!form.code.trim()) return alert("Código é obrigatório.");
    if (!form.type.trim()) return alert("Tipo é obrigatório.");
    if (!form.price.toString().trim()) return alert("Preço é obrigatório.");
    if (!form.area.toString().trim()) return alert("Área é obrigatória.");
    if (!form.rooms.toString().trim()) {
      return alert("Quantidade de quartos é obrigatória.");
    }
    if (!form.bathrooms.toString().trim()) {
      return alert("Quantidade de banheiros é obrigatória.");
    }
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
      if (editingId) {
        const response = await api.put(`/properties/${editingId}`, payload);
        alert("Imóvel atualizado com sucesso.");
        await loadProperties(response.data.property?.id || editingId);
      } else {
        const response = await api.post("/properties", payload);
        alert("Imóvel cadastrado com sucesso.");
        await loadProperties(response.data.property?.id || null);
      }

      setViewMode("list");
    } catch (error) {
      console.error("Erro ao salvar imóvel:", error.response?.data || error);
      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        "Erro ao salvar imóvel.";
      alert(apiMessage);
    }
  }

  async function handleDelete() {
    if (user.role !== "ADMIN") {
      alert("Somente administradores podem excluir imóveis.");
      return;
    }

    if (!editingId) {
      alert("Selecione um imóvel para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este imóvel?");
    if (!confirmed) return;

    try {
      await api.delete(`/properties/${editingId}`);
      alert("Imóvel excluído com sucesso.");
      setSelectedProperty(null);
      setEditingId(null);
      setViewMode("list");
      await loadProperties();
    } catch (error) {
      console.error(
        "Erro ao excluir imóvel:",
        error.response?.data || error.message
      );
      alert("Erro ao excluir imóvel.");
    }
  }

  async function handleRefresh() {
    await loadProperties(editingId || null);
    await loadOwners();
  }

  function handlePrint() {
    if (!selectedProperty) {
      alert("Selecione um imóvel para imprimir.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Não foi possível abrir a janela de impressão.");
      return;
    }

    const imagesHtml = (selectedProperty.images || [])
      .map(
        (img) =>
          `<img src="${getImageUrl(
            img
          )}" style="width:220px;height:160px;object-fit:cover;margin:8px;border-radius:8px;" />`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Imóvel - ${selectedProperty.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 24px; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h1>${selectedProperty.title}</h1>
          <div>${imagesHtml}</div>
          <p><strong>Código:</strong> ${selectedProperty.code || "-"}</p>
          <p><strong>Tipo:</strong> ${selectedProperty.type || "-"}</p>
          <p><strong>Status:</strong> ${selectedProperty.status || "-"}</p>
          <p><strong>Preço:</strong> ${selectedProperty.price ?? "-"}</p>
          <p><strong>Aluguel:</strong> ${selectedProperty.rentPrice ?? "-"}</p>
          <p><strong>Área:</strong> ${selectedProperty.area ?? "-"}</p>
          <p><strong>Quartos:</strong> ${selectedProperty.rooms ?? "-"}</p>
          <p><strong>Banheiros:</strong> ${selectedProperty.bathrooms ?? "-"}</p>
          <p><strong>Garagem:</strong> ${selectedProperty.garage ?? "-"}</p>
          <p><strong>CEP:</strong> ${selectedProperty.zipCode || "-"}</p>
          <p><strong>Rua:</strong> ${selectedProperty.street || "-"}</p>
          <p><strong>Número:</strong> ${selectedProperty.number || "-"}</p>
          <p><strong>Complemento:</strong> ${selectedProperty.complement || "-"}</p>
          <p><strong>Bairro:</strong> ${selectedProperty.district || "-"}</p>
          <p><strong>Cidade:</strong> ${selectedProperty.city || "-"}</p>
          <p><strong>Estado:</strong> ${selectedProperty.state || "-"}</p>
          <p><strong>Descrição:</strong> ${selectedProperty.description || "-"}</p>
          <p><strong>Proprietário:</strong> ${selectedProperty.owner?.fullName || "-"}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleShare() {
    if (!selectedProperty) {
      alert("Selecione um imóvel para copiar o resumo.");
      return;
    }

    const text = `
Imóvel: ${selectedProperty.title}
Código: ${selectedProperty.code || "-"}
Tipo: ${selectedProperty.type || "-"}
Cidade: ${selectedProperty.city || "-"}
Estado: ${selectedProperty.state || "-"}
Proprietário: ${selectedProperty.owner?.fullName || "-"}
Preço: ${selectedProperty.price ?? "-"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do imóvel copiado.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function renderList() {
    return (
      <div style={styles.listPage}>
        <div style={styles.listHeader}>
          <div>
            <h1 style={styles.pageTitle}>Últimos imóveis cadastrados</h1>
            <p style={styles.pageSubtitle}>
              Clique na linha para ver detalhes ou editar.
            </p>
          </div>

          <div style={styles.listHeaderActions}>
            <input
              style={styles.searchInputTop}
              placeholder="Buscar por código, título, cidade, bairro ou proprietário"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleRefresh}
            >
              Atualizar
            </button>

            {user.role === "ADMIN" && (
              <button
                type="button"
                style={styles.primaryButton}
                onClick={handleNewProperty}
              >
                + Novo imóvel
              </button>
            )}
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thImage}></th>
                <th style={styles.th}>Referência</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.thCenter}>Dorm.</th>
                <th style={styles.thCenter}>Suítes</th>
                <th style={styles.thCenter}>Gar.</th>
                <th style={styles.thCenter}>Área</th>
                <th style={styles.th}>Bairro/Cidade</th>
                <th style={styles.th}>Endereço</th>
                <th style={styles.thCenter}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan="11" style={styles.emptyTableCell}>
                    Nenhum imóvel encontrado.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    style={styles.tr}
                    onClick={() => handleOpenDetails(property)}
                  >
                    <td style={styles.tdImage}>
                      {getMainImage(property) ? (
                        <img
                          src={getMainImage(property)}
                          alt={property.title}
                          style={styles.tableImage}
                        />
                      ) : (
                        <div style={styles.noImage}>Sem foto</div>
                      )}
                    </td>

                    <td style={styles.tdStrong}>{property.code || "-"}</td>

                    <td style={styles.td}>
                      <div>{property.type || "-"}</div>
                      <div style={styles.subText}>
                        {property.status || "Normal"}
                      </div>
                    </td>

                    <td style={styles.td}>{formatCurrency(property.price)}</td>
                    <td style={styles.tdCenter}>{property.rooms ?? "-"}</td>
                    <td style={styles.tdCenter}>-</td>
                    <td style={styles.tdCenter}>{property.garage ?? "-"}</td>
                    <td style={styles.tdCenter}>
                      {property.area ? `${property.area}m²` : "-"}
                    </td>

                    <td style={styles.td}>
                      <div>{property.district || "-"}</div>
                      <div style={styles.subText}>
                        {property.city || "-"}-{property.state || "-"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>{getAddressLine(property)}</div>
                    </td>

                    <td
                      style={styles.tdCenter}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {user.role === "ADMIN" ? (
                        <button
                          type="button"
                          style={styles.editButton}
                          onClick={() => handleOpenEdit(property)}
                        >
                          Editar
                        </button>
                      ) : (
                        <span style={styles.viewOnlyBadge}>Visualização</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderDetails() {
    if (!selectedProperty) {
      return renderList();
    }

    return (
      <div style={styles.detailsPage}>
        <div style={styles.detailsTopBar}>
          <button
            type="button"
            style={styles.backListButton}
            onClick={handleBackToList}
          >
            ← Voltar para lista
          </button>

          <div style={styles.detailsTopActions} ref={menuRef}>
            {user.role === "ADMIN" && (
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => handleOpenEdit(selectedProperty)}
              >
                Editar
              </button>
            )}

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleShare}
            >
              Compartilhar
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handlePrint}
            >
              Imprimir
            </button>

            <button
              type="button"
              style={styles.menuButton}
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>

            {showMenu && (
              <div style={styles.dropdownMenu}>
                <button type="button" style={styles.dropdownItem}>
                  Histórico do imóvel
                </button>
                <button type="button" style={styles.dropdownItem}>
                  Documentos do imóvel
                </button>
                <button type="button" style={styles.dropdownItem}>
                  Proprietário vinculado
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.detailsCard}>
          <div style={styles.detailsImageArea}>
            {getMainImage(selectedProperty) ? (
              <img
                src={getMainImage(selectedProperty)}
                alt={selectedProperty.title}
                style={styles.heroImage}
              />
            ) : (
              <div style={styles.noHeroImage}>Sem imagem</div>
            )}
          </div>

          <div style={styles.detailsContent}>
            <h2 style={styles.detailsTitle}>
              {selectedProperty.title} - {selectedProperty.city}/
              {selectedProperty.state}
            </h2>

            <div style={styles.detailsPrice}>
              {formatCurrency(selectedProperty.price)}
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Código</div>
                <div style={styles.infoValue}>
                  {selectedProperty.code || "-"}
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Tipo</div>
                <div style={styles.infoValue}>
                  {selectedProperty.type || "-"}
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Área</div>
                <div style={styles.infoValue}>
                  {selectedProperty.area ? `${selectedProperty.area}m²` : "-"}
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Quartos</div>
                <div style={styles.infoValue}>
                  {selectedProperty.rooms ?? "-"}
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Banheiros</div>
                <div style={styles.infoValue}>
                  {selectedProperty.bathrooms ?? "-"}
                </div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Garagem</div>
                <div style={styles.infoValue}>
                  {selectedProperty.garage ?? "-"}
                </div>
              </div>
            </div>

            <div style={styles.descriptionBox}>
              <h3 style={styles.sectionTitle}>Descrição</h3>
              <p style={styles.descriptionText}>
                {selectedProperty.description || "Sem descrição cadastrada."}
              </p>

              <h3 style={styles.sectionTitle}>Endereço</h3>
              <p style={styles.descriptionText}>
                {getAddressLine(selectedProperty)}
              </p>
              <p style={styles.descriptionText}>
                {selectedProperty.district || "-"} -{" "}
                {selectedProperty.city || "-"} /{" "}
                {selectedProperty.state || "-"}
              </p>

              <h3 style={styles.sectionTitle}>Proprietário</h3>
              <p style={styles.descriptionText}>
                {selectedProperty.owner?.fullName || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderForm() {
    if (user.role !== "ADMIN") {
      return (
        <div style={styles.formPage}>
          <div style={styles.formTopBar}>
            <button
              type="button"
              style={styles.backListButton}
              onClick={handleBackToList}
            >
              ← Voltar para lista
            </button>
          </div>

          <div style={styles.accessDeniedCard}>
            <h2 style={styles.accessDeniedTitle}>Acesso restrito</h2>
            <p style={styles.accessDeniedText}>
              Somente administradores podem cadastrar ou editar imóveis.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.formPage}>
        <div style={styles.formTopBar}>
          <button
            type="button"
            style={styles.backListButton}
            onClick={handleBackToList}
          >
            ← Voltar para lista
          </button>

          <div style={styles.formTopTitle}>
            {editingId ? `Editar imóvel (${form.code || ""})` : "Novo imóvel"}
          </div>
        </div>

        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formHeader}>
              <div style={styles.dot}></div>
              <h2 style={styles.formTitle}>Cadastro</h2>
            </div>

            <div style={styles.rowSingle}>
              <div style={styles.fieldWithIcon}>
                <div style={styles.fieldIcon}>🏠</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>*Título do imóvel</label>
                  <input
                    style={styles.lineInput}
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div style={styles.rowTriple}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Código</label>
                <input
                  style={styles.lineInput}
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>*Tipo</label>
                <input
                  style={styles.lineInput}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.selectInput}
                  name="status"
                  value={form.status || "DISPONIVEL"}
                  onChange={handleChange}
                >
                  <option value="DISPONIVEL">Disponível</option>
                  <option value="RESERVADO">Reservado</option>
                  <option value="EM_ANALISE">Em análise</option>
                </select>
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Preço de venda</label>
                <input
                  style={styles.lineInput}
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Preço de aluguel</label>
                <input
                  style={styles.lineInput}
                  name="rentPrice"
                  value={form.rentPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowFour}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Área</label>
                <input
                  style={styles.lineInput}
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Quartos</label>
                <input
                  style={styles.lineInput}
                  name="rooms"
                  value={form.rooms}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Banheiros</label>
                <input
                  style={styles.lineInput}
                  name="bathrooms"
                  value={form.bathrooms}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Garagem</label>
                <input
                  style={styles.lineInput}
                  name="garage"
                  value={form.garage}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>CEP</label>
                <input
                  style={styles.lineInput}
                  name="zipCode"
                  value={form.zipCode}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Número</label>
                <input
                  style={styles.lineInput}
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Rua</label>
                <input
                  style={styles.lineInput}
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Complemento</label>
                <input
                  style={styles.lineInput}
                  name="complement"
                  value={form.complement}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowTriple}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Bairro</label>
                <input
                  style={styles.lineInput}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Cidade</label>
                <input
                  style={styles.lineInput}
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Estado</label>
                <input
                  style={styles.lineInput}
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Descrição</label>
                <input
                  style={styles.lineInput}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Proprietário</label>
                <select
                  style={styles.selectInput}
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

            <div style={styles.rowSingle}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Imagens do imóvel</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  style={styles.fileInput}
                />
              </div>
            </div>

            {form.images?.length > 0 && (
              <div style={styles.previewSection}>
                <h4 style={styles.previewTitle}>Imagens atuais</h4>
                <div style={styles.imageGrid}>
                  {form.images.map((imagePath) => (
                    <div key={imagePath} style={styles.imageCard}>
                      <img
                        src={getImageUrl(imagePath)}
                        alt="Imóvel"
                        style={styles.previewImage}
                      />
                      <button
                        type="button"
                        style={styles.removeImageButton}
                        onClick={() => removeExistingImage(imagePath)}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newImages.length > 0 && (
              <div style={styles.previewSection}>
                <h4 style={styles.previewTitle}>Novas imagens</h4>
                <div style={styles.imageGrid}>
                  {newImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} style={styles.imageCard}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Nova"
                        style={styles.previewImage}
                      />
                      <button
                        type="button"
                        style={styles.removeImageButton}
                        onClick={() => removeNewImage(index)}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.actionRow}>
              {user.role === "ADMIN" && editingId && (
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={handleDelete}
                >
                  Excluir
                </button>
              )}
            </div>

            <button type="submit" style={styles.floatingSaveButton}>
              💾
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {viewMode === "list" && renderList()}
      {viewMode === "details" && renderDetails()}
      {viewMode === "form" && renderForm()}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f6f8",
    padding: "24px"
  },

  listPage: {
    width: "100%"
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap"
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1f2937"
  },
  pageSubtitle: {
    margin: "6px 0 0 0",
    color: "#6b7280",
    fontSize: "14px"
  },
  listHeaderActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  searchInputTop: {
    width: "420px",
    maxWidth: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#fff"
  },
  primaryButton: {
    border: "none",
    backgroundColor: "#2383e2",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#1f2937",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer"
  },

  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  thImage: {
    width: "88px",
    backgroundColor: "#fff",
    padding: "18px 12px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb"
  },
  th: {
    backgroundColor: "#fff",
    padding: "18px 12px",
    textAlign: "left",
    color: "#111827",
    fontSize: "14px",
    borderBottom: "1px solid #e5e7eb"
  },
  thCenter: {
    backgroundColor: "#fff",
    padding: "18px 12px",
    textAlign: "center",
    color: "#111827",
    fontSize: "14px",
    borderBottom: "1px solid #e5e7eb"
  },
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #eef0f3"
  },
  tdImage: {
    padding: "16px 12px",
    verticalAlign: "middle"
  },
  td: {
    padding: "16px 12px",
    color: "#111827",
    fontSize: "15px",
    verticalAlign: "middle"
  },
  tdStrong: {
    padding: "16px 12px",
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    verticalAlign: "middle"
  },
  tdCenter: {
    padding: "16px 12px",
    color: "#111827",
    fontSize: "15px",
    textAlign: "center",
    verticalAlign: "middle"
  },
  subText: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "4px"
  },
  tableImage: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block"
  },
  noImage: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#6b7280",
    textAlign: "center"
  },
  editButton: {
    border: "none",
    backgroundColor: "#f59e0b",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer"
  },
  viewOnlyBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "700"
  },
  emptyTableCell: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280"
  },

  detailsPage: {},
  detailsTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
    flexWrap: "wrap"
  },
  detailsTopActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    position: "relative"
  },
  backListButton: {
    border: "none",
    backgroundColor: "#111827",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  menuButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  dropdownMenu: {
    position: "absolute",
    top: "48px",
    right: 0,
    width: "240px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
    overflow: "hidden",
    zIndex: 20
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    backgroundColor: "#fff",
    padding: "12px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0"
  },
  detailsCard: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "22px",
    backgroundColor: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb"
  },
  detailsImageArea: {
    minHeight: "420px",
    backgroundColor: "#e5e7eb"
  },
  heroImage: {
    width: "100%",
    height: "100%",
    minHeight: "420px",
    objectFit: "cover",
    display: "block"
  },
  noHeroImage: {
    minHeight: "420px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "18px"
  },
  detailsContent: {
    padding: "24px"
  },
  detailsTitle: {
    margin: "0 0 12px 0",
    fontSize: "30px",
    color: "#1f2937"
  },
  detailsPrice: {
    fontSize: "40px",
    color: "#2383e2",
    fontWeight: "800",
    marginBottom: "20px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "22px"
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px"
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "6px"
  },
  infoValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827"
  },
  descriptionBox: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px"
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    color: "#111827"
  },
  descriptionText: {
    margin: "0 0 12px 0",
    color: "#4b5563",
    lineHeight: 1.5
  },

  formPage: {},
  formTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
    flexWrap: "wrap"
  },
  formTopTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1f2937"
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "26px 30px 80px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    position: "relative"
  },

  accessDeniedCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "32px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb"
  },
  accessDeniedTitle: {
    margin: "0 0 12px 0",
    fontSize: "24px",
    color: "#111827"
  },
  accessDeniedText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "16px"
  },

  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "26px"
  },
  dot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "#9ccc9c"
  },
  formTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "600"
  },
  rowSingle: {
    marginBottom: "26px"
  },
  rowDouble: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    marginBottom: "26px"
  },
  rowTriple: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "40px",
    marginBottom: "26px",
    alignItems: "end"
  },
  rowFour: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "30px",
    marginBottom: "26px"
  },
  fieldWithIcon: {
    display: "grid",
    gridTemplateColumns: "52px 1fr",
    gap: "16px",
    alignItems: "end"
  },
  fieldIcon: {
    fontSize: "30px",
    color: "#9a8a60",
    textAlign: "center",
    paddingBottom: "10px"
  },
  fieldContent: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    color: "#6b7280",
    fontSize: "15px",
    marginBottom: "6px"
  },
  lineInput: {
    border: "none",
    borderBottom: "1px solid #d1d5db",
    padding: "8px 0 10px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent"
  },
  selectInput: {
    border: "none",
    borderBottom: "1px solid #d1d5db",
    padding: "8px 0 10px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent"
  },
  fileInput: {
    fontSize: "16px",
    marginTop: "8px"
  },
  previewSection: {
    marginBottom: "26px"
  },
  previewTitle: {
    margin: "0 0 12px 0",
    color: "#4b5563"
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "14px"
  },
  imageCard: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px"
  },
  previewImage: {
    width: "100%",
    height: "110px",
    objectFit: "cover",
    borderRadius: "8px",
    display: "block",
    marginBottom: "8px"
  },
  removeImageButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer"
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: "10px"
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer"
  },
  floatingSaveButton: {
    position: "fixed",
    right: "28px",
    bottom: "24px",
    width: "66px",
    height: "66px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#ff4a3d",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
  }
};

export default Properties;