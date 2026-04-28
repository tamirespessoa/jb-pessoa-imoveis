import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Clients() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [newActivityText, setNewActivityText] = useState("");

  const [form, setForm] = useState({
    type: "CLIENTE",
    fullName: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    company: "",
    commercialPhone: "",
    residentialPhone: "",
    contactPhone: "",
    whatsapp: false,
    category: "",
    firstContact: "",
    isActive: true,
    notes: "",
    createReminder: false,
    businessTemperature: "FRIO",
    activities: []
  });

  function parseWhatsapp(value) {
    if (
      value === true ||
      value === "true" ||
      value === "Sim" ||
      value === "sim" ||
      value === 1 ||
      value === "1"
    ) {
      return true;
    }

    return false;
  }

  function normalizeString(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }

  async function loadClients(selectId = null) {
    try {
      const response = await api.get("/persons");
      const filtered = (response.data || []).filter(
        (item) => item.type === "CLIENTE"
      );

      setClients(filtered);

      if (selectId) {
        const found = filtered.find((item) => item.id === selectId);
        if (found) {
          handleSelectClient(found);
          return;
        }
      }
      // Não seleciona cliente automaticamente. O usuário escolhe na lista.
    } catch (error) {
      console.error(
        "Erro ao carregar clientes:",
        error.response?.data || error.message
      );

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        error.message ||
        "Não foi possível carregar os clientes.";

      alert(`Erro ao carregar clientes:
${apiMessage}`);
      setClients([]);
      setSelectedClient(null);
      setEditingId(null);
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
      `${client.fullName || ""} ${client.cpf || ""} ${client.email || ""} ${
        client.phone || ""
      } ${client.createdBy?.name || ""} ${client.category || ""} ${
        client.firstContact || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [clients, search]);

  function handleSelectClient(client) {
    setSelectedClient(client);
    setEditingId(client.id);

    setForm({
      type: "CLIENTE",
      fullName: client.fullName || "",
      cpf: client.cpf || "",
      rg: client.rg || "",
      phone: client.phone || "",
      email: client.email || "",
      company: client.company || "",
      commercialPhone: client.commercialPhone || "",
      residentialPhone: client.residentialPhone || "",
      contactPhone: client.contactPhone || "",
      whatsapp: parseWhatsapp(client.whatsapp),
      category: client.category || "",
      firstContact: client.firstContact || "",
      isActive:
        client.isActive !== undefined && client.isActive !== null
          ? Boolean(client.isActive)
          : true,
      notes: client.notes || "",
      createReminder:
        client.createReminder !== undefined && client.createReminder !== null
          ? Boolean(client.createReminder)
          : false,
      businessTemperature: client.businessTemperature || "FRIO",
      activities: Array.isArray(client.activities) ? client.activities : []
    });
  }

  function handleNewClient() {
    setSelectedClient(null);
    setEditingId(null);
    setShowMenu(false);

    setForm({
      type: "CLIENTE",
      fullName: "",
      cpf: "",
      rg: "",
      phone: "",
      email: "",
      company: "",
      commercialPhone: "",
      residentialPhone: "",
      contactPhone: "",
      whatsapp: false,
      category: "",
      firstContact: "",
      isActive: true,
      notes: "",
      createReminder: false,
    businessTemperature: "FRIO",
    activities: []
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

    if (!form.fullName.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    try {
      const payload = {
        type: "CLIENTE",
        fullName: form.fullName.trim(),
        cpf: normalizeString(form.cpf),
        rg: normalizeString(form.rg),
        phone: normalizeString(form.phone),
        email: normalizeString(form.email),
        company: normalizeString(form.company),
        commercialPhone: normalizeString(form.commercialPhone),
        residentialPhone: normalizeString(form.residentialPhone),
        contactPhone: normalizeString(form.contactPhone),
        whatsapp: Boolean(form.whatsapp),
        category: normalizeString(form.category),
        firstContact: normalizeString(form.firstContact),
        isActive: Boolean(form.isActive),
        notes: normalizeString(form.notes),
        createReminder: Boolean(form.createReminder),
        businessTemperature: normalizeString(form.businessTemperature) || "FRIO",
        activities: Array.isArray(form.activities) ? form.activities : []
      };

      if (editingId) {
        await api.put(`/persons/${editingId}`, payload);
        alert("Cliente atualizado com sucesso.");
        await loadClients(editingId);
      } else {
        const response = await api.post("/persons", payload);
        const createdId = response.data?.person?.id || response.data?.id || null;
        alert("Cliente cadastrado com sucesso.");
        await loadClients(createdId);
      }
    } catch (error) {
      console.error(
        "Erro ao salvar cliente:",
        error.response?.data || error.message
      );

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        JSON.stringify(error.response?.data) ||
        error.message;

      alert(`Erro ao salvar cliente:\n${apiMessage}`);
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
      console.error(
        "Erro ao excluir cliente:",
        error.response?.data || error.message
      );
      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erro ao excluir cliente.";
      alert(apiMessage);
    }
  }

  function handleCreateFinancing() {
    setShowMenu(false);

    if (!selectedClient) {
      alert("Selecione um cliente primeiro.");
      return;
    }

    navigate("/financiamentos", {
      state: {
        preselectedClient: {
          id: selectedClient.id,
          fullName: selectedClient.fullName,
          cpf: selectedClient.cpf || "",
          phone: selectedClient.phone || "",
          email: selectedClient.email || "",
          createdByName: selectedClient.createdBy?.name || selectedClient.createdBy?.email || "",
          createdById: selectedClient.createdBy?.id || null
        }
      }
    });
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
          <p><strong>WhatsApp:</strong> ${
            parseWhatsapp(selectedClient.whatsapp) ? "Sim" : "Não"
          }</p>
          <p><strong>Categoria:</strong> ${selectedClient.category || "-"}</p>
          <p><strong>Primeiro contato:</strong> ${selectedClient.firstContact || "-"}</p>
          <p><strong>Situação:</strong> ${
            selectedClient.isActive ? "Ativo" : "Inativo"
          }</p>
          <p><strong>Notas:</strong> ${selectedClient.notes || "-"}</p>
          <p><strong>Criar aviso:</strong> ${
            selectedClient.createReminder ? "Sim" : "Não"
          }</p>
          <p><strong>Captador:</strong> ${
            selectedClient.createdBy?.name || selectedClient.createdBy?.email || "-"
          }</p>
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
Categoria: ${selectedClient.category || "-"}
Primeiro contato: ${selectedClient.firstContact || "-"}
Situação: ${selectedClient.isActive ? "Ativo" : "Inativo"}
Captador: ${selectedClient.createdBy?.name || selectedClient.createdBy?.email || "-"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do cliente copiado.");
    } catch (error) {
      console.error("Erro ao copiar resumo:", error);
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


  function getCaptadorName(person) {
  
  function getInitials(name) {
    const value = String(name || "").trim();

    if (!value) return "?";

    const parts = value.split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  }

  function formatDate(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  }

  function getWhatsAppLink(phone) {
    const numbers = String(phone || "").replace(/\D/g, "");

    if (!numbers) return "";

    const finalNumber = numbers.startsWith("55") ? numbers : `55${numbers}`;

    return `https://wa.me/${finalNumber}`;
  }

  function handleOpenQuickView(client) {
    setViewClient(client);
  }

  function handleEditFromQuickView() {
    if (!viewClient) return;

    handleSelectClient(viewClient);
    setViewClient(null);
  }

  return (
      person?.createdBy?.name ||
      person?.createdBy?.email ||
      person?.captorName ||
      user.name ||
      user.fullName ||
      user.email ||
      "Captador não informado"
    );
  }

  function formatDateTime(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return "-";
    }
  }

  function handleSelectTemperature(value) {
    setForm((prev) => ({
      ...prev,
      businessTemperature: value
    }));
  }

  function handleAddActivity() {
    const text = newActivityText.trim();

    if (!text) {
      alert("Digite uma anotação ou atividade.");
      return;
    }

    const activity = {
      id: Date.now(),
      type: "Anotação",
      text,
      createdAt: new Date().toISOString(),
      createdBy: user.name || user.fullName || user.email || "Usuário"
    };

    setForm((prev) => ({
      ...prev,
      activities: [activity, ...(Array.isArray(prev.activities) ? prev.activities : [])]
    }));

    setNewActivityText("");
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
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleCreateFinancing}
              >
                Criar financiamento
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenHistory}
              >
                Histórico de atendimentos
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenProfiles}
              >
                Perfis de imóveis
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenVisits}
              >
                Visitas/Negociações
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenFollowUp}
              >
                Avisos/Retornos/Follow up
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenMessages}
              >
                E-mails/WhatsApp enviados
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenDocuments}
              >
                Documentos do cliente
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenClientProperties}
              >
                Imóveis do cliente
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.activitiesBox}>
            <div style={styles.activitiesHeader}>
              <h3 style={styles.activitiesTitle}>Anotações e atividades</h3>
              <div style={styles.activitiesIcons}>
                <span title="Filtrar">⏷</span>
                <span title="Atualizar" onClick={handleRefresh} style={styles.iconClickable}>↻</span>
                <span title="Adicionar" onClick={handleAddActivity} style={styles.iconClickable}>⊕</span>
              </div>
            </div>

            <textarea
              value={newActivityText}
              onChange={(e) => setNewActivityText(e.target.value)}
              style={styles.activityTextarea}
              placeholder="Digite uma anotação ou atividade..."
            />

            <button
              type="button"
              onClick={handleAddActivity}
              style={styles.activityButton}
            >
              + Adicionar anotação
            </button>

            <div style={styles.activitiesList}>
              {Array.isArray(form.activities) && form.activities.length > 0 ? (
                form.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id || activity.createdAt} style={styles.activityItem}>
                    <div style={styles.activityItemTop}>
                      <strong>{activity.type || "Anotação"}</strong>
                      <span>{formatDateTime(activity.createdAt)}</span>
                    </div>
                    <p style={styles.activityItemText}>{activity.text}</p>
                    <div style={styles.activityAuthor}>
                      👤 {activity.createdBy || getCaptadorName(selectedClient)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyActivities}>
                  Cliente sem anotações ou atividades
                </div>
              )}
            </div>
          </div>

          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>
              {user.role === "ADMIN"
                ? "Clientes cadastrados"
                : "Meus clientes"}
            </h3>
            <div style={styles.leftIcons}>
              <span>⏷</span>
              <span onClick={handleRefresh} style={styles.iconClickable}>
                ↻
              </span>
              <span onClick={handleNewClient} style={styles.iconClickable}>
                ⊕
              </span>
            </div>
          </div>

          <input
            style={styles.searchInput}
            placeholder="Buscar cliente por nome, CPF, e-mail ou captador"
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

          <div style={styles.clientListCard}>
            <div style={styles.clientTableHeader}>
              <div style={styles.checkboxFake}></div>
              <div>Nome / Empresa</div>
              <div>Captador</div>
              <div>Data Cadastro</div>
              <div>Data Atualização</div>
            </div>

            {filteredClients.length === 0 ? (
              <div style={styles.emptyNotes}>Nenhum cliente encontrado</div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    ...styles.clientTableRow,
                    ...(selectedClient?.id === client.id
                      ? styles.clientTableRowActive
                      : {})
                  }}
                >
                  <div
                    style={styles.avatar}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenQuickView(client);
                    }}
                    title="Ver informações básicas"
                  >
                    {getInitials(client.fullName)}
                  </div>

                  <div style={styles.clientNameCell}>
                    <strong>{client.fullName}</strong>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenQuickView(client);
                      }}
                      style={styles.homeMiniButton}
                      title="Informações rápidas"
                    >
                      ⌂
                    </button>
                  </div>

                  <div style={styles.captorCell}>
                    <div style={styles.captorAvatar}>
                      {getInitials(client.createdBy?.name || client.createdBy?.email)}
                    </div>
                    <span>
                      {client.createdBy?.name ||
                        client.createdBy?.email ||
                        "Captador não informado"}
                    </span>
                  </div>

                  <div style={styles.dateCell}>◷ {formatDate(client.createdAt)}</div>
                  <div style={styles.dateCell}>↻ {formatDate(client.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section style={styles.mainPanel}>
          <div style={styles.rightNav}>
            <a href="#cadastro" style={styles.rightNavItem}>Cadastro</a>
            <a href="#atividades" style={styles.rightNavItem}>Atividades</a>
            <a href="#dados-pessoais" style={styles.rightNavItem}>D. pessoais</a>
            <a href="#endereco" style={styles.rightNavItem}>Endereço</a>
          </div>
          <div style={styles.formHeader} id="cadastro">
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
                <label style={styles.label}>Captador</label>
                <input
                  style={styles.lineInput}
                  value={getCaptadorName(selectedClient)}
                  disabled
                />
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>*Categoria</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={styles.lineSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="INTERESSADO">INTERESSADO(A)</option>
                  <option value="PROPRIETARIO">PROPRIETÁRIO(A)</option>
                  <option value="PROSPECCAO">PROSPECÇÃO</option>
                </select>
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>*Primeiro Contato (Mídia)</label>
                <select
                  name="firstContact"
                  value={form.firstContact}
                  onChange={handleChange}
                  style={styles.lineSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LIGACAO">Ligação</option>
                  <option value="SITE">Site</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INDICACAO">Indicação</option>
                  <option value="PORTAL">Portal</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
            </div>

            <div style={styles.rowDouble}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Situação</label>
                <div style={styles.statusRow}>
                  <span style={styles.statusTextLeft}>Inativo</span>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: !prev.isActive
                      }))
                    }
                    style={{
                      width: "54px",
                      height: "30px",
                      borderRadius: "30px",
                      border: "none",
                      backgroundColor: form.isActive ? "#b9dcbc" : "#d9d9d9",
                      position: "relative",
                      cursor: "pointer"
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: form.isActive ? "28px" : "4px",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: form.isActive ? "#8cc98f" : "#ffffff",
                        transition: "0.2s"
                      }}
                    />
                  </button>

                  <span style={styles.statusTextRight}>Ativo</span>
                </div>
              </div>

              <div style={styles.fieldContent}>
                <label style={styles.label}>
                  Criar aviso na agenda para retorno
                </label>
                <div style={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    name="createReminder"
                    checked={form.createReminder}
                    onChange={handleChange}
                  />
                  <span style={styles.checkboxLabel}>
                    Criar retorno automático
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.rowSingle}>
              <label style={styles.label}>Termômetro de Negócios</label>
              <div style={styles.thermometerRow}>
                {["FRIO", "MORNO", "INTERESSADO", "QUENTE", "FECHAMENTO"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectTemperature(item)}
                      style={{
                        ...styles.thermometerButton,
                        ...(form.businessTemperature === item
                          ? styles[`thermometer${item}`]
                          : styles.thermometerInactive)
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div style={styles.rowSingle}>
              <div style={styles.fieldContent}>
                <label style={styles.label}>Notas sobre o cliente</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Digite observações sobre o cliente..."
                />
              </div>
            </div>

            <div style={styles.crmSection} id="dados-pessoais">
              <h2 style={styles.crmSectionTitle}>Dados pessoais</h2>
              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Pessoa</label>
                  <select style={styles.lineSelect} defaultValue="FISICA">
                    <option value="FISICA">FÍSICA</option>
                    <option value="JURIDICA">JURÍDICA</option>
                  </select>
                </div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>CPF</label>
                  <input style={styles.lineInput} value={form.cpf} disabled />
                </div>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>RG</label>
                  <input style={styles.lineInput} value={form.rg} disabled />
                </div>
              </div>

              <div style={styles.rowDouble}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Estado Civil</label>
                  <select style={styles.lineSelect} defaultValue="">
                    <option value="">Selecione...</option>
                    <option value="SOLTEIRO">Solteiro(a)</option>
                    <option value="CASADO">Casado(a)</option>
                    <option value="DIVORCIADO">Divorciado(a)</option>
                    <option value="VIUVO">Viúvo(a)</option>
                  </select>
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Profissão</label>
                  <input style={styles.lineInput} placeholder="Profissão" />
                </div>
              </div>
            </div>

            <div style={styles.crmSection} id="endereco">
              <h2 style={styles.crmSectionTitle}>Endereço</h2>
              <div style={styles.rowDouble}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Endereço Residencial</label>
                  <input style={styles.lineInput} placeholder="Rua, avenida..." />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Número</label>
                  <input style={styles.lineInput} placeholder="Número" />
                </div>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Bairro</label>
                  <input style={styles.lineInput} placeholder="Bairro" />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Cidade</label>
                  <input style={styles.lineInput} placeholder="Cidade" />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>UF</label>
                  <input style={styles.lineInput} placeholder="SP" />
                </div>
              </div>
            </div>

            <div style={styles.actionRow}>
              {editingId && (
                <>
                  <button
                    type="button"
                    style={styles.createFinancingButton}
                    onClick={handleCreateFinancing}
                  >
                    Criar financiamento
                  </button>

                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={handleDelete}
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>

            <button type="submit" style={styles.floatingSaveButton}>
              💾
            </button>
          </form>
        </section>
      </div>

      {viewClient && (
        <div style={styles.quickOverlay} onClick={() => setViewClient(null)}>
          <div
            style={styles.quickModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.quickModalTop}>
              <button
                type="button"
                style={styles.quickBack}
                onClick={() => setViewClient(null)}
              >
                ←
              </button>

              <div style={styles.quickAvatar}>
                {getInitials(viewClient.fullName)}
              </div>

              <h2 style={styles.quickTitle}>{viewClient.fullName}</h2>

              <button
                type="button"
                style={styles.quickEdit}
                onClick={handleEditFromQuickView}
                title="Editar cliente"
              >
                ✎
              </button>
            </div>

            <div style={styles.quickContent}>
              <section style={styles.quickSection}>
                <h3 style={styles.quickSectionTitle}>Contato</h3>

                <div style={styles.quickLine}>
                  <span style={styles.quickIcon}>⌕</span>
                  <span>{viewClient.phone || "Telefone não informado"}</span>

                  {viewClient.phone && parseWhatsapp(viewClient.whatsapp) && (
                    <a
                      href={getWhatsAppLink(viewClient.phone)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.quickWhatsapp}
                    >
                      🟢
                    </a>
                  )}
                </div>

                {viewClient.email && (
                  <div style={styles.quickLine}>
                    <span style={styles.quickIcon}>✉</span>
                    <span>{viewClient.email}</span>
                  </div>
                )}
              </section>

              <section style={styles.quickSection}>
                <h3 style={styles.quickSectionTitle}>Categoria</h3>
                <div style={styles.quickValue}>
                  {viewClient.category || "Sem categoria"}
                </div>
              </section>

              <section style={styles.quickSection}>
                <h3 style={styles.quickSectionTitle}>Captador</h3>

                <div style={styles.quickCaptor}>
                  <div style={styles.quickCaptorAvatar}>
                    {getInitials(viewClient.createdBy?.name || viewClient.createdBy?.email)}
                  </div>

                  <div>
                    <strong>
                      {viewClient.createdBy?.name ||
                        viewClient.createdBy?.email ||
                        "Captador não informado"}
                    </strong>
                    <p style={styles.quickCaptorCompany}>JB Pessoa Imóveis</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {

  clientListCard: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    overflow: "hidden"
  },
  clientTableHeader: {
    display: "grid",
    gridTemplateColumns: "70px 2fr 1.7fr 1fr 1fr",
    alignItems: "center",
    gap: "18px",
    padding: "18px 24px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    fontWeight: "800",
    fontSize: "14px"
  },
  checkboxFake: {
    width: "22px",
    height: "22px",
    border: "2px solid #555",
    borderRadius: "2px"
  },
  clientTableRow: {
    display: "grid",
    gridTemplateColumns: "70px 2fr 1.7fr 1fr 1fr",
    alignItems: "center",
    gap: "18px",
    padding: "15px 24px",
    minHeight: "62px",
    cursor: "pointer",
    borderLeft: "4px solid transparent",
    transition: "0.2s ease"
  },
  clientTableRowActive: {
    borderLeft: "4px solid #1e88e5",
    backgroundColor: "#f8fafc"
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#d1d5db",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer"
  },
  clientNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#111827",
    fontSize: "15px"
  },
  homeMiniButton: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "15px",
    lineHeight: "20px"
  },
  captorCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#111827",
    fontSize: "14px"
  },
  captorAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#c9a227",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "13px"
  },
  dateCell: {
    color: "#374151",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },
  quickOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "70px",
    zIndex: 9999
  },
  quickModal: {
    width: "760px",
    maxWidth: "calc(100vw - 40px)",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 25px 70px rgba(15, 23, 42, 0.35)",
    overflow: "hidden"
  },
  quickModalTop: {
    height: "86px",
    display: "grid",
    gridTemplateColumns: "42px 70px 1fr 42px",
    alignItems: "center",
    gap: "14px",
    padding: "0 24px",
    borderBottom: "1px solid #e5e7eb"
  },
  quickBack: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: "28px",
    cursor: "pointer",
    color: "#555"
  },
  quickAvatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    backgroundColor: "#d1d5db",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700"
  },
  quickTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#333"
  },
  quickEdit: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: "28px",
    cursor: "pointer",
    color: "#666"
  },
  quickContent: {
    padding: "22px 30px 34px"
  },
  quickSection: {
    borderBottom: "1px solid #e5e7eb",
    padding: "0 0 20px",
    marginBottom: "22px"
  },
  quickSectionTitle: {
    fontSize: "17px",
    margin: "0 0 16px",
    color: "#111",
    fontWeight: "800"
  },
  quickLine: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    minHeight: "36px",
    color: "#111",
    fontSize: "15px",
    paddingLeft: "26px"
  },
  quickIcon: {
    width: "24px",
    color: "#777",
    fontSize: "22px"
  },
  quickWhatsapp: {
    textDecoration: "none",
    fontSize: "24px"
  },
  quickValue: {
    paddingLeft: "30px",
    fontSize: "15px",
    color: "#111",
    minHeight: "26px"
  },
  quickCaptor: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingLeft: "12px"
  },
  quickCaptorAvatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    backgroundColor: "#d1d5db",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "800"
  },
  quickCaptorCompany: {
    margin: "4px 0 0",
    color: "#888"
  },

  activitiesBox: {
    backgroundColor: "#fffdf8",
    border: "1px solid #e3d6b5",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "16px"
  },
  activitiesHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px"
  },
  activitiesTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#5d4a1f"
  },
  activitiesIcons: {
    display: "flex",
    gap: "12px",
    color: "#8b7a52",
    fontSize: "20px"
  },
  activityTextarea: {
    width: "100%",
    minHeight: "70px",
    border: "1px solid #d8c8a2",
    borderRadius: "8px",
    padding: "10px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fff"
  },
  activityButton: {
    width: "100%",
    marginTop: "8px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d4a62a",
    color: "#fff",
    padding: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  activitiesList: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "260px",
    overflowY: "auto"
  },
  activityItem: {
    backgroundColor: "#f0eee8",
    borderRadius: "10px",
    padding: "12px"
  },
  activityItemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "13px",
    color: "#6b5b34"
  },
  activityItemText: {
    margin: "8px 0",
    fontSize: "14px",
    color: "#222",
    lineHeight: 1.4
  },
  activityAuthor: {
    fontSize: "12px",
    color: "#7a6a47",
    fontWeight: "600"
  },
  emptyActivities: {
    color: "#c0b38f",
    textAlign: "center",
    padding: "30px 10px",
    fontSize: "14px"
  },
  thermometerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "14px",
    marginTop: "8px"
  },
  thermometerButton: {
    border: "none",
    borderRadius: "6px",
    minHeight: "46px",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer"
  },
  thermometerInactive: {
    backgroundColor: "#e5dcc1",
    color: "#8b7a52"
  },
  thermometerFRIO: {
    backgroundColor: "#60a5fa"
  },
  thermometerMORNO: {
    backgroundColor: "#86efac",
    color: "#14532d"
  },
  thermometerINTERESSADO: {
    backgroundColor: "#fde68a",
    color: "#78350f"
  },
  thermometerQUENTE: {
    backgroundColor: "#fdba74",
    color: "#7c2d12"
  },
  thermometerFECHAMENTO: {
    backgroundColor: "#f87171"
  },
  rightNav: {
    position: "fixed",
    right: "34px",
    top: "230px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    zIndex: 5
  },
  rightNavItem: {
    color: "#7a6a47",
    textDecoration: "none",
    fontSize: "16px",
    borderLeft: "3px solid transparent",
    paddingLeft: "12px",
    fontWeight: "600"
  },
  crmSection: {
    borderTop: "1px solid #eee2bf",
    marginTop: "38px",
    paddingTop: "30px"
  },
  crmSectionTitle: {
    margin: "0 0 26px 0",
    fontSize: "28px",
    fontWeight: "500",
    color: "#111"
  },
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
    backgroundColor: "#fffdf8",
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
  clientResponsible: {
    color: "#a16207",
    fontSize: "13px",
    marginTop: "6px",
    fontWeight: "600"
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
  lineSelect: {
    border: "none",
    borderBottom: "1px solid #d8c8a2",
    padding: "8px 0 10px 0",
    fontSize: "18px",
    outline: "none",
    backgroundColor: "transparent"
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    border: "1px solid #d8c8a2",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    outline: "none",
    backgroundColor: "#fffdf8",
    resize: "vertical",
    boxSizing: "border-box"
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
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingTop: "10px"
  },
  statusTextLeft: {
    fontSize: "16px",
    color: "#000"
  },
  statusTextRight: {
    fontSize: "16px",
    color: "#000"
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "12px",
    marginTop: "10px"
  },
  createFinancingButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "700"
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