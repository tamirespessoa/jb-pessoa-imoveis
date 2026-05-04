import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Owners() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [viewOwner, setViewOwner] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newActivityText, setNewActivityText] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [screenMode, setScreenMode] = useState("list");

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
    whatsapp: false,
    category: "PROPRIETARIO",
    firstContact: "",
    isActive: true,
    notes: "",
    createReminder: false,
    businessTemperature: "FRIO",
    activities: [],
    createdById: user.id || user.userId || ""
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

  function formatDateTime(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("pt-BR");
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

  function getCaptadorName(person) {
    const captadorId =
      person?.createdById ||
      person?.createdBy?.id ||
      person?.captadorId ||
      person?.captorId ||
      "";

    const captadorFromUsers = users.find((item) => item.id === captadorId);

    return (
      person?.createdBy?.name ||
      captadorFromUsers?.name ||
      captadorFromUsers?.email ||
      person?.captadorName ||
      person?.captorName ||
      person?.createdBy?.email ||
      "Captador não informado"
    );
  }

  function getSelectedCaptadorName() {
    const selected = users.find((item) => item.id === form.createdById);

    return (
      selected?.name ||
      selected?.email ||
      getCaptadorName(selectedOwner) ||
      user.name ||
      user.fullName ||
      user.email ||
      "Captador não informado"
    );
  }

  async function loadUsers() {
    try {
      const response = await api.get("/users");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.users || [];

      setUsers(data);
    } catch (error) {
      console.error(
        "Erro ao carregar usuários/captadores:",
        error.response?.data || error.message
      );
      setUsers([]);
    }
  }

  async function loadProperties() {
    try {
      const response = await api.get("/properties");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.properties || [];

      setProperties(data);
    } catch (error) {
      console.error(
        "Erro ao carregar imóveis do proprietário:",
        error.response?.data || error.message
      );
      setProperties([]);
    }
  }

  async function loadOwners(selectId = null) {
    try {
      const response = await api.get("/persons");
      const filtered = (response.data || []).filter(
        (item) => item.type === "PROPRIETARIO"
      );

      setOwners(filtered);

      if (selectId) {
        const found = filtered.find((item) => item.id === selectId);
        if (found) {
          handleSelectOwner(found);
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar proprietários:",
        error.response?.data || error.message
      );

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        error.message ||
        "Não foi possível carregar os proprietários.";

      alert(`Erro ao carregar proprietários:\n${apiMessage}`);
      setOwners([]);
      setSelectedOwner(null);
      setEditingId(null);
    }
  }

  useEffect(() => {
    loadUsers();
    loadOwners();
    loadProperties();
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
    return owners
      .filter((owner) => {
        if (showOnlyActive && owner.isActive === false) return false;
        if (!showArchived && owner.archived === true) return false;
        return true;
      })
      .filter((owner) =>
        `${owner.fullName || ""} ${owner.cpf || ""} ${owner.email || ""} ${
          owner.phone || ""
        } ${owner.createdBy?.name || ""} ${owner.category || ""} ${
          owner.firstContact || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [owners, search, showOnlyActive, showArchived]);

  function fillFormFromOwner(owner) {
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
      whatsapp: parseWhatsapp(owner.whatsapp),
      category: owner.category || "",
      firstContact: owner.firstContact || "",
      isActive:
        owner.isActive !== undefined && owner.isActive !== null
          ? Boolean(owner.isActive)
          : true,
      notes: owner.notes || "",
      createReminder:
        owner.createReminder !== undefined && owner.createReminder !== null
          ? Boolean(owner.createReminder)
          : false,
      businessTemperature: owner.businessTemperature || "FRIO",
      activities: Array.isArray(owner.activities) ? owner.activities : [],
      createdById: owner.createdById || owner.createdBy?.id || user.id || user.userId || ""
    });
  }

  function handleSelectOwner(owner) {
    setSelectedOwner(owner);
    setEditingId(owner.id);
    fillFormFromOwner(owner);
    setScreenMode("form");
  }

  function handleOpenQuickView(owner) {
    setViewOwner(owner);
  }

  function handleEditFromQuickView() {
    if (!viewOwner) return;

    handleSelectOwner(viewOwner);
    setViewOwner(null);
  }

  function handleBackToList() {
    setScreenMode("list");
    setShowMenu(false);
  }

  function handleNewOwner() {
    setSelectedOwner(null);
    setEditingId(null);
    setShowMenu(false);
    setScreenMode("form");

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
      whatsapp: false,
      category: "PROPRIETARIO",
      firstContact: "",
      isActive: true,
      notes: "",
      createReminder: false,
      businessTemperature: "FRIO",
      activities: [],
      createdById: user.id || user.userId || ""
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
        type: "PROPRIETARIO",
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
        activities: Array.isArray(form.activities) ? form.activities : [],
        createdById: normalizeString(form.createdById)
      };

      if (editingId) {
        const response = await api.put(`/persons/${editingId}`, payload);
        const updatedOwner = response.data?.person || response.data || null;
        alert("Ownere atualizado com sucesso.");
        await loadOwners(updatedOwner?.id || editingId);
      } else {
        const response = await api.post("/persons", payload);
        const createdId = response.data?.person?.id || response.data?.id || null;
        alert("Ownere cadastrado com sucesso.");
        await loadOwners(createdId);
      }
    } catch (error) {
      console.error(
        "Erro ao salvar proprietário:",
        error.response?.data || error.message
      );

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        JSON.stringify(error.response?.data) ||
        error.message;

      alert(`Erro ao salvar proprietário:\n${apiMessage}`);
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
      alert("Ownere excluído com sucesso.");
      setSelectedOwner(null);
      setEditingId(null);
      setScreenMode("list");
      await loadOwners();
    } catch (error) {
      console.error(
        "Erro ao excluir proprietário:",
        error.response?.data || error.message
      );

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erro ao excluir proprietário.";

      alert(apiMessage);
    }
  }

  function handleOpenLinkedProperties() {
    setShowMenu(false);
    navigate("/imoveis");
  }

  function handleBack() {
    if (screenMode === "form") {
      handleBackToList();
      return;
    }

    navigate("/dashboard");
  }

  async function handleRefresh() {
    await loadOwners(editingId || null);
  }

  function handlePrint() {
    if (!selectedOwner) {
      window.print();
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
          <title>Ownere - ${selectedOwner.fullName}</title>
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
          <p><strong>WhatsApp:</strong> ${
            parseWhatsapp(selectedOwner.whatsapp) ? "Sim" : "Não"
          }</p>
          <p><strong>Categoria:</strong> ${selectedOwner.category || "-"}</p>
          <p><strong>Primeiro contato:</strong> ${selectedOwner.firstContact || "-"}</p>
          <p><strong>Situação:</strong> ${
            selectedOwner.isActive ? "Ativo" : "Inativo"
          }</p>
          <p><strong>Termômetro:</strong> ${
            selectedOwner.businessTemperature || "-"
          }</p>
          <p><strong>Notas:</strong> ${selectedOwner.notes || "-"}</p>
          <p><strong>Captador:</strong> ${
            selectedOwner.createdBy?.name || selectedOwner.createdBy?.email || "-"
          }</p>
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
Ownere: ${selectedOwner.fullName}
Código: ${selectedOwner.id}
CPF: ${selectedOwner.cpf || "-"}
Telefone: ${selectedOwner.phone || "-"}
E-mail: ${selectedOwner.email || "-"}
Categoria: ${selectedOwner.category || "-"}
Primeiro contato: ${selectedOwner.firstContact || "-"}
Situação: ${selectedOwner.isActive ? "Ativo" : "Inativo"}
Termômetro: ${selectedOwner.businessTemperature || "-"}
Captador: ${selectedOwner.createdBy?.name || selectedOwner.createdBy?.email || "-"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo do proprietário copiado.");
    } catch (error) {
      console.error("Erro ao copiar resumo:", error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function handleOpenHistory() {
    setShowMenu(false);

    if (!selectedOwner) {
      alert("Selecione um proprietário primeiro.");
      return;
    }

    alert(`Histórico de atendimentos do proprietário: ${selectedOwner.fullName}`);
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

  function handleOpenOwnerProperties() {
    setShowMenu(false);
    navigate("/imoveis");
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
      activities: [
        activity,
        ...(Array.isArray(prev.activities) ? prev.activities : [])
      ]
    }));

    setNewActivityText("");
  }

  function formatCurrency(value) {
    const number = Number(value || 0);

    if (!number) return "Valor não informado";

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getPropertyAddress(property) {
    return [
      property.address,
      property.street,
      property.number,
      property.neighborhood,
      property.city,
      property.state
    ]
      .filter(Boolean)
      .join(", ");
  }

  function getOwnerProperties() {
    if (!selectedOwner) return [];

    return properties.filter((property) => {
      const ids = [
        property.ownerId,
        property.personId,
        property.proprietarioId,
        property.owner?.id,
        property.person?.id,
        property.proprietario?.id
      ]
        .filter(Boolean)
        .map(String);

      const ownerName =
        property.ownerName ||
        property.owner?.fullName ||
        property.person?.fullName ||
        property.proprietario?.fullName ||
        "";

      return (
        ids.includes(String(selectedOwner.id)) ||
        ownerName.toLowerCase() === String(selectedOwner.fullName || "").toLowerCase()
      );
    });
  }

  function renderTopBar() {
    return (
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button type="button" style={styles.backButton} onClick={handleBack}>
            ←
          </button>

          <span style={styles.topBarTitle}>
            {screenMode === "list"
              ? "Owneres"
              : selectedOwner
              ? `${selectedOwner.fullName} (Código: ${selectedOwner.id})`
              : "Novo proprietário"}
          </span>
        </div>

        <div style={styles.topBarRight} ref={menuRef}>
          {screenMode === "list" && (
            <button type="button" style={styles.topIcon} onClick={handleNewOwner}>
              +
            </button>
          )}

          <button type="button" style={styles.topIcon} onClick={handlePrint}>
            🖨
          </button>

          <button type="button" style={styles.topIcon} onClick={handleRefresh}>
            ↻
          </button>

          {screenMode === "form" && (
            <>
              <button type="button" style={styles.topIcon} onClick={handleShare}>
                ⤴
              </button>

              <button
                type="button"
                style={styles.topIcon}
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>
            </>
          )}

          {showMenu && (
            <div style={styles.dropdownMenu}>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenLinkedProperties}
              >
                Imóveis vinculados
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
                Documentos do proprietário
              </button>

              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenOwnerProperties}
              >
                Imóveis do proprietário
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderListScreen() {
    return (
      <div style={styles.listScreen}>
        <div style={styles.listHeaderArea}>
          <h1 style={styles.listTitle}>Últimos proprietários cadastrados</h1>

          <div style={styles.listOptions}>
            <strong>Opções:</strong>

            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(event) => setShowOnlyActive(event.target.checked)}
              />
              <span>Somente Ativos</span>
            </label>

            <label style={styles.optionLabelMuted}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              <span>Arquivados</span>
            </label>
          </div>
        </div>

        <div style={styles.listSearchRow}>
          <input
            style={styles.listSearch}
            placeholder="Pesquise por nome, e-mail, telefone, CPF ou CNPJ"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button type="button" style={styles.newOwnerButtonList} onClick={handleNewOwner}>
            + Novo proprietário
          </button>
        </div>

        <div style={styles.ownerListCard}>
          <div style={styles.ownerTableHeader}>
            <div style={styles.checkboxFake}></div>
            <div>Nome / Empresa</div>
            <div>Captador</div>
            <div>Data Cadastro</div>
            <div>Data Atualização</div>
          </div>

          {filteredOwners.length === 0 ? (
            <div style={styles.emptyListMessage}>Nenhum proprietário encontrado</div>
          ) : (
            filteredOwners.map((owner) => (
              <div
                key={owner.id}
                onClick={() => handleSelectOwner(owner)}
                style={{
                  ...styles.ownerTableRow,
                  ...(selectedOwner?.id === owner.id
                    ? styles.ownerTableRowActive
                    : {})
                }}
              >
                <div
                  style={styles.avatar}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenQuickView(owner);
                  }}
                  title="Ver informações básicas"
                >
                  {getInitials(owner.fullName)}
                </div>

                <div style={styles.ownerNameCell}>
                  <strong>{owner.fullName}</strong>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenQuickView(owner);
                    }}
                    style={styles.homeMiniButton}
                    title="Informações rápidas"
                  >
                    ⌂
                  </button>
                </div>

                <div style={styles.captorCell}>
                  <div style={styles.captorAvatar}>
                    {getInitials(owner.createdBy?.name || owner.createdBy?.email)}
                  </div>

                  <span>
                    {owner.createdBy?.name ||
                      owner.createdBy?.email ||
                      "Captador não informado"}
                  </span>
                </div>

                <div style={styles.dateCell}>◷ {formatDate(owner.createdAt)}</div>
                <div style={styles.dateCell}>↻ {formatDate(owner.updatedAt)}</div>
              </div>
            ))
          )}
        </div>

        <div style={styles.listFooter}>
          <strong>{filteredOwners.length}</strong> proprietários encontrados
        </div>
      </div>
    );
  }

  function renderActivityPanel() {
    return (
      <div style={styles.activitiesBox} id="atividades">
        <div style={styles.activitiesHeader}>
          <h3 style={styles.activitiesTitle}>Anotações e atividades</h3>

          <div style={styles.activitiesIcons}>
            <span title="Filtrar">⏷</span>

            <span title="Atualizar" onClick={handleRefresh} style={styles.iconClickable}>
              ↻
            </span>

            <span title="Adicionar" onClick={handleAddActivity} style={styles.iconClickable}>
              ⊕
            </span>
          </div>
        </div>

        <textarea
          value={newActivityText}
          onChange={(event) => setNewActivityText(event.target.value)}
          style={styles.activityTextarea}
          placeholder="Digite uma anotação ou atividade..."
        />

        <button type="button" onClick={handleAddActivity} style={styles.activityButton}>
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
                  👤 {activity.createdBy || getCaptadorName(selectedOwner)}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyActivities}>Ownere sem anotações ou atividades</div>
          )}
        </div>
      </div>
    );
  }

  function renderFormScreen() {
    return (
      <div style={styles.formLayout}>
        <aside style={styles.formLeftPanel}>
          {renderActivityPanel()}

          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>
              {user.role === "ADMIN" ? "Owneres cadastrados" : "Meus proprietários"}
            </h3>

            <div style={styles.leftIcons}>
              <span>⏷</span>

              <span onClick={handleRefresh} style={styles.iconClickable}>
                ↻
              </span>

              <span onClick={handleNewOwner} style={styles.iconClickable}>
                ⊕
              </span>
            </div>
          </div>

          <input
            style={styles.searchInput}
            placeholder="Buscar proprietário por nome, CPF, e-mail ou captador"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button type="button" style={styles.newOwnerButton} onClick={handleNewOwner}>
            + Novo proprietário
          </button>

          <button type="button" style={styles.backToListButton} onClick={handleBackToList}>
            Ver lista completa
          </button>

          <div style={styles.sideList}>
            {filteredOwners.length === 0 ? (
              <div style={styles.emptyNotes}>Nenhum proprietário encontrado</div>
            ) : (
              filteredOwners.slice(0, 20).map((owner) => (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => handleSelectOwner(owner)}
                  style={{
                    ...styles.sideItem,
                    ...(selectedOwner?.id === owner.id ? styles.sideItemActive : {})
                  }}
                >
                  <strong>{owner.fullName}</strong>

                  <div style={styles.sideItemMeta}>CPF: {owner.cpf || "-"}</div>

                  <div style={styles.sideItemMeta}>{owner.phone || "-"}</div>

                  <div style={styles.sideResponsible}>
                    Captador: {getCaptadorName(owner)}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section style={styles.mainPanel}>
          <div style={styles.rightNav}>
            <a href="#cadastro" style={styles.rightNavItem}>
              Cadastro
            </a>
            <a href="#imoveis-proprietario" style={styles.rightNavItem}>
              Imóveis
            </a>
            <a href="#atividades" style={styles.rightNavItem}>
              Atividades
            </a>
            <a href="#dados-pessoais" style={styles.rightNavItem}>
              D. pessoais
            </a>
            <a href="#endereco" style={styles.rightNavItem}>
              Endereço
            </a>
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
                <select
                  name="createdById"
                  value={form.createdById || ""}
                  onChange={handleChange}
                  style={styles.lineSelect}
                >
                  <option value="">
                    {getSelectedCaptadorName()}
                  </option>

                  {users.map((captador) => (
                    <option key={captador.id} value={captador.id}>
                      {captador.name || captador.email}
                    </option>
                  ))}
                </select>
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
                  <option value="PROPRIETARIO">PROPRIETÁRIO(A)</option>
                  <option value="INTERESSADO">INTERESSADO(A)</option>
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
                <label style={styles.label}>Criar aviso na agenda para retorno</label>

                <div style={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    name="createReminder"
                    checked={form.createReminder}
                    onChange={handleChange}
                  />
                  <span style={styles.checkboxLabel}>Criar retorno automático</span>
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
                <label style={styles.label}>Notas sobre o proprietário</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Digite observações sobre o proprietário..."
                />
              </div>
            </div>

            <div style={styles.cleanSection} id="imoveis-proprietario">
              <h2 style={styles.cleanSectionTitle}>Imóveis do proprietário</h2>

              {getOwnerProperties().length === 0 ? (
                <div style={styles.emptyPropertyBox}>
                  <div style={styles.propertyIconLarge}>⌂</div>
                  <div>
                    <strong>Nenhum imóvel vinculado a este proprietário</strong>
                    <p style={styles.emptyPropertyText}>
                      Você pode cadastrar ou vincular um imóvel para este proprietário.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={styles.propertyListClean}>
                  {getOwnerProperties().map((property) => (
                    <div key={property.id} style={styles.propertyCleanItem}>
                      <div style={styles.propertyIconLarge}>⌂</div>

                      <div style={styles.propertyCleanInfo}>
                        <strong style={styles.propertyCleanTitle}>
                          {String(property.type || "IMÓVEL").toUpperCase()} -{" "}
                          <span style={styles.propertyPrice}>
                            {formatCurrency(property.price || property.salePrice || property.value)}
                          </span>
                        </strong>

                        <p style={styles.propertyAddress}>
                          {getPropertyAddress(property) || "Endereço não informado"}
                        </p>

                        <p style={styles.propertyDetails}>
                          {property.area ? `${property.area} m²` : ""}
                          {property.bedrooms ? `  ${property.bedrooms} Quartos` : ""}
                          {property.bathrooms ? `  ${property.bathrooms} Banheiros` : ""}
                          {property.parkingSpaces || property.garage
                            ? `  ${property.parkingSpaces || property.garage} Vaga(s)`
                            : ""}
                        </p>
                      </div>

                      <span style={styles.propertyCodeBadge}>
                        🏠 {property.reference || property.code || property.id?.slice(0, 6)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.propertyActionsClean}>
                <button
                  type="button"
                  style={styles.propertyActionButton}
                  onClick={() => navigate("/imoveis")}
                >
                  + CADASTRAR IMÓVEL
                </button>

                <button
                  type="button"
                  style={styles.propertyActionButton}
                  onClick={() => alert("Convite para cadastro será ligado depois.")}
                >
                  ✉ ENVIAR CONVITE PARA CADASTRO
                </button>

                <span style={styles.newBadge}>NOVO</span>
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
                    style={styles.linkedPropertiesButton}
                    onClick={handleOpenLinkedProperties}
                  >
                    Imóveis vinculados
                  </button>

                  <button type="button" style={styles.deleteButton} onClick={handleDelete}>
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
    );
  }

  function renderQuickModal() {
    if (!viewOwner) return null;

    return (
      <div style={styles.quickOverlay} onClick={() => setViewOwner(null)}>
        <div style={styles.quickModal} onClick={(event) => event.stopPropagation()}>
          <div style={styles.quickModalTop}>
            <button type="button" style={styles.quickBack} onClick={() => setViewOwner(null)}>
              ←
            </button>

            <div style={styles.quickAvatar}>{getInitials(viewOwner.fullName)}</div>

            <h2 style={styles.quickTitle}>{viewOwner.fullName}</h2>

            <button
              type="button"
              style={styles.quickEdit}
              onClick={handleEditFromQuickView}
              title="Editar proprietário"
            >
              ✎
            </button>
          </div>

          <div style={styles.quickContent}>
            <section style={styles.quickSection}>
              <h3 style={styles.quickSectionTitle}>Contato</h3>

              <div style={styles.quickLine}>
                <span style={styles.quickIcon}>☎</span>
                <span>{viewOwner.phone || "Telefone não informado"}</span>

                {viewOwner.phone && parseWhatsapp(viewOwner.whatsapp) && (
                  <a
                    href={getWhatsAppLink(viewOwner.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.quickWhatsapp}
                  >
                    🟢
                  </a>
                )}
              </div>

              {viewOwner.email && (
                <div style={styles.quickLine}>
                  <span style={styles.quickIcon}>✉</span>
                  <span>{viewOwner.email}</span>
                </div>
              )}
            </section>

            <section style={styles.quickSection}>
              <h3 style={styles.quickSectionTitle}>Categoria</h3>
              <div style={styles.quickValue}>{viewOwner.category || "Sem categoria"}</div>
            </section>

            <section style={styles.quickSection}>
              <h3 style={styles.quickSectionTitle}>Captador</h3>

              <div style={styles.quickCaptor}>
                <div style={styles.quickCaptorAvatar}>
                  {getInitials(viewOwner.createdBy?.name || viewOwner.createdBy?.email)}
                </div>

                <div>
                  <strong>
                    {viewOwner.createdBy?.name ||
                      viewOwner.createdBy?.email ||
                      "Captador não informado"}
                  </strong>
                  <p style={styles.quickCaptorCompany}>JB Pessoa Imóveis</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {renderTopBar()}
      {screenMode === "list" ? renderListScreen() : renderFormScreen()}
      {renderQuickModal()}
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#eeeeee",
    minHeight: "100vh",
    position: "relative",
    margin: 0
  },
  topBar: {
    height: "54px",
    backgroundColor: "#1e88e5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    color: "#fff",
    position: "relative",
    boxShadow: "0 2px 6px rgba(0,0,0,0.22)"
  },
  topBarLeft: {
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
  topBarTitle: {
    fontSize: "20px",
    fontWeight: "600"
  },
  topBarRight: {
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
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
    zIndex: 20
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    backgroundColor: "#fff",
    padding: "14px 16px",
    fontSize: "15px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  },
  listScreen: {
    width: "100%",
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "26px 20px 70px",
    boxSizing: "border-box"
  },
  listHeaderArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "30px"
  },
  listTitle: {
    fontSize: "34px",
    fontWeight: "400",
    color: "#111",
    margin: 0
  },
  listOptions: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    fontSize: "15px"
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  optionLabelMuted: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#999",
    cursor: "pointer"
  },
  listSearchRow: {
    display: "flex",
    gap: "14px",
    marginBottom: "18px"
  },
  listSearch: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    padding: "12px 16px",
    fontSize: "15px",
    outline: "none"
  },
  newOwnerButtonList: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d4a62a",
    color: "#fff",
    padding: "0 22px",
    fontWeight: "800",
    cursor: "pointer"
  },
  ownerListCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
    overflow: "hidden"
  },
  ownerTableHeader: {
    display: "grid",
    gridTemplateColumns: "72px 2fr 1.7fr 1fr 1fr",
    alignItems: "center",
    gap: "18px",
    padding: "24px 24px",
    borderBottom: "1px solid #ddd",
    color: "#000",
    fontWeight: "800",
    fontSize: "15px"
  },
  checkboxFake: {
    width: "22px",
    height: "22px",
    border: "2px solid #555",
    borderRadius: "2px",
    marginLeft: "12px"
  },
  ownerTableRow: {
    display: "grid",
    gridTemplateColumns: "72px 2fr 1.7fr 1fr 1fr",
    alignItems: "center",
    gap: "18px",
    padding: "17px 24px",
    minHeight: "66px",
    cursor: "pointer",
    borderLeft: "4px solid transparent",
    transition: "0.2s ease",
    backgroundColor: "#fff"
  },
  ownerTableRowActive: {
    borderLeft: "4px solid #1e88e5",
    backgroundColor: "#fbfbfb"
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#d1d5db",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "500",
    fontSize: "17px",
    cursor: "pointer",
    marginLeft: "8px"
  },
  ownerNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#111",
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
    color: "#111",
    fontSize: "15px"
  },
  captorAvatar: {
    width: "40px",
    height: "40px",
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
    color: "#111",
    fontSize: "15px",
    whiteSpace: "nowrap"
  },
  emptyListMessage: {
    padding: "50px",
    textAlign: "center",
    color: "#777"
  },
  listFooter: {
    height: "42px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "16px",
    color: "#333"
  },
  formLayout: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    minHeight: "calc(100vh - 54px)"
  },
  formLeftPanel: {
    backgroundColor: "#fbf7ef",
    borderRight: "1px solid #eeeeee",
    padding: "18px 14px",
    boxSizing: "border-box"
  },
  activitiesBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #eeeeee",
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
  iconClickable: {
    cursor: "pointer"
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
  searchInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd1af",
    borderRadius: "8px",
    boxSizing: "border-box",
    marginBottom: "12px",
    backgroundColor: "#fffdf8"
  },
  newOwnerButton: {
    width: "100%",
    border: "1px solid #d4a62a",
    backgroundColor: "#ffffff",
    color: "#b58712",
    borderRadius: "8px",
    padding: "10px 12px",
    cursor: "pointer",
    marginBottom: "10px",
    fontWeight: "bold"
  },
  backToListButton: {
    width: "100%",
    border: "none",
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: "8px",
    padding: "10px 12px",
    cursor: "pointer",
    marginBottom: "14px",
    fontWeight: "bold"
  },
  sideList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "calc(100vh - 390px)",
    overflowY: "auto"
  },
  sideItem: {
    border: "1px solid #eeeeee",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer"
  },
  sideItemActive: {
    border: "2px solid #d4a62a",
    backgroundColor: "#fff7df"
  },
  sideItemMeta: {
    color: "#7a6a47",
    fontSize: "14px",
    marginTop: "4px"
  },
  sideResponsible: {
    color: "#a16207",
    fontSize: "13px",
    marginTop: "6px",
    fontWeight: "600"
  },
  emptyNotes: {
    color: "#c0b38f",
    textAlign: "center",
    padding: "40px 20px"
  },
  mainPanel: {
    backgroundColor: "#ffffff",
    padding: "26px 150px 26px 34px",
    position: "relative",
    overflowX: "hidden"
  },
  rightNav: {
    position: "sticky",
    float: "right",
    right: "10px",
    top: "90px",
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
    backgroundColor: "#ffffff",
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
  actionRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "12px",
    marginTop: "10px"
  },
  linkedPropertiesButton: {
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

  cleanSection: {
    borderTop: "1px solid #eeeeee",
    marginTop: "42px",
    paddingTop: "34px",
    paddingBottom: "34px"
  },
  cleanSectionTitle: {
    margin: "0 0 28px 0",
    fontSize: "30px",
    fontWeight: "400",
    color: "#111"
  },
  emptyPropertyBox: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    padding: "22px 18px",
    color: "#777",
    borderBottom: "1px solid #eeeeee"
  },
  emptyPropertyText: {
    margin: "6px 0 0",
    color: "#999"
  },
  propertyListClean: {
    display: "flex",
    flexDirection: "column"
  },
  propertyCleanItem: {
    display: "grid",
    gridTemplateColumns: "90px 1fr auto",
    alignItems: "center",
    gap: "24px",
    padding: "22px 18px",
    borderBottom: "1px solid #eeeeee"
  },
  propertyIconLarge: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    backgroundColor: "#d1d1d1",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    fontWeight: "700"
  },
  propertyCleanInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  propertyCleanTitle: {
    fontSize: "16px",
    color: "#7a7a7a"
  },
  propertyPrice: {
    color: "#1e88e5",
    fontWeight: "800"
  },
  propertyAddress: {
    margin: 0,
    color: "#111",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  propertyDetails: {
    margin: 0,
    color: "#111",
    fontSize: "14px"
  },
  propertyCodeBadge: {
    backgroundColor: "#90caf9",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "8px 10px",
    fontWeight: "700",
    fontSize: "13px"
  },
  propertyActionsClean: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "34px",
    padding: "28px 0",
    borderBottom: "1px solid #eeeeee"
  },
  propertyActionButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#1e88e5",
    fontSize: "15px",
    cursor: "pointer",
    letterSpacing: "0.3px"
  },
  newBadge: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "800"
  },

};

export default Owners;
