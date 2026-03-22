import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Clients() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: "CLIENTE_COMPRADOR",
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

  async function loadClients(selectId = null) {
    try {
      const response = await api.get("/persons");
      const filtered = response.data.filter(
        (item) => item.type === "CLIENTE_COMPRADOR"
      );

      setClients(filtered);

      if (selectId) {
        const found = filtered.find((item) => item.id === selectId);
        if (found) {
          handleSelectClient(found);
          return;
        }
      }

      if (!selectedClient && filtered.length > 0) {
        handleSelectClient(filtered[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar clientes.");
    }
  }

  useEffect(() => {
    loadClients();
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

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      `${client.fullName} ${client.cpf || ""} ${client.email || ""} ${client.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [clients, search]);

  function handleSelectClient(client) {
    setSelectedClient(client);
    setEditingId(client.id);

    setForm({
      type: "CLIENTE_COMPRADOR",
      fullName: client.fullName || "",
      cpf: client.cpf || "",
      rg: client.rg || "",
      phone: client.phone || "",
      email: client.email || "",
      company: client.company || "",
      commercialPhone: client.commercialPhone || "",
      residentialPhone: client.residentialPhone || "",
      contactPhone: client.contactPhone || "",
      whatsapp: client.whatsapp || false
    });
  }

  function handleNewClient() {
    setSelectedClient(null);
    setEditingId(null);
    setShowMenu(false);

    setForm({
      type: "CLIENTE_COMPRADOR",
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
        type: "CLIENTE_COMPRADOR",
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
        alert("Cliente atualizado com sucesso.");
        await loadClients(response.data.person.id);
      } else {
        const response = await api.post("/persons", payload);
        alert("Cliente cadastrado com sucesso.");
        await loadClients(response.data.person.id);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cliente.");
    }
  }

  async function handleDelete() {
    if (!editingId) {
      alert("Selecione um cliente para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este cliente?");
    if (!confirmed) return;

    try {
      await api.delete(`/persons/${editingId}`);
      alert("Cliente excluído com sucesso.");
      handleNewClient();
      await loadClients();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir cliente.");
    }
  }

  function handleBack() {
    navigate("/dashboard");
  }

  async function handleRefresh() {
    await loadClients(editingId || null);
    alert("Lista atualizada.");
  }

  function handlePrint() {
    if (!selectedClient) {
      alert("Selecione um cliente para imprimir.");
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
          <title>Cliente - ${selectedClient.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 24px; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h1>${selectedClient.fullName}</h1>
          <p><strong>Código:</strong> ${selectedClient.id}</p>
          <p><strong>CPF:</strong> ${selectedClient.cpf || "-"}</p>
          <p><strong>RG:</strong> ${selectedClient.rg || "-"}</p>
          <p><strong>Telefone:</strong> ${selectedClient.phone || "-"}</p>
          <p><strong>E-mail:</strong> ${selectedClient.email || "-"}</p>
          <p><strong>Empresa:</strong> ${selectedClient.company || "-"}</p>
          <p><strong>Telefone comercial:</strong> ${selectedClient.commercialPhone || "-"}</p>
          <p><strong>Telefone residencial:</strong> ${selectedClient.residentialPhone || "-"}</p>
          <p><strong>Telefone contato:</strong> ${selectedClient.contactPhone || "-"}</p>
          <p><strong>WhatsApp:</strong> ${selectedClient.whatsapp ? "Sim" : "Não"}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleShare() {
    if (!selectedClient) {
      alert("Selecione um cliente para copiar o resumo.");
      return;
    }

    const text = `
Cliente: ${selectedClient.fullName}
Código: ${selectedClient.id}
CPF: ${selectedClient.cpf || "-"}
Telefone: ${selectedClient.phone || "-"}
E-mail: ${selectedClient.email || "-"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do cliente copiado.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function handleOpenHistory() {
    setShowMenu(false);
    if (!selectedClient) {
      alert("Selecione um cliente primeiro.");
      return;
    }
    alert(`Histórico de atendimentos do cliente: ${selectedClient.fullName}`);
  }

  function handleOpenProfiles() {
    setShowMenu(false);
    navigate("/imoveis");
  }

  function handleOpenVisits() {
    setShowMenu(false);
    alert("Área de visitas/negociações será ligada depois.");
  }

  function handleOpenFollowUp() {
    setShowMenu(false);
    alert("Área de avisos/retornos/follow up será ligada depois.");
  }

  function handleOpenMessages() {
    setShowMenu(false);
    alert("Área de e-mails/WhatsApp enviados será ligada depois.");
  }

  function handleOpenDocuments() {
    setShowMenu(false);
    navigate("/documentos");
  }

  function handleOpenClientProperties() {
    setShowMenu(false);
    navigate("/imoveis");
  }

  return (
    <div style={styles.page}>
      <div style={styles.blueBar}>
        <div style={styles.blueBarLeft}>
          <button type="button" style={styles.backButton} onClick={handleBack}>
            ←
          </button>
          <span style={styles.blueBarTitle}>
            {selectedClient
              ? `${selectedClient.fullName} (Código: ${selectedClient.id})`
              : "Novo cliente"}
          </span>
        </div>

        <div style={styles.blueBarRight} ref={menuRef}>
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
                Histórico de atendimentos
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenProfiles}>
                Perfis de imóveis
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenVisits}>
                Visitas/Negociações
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenFollowUp}>
                Avisos/Retornos/Follow up
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenMessages}>
                E-mails/WhatsApp enviados
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenDocuments}>
                Documentos do cliente
              </button>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenClientProperties}>
                Imóveis do cliente
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>Anotações e atividades</h3>
            <div style={styles.leftIcons}>
              <span>⏷</span>
              <span onClick={handleRefresh} style={styles.iconClickable}>↻</span>
              <span onClick={handleNewClient} style={styles.iconClickable}>⊕</span>
            </div>
          </div>

          <input
            style={styles.searchInput}
            placeholder="Buscar cliente por nome, CPF ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={styles.newClientButton}
            onClick={handleNewClient}
          >
            + Novo cliente
          </button>

          <div style={styles.clientList}>
            {filteredClients.length === 0 ? (
              <div style={styles.emptyNotes}>
                Cliente sem anotações ou atividades
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  style={{
                    ...styles.clientItem,
                    ...(selectedClient?.id === client.id
                      ? styles.clientItemActive
                      : {})
                  }}
                >
                  <strong>{client.fullName}</strong>
                  <div style={styles.clientItemMeta}>
                    CPF: {client.cpf || "-"}
                  </div>
                  <div style={styles.clientItemMeta}>
                    {client.phone || "-"}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section style={styles.mainPanel}>
          <div style={styles.formHeader}>
            <div style={styles.greenDot}></div>
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
  blueBar: {
    height: "54px",
    backgroundColor: "#d4a62a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    color: "#fff",
    position: "relative"
  },
  blueBarLeft: {
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
  blueBarTitle: {
    fontSize: "18px",
    fontWeight: "500"
  },
  blueBarRight: {
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
    width: "310px",
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
  newClientButton: {
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
  clientList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "calc(100vh - 220px)",
    overflowY: "auto"
  },
  emptyNotes: {
    color: "#c0b38f",
    textAlign: "center",
    padding: "60px 20px"
  },
  clientItem: {
    border: "1px solid #e3d6b5",
    backgroundColor: "#fffdf8",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer"
  },
  clientItemActive: {
    border: "2px solid #d4a62a",
    backgroundColor: "#fff7df"
  },
  clientItemMeta: {
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
  greenDot: {
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

export default Clients;