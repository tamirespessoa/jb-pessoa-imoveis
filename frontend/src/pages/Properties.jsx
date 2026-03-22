import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Properties() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    code: "",
    description: "",
    purpose: "",
    type: "",
    price: "",
    condominiumFee: "",
    iptuValue: "",
    status: "",
    bedrooms: "",
    bathrooms: "",
    suites: "",
    parkingSpaces: "",
    builtArea: "",
    landArea: "",
    zipCode: "",
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    ownerId: ""
  });

  async function loadProperties(selectId = null) {
    try {
      const response = await api.get("/properties");
      const list = response.data || [];
      setProperties(list);

      if (selectId) {
        const found = list.find((item) => item.id === selectId);
        if (found) {
          handleSelectProperty(found);
          return;
        }
      }

      if (!selectedProperty && list.length > 0) {
        handleSelectProperty(list[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar imóveis.");
    }
  }

  async function loadOwners() {
    try {
      const response = await api.get("/persons");
      const filtered = response.data.filter(
        (item) => item.type === "PROPRIETARIO"
      );
      setOwners(filtered);
    } catch (error) {
      console.error(error);
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
      `${property.title} ${property.code} ${property.city || ""} ${
        property.owner?.fullName || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [properties, search]);

  function handleSelectProperty(property) {
    setSelectedProperty(property);
    setEditingId(property.id);

    setForm({
      title: property.title || "",
      code: property.code || "",
      description: property.description || "",
      purpose: property.purpose || "",
      type: property.type || "",
      price: property.price ?? "",
      condominiumFee: property.condominiumFee ?? "",
      iptuValue: property.iptuValue ?? "",
      status: property.status || "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      suites: property.suites ?? "",
      parkingSpaces: property.parkingSpaces ?? "",
      builtArea: property.builtArea ?? "",
      landArea: property.landArea ?? "",
      zipCode: property.zipCode || "",
      street: property.street || "",
      number: property.number || "",
      district: property.district || "",
      city: property.city || "",
      state: property.state || "",
      ownerId: property.ownerId ? String(property.ownerId) : ""
    });
  }

  function handleNewProperty() {
    setSelectedProperty(null);
    setEditingId(null);
    setShowMenu(false);

    setForm({
      title: "",
      code: "",
      description: "",
      purpose: "",
      type: "",
      price: "",
      condominiumFee: "",
      iptuValue: "",
      status: "",
      bedrooms: "",
      bathrooms: "",
      suites: "",
      parkingSpaces: "",
      builtArea: "",
      landArea: "",
      zipCode: "",
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      ownerId: ""
    });
  }

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        title: form.title,
        code: form.code,
        description: form.description,
        purpose: form.purpose,
        type: form.type,
        price: form.price,
        condominiumFee: form.condominiumFee,
        iptuValue: form.iptuValue,
        status: form.status,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        suites: form.suites,
        parkingSpaces: form.parkingSpaces,
        builtArea: form.builtArea,
        landArea: form.landArea,
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        district: form.district,
        city: form.city,
        state: form.state,
        ownerId: form.ownerId || null
      };

      if (editingId) {
        const response = await api.put(`/properties/${editingId}`, payload);
        alert("Imóvel atualizado com sucesso.");
        await loadProperties(response.data.property.id);
      } else {
        const response = await api.post("/properties", payload);
        alert("Imóvel cadastrado com sucesso.");
        await loadProperties(response.data.property.id);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar imóvel.");
    }
  }

  async function handleDelete() {
    if (!editingId) {
      alert("Selecione um imóvel para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este imóvel?");
    if (!confirmed) return;

    try {
      await api.delete(`/properties/${editingId}`);
      alert("Imóvel excluído com sucesso.");
      handleNewProperty();
      await loadProperties();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir imóvel.");
    }
  }

  function handleBack() {
    navigate("/dashboard");
  }

  async function handleRefresh() {
    await loadProperties(editingId || null);
    await loadOwners();
    alert("Lista atualizada.");
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
          <p><strong>Código:</strong> ${selectedProperty.code || "-"}</p>
          <p><strong>Descrição:</strong> ${selectedProperty.description || "-"}</p>
          <p><strong>Finalidade:</strong> ${selectedProperty.purpose || "-"}</p>
          <p><strong>Tipo:</strong> ${selectedProperty.type || "-"}</p>
          <p><strong>Preço:</strong> ${selectedProperty.price ?? "-"}</p>
          <p><strong>Condomínio:</strong> ${selectedProperty.condominiumFee ?? "-"}</p>
          <p><strong>IPTU:</strong> ${selectedProperty.iptuValue ?? "-"}</p>
          <p><strong>Status:</strong> ${selectedProperty.status || "-"}</p>
          <p><strong>Quartos:</strong> ${selectedProperty.bedrooms ?? "-"}</p>
          <p><strong>Banheiros:</strong> ${selectedProperty.bathrooms ?? "-"}</p>
          <p><strong>Suítes:</strong> ${selectedProperty.suites ?? "-"}</p>
          <p><strong>Vagas:</strong> ${selectedProperty.parkingSpaces ?? "-"}</p>
          <p><strong>Área construída:</strong> ${selectedProperty.builtArea ?? "-"}</p>
          <p><strong>Área terreno:</strong> ${selectedProperty.landArea ?? "-"}</p>
          <p><strong>CEP:</strong> ${selectedProperty.zipCode || "-"}</p>
          <p><strong>Rua:</strong> ${selectedProperty.street || "-"}</p>
          <p><strong>Número:</strong> ${selectedProperty.number || "-"}</p>
          <p><strong>Bairro:</strong> ${selectedProperty.district || "-"}</p>
          <p><strong>Cidade:</strong> ${selectedProperty.city || "-"}</p>
          <p><strong>Estado:</strong> ${selectedProperty.state || "-"}</p>
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

  function handleOpenHistory() {
    setShowMenu(false);
    if (!selectedProperty) {
      alert("Selecione um imóvel primeiro.");
      return;
    }
    alert(`Histórico do imóvel: ${selectedProperty.title}`);
  }

  function handleOpenDocuments() {
    setShowMenu(false);
    navigate("/documentos");
  }

  function handleOpenOwner() {
    setShowMenu(false);
    navigate("/proprietarios");
  }

  function handleOpenVisits() {
    setShowMenu(false);
    alert("Área de visitas e negociações será ligada depois.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button type="button" style={styles.backButton} onClick={handleBack}>
            ←
          </button>
          <span style={styles.topBarTitle}>
            {selectedProperty
              ? `${selectedProperty.title} (Código: ${selectedProperty.code})`
              : "Novo imóvel"}
          </span>
        </div>

        <div style={styles.topBarRight} ref={menuRef}>
          <button type="button" style={styles.topIcon} onClick={handleShare}>
            ⤴
          </button>
          <button type="button" style={styles.topIcon} onClick={handlePrint}>
            🖨
          </button>
          <button type="button" style={styles.topIcon} onClick={handleRefresh}>
            ↻
          </button>
          <button
            type="button"
            style={styles.topIcon}
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>

          {showMenu && (
            <div style={styles.dropdownMenu}>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenHistory}>
                Histórico do imóvel
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenDocuments}>
                Documentos do imóvel
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenOwner}>
                Proprietário vinculado
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenVisits}>
                Visitas e negociações
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>Lista de imóveis</h3>
            <div style={styles.leftIcons}>
              <span>⏷</span>
              <span onClick={handleRefresh} style={styles.iconClickable}>↻</span>
              <span onClick={handleNewProperty} style={styles.iconClickable}>⊕</span>
            </div>
          </div>

          <input
            style={styles.searchInput}
            placeholder="Buscar imóvel por título, código, cidade ou proprietário"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={styles.newButton}
            onClick={handleNewProperty}
          >
            + Novo imóvel
          </button>

          <div style={styles.list}>
            {filteredProperties.length === 0 ? (
              <div style={styles.emptyBox}>Nenhum imóvel encontrado.</div>
            ) : (
              filteredProperties.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => handleSelectProperty(property)}
                  style={{
                    ...styles.listItem,
                    ...(selectedProperty?.id === property.id
                      ? styles.listItemActive
                      : {})
                  }}
                >
                  <strong>{property.title}</strong>
                  <div style={styles.listMeta}>Código: {property.code}</div>
                  <div style={styles.listMeta}>
                    {property.city || "-"} / {property.state || "-"}
                  </div>
                  <div style={styles.listMeta}>
                    Proprietário: {property.owner?.fullName || "-"}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section style={styles.mainPanel}>
          <div style={styles.formHeader}>
            <div style={styles.dot}></div>
            <h2 style={styles.formTitle}>Cadastro</h2>
          </div>

          <form onSubmit={handleSubmit}>
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
                <label style={styles.label}>Finalidade</label>
                <input
                  style={styles.lineInput}
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  placeholder="Venda, Aluguel..."
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Tipo</label>
                <input
                  style={styles.lineInput}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="Casa, Apartamento..."
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
                <label style={styles.label}>Status</label>
                <input
                  style={styles.lineInput}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  placeholder="Disponível, Reservado..."
                />
              </div>
            </div>

            <div style={styles.rowTriple}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Preço</label>
                <input
                  style={styles.lineInput}
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Condomínio</label>
                <input
                  style={styles.lineInput}
                  name="condominiumFee"
                  value={form.condominiumFee}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>IPTU</label>
                <input
                  style={styles.lineInput}
                  name="iptuValue"
                  value={form.iptuValue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowFour}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Quartos</label>
                <input
                  style={styles.lineInput}
                  name="bedrooms"
                  value={form.bedrooms}
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
                <label style={styles.label}>Vagas</label>
                <input
                  style={styles.lineInput}
                  name="parkingSpaces"
                  value={form.parkingSpaces}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowFour}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Área construída</label>
                <input
                  style={styles.lineInput}
                  name="builtArea"
                  value={form.builtArea}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Área terreno</label>
                <input
                  style={styles.lineInput}
                  name="landArea"
                  value={form.landArea}
                  onChange={handleChange}
                />
              </div>

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

            <div style={styles.rowTriple}>
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
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Estado</label>
                <input
                  style={styles.lineInput}
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Proprietário</label>
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

            <div style={styles.actionRow}>
              {editingId && (
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
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f3f0e8",
    minHeight: "100vh",
    position: "relative",
    margin: 0
  },
  topBar: {
    height: "54px",
    backgroundColor: "#d4a62a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    color: "#fff",
    position: "relative"
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "26px",
    cursor: "pointer"
  },
  topBarTitle: {
    fontSize: "18px",
    fontWeight: "500"
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    position: "relative"
  },
  topIcon: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer"
  },
  dropdownMenu: {
    position: "absolute",
    top: "46px",
    right: 0,
    width: "280px",
    backgroundColor: "#fffdf8",
    border: "1px solid #e4d2a0",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
    zIndex: 20
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#fffdf8",
    padding: "14px 16px",
    fontSize: "15px",
    cursor: "pointer",
    borderBottom: "1px solid #eee2bf"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    minHeight: "calc(100vh - 54px)"
  },
  leftPanel: {
    backgroundColor: "#fbf7ef",
    borderRight: "1px solid #e2d6bb",
    padding: "18px 14px"
  },
  leftPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },
  leftPanelTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "500",
    color: "#5d4a1f"
  },
  leftIcons: {
    display: "flex",
    gap: "14px",
    fontSize: "22px",
    color: "#8b7a52"
  },
  iconClickable: {
    cursor: "pointer"
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd1af",
    borderRadius: "8px",
    boxSizing: "border-box",
    marginBottom: "12px",
    backgroundColor: "#fffdf8"
  },
  newButton: {
    width: "100%",
    border: "1px solid #d4a62a",
    backgroundColor: "#fffdf8",
    color: "#b58712",
    borderRadius: "8px",
    padding: "10px 12px",
    cursor: "pointer",
    marginBottom: "14px",
    fontWeight: "bold"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "calc(100vh - 220px)",
    overflowY: "auto"
  },
  emptyBox: {
    color: "#c0b38f",
    textAlign: "center",
    padding: "60px 20px"
  },
  listItem: {
    border: "1px solid #e3d6b5",
    backgroundColor: "#fffdf8",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer"
  },
  listItemActive: {
    border: "2px solid #d4a62a",
    backgroundColor: "#fff7df"
  },
  listMeta: {
    color: "#7a6a47",
    fontSize: "14px",
    marginTop: "4px"
  },
  mainPanel: {
    backgroundColor: "#fffdf8",
    padding: "26px 34px",
    position: "relative"
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "26px"
  },
  dot: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#cdbb7b"
  },
  formTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "500"
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
    color: "#9a8a60",
    fontSize: "15px",
    marginBottom: "6px"
  },
  lineInput: {
    border: "none",
    borderBottom: "1px solid #d8c8a2",
    padding: "8px 0 10px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent"
  },
  selectInput: {
    border: "none",
    borderBottom: "1px solid #d8c8a2",
    padding: "8px 0 10px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent"
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: "10px"
  },
  deleteButton: {
    backgroundColor: "#d6453d",
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