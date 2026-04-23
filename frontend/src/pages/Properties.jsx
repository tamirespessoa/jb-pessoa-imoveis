import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

function Properties() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuRef = useRef(null);
  const cepTimeoutRef = useRef(null);
  const lastFetchedCepRef = useRef("");

  const sectionRefs = {
    cadastro: useRef(null),
    localizacao: useRef(null),
    detalhes: useRef(null),
    internet: useRef(null),
    captacao: useRef(null),
    confidencial: useRef(null)
  };

  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [formMode, setFormMode] = useState("EXPRESS");
  const [activeSection, setActiveSection] = useState("cadastro");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [cepSuccess, setCepSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    code: "",
    type: "",
    category: "Normal",
    purpose: "Residencial",
    status: "DISPONIVEL",

    price: "",
    rentPrice: "",
    promoPrice: "",
    area: "",
    builtArea: "",
    usableArea: "",
    totalArea: "",
    rooms: "",
    suites: "",
    bathrooms: "",
    garage: "",
    livingRooms: "",
    floor: "",
    furnished: false,
    financed: false,
    exchange: false,

    street: "",
    number: "",
    complement: "",
    block: "",
    apartment: "",
    zipCode: "",
    district: "",
    officialDistrict: "",
    city: "",
    state: "",
    country: "Brasil",

    description: "",
    internalDescription: "",
    ownerId: "",
    captorName: "",

    publishOnSite: true,
    siteHighlight: false,
    valueOnRequest: false,
    negotiable: false,

    images: []
  });

  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    api.defaults.baseURL ||
    "http://localhost:3001";

  const visibleSections =
    formMode === "EXPRESS"
      ? ["cadastro", "localizacao", "detalhes", "internet", "confidencial"]
      : [
          "cadastro",
          "localizacao",
          "detalhes",
          "internet",
          "captacao",
          "confidencial"
        ];

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

  function getMainImage(property) {
    if (!property?.images?.length) return "";
    return getImageUrl(property.images[0]);
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

  function formatZipCode(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  function getAddressLine(property) {
    const parts = [
      property.street,
      property.number,
      property.complement
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  }

  function getEmployeeLabel(employee) {
    const name =
      employee?.name ||
      employee?.fullName ||
      employee?.username ||
      employee?.email ||
      "Funcionário";

    const role = employee?.role ? ` - ${employee.role}` : "";
    return `${name}${role}`;
  }

  function getEmployeeValue(employee) {
    return (
      employee?.name ||
      employee?.fullName ||
      employee?.username ||
      employee?.email ||
      ""
    );
  }

  function scrollToSection(sectionKey) {
    const target = sectionRefs[sectionKey]?.current;
    if (!target) return;
    setActiveSection(sectionKey);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function fetchAddressByCep(cepValue, options = {}) {
    const { force = false } = options;
    const cepClean = String(cepValue || "").replace(/\D/g, "");

    if (cepClean.length !== 8) {
      setCepLoading(false);
      setCepError("");
      setCepSuccess("");
      return;
    }

    if (!force && lastFetchedCepRef.current === cepClean) {
      return;
    }

    try {
      setCepLoading(true);
      setCepError("");
      setCepSuccess("");

      const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
        setCepSuccess("");
        return;
      }

      setForm((prev) => ({
        ...prev,
        zipCode: formatZipCode(cepClean),
        street: data.logradouro || "",
        district: data.bairro || "",
        officialDistrict: data.bairro || prev.officialDistrict || "",
        city: data.localidade || "",
        state: data.uf || ""
      }));

      lastFetchedCepRef.current = cepClean;
      setCepSuccess("Endereço preenchido automaticamente.");
      setCepError("");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Não foi possível consultar o CEP agora.");
      setCepSuccess("");
    } finally {
      setCepLoading(false);
    }
  }

  function handleZipCodeChange(e) {
    const formatted = formatZipCode(e.target.value);

    setForm((prev) => ({
      ...prev,
      zipCode: formatted
    }));

    setCepError("");
    setCepSuccess("");

    const cleanCep = formatted.replace(/\D/g, "");

    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current);
    }

    if (cleanCep.length === 8) {
      cepTimeoutRef.current = setTimeout(() => {
        fetchAddressByCep(cleanCep);
      }, 450);
    } else {
      setCepLoading(false);
      lastFetchedCepRef.current = "";
    }
  }

  async function loadProperties(selectId = null) {
    try {
      const response = await api.get("/properties");
      const list = response.data || [];
      setProperties(list);

      if (selectId) {
        const found = list.find((item) => item.id === selectId);
        if (found) handleSelectProperty(found, false);
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

  async function loadEmployees() {
    try {
      const response = await api.get("/users");
      const list = Array.isArray(response.data) ? response.data : [];
      setEmployees(list);
    } catch (error) {
      console.error(
        "Erro ao carregar funcionários:",
        error.response?.data || error.message
      );
      alert("Erro ao carregar funcionários.");
    }
  }

  useEffect(() => {
    loadProperties();
    loadOwners();
    loadEmployees();
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

  useEffect(() => {
    return () => {
      if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);
    };
  }, []);

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
      category: property.category || "Normal",
      purpose: property.purpose || "Residencial",
      status: property.status || "DISPONIVEL",

      price: property.price ?? "",
      rentPrice: property.rentPrice ?? "",
      promoPrice: property.promoPrice ?? "",
      area: property.area ?? "",
      builtArea: property.builtArea ?? property.area ?? "",
      usableArea: property.usableArea ?? "",
      totalArea: property.totalArea ?? "",
      rooms: property.rooms ?? "",
      suites: property.suites ?? "",
      bathrooms: property.bathrooms ?? "",
      garage: property.garage ?? "",
      livingRooms: property.livingRooms ?? "",
      floor: property.floor ?? "",
      furnished: Boolean(property.furnished),
      financed: Boolean(property.financed),
      exchange: Boolean(property.exchange),

      street: property.street || "",
      number: property.number || "",
      complement: property.complement || "",
      block: property.block || "",
      apartment: property.apartment || "",
      zipCode: property.zipCode ? formatZipCode(property.zipCode) : "",
      district: property.district || "",
      officialDistrict: property.officialDistrict || property.district || "",
      city: property.city || "",
      state: property.state || "",
      country: property.country || "Brasil",

      description: property.description || "",
      internalDescription: property.internalDescription || "",
      ownerId: property.ownerId ? String(property.ownerId) : "",
      captorName: property.captorName || "",

      publishOnSite:
        property.publishOnSite !== undefined ? Boolean(property.publishOnSite) : true,
      siteHighlight: Boolean(property.siteHighlight),
      valueOnRequest: Boolean(property.valueOnRequest),
      negotiable: Boolean(property.negotiable),

      images: property.images || []
    });

    setCepError("");
    setCepSuccess("");
    setCepLoading(false);
    lastFetchedCepRef.current = String(property.zipCode || "").replace(/\D/g, "");
  }

  function emptyForm() {
    return {
      title: "",
      code: "",
      type: "",
      category: "Normal",
      purpose: "Residencial",
      status: "DISPONIVEL",

      price: "",
      rentPrice: "",
      promoPrice: "",
      area: "",
      builtArea: "",
      usableArea: "",
      totalArea: "",
      rooms: "",
      suites: "",
      bathrooms: "",
      garage: "",
      livingRooms: "",
      floor: "",
      furnished: false,
      financed: false,
      exchange: false,

      street: "",
      number: "",
      complement: "",
      block: "",
      apartment: "",
      zipCode: "",
      district: "",
      officialDistrict: "",
      city: "",
      state: "",
      country: "Brasil",

      description: "",
      internalDescription: "",
      ownerId: "",
      captorName: "",

      publishOnSite: true,
      siteHighlight: false,
      valueOnRequest: false,
      negotiable: false,

      images: []
    };
  }

  function handleSelectProperty(property, openForm = false) {
    setSelectedProperty(property);
    setEditingId(property.id);
    setNewImages([]);
    fillFormFromProperty(property);

    if (openForm) {
      setViewMode("form");
      setActiveSection("cadastro");
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
    setActiveSection("cadastro");
    setCepError("");
    setCepSuccess("");
    setCepLoading(false);
    lastFetchedCepRef.current = "";
    setForm(emptyForm());
  }

  function handleBackToList() {
    setViewMode("list");
    setShowMenu(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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
    if (!form.type.trim()) return alert("Tipo é obrigatório.");
    if (!form.price.toString().trim()) return alert("Preço é obrigatório.");
    if (!form.ownerId) return alert("Selecione o proprietário.");

    const payload = new FormData();

    const price = numberOrNull(form.price);
    const rentPrice = numberOrNull(form.rentPrice);
    const area = numberOrNull(form.area || form.builtArea);
    const rooms = intOrNull(form.rooms);
    const bathrooms = intOrNull(form.bathrooms);
    const garage = intOrNull(form.garage);

    payload.append("title", form.title.trim());

    if (form.code.trim()) payload.append("code", form.code.trim());

    payload.append("type", form.type.trim());
    payload.append("status", normalizeString(form.status) || "DISPONIVEL");
    payload.append("price", String(price ?? 0));
    payload.append("area", String(area ?? 0));
    payload.append("rooms", String(rooms ?? 0));
    payload.append("bathrooms", String(bathrooms ?? 0));
    payload.append("street", form.street.trim());
    payload.append("number", form.number.trim());
    payload.append("zipCode", form.zipCode.trim());
    payload.append("district", form.district.trim());
    payload.append("city", form.city.trim());
    payload.append("state", form.state.trim());
    payload.append("ownerId", String(form.ownerId));

    if (rentPrice !== null) payload.append("rentPrice", String(rentPrice));
    if (garage !== null) payload.append("garage", String(garage));

    const complement = normalizeString(form.complement);
    if (complement !== null) payload.append("complement", complement);

    const description = normalizeString(form.description);
    if (description !== null) payload.append("description", description);

    const captorName = normalizeString(form.captorName);
    if (captorName !== null) payload.append("captorName", captorName);

    const internalDescription = normalizeString(form.internalDescription);
    if (internalDescription !== null) {
      payload.append("internalDescription", internalDescription);
    }

    payload.append("existingImages", JSON.stringify(form.images || []));

    newImages.forEach((file) => {
      payload.append("images", file);
    });

    try {
      let response;

      if (editingId) {
        response = await api.put(`/properties/${editingId}`, payload);
        alert("Imóvel atualizado com sucesso.");
        await loadProperties(response.data?.property?.id || editingId);
      } else {
        response = await api.post("/properties", payload);
        alert("Imóvel cadastrado com sucesso.");
        await loadProperties(response.data?.property?.id || null);
      }

      setSelectedProperty(response.data?.property || null);
      setNewImages([]);
      setViewMode("list");
    } catch (error) {
      console.error("Erro ao salvar imóvel:", error);

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao salvar imóvel.";

      alert(`Erro ao salvar imóvel:\n${apiMessage}`);
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
    await loadEmployees();
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

  function renderMediaSidebar() {
    const allImages =
      viewMode === "form" ? [...form.images, ...newImages] : selectedProperty?.images || [];

    return (
      <aside style={styles.mediaSidebar}>
        <div style={styles.mediaHeader}>
          <span style={styles.mediaTitle}>Fotos ({allImages.length})</span>
          <div style={styles.mediaIcons}>
            <span style={styles.mediaIcon}>✉</span>
            <span style={styles.mediaIcon}>✎</span>
          </div>
        </div>

        <div style={styles.mediaMainBox}>
          {allImages.length > 0 ? (
            <img
              src={
                typeof allImages[0] === "string"
                  ? getImageUrl(allImages[0])
                  : URL.createObjectURL(allImages[0])
              }
              alt="Principal"
              style={styles.mediaMainImage}
            />
          ) : (
            <div style={styles.mediaEmpty}>Sem foto principal</div>
          )}
        </div>

        <div style={styles.mediaThumbGrid}>
          {allImages.slice(1, 7).map((image, index) => (
            <div key={index} style={styles.mediaThumbCard}>
              <img
                src={
                  typeof image === "string"
                    ? getImageUrl(image)
                    : URL.createObjectURL(image)
                }
                alt={`thumb-${index}`}
                style={styles.mediaThumbImage}
              />
            </div>
          ))}

          {allImages.length === 0 && (
            <div style={styles.mediaPlaceholder}>
              Nenhuma imagem cadastrada
            </div>
          )}
        </div>
      </aside>
    );
  }

  function renderSectionNav() {
    const items = [
      { key: "cadastro", label: "Cadastro" },
      { key: "localizacao", label: "Localização" },
      { key: "detalhes", label: "Detalhes" },
      { key: "internet", label: "Internet e Anúncios" },
      ...(formMode === "AVANCADA" ? [{ key: "captacao", label: "Captação" }] : []),
      { key: "confidencial", label: "Confidencial" }
    ];

    return (
      <aside style={styles.sectionSidebar}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => scrollToSection(item.key)}
            style={{
              ...styles.sectionNavButton,
              ...(activeSection === item.key ? styles.sectionNavButtonActive : {})
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>
    );
  }

  function renderTopSwitch() {
    return (
      <div style={styles.topSwitch}>
        <button
          type="button"
          onClick={() => setFormMode("EXPRESS")}
          style={{
            ...styles.switchButton,
            ...(formMode === "EXPRESS" ? styles.switchButtonActive : {})
          }}
        >
          EXPRESS
        </button>
        <button
          type="button"
          onClick={() => setFormMode("AVANCADA")}
          style={{
            ...styles.switchButton,
            ...(formMode === "AVANCADA" ? styles.switchButtonActive : {})
          }}
        >
          AVANÇADA
        </button>
      </div>
    );
  }

  function renderList() {
    return (
      <div style={styles.listPage}>
        <div style={styles.listHeader}>
          <div>
            <h1 style={styles.pageTitle}>Imóveis cadastrados</h1>
            <p style={styles.pageSubtitle}>
              Clique em um imóvel para ver detalhes ou editar.
            </p>
          </div>

          <div style={styles.listHeaderActions}>
            <input
              style={styles.searchInputTop}
              placeholder="Buscar por código, título, cidade, bairro ou proprietário"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" style={styles.secondaryButton} onClick={handleRefresh}>
              Atualizar
            </button>

            {user.role === "ADMIN" && (
              <button type="button" style={styles.primaryButton} onClick={handleNewProperty}>
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
                  <td colSpan="10" style={styles.emptyTableCell}>
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
                        <div style={styles.imageWrapper}>
                          <img
                            src={getMainImage(property)}
                            alt={property.title}
                            style={styles.tableImage}
                          />
                        </div>
                      ) : (
                        <div style={styles.noImage}>Sem foto</div>
                      )}
                    </td>

                    <td style={styles.tdStrong}>{property.code || "-"}</td>
                    <td style={styles.td}>
                      <div>{property.type || "-"}</div>
                      <div style={styles.subText}>{property.status || "-"}</div>
                    </td>
                    <td style={styles.td}>{formatCurrency(property.price)}</td>
                    <td style={styles.tdCenter}>{property.rooms ?? "-"}</td>
                    <td style={styles.tdCenter}>{property.garage ?? "-"}</td>
                    <td style={styles.tdCenter}>
                      {property.area ? `${property.area}m²` : "-"}
                    </td>
                    <td style={styles.td}>
                      <div>{property.district || "-"}</div>
                      <div style={styles.subText}>
                        {property.city || "-"} - {property.state || "-"}
                      </div>
                    </td>
                    <td style={styles.td}>{getAddressLine(property)}</td>

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
    if (!selectedProperty) return renderList();

    return (
      <div style={styles.detailsPage}>
        <div style={styles.detailsTopBar}>
          <button type="button" style={styles.backListButton} onClick={handleBackToList}>
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

            <button type="button" style={styles.secondaryButton} onClick={handleShare}>
              Compartilhar
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
              {selectedProperty.title} - {selectedProperty.city}/{selectedProperty.state}
            </h2>

            <div style={styles.detailsPrice}>
              {formatCurrency(selectedProperty.price)}
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Código</div>
                <div style={styles.infoValue}>{selectedProperty.code || "-"}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Tipo</div>
                <div style={styles.infoValue}>{selectedProperty.type || "-"}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Área</div>
                <div style={styles.infoValue}>
                  {selectedProperty.area ? `${selectedProperty.area}m²` : "-"}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Quartos</div>
                <div style={styles.infoValue}>{selectedProperty.rooms ?? "-"}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Banheiros</div>
                <div style={styles.infoValue}>{selectedProperty.bathrooms ?? "-"}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Garagem</div>
                <div style={styles.infoValue}>{selectedProperty.garage ?? "-"}</div>
              </div>
            </div>

            <div style={styles.descriptionBox}>
              <h3 style={styles.sectionTitle}>Descrição</h3>
              <p style={styles.descriptionText}>
                {selectedProperty.description || "Sem descrição cadastrada."}
              </p>

              <h3 style={styles.sectionTitle}>Endereço</h3>
              <p style={styles.descriptionText}>{getAddressLine(selectedProperty)}</p>
              <p style={styles.descriptionText}>
                {selectedProperty.district || "-"} - {selectedProperty.city || "-"} /{" "}
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
            <button type="button" style={styles.backListButton} onClick={handleBackToList}>
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
          <button type="button" style={styles.backListButton} onClick={handleBackToList}>
            ← Voltar para lista
          </button>

          {renderTopSwitch()}
        </div>

        <div style={styles.editorLayout}>
          <div style={{ minWidth: 0 }}>
            {renderMediaSidebar()}
          </div>

          <div style={{ ...styles.editorCenter, minWidth: 0 }}>
            <form onSubmit={handleSubmit}>
              <section ref={sectionRefs.cadastro} style={styles.formSection}>
                <div style={styles.sectionHeaderRow}>
                  <div style={styles.formHeaderBadge}></div>
                  <h2 style={styles.formSectionTitle}>Cadastro</h2>
                </div>

                <div style={styles.rowTriple}>
                  <div style={styles.fieldContent}>
                    <label style={styles.label}>*Tipo</label>
                    <select
                      style={styles.lineSelect}
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Sobrado">Sobrado</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Comércio">Comércio</option>
                    </select>
                  </div>

                  <div style={styles.fieldContent}>
                    <label style={styles.label}>*Categoria</label>
                    <select
                      style={styles.lineSelect}
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Destaque">Destaque</option>
                      <option value="Oportunidade">Oportunidade</option>
                    </select>
                  </div>

                  <div style={styles.fieldContent}>
                    <label style={styles.label}>*Finalidade</label>
                    <select
                      style={styles.lineSelect}
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                    >
                      <option value="Residencial">Residencial</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Misto">Misto</option>
                    </select>
                  </div>
                </div>

                <div style={styles.separator}></div>

                <div style={styles.subSectionTitle}>Valores</div>

                <div style={styles.rowFour}>
                  <div style={styles.fieldContent}>
                    <label style={styles.label}>*Venda</label>
                    <input
                      style={styles.lineInput}
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={styles.fieldContent}>
                    <label style={styles.label}>Locação</label>
                    <input
                      style={styles.lineInput}
                      name="rentPrice"
                      value={form.rentPrice}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={styles.fieldContent}>
                    <label style={styles.label}>Preço promocional</label>
                    <input
                      style={styles.lineInput}
                      name="promoPrice"
                      value={form.promoPrice}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={styles.fieldContent}>
                    <label style={styles.label}>Status</label>
                    <select
                      style={styles.lineSelect}
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="DISPONIVEL">Disponível</option>
                      <option value="RESERVADO">Reservado</option>
                      <option value="EM_ANALISE">Em análise</option>
                    </select>
                  </div>
                </div>

                <div style={styles.rowChecks}>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      name="exchange"
                      checked={form.exchange}
                      onChange={handleChange}
                    />
                    Permuta
                  </label>

                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      name="financed"
                      checked={form.financed}
                      onChange={handleChange}
                    />
                    Financiado
                  </label>

                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      name="furnished"
                      checked={form.furnished}
                      onChange={handleChange}
                    />
                    Mobiliado
                  </label>
                </div>

                <div style={styles.rowDouble}>
                  <div style={styles.fieldContent}>
                    <label style={styles.label}>Código</label>
                    <input
                      style={styles.lineInput}
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="Deixe em branco para gerar automático"
                    />
                  </div>

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
              </section>

              {visibleSections.includes("localizacao") && (
                <section ref={sectionRefs.localizacao} style={styles.formSection}>
                  <h2 style={styles.formSectionTitle}>Localização</h2>

                  <div style={styles.rowDouble}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>CEP</label>

                      <div style={styles.cepRow}>
                        <input
                          style={styles.lineInput}
                          name="zipCode"
                          value={form.zipCode}
                          onChange={handleZipCodeChange}
                          onBlur={() => fetchAddressByCep(form.zipCode, { force: true })}
                          placeholder="00000-000"
                          maxLength={9}
                        />

                        <button
                          type="button"
                          style={styles.cepButton}
                          onClick={() => fetchAddressByCep(form.zipCode, { force: true })}
                        >
                          Buscar CEP
                        </button>
                      </div>

                      {cepLoading && (
                        <span style={styles.cepLoadingText}>Buscando endereço...</span>
                      )}

                      {!cepLoading && cepError && (
                        <span style={styles.cepErrorText}>{cepError}</span>
                      )}

                      {!cepLoading && !cepError && cepSuccess && (
                        <span style={styles.cepSuccessText}>{cepSuccess}</span>
                      )}
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

                  <div style={styles.rowTriple}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Endereço</label>
                      <input
                        style={styles.lineInput}
                        name="street"
                        value={form.street}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Bloco</label>
                      <input
                        style={styles.lineInput}
                        name="block"
                        value={form.block}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Apartamento</label>
                      <input
                        style={styles.lineInput}
                        name="apartment"
                        value={form.apartment}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={styles.rowDouble}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Complemento</label>
                      <input
                        style={styles.lineInput}
                        name="complement"
                        value={form.complement}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Bairro comercial</label>
                      <input
                        style={styles.lineInput}
                        name="district"
                        value={form.district}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={styles.rowTriple}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Bairro oficial</label>
                      <input
                        style={styles.lineInput}
                        name="officialDistrict"
                        value={form.officialDistrict}
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
                      <label style={styles.label}>UF</label>
                      <input
                        style={styles.lineInput}
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={styles.rowSingle}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>País</label>
                      <input
                        style={styles.lineInput}
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </section>
              )}

              {visibleSections.includes("detalhes") && (
                <section ref={sectionRefs.detalhes} style={styles.formSection}>
                  <h2 style={styles.formSectionTitle}>Detalhes</h2>

                  <div style={styles.subSectionTitle}>Principal</div>

                  <div style={styles.rowFour}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Dormitórios</label>
                      <input
                        style={styles.lineInput}
                        name="rooms"
                        value={form.rooms}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Suítes</label>
                      <input
                        style={styles.lineInput}
                        name="suites"
                        value={form.suites}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Salas</label>
                      <input
                        style={styles.lineInput}
                        name="livingRooms"
                        value={form.livingRooms}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Banheiros</label>
                      <input
                        style={styles.lineInput}
                        name="bathrooms"
                        value={form.bathrooms}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={styles.rowTriple}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Garagens</label>
                      <input
                        style={styles.lineInput}
                        name="garage"
                        value={form.garage}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Andar</label>
                      <input
                        style={styles.lineInput}
                        name="floor"
                        value={form.floor}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Descrição pública</label>
                      <textarea
                        style={styles.textareaInput}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div style={styles.separator}></div>

                  <div style={styles.subSectionTitle}>Áreas</div>

                  <div style={styles.rowFour}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Construída</label>
                      <input
                        style={styles.lineInput}
                        name="builtArea"
                        value={form.builtArea}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Útil</label>
                      <input
                        style={styles.lineInput}
                        name="usableArea"
                        value={form.usableArea}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Total</label>
                      <input
                        style={styles.lineInput}
                        name="totalArea"
                        value={form.totalArea}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Área principal</label>
                      <input
                        style={styles.lineInput}
                        name="area"
                        value={form.area}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </section>
              )}

              {visibleSections.includes("internet") && (
                <section ref={sectionRefs.internet} style={styles.formSection}>
                  <h2 style={styles.formSectionTitle}>Internet e Anúncios</h2>

                  <div style={styles.rowChecks}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        name="publishOnSite"
                        checked={form.publishOnSite}
                        onChange={handleChange}
                      />
                      Site da Empresa
                    </label>

                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        name="siteHighlight"
                        checked={form.siteHighlight}
                        onChange={handleChange}
                      />
                      Destaque
                    </label>

                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        name="valueOnRequest"
                        checked={form.valueOnRequest}
                        onChange={handleChange}
                      />
                      Valor sob consulta
                    </label>

                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        name="negotiable"
                        checked={form.negotiable}
                        onChange={handleChange}
                      />
                      Valor negociável
                    </label>
                  </div>

                  <div style={styles.rowSingle}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Descrição do anúncio</label>
                      <textarea
                        style={styles.textareaInputLarge}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={6}
                      />
                    </div>
                  </div>
                </section>
              )}

              {visibleSections.includes("captacao") && (
                <section ref={sectionRefs.captacao} style={styles.formSection}>
                  <h2 style={styles.formSectionTitle}>Captação</h2>

                  <div style={styles.rowDouble}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Captador principal</label>
                      <select
                        style={styles.lineSelect}
                        name="captorName"
                        value={form.captorName}
                        onChange={handleChange}
                      >
                        <option value="">Selecione...</option>
                        {employees.map((employee) => (
                          <option
                            key={employee.id}
                            value={getEmployeeValue(employee)}
                          >
                            {getEmployeeLabel(employee)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.fieldContent}>
                      <label style={styles.label}>*Proprietário</label>
                      <select
                        style={styles.lineSelect}
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
                </section>
              )}

              {visibleSections.includes("confidencial") && (
                <section ref={sectionRefs.confidencial} style={styles.formSection}>
                  <h2 style={styles.formSectionTitle}>Confidencial</h2>

                  {formMode === "EXPRESS" && !visibleSections.includes("captacao") && (
                    <div style={styles.rowSingle}>
                      <div style={styles.fieldContent}>
                        <label style={styles.label}>*Proprietário</label>
                        <select
                          style={styles.lineSelect}
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
                  )}

                  <div style={styles.rowSingle}>
                    <div style={styles.fieldContent}>
                      <label style={styles.label}>Descrição interna*</label>
                      <textarea
                        style={styles.textareaInputLarge}
                        name="internalDescription"
                        value={form.internalDescription}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Informações internas do imóvel. Esta parte não será exibida no site."
                      />
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
                </section>
              )}

              <div style={styles.actionRow}>
                {user.role === "ADMIN" && editingId && (
                  <button type="button" style={styles.deleteButton} onClick={handleDelete}>
                    Excluir
                  </button>
                )}
              </div>

              <button type="submit" style={styles.floatingSaveButton}>
                💾
              </button>
            </form>
          </div>

          <div style={{ minWidth: 0 }}>
            {renderSectionNav()}
          </div>
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
    background: "#f4f4f4",
    padding: "20px",
    boxSizing: "border-box"
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
    fontSize: "28px",
    color: "#1f2937",
    fontWeight: "800"
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
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#fff",
    boxSizing: "border-box"
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #d1a84c 0%, #b1811f 100%)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 12px 20px rgba(177,129,31,0.20)"
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#1f2937",
    padding: "12px 16px",
    borderRadius: "12px",
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
    width: "96px",
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
  imageWrapper: {
    width: "64px",
    height: "64px",
    position: "relative"
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
    width: "64px",
    height: "64px",
    minWidth: "64px",
    borderRadius: "12px",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb"
  },
  noImage: {
    width: "64px",
    height: "64px",
    minWidth: "64px",
    borderRadius: "12px",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#6b7280",
    textAlign: "center",
    border: "1px solid #d1d5db"
  },
  editButton: {
    border: "none",
    background: "linear-gradient(135deg, #d1a84c 0%, #b1811f 100%)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  viewOnlyBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#f6efdd",
    color: "#8a6414",
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
    color: "#b8860b",
    fontWeight: "800",
    marginBottom: "20px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
    marginBottom: "16px",
    gap: "12px",
    flexWrap: "wrap"
  },

  topSwitch: {
    display: "flex",
    background: "#ececec",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #dedede"
  },
  switchButton: {
    border: "none",
    background: "transparent",
    padding: "12px 22px",
    fontWeight: "700",
    cursor: "pointer",
    color: "#a0a0a0"
  },
  switchButtonActive: {
    background: "#dcdcdc",
    color: "#1f2937"
  },

  editorLayout: {
    display: "grid",
    gridTemplateColumns: "360px minmax(0, 1fr) 220px",
    gap: "18px",
    alignItems: "start",
    width: "100%",
    minWidth: 0
  },

  mediaSidebar: {
    background: "#f3f3f3",
    borderRight: "1px solid #ddd",
    minHeight: "calc(100vh - 100px)",
    padding: "8px 4px",
    width: "100%",
    minWidth: 0,
    overflow: "hidden"
  },
  mediaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    padding: "0 12px"
  },
  mediaTitle: {
    color: "#1d72e8",
    fontSize: "18px"
  },
  mediaIcons: {
    display: "flex",
    gap: "14px"
  },
  mediaIcon: {
    fontSize: "18px",
    color: "#6b7280"
  },
  mediaMainBox: {
    padding: "0 12px"
  },
  mediaMainImage: {
    width: "100%",
    maxWidth: "100%",
    height: "260px",
    objectFit: "cover",
    borderRadius: "14px",
    display: "block",
    backgroundColor: "#ddd"
  },
  mediaEmpty: {
    width: "100%",
    height: "260px",
    borderRadius: "14px",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777"
  },
  mediaThumbGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    padding: "14px 12px"
  },
  mediaThumbCard: {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    minHeight: "120px"
  },
  mediaThumbImage: {
    width: "100%",
    maxWidth: "100%",
    height: "160px",
    objectFit: "cover",
    display: "block"
  },
  mediaPlaceholder: {
    gridColumn: "1 / -1",
    textAlign: "center",
    color: "#999",
    padding: "30px 10px"
  },

  editorCenter: {
    background: "#f4f4f4",
    padding: "0 10px",
    width: "100%",
    minWidth: 0,
    overflow: "hidden"
  },

  sectionSidebar: {
    position: "sticky",
    top: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingTop: "40px",
    width: "100%",
    minWidth: "180px",
    maxWidth: "220px"
  },
  sectionNavButton: {
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "10px 16px",
    fontSize: "18px",
    color: "#7b7b7b",
    cursor: "pointer",
    borderLeft: "3px solid transparent"
  },
  sectionNavButtonActive: {
    color: "#4a5568",
    fontWeight: "700",
    borderLeft: "3px solid #ef4444"
  },

  formSection: {
    padding: "18px 0 30px 0",
    borderBottom: "1px solid #e3e3e3",
    marginBottom: "16px",
    width: "100%",
    minWidth: 0
  },
  formSectionTitle: {
    fontSize: "32px",
    fontWeight: "500",
    color: "#101828",
    margin: "0 0 26px 0"
  },
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px"
  },
  formHeaderBadge: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#9fd38d"
  },
  subSectionTitle: {
    color: "#1d72e8",
    fontSize: "20px",
    marginBottom: "18px"
  },
  separator: {
    height: "1px",
    background: "#e3e3e3",
    margin: "26px 0"
  },

  rowSingle: {
    marginBottom: "26px"
  },
  rowDouble: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "28px",
    marginBottom: "26px"
  },
  rowTriple: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "28px",
    marginBottom: "26px",
    alignItems: "end"
  },
  rowFour: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "22px",
    marginBottom: "26px"
  },
  rowChecks: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
    marginBottom: "26px"
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    color: "#6b7280"
  },

  fieldContent: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  label: {
    color: "#909090",
    fontSize: "16px",
    marginBottom: "6px"
  },
  lineInput: {
    border: "none",
    borderBottom: "1px solid #d2d2d2",
    padding: "8px 0 12px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box"
  },
  lineSelect: {
    border: "none",
    borderBottom: "1px solid #d2d2d2",
    padding: "8px 0 12px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box"
  },
  textareaInput: {
    border: "1px solid #dcdcdc",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "16px",
    outline: "none",
    resize: "vertical",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box"
  },
  textareaInputLarge: {
    border: "1px solid #dcdcdc",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "16px",
    outline: "none",
    resize: "vertical",
    background: "#fff",
    minHeight: "160px",
    width: "100%",
    boxSizing: "border-box"
  },

  cepRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    alignItems: "center"
  },
  cepButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  cepLoadingText: {
    marginTop: "8px",
    color: "#a16207",
    fontSize: "13px",
    fontWeight: "600"
  },
  cepErrorText: {
    marginTop: "8px",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: "600"
  },
  cepSuccessText: {
    marginTop: "8px",
    color: "#15803d",
    fontSize: "13px",
    fontWeight: "600"
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
  fileInput: {
    fontSize: "16px",
    marginTop: "8px"
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: "10px",
    marginBottom: "80px"
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
    right: "34px",
    bottom: "30px",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "none",
    background: "#ff4c39",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)"
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
  }
};

export default Properties;