import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Owners() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: "PROPRIETARIO",
    fullName: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    company: "",
    commercialPhone: "",
    residentialPhone: "",
    contactPhone: "",
    whatsapp: false
  });

  async function loadOwners(selectId = null) {
    try {
      const response = await api.get("/persons");
      const filtered = response.data.filter(
        (item) => item.type === "PROPRIETARIO"
      );

      setOwners(filtered);

      if (selectId) {
        const found = filtered.find((item) => item.id === selectId);
        if (found) {
          handleSelectOwner(found);
          return;
        }
      }

      if (!selectedOwner && filtered.length > 0) {
        handleSelectOwner(filtered[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar proprietários.");
    }
  }

  useEffect(() => {
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

  const filteredOwners = useMemo(() => {
    return owners.filter((owner) =>
      `${owner.fullName} ${owner.cpf || ""} ${owner.email || ""} ${owner.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [owners, search]);

  function handleSelectOwner(owner) {
    setSelectedOwner(owner);
    setEditingId(owner.id);

    setForm({
      type: "PROPRIETARIO",
      fullName: owner.fullName || "",
      cpf: owner.cpf || "",
      rg: owner.rg || "",
      phone: owner.phone || "",
      email: owner.email || "",
      company: owner.company || "",
      commercialPhone: owner.commercialPhone || "",
      residentialPhone: owner.residentialPhone || "",
      contactPhone: owner.contactPhone || "",
      whatsapp: owner.whatsapp || false
    });
  }

  function handleNewOwner() {
    setSelectedOwner(null);
    setEditingId(null);
    setShowMenu(false);

    setForm({
      type: "PROPRIETARIO",
      fullName: "",
      cpf: "",
      rg: "",
      phone: "",
      email: "",
      company: "",
      commercialPhone: "",
      residentialPhone: "",
      contactPhone: "",
      whatsapp: false
    });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        type: "PROPRIETARIO",
        fullName: form.fullName,
        cpf: form.cpf,
        rg: form.rg,
        phone: form.phone,
        email: form.email,
        company: form.company,
        commercialPhone: form.commercialPhone,
        residentialPhone: form.residentialPhone,
        contactPhone: form.contactPhone,
        whatsapp: form.whatsapp
      };

      if (editingId) {
        const response = await api.put(`/persons/${editingId}`, payload);
        alert("Proprietário atualizado com sucesso.");
        await loadOwners(response.data.person.id);
      } else {
        const response = await api.post("/persons", payload);
        alert("Proprietário cadastrado com sucesso.");
        await loadOwners(response.data.person.id);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar proprietário.");
    }
  }

  async function handleDelete() {
    if (!editingId) {
      alert("Selecione um proprietário para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este proprietário?");
    if (!confirmed) return;

    try {
      await api.delete(`/persons/${editingId}`);
      alert("Proprietário excluído com sucesso.");
      handleNewOwner();
      await loadOwners();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir proprietário.");
    }
  }

  function handleBack() {
    navigate("/dashboard");
  }

  async function handleRefresh() {
    await loadOwners(editingId || null);
    alert("Lista atualizada.");
  }

  function handlePrint() {
    if (!selectedOwner) {
      alert("Selecione um proprietário para imprimir.");
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
          <title>Proprietário - ${selectedOwner.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 24px; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h1>${selectedOwner.fullName}</h1>
          <p><strong>Código:</strong> ${selectedOwner.id}</p>
          <p><strong>CPF:</strong> ${selectedOwner.cpf || "-"}</p>
          <p><strong>RG:</strong> ${selectedOwner.rg || "-"}</p>
          <p><strong>Telefone:</strong> ${selectedOwner.phone || "-"}</p>
          <p><strong>E-mail:</strong> ${selectedOwner.email || "-"}</p>
          <p><strong>Empresa:</strong> ${selectedOwner.company || "-"}</p>
          <p><strong>Telefone comercial:</strong> ${selectedOwner.commercialPhone || "-"}</p>
          <p><strong>Telefone residencial:</strong> ${selectedOwner.residentialPhone || "-"}</p>
          <p><strong>Telefone contato:</strong> ${selectedOwner.contactPhone || "-"}</p>
          <p><strong>WhatsApp:</strong> ${selectedOwner.whatsapp ? "Sim" : "Não"}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleShare() {
    if (!selectedOwner) {
      alert("Selecione um proprietário para copiar o resumo.");
      return;
    }

    const text = `
Proprietário: ${selectedOwner.fullName}
Código: ${selectedOwner.id}
CPF: ${selectedOwner.cpf || "-"}
Telefone: ${selectedOwner.phone || "-"}
E-mail: ${selectedOwner.email || "-"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do proprietário copiado.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function handleOpenHistory() {
    setShowMenu(false);
    if (!selectedOwner) {
      alert("Selecione um proprietário primeiro.");
      return;
    }
    alert(`Histórico do proprietário: ${selectedOwner.fullName}`);
  }

  function handleOpenLinkedProperties() {
    setShowMenu(false);
    navigate("/imoveis");
  }

  function handleOpenDocuments() {
    setShowMenu(false);
    navigate("/documentos");
  }

  function handleOpenService() {
    setShowMenu(false);
    alert("Área de atendimentos será ligada depois.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button type="button" style={styles.backButton} onClick={handleBack}>
            ←
          </button>
          <span style={styles.topBarTitle}>
            {selectedOwner
              ? `${selectedOwner.fullName} (Código: ${selectedOwner.id})`
              : "Novo proprietário"}
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
                Histórico do proprietário
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenLinkedProperties}>
                Imóveis vinculados
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenDocuments}>
                Documentos do proprietário
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenService}>
                Atendimentos
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>Lista de proprietários</h3>
            <div style={styles.leftIcons}>
              <span>⏷</span>
              <span onClick={handleRefresh} style={styles.iconClickable}>↻</span>
              <span onClick={handleNewOwner} style={styles.iconClickable}>⊕</span>
            </div>
          </div>

          <input
            style={styles.searchInput}
            placeholder="Buscar proprietário por nome, CPF ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={styles.newButton}
            onClick={handleNewOwner}
          >
            + Novo proprietário
          </button>

          <div style={styles.list}>
            {filteredOwners.length === 0 ? (
              <div style={styles.emptyBox}>Nenhum proprietário encontrado.</div>
            ) : (
              filteredOwners.map((owner) => (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => handleSelectOwner(owner)}
                  style={{
                    ...styles.listItem,
                    ...(selectedOwner?.id === owner.id
                      ? styles.listItemActive
                      : {})
                  }}
                >
                  <strong>{owner.fullName}</strong>
                  <div style={styles.listMeta}>CPF: {owner.cpf || "-"}</div>
                  <div style={styles.listMeta}>{owner.phone || "-"}</div>
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
                <div style={styles.fieldIcon}>👤</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>*Nome</label>
                  <input
                    style={styles.lineInput}
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div style={styles.rowSingle}>
              <div style={styles.fieldWithIcon}>
                <div style={styles.fieldIcon}>🏢</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Empresa</label>
                  <input
                    style={styles.lineInput}
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div style={styles.rowSingle}>
              <div style={styles.fieldWithIcon}>
                <div style={styles.fieldIcon}>✉</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>E-mail</label>
                  <input
                    style={styles.lineInput}
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div style={styles.rowTriple}>
              <div style={styles.fieldWithIcon}>
                <div style={styles.fieldIcon}>📱</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Celular</label>
                  <input
                    style={styles.lineInput}
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>CPF</label>
                <input
                  style={styles.lineInput}
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  name="whatsapp"
                  checked={form.whatsapp}
                  onChange={handleChange}
                />
                <span style={styles.checkboxLabel}>Possui WhatsApp</span>
              </div>
            </div>

            <div style={styles.rowTriple}>
              <div style={styles.fieldWithIcon}>
                <div style={styles.fieldIcon}>☎</div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Telefone Comercial</label>
                  <input
                    style={styles.lineInput}
                    name="commercialPhone"
                    value={form.commercialPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Telefone Residencial</label>
                <input
                  style={styles.lineInput}
                  name="residentialPhone"
                  value={form.residentialPhone}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Telefone Contato</label>
                <input
                  style={styles.lineInput}
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>RG</label>
                <input
                  style={styles.lineInput}
                  name="rg"
                  value={form.rg}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Observação rápida</label>
                <input
                  style={styles.lineInput}
                  placeholder="Campo visual"
                  disabled
                />
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
    gridTemplateColumns: "1.2fr 1fr 0.8fr",
    gap: "40px",
    marginBottom: "26px",
    alignItems: "end"
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
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "10px"
  },
  checkboxLabel: {
    color: "#7a6a47",
    fontSize: "16px"
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

export default Owners;