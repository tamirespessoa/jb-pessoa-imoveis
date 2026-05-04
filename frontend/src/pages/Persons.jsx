import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Persons() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [persons, setPersons] = useState([]);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [viewPerson, setViewPerson] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [screenMode, setScreenMode] = useState("list");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
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
    activities: [],
    createdById: user.id || user.userId || ""
  });

  function emptyForm(type = "CLIENTE") {
    return {
      type,
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
      category: type === "PROPRIETARIO" ? "PROPRIETARIO" : "",
      firstContact: "",
      isActive: true,
      notes: "",
      createReminder: false,
      businessTemperature: "FRIO",
      activities: [],
      createdById: user.id || user.userId || ""
    };
  }

  function normalizeString(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }

  function parseWhatsapp(value) {
    return (
      value === true ||
      value === "true" ||
      value === "Sim" ||
      value === "sim" ||
      value === 1 ||
      value === "1"
    );
  }

  function getInitials(name) {
    const value = String(name || "").trim();
    if (!value) return "?";
    const parts = value.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
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

  function formatCurrency(value) {
    const number = Number(value || 0);
    if (!number) return "Valor não informado";
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getWhatsAppLink(phone) {
    const numbers = String(phone || "").replace(/\D/g, "");
    if (!numbers) return "";
    const finalNumber = numbers.startsWith("55") ? numbers : `55${numbers}`;
    return `https://wa.me/${finalNumber}`;
  }

  function getPersonTypeLabel(type) {
    if (type === "CLIENTE") return "Cliente";
    if (type === "PROPRIETARIO") return "Proprietário";
    if (type === "AMBOS") return "Cliente + Proprietário";
    return "Não informado";
  }

  function getTypeBadgeStyle(type) {
    if (type === "CLIENTE") return styles.clientBadge;
    if (type === "PROPRIETARIO") return styles.ownerBadge;
    if (type === "AMBOS") return styles.bothBadge;
    return styles.neutralBadge;
  }

  function getTemperatureStyle(value) {
    const temperature = String(value || "FRIO").toUpperCase();
    if (temperature === "QUENTE") return styles.tempHot;
    if (temperature === "MORNO") return styles.tempWarm;
    return styles.tempCold;
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
      getCaptadorName(selectedPerson) ||
      user.name ||
      user.fullName ||
      user.email ||
      "Captador não informado"
    );
  }

  function getPropertyAddress(property) {
    return [
      property.address,
      property.street,
      property.number,
      property.neighborhood,
      property.district,
      property.city,
      property.state
    ]
      .filter(Boolean)
      .join(", ");
  }

  function getLinkedProperties(person = selectedPerson) {
    if (!person) return [];

    return properties.filter((property) => {
      const ids = [
        property.ownerId,
        property.clientId,
        property.buyerId,
        property.personId,
        property.proprietarioId,
        property.owner?.id,
        property.client?.id,
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
        ids.includes(String(person.id)) ||
        ownerName.toLowerCase() === String(person.fullName || "").toLowerCase()
      );
    });
  }

  async function loadUsers() {
    try {
      const response = await api.get("/users");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.users || [];
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar captadores:", error.response?.data || error.message);
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
      console.error("Erro ao carregar imóveis:", error.response?.data || error.message);
      setProperties([]);
    }
  }

  async function loadPersons(selectId = null) {
    try {
      const response = await api.get("/persons");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.persons || [];

      setPersons(data);

      if (selectId) {
        const found = data.find((item) => item.id === selectId);
        if (found) handleSelectPerson(found);
      }
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error.response?.data || error.message);
      alert("Erro ao carregar clientes e proprietários.");
      setPersons([]);
    }
  }

  useEffect(() => {
    loadUsers();
    loadPersons();
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

  const counters = useMemo(() => {
    return {
      total: persons.length,
      clients: persons.filter((item) => item.type === "CLIENTE" || item.type === "AMBOS").length,
      owners: persons.filter((item) => item.type === "PROPRIETARIO" || item.type === "AMBOS").length,
      both: persons.filter((item) => item.type === "AMBOS").length
    };
  }, [persons]);

  const filteredPersons = useMemo(() => {
    return persons
      .filter((person) => {
        if (showOnlyActive && person.isActive === false) return false;
        if (!showArchived && person.archived === true) return false;

        if (typeFilter === "CLIENTES") {
          return person.type === "CLIENTE" || person.type === "AMBOS";
        }

        if (typeFilter === "PROPRIETARIOS") {
          return person.type === "PROPRIETARIO" || person.type === "AMBOS";
        }

        if (typeFilter === "AMBOS") {
          return person.type === "AMBOS";
        }

        return true;
      })
      .filter((person) =>
        `${person.fullName || ""} ${person.cpf || ""} ${person.email || ""} ${
          person.phone || ""
        } ${person.createdBy?.name || ""} ${person.category || ""} ${
          person.firstContact || ""
        } ${person.type || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [persons, search, showOnlyActive, showArchived, typeFilter]);

  function fillFormFromPerson(person) {
    setForm({
      type: person.type || "CLIENTE",
      fullName: person.fullName || "",
      cpf: person.cpf || "",
      rg: person.rg || "",
      phone: person.phone || "",
      email: person.email || "",
      company: person.company || "",
      commercialPhone: person.commercialPhone || "",
      residentialPhone: person.residentialPhone || "",
      contactPhone: person.contactPhone || "",
      whatsapp: parseWhatsapp(person.whatsapp),
      category: person.category || "",
      firstContact: person.firstContact || "",
      isActive:
        person.isActive !== undefined && person.isActive !== null
          ? Boolean(person.isActive)
          : true,
      notes: person.notes || "",
      createReminder:
        person.createReminder !== undefined && person.createReminder !== null
          ? Boolean(person.createReminder)
          : false,
      businessTemperature: person.businessTemperature || "FRIO",
      activities: Array.isArray(person.activities) ? person.activities : [],
      createdById: person.createdById || person.createdBy?.id || user.id || user.userId || ""
    });
  }

  function handleSelectPerson(person) {
    setSelectedPerson(person);
    setEditingId(person.id);
    fillFormFromPerson(person);
    setScreenMode("form");
  }

  function handleOpenQuickView(person) {
    setViewPerson(person);
  }

  function handleEditFromQuickView() {
    if (!viewPerson) return;
    handleSelectPerson(viewPerson);
    setViewPerson(null);
  }

  function handleBackToList() {
    setScreenMode("list");
    setShowMenu(false);
  }

  function handleNewPerson(defaultType = "CLIENTE") {
    setSelectedPerson(null);
    setEditingId(null);
    setShowMenu(false);
    setScreenMode("form");
    setForm(emptyForm(defaultType));
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
        type: form.type || "CLIENTE",
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
        const updatedPerson = response.data?.person || response.data || null;
        alert("Cadastro atualizado com sucesso.");
        await loadPersons(updatedPerson?.id || editingId);
      } else {
        const response = await api.post("/persons", payload);
        const createdId = response.data?.person?.id || response.data?.id || null;
        alert("Cadastro criado com sucesso.");
        await loadPersons(createdId);
      }

      await loadProperties();
    } catch (error) {
      console.error("Erro ao salvar cadastro:", error.response?.data || error.message);

      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details ||
        JSON.stringify(error.response?.data) ||
        error.message;

      alert(`Erro ao salvar cadastro:\n${apiMessage}`);
    }
  }

  async function handleDelete() {
    if (!editingId) {
      alert("Selecione um cadastro para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir este cadastro?");
    if (!confirmed) return;

    try {
      await api.delete(`/persons/${editingId}`);
      alert("Cadastro excluído com sucesso.");
      setSelectedPerson(null);
      setEditingId(null);
      setScreenMode("list");
      await loadPersons();
    } catch (error) {
      console.error("Erro ao excluir cadastro:", error.response?.data || error.message);
      alert("Erro ao excluir cadastro.");
    }
  }

  function handleBack() {
    if (screenMode === "form") {
      handleBackToList();
      return;
    }

    navigate("/dashboard");
  }

  async function handleRefresh() {
    await loadUsers();
    await loadPersons(editingId || null);
    await loadProperties();
  }

  function handleCreateFinancing() {
    setShowMenu(false);

    if (!selectedPerson) {
      alert("Selecione um cadastro primeiro.");
      return;
    }

    navigate("/financiamentos", {
      state: {
        preselectedClient: {
          id: selectedPerson.id,
          fullName: selectedPerson.fullName,
          cpf: selectedPerson.cpf || "",
          phone: selectedPerson.phone || "",
          email: selectedPerson.email || "",
          createdByName:
            selectedPerson.createdBy?.name || selectedPerson.createdBy?.email || "",
          createdById: selectedPerson.createdBy?.id || null
        }
      }
    });
  }

  function handleOpenLinkedProperties() {
    setShowMenu(false);
    navigate("/imoveis");
  }

  function handleOpenHistory() {
    setShowMenu(false);

    if (!selectedPerson) {
      alert("Selecione um cadastro primeiro.");
      return;
    }

    alert(`Histórico de atendimentos: ${selectedPerson.fullName}`);
  }

  function handleOpenVisits() {
    setShowMenu(false);
    navigate("/visitas");
  }

  function handleOpenProposals() {
    setShowMenu(false);
    navigate("/propostas");
  }

  async function handleShare() {
    if (!selectedPerson) {
      alert("Selecione um cadastro para copiar o resumo.");
      return;
    }

    const text = `
Cadastro: ${selectedPerson.fullName}
Tipo: ${getPersonTypeLabel(selectedPerson.type)}
Código: ${selectedPerson.id}
CPF: ${selectedPerson.cpf || "-"}
Telefone: ${selectedPerson.phone || "-"}
E-mail: ${selectedPerson.email || "-"}
Categoria: ${selectedPerson.category || "-"}
Situação: ${selectedPerson.isActive ? "Ativo" : "Inativo"}
Termômetro: ${selectedPerson.businessTemperature || "-"}
Captador: ${getCaptadorName(selectedPerson)}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Resumo copiado.");
    } catch (error) {
      console.error("Erro ao copiar resumo:", error);
      alert("Não foi possível copiar o resumo.");
    }
  }

  function handlePrint() {
    window.print();
  }

  function addActivity() {
    const text = newActivityText.trim();
    if (!text) return;

    const activity = {
      id: Date.now(),
      text,
      date: new Date().toISOString(),
      user: user.name || user.email || "Usuário"
    };

    setForm((prev) => ({
      ...prev,
      activities: [activity, ...(Array.isArray(prev.activities) ? prev.activities : [])]
    }));

    setNewActivityText("");
  }

  function removeActivity(activityId) {
    setForm((prev) => ({
      ...prev,
      activities: (prev.activities || []).filter((item) => item.id !== activityId)
    }));
  }

  function renderTopBar() {
    return (
      <div style={styles.topBar}>
        <button type="button" style={styles.backButton} onClick={handleBack}>
          ←
        </button>

        <h1 style={styles.topTitle}>Clientes e Proprietários</h1>

        <div ref={menuRef} style={styles.menuWrapper}>
          <button
            type="button"
            style={styles.menuButton}
            onClick={() => setShowMenu((prev) => !prev)}
          >
            ⋮
          </button>

          {showMenu && (
            <div style={styles.dropdownMenu}>
              <button type="button" style={styles.dropdownItem} onClick={handleOpenHistory}>
                Histórico
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handleOpenVisits}>
                Visitas
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handleOpenProposals}>
                Propostas
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handleCreateFinancing}>
                Financiamento
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handleOpenLinkedProperties}>
                Imóveis vinculados
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handleShare}>
                Compartilhar
              </button>

              <button type="button" style={styles.dropdownItem} onClick={handlePrint}>
                Imprimir
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div style={styles.page}>
        {renderTopBar()}

        <div style={styles.listContent}>
          <div style={styles.heroCard}>
            <div>
              <span style={styles.heroBadge}>CRM Imobiliário • JB Pessoa</span>
              <h2 style={styles.heroTitle}>Clientes e proprietários em uma única tela</h2>
              <p style={styles.heroText}>
                Cadastro único no padrão Univem: tipo flexível, captador, atividades,
                termômetro e imóveis vinculados.
              </p>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.statCard}>
                <strong>{counters.total}</strong>
                <span>Todos</span>
              </div>

              <div style={styles.statCard}>
                <strong>{counters.clients}</strong>
                <span>Clientes</span>
              </div>

              <div style={styles.statCard}>
                <strong>{counters.owners}</strong>
                <span>Proprietários</span>
              </div>

              <div style={styles.statCard}>
                <strong>{counters.both}</strong>
                <span>Ambos</span>
              </div>
            </div>
          </div>

          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.pageTitle}>Cadastros</h2>
              <p style={styles.pageSubtitle}>
                Clique no cadastro para editar ou na foto para abrir a visualização rápida.
              </p>
            </div>

            <div style={styles.listHeaderActions}>
              <button type="button" style={styles.secondaryButton} onClick={handleRefresh}>
                Atualizar
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => handleNewPerson("CLIENTE")}
              >
                + Novo cliente
              </button>

              <button
                type="button"
                style={styles.primaryButtonDark}
                onClick={() => handleNewPerson("PROPRIETARIO")}
              >
                + Novo proprietário
              </button>
            </div>
          </div>

          <div style={styles.filtersCard}>
            <input
              style={styles.searchInputTop}
              placeholder="Buscar por nome, CPF, e-mail, telefone, captador ou categoria"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div style={styles.typeFilterGroup}>
              <button
                type="button"
                style={{
                  ...styles.typeFilterButton,
                  ...(typeFilter === "TODOS" ? styles.typeFilterButtonActive : {})
                }}
                onClick={() => setTypeFilter("TODOS")}
              >
                Todos
              </button>

              <button
                type="button"
                style={{
                  ...styles.typeFilterButton,
                  ...(typeFilter === "CLIENTES" ? styles.typeFilterButtonActive : {})
                }}
                onClick={() => setTypeFilter("CLIENTES")}
              >
                Clientes
              </button>

              <button
                type="button"
                style={{
                  ...styles.typeFilterButton,
                  ...(typeFilter === "PROPRIETARIOS" ? styles.typeFilterButtonActive : {})
                }}
                onClick={() => setTypeFilter("PROPRIETARIOS")}
              >
                Proprietários
              </button>

              <button
                type="button"
                style={{
                  ...styles.typeFilterButton,
                  ...(typeFilter === "AMBOS" ? styles.typeFilterButtonActive : {})
                }}
                onClick={() => setTypeFilter("AMBOS")}
              >
                Ambos
              </button>
            </div>

            <label style={styles.checkboxSmall}>
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
              Somente ativos
            </label>

            <label style={styles.checkboxSmall}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Mostrar arquivados
            </label>
          </div>

          <div style={styles.personTableCard}>
            <div style={styles.personTableHeader}>
              <span>Nome / Empresa</span>
              <span>Tipo</span>
              <span>Contato</span>
              <span>Captador</span>
              <span>Termômetro</span>
              <span>Imóveis</span>
            </div>

            {filteredPersons.length === 0 ? (
              <div style={styles.emptyState}>Nenhum cadastro encontrado.</div>
            ) : (
              filteredPersons.map((person) => (
                <div
                  key={person.id}
                  style={{
                    ...styles.personRow,
                    ...(selectedPerson?.id === person.id ? styles.personRowActive : {})
                  }}
                  onClick={() => handleSelectPerson(person)}
                >
                  <div style={styles.personNameCell}>
                    <button
                      type="button"
                      style={styles.avatarButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenQuickView(person);
                      }}
                    >
                      {getInitials(person.fullName)}
                    </button>

                    <div>
                      <strong style={styles.personName}>{person.fullName || "Sem nome"}</strong>
                      <span style={styles.personSub}>
                        CPF: {person.cpf || "-"} • Cadastro: {formatDate(person.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        ...styles.typeBadge,
                        ...getTypeBadgeStyle(person.type)
                      }}
                    >
                      {getPersonTypeLabel(person.type)}
                    </span>
                  </div>

                  <div style={styles.contactCell}>
                    <span>{person.phone || person.contactPhone || "-"}</span>
                    <span>{person.email || "-"}</span>
                  </div>

                  <div style={styles.captorCell}>
                    <span style={styles.captorAvatar}>{getInitials(getCaptadorName(person))}</span>
                    <span>{getCaptadorName(person)}</span>
                  </div>

                  <div>
                    <span
                      style={{
                        ...styles.temperatureBadge,
                        ...getTemperatureStyle(person.businessTemperature)
                      }}
                    >
                      {person.businessTemperature || "FRIO"}
                    </span>
                  </div>

                  <div>
                    <span style={styles.propertyCountBadge}>
                      {getLinkedProperties(person).length}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {viewPerson && renderQuickView()}
      </div>
    );
  }

  function renderQuickView() {
    const linkedProperties = getLinkedProperties(viewPerson);

    return (
      <div style={styles.modalOverlay} onClick={() => setViewPerson(null)}>
        <div style={styles.quickViewModal} onClick={(event) => event.stopPropagation()}>
          <button type="button" style={styles.modalCloseButton} onClick={() => setViewPerson(null)}>
            ×
          </button>

          <div style={styles.quickHeader}>
            <div style={styles.quickAvatar}>{getInitials(viewPerson.fullName)}</div>

            <div>
              <h2 style={styles.quickTitle}>{viewPerson.fullName}</h2>
              <p style={styles.quickSub}>
                {getPersonTypeLabel(viewPerson.type)} • Captador: {getCaptadorName(viewPerson)}
              </p>
            </div>
          </div>

          <div style={styles.quickInfoGrid}>
            <div>
              <span>Telefone</span>
              <strong>{viewPerson.phone || viewPerson.contactPhone || "-"}</strong>
            </div>

            <div>
              <span>E-mail</span>
              <strong>{viewPerson.email || "-"}</strong>
            </div>

            <div>
              <span>CPF</span>
              <strong>{viewPerson.cpf || "-"}</strong>
            </div>

            <div>
              <span>Termômetro</span>
              <strong>{viewPerson.businessTemperature || "FRIO"}</strong>
            </div>
          </div>

          <div style={styles.quickSection}>
            <h3>Imóveis vinculados</h3>

            {linkedProperties.length === 0 ? (
              <p style={styles.emptyLinkedText}>Nenhum imóvel vinculado.</p>
            ) : (
              linkedProperties.slice(0, 4).map((property) => (
                <div key={property.id} style={styles.linkedPropertyItem}>
                  <div>
                    <strong>{property.title || property.type || "Imóvel"}</strong>
                    <span>{getPropertyAddress(property) || "Endereço não informado"}</span>
                  </div>

                  <span>{formatCurrency(property.price || property.salePrice || property.value)}</span>
                </div>
              ))
            )}
          </div>

          <div style={styles.quickActions}>
            {viewPerson.phone && (
              <a
                href={getWhatsAppLink(viewPerson.phone)}
                target="_blank"
                rel="noreferrer"
                style={styles.whatsappButton}
              >
                WhatsApp
              </a>
            )}

            <button type="button" style={styles.primaryButton} onClick={handleEditFromQuickView}>
              Editar cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderForm() {
    const linkedProperties = getLinkedProperties(selectedPerson);

    return (
      <div style={styles.page}>
        {renderTopBar()}

        <div style={styles.formShell}>
          <div style={styles.formSidebar}>
            <button type="button" style={styles.backListButton} onClick={handleBackToList}>
              ← Voltar para lista
            </button>

            <div style={styles.profileCard}>
              <div style={styles.profileAvatar}>{getInitials(form.fullName)}</div>

              <h2>{form.fullName || "Novo cadastro"}</h2>

              <span
                style={{
                  ...styles.typeBadge,
                  ...getTypeBadgeStyle(form.type)
                }}
              >
                {getPersonTypeLabel(form.type)}
              </span>

              <p>Captador: {getSelectedCaptadorName()}</p>
            </div>

            <div style={styles.sidebarSummary}>
              <div>
                <span>Imóveis vinculados</span>
                <strong>{linkedProperties.length}</strong>
              </div>

              <div>
                <span>Atividades</span>
                <strong>{form.activities?.length || 0}</strong>
              </div>

              <div>
                <span>Situação</span>
                <strong>{form.isActive ? "Ativo" : "Inativo"}</strong>
              </div>
            </div>
          </div>

          <form style={styles.formContent} onSubmit={handleSubmit}>
            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h2>Dados principais</h2>
                <p>Cadastro único para cliente, proprietário ou ambos.</p>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Tipo de cadastro</label>
                  <select
                    style={styles.lineSelect}
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="PROPRIETARIO">Proprietário</option>
                    <option value="AMBOS">Cliente + Proprietário</option>
                  </select>
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Nome / Empresa</label>
                  <input
                    style={styles.lineInput}
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nome completo ou razão social"
                  />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Categoria</label>
                  <input
                    style={styles.lineInput}
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Ex: Comprador, Proprietário, Investidor"
                  />
                </div>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>CPF / CNPJ</label>
                  <input style={styles.lineInput} name="cpf" value={form.cpf} onChange={handleChange} />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>RG</label>
                  <input style={styles.lineInput} name="rg" value={form.rg} onChange={handleChange} />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Primeiro contato</label>
                  <input
                    style={styles.lineInput}
                    type="date"
                    name="firstContact"
                    value={form.firstContact}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h2>Contato</h2>
                <p>Telefones, e-mail e WhatsApp.</p>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Telefone principal</label>
                  <input style={styles.lineInput} name="phone" value={form.phone} onChange={handleChange} />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>E-mail</label>
                  <input style={styles.lineInput} name="email" value={form.email} onChange={handleChange} />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Empresa</label>
                  <input style={styles.lineInput} name="company" value={form.company} onChange={handleChange} />
                </div>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Telefone comercial</label>
                  <input
                    style={styles.lineInput}
                    name="commercialPhone"
                    value={form.commercialPhone}
                    onChange={handleChange}
                  />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Telefone residencial</label>
                  <input
                    style={styles.lineInput}
                    name="residentialPhone"
                    value={form.residentialPhone}
                    onChange={handleChange}
                  />
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Telefone contato</label>
                  <input
                    style={styles.lineInput}
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="whatsapp"
                  checked={form.whatsapp}
                  onChange={handleChange}
                />
                Possui WhatsApp
              </label>
            </section>

            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h2>Gestão comercial</h2>
                <p>Captador, termômetro, situação e observações.</p>
              </div>

              <div style={styles.rowTriple}>
                <div style={styles.fieldContent}>
                  <label style={styles.label}>Captador</label>
                  <select
                    name="createdById"
                    value={form.createdById || ""}
                    onChange={handleChange}
                    style={styles.lineSelect}
                  >
                    <option value="">{getSelectedCaptadorName()}</option>

                    {users.map((captador) => (
                      <option key={captador.id} value={captador.id}>
                        {captador.name || captador.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Termômetro de negócio</label>
                  <select
                    style={styles.lineSelect}
                    name="businessTemperature"
                    value={form.businessTemperature}
                    onChange={handleChange}
                  >
                    <option value="FRIO">Frio</option>
                    <option value="MORNO">Morno</option>
                    <option value="QUENTE">Quente</option>
                  </select>
                </div>

                <div style={styles.fieldContent}>
                  <label style={styles.label}>Situação</label>
                  <select
                    style={styles.lineSelect}
                    name="isActive"
                    value={String(form.isActive)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.value === "true"
                      }))
                    }
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="createReminder"
                  checked={form.createReminder}
                  onChange={handleChange}
                />
                Criar lembrete
              </label>

              <div style={styles.fieldContent}>
                <label style={styles.label}>Anotações</label>
                <textarea
                  style={styles.textarea}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Observações importantes sobre este cadastro..."
                />
              </div>
            </section>

            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h2>Atividades</h2>
                <p>Histórico rápido de contatos e atendimentos.</p>
              </div>

              <div style={styles.activityInputRow}>
                <input
                  style={styles.lineInput}
                  value={newActivityText}
                  onChange={(event) => setNewActivityText(event.target.value)}
                  placeholder="Digite uma nova atividade..."
                />

                <button type="button" style={styles.secondaryButton} onClick={addActivity}>
                  Adicionar
                </button>
              </div>

              <div style={styles.activitiesBox}>
                {(form.activities || []).length === 0 ? (
                  <div style={styles.emptyStateSmall}>Nenhuma atividade cadastrada.</div>
                ) : (
                  form.activities.map((activity) => (
                    <div key={activity.id || activity.date || activity.text} style={styles.activityItem}>
                      <div>
                        <strong>{activity.text}</strong>
                        <span>
                          {activity.user || "Usuário"} • {formatDateTime(activity.date)}
                        </span>
                      </div>

                      <button
                        type="button"
                        style={styles.removeActivityButton}
                        onClick={() => removeActivity(activity.id)}
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h2>Imóveis vinculados</h2>
                <p>Imóveis relacionados a este cadastro.</p>
              </div>

              {linkedProperties.length === 0 ? (
                <div style={styles.emptyPropertyBox}>
                  <div style={styles.propertyIconLarge}>⌂</div>
                  <div>
                    <strong>Nenhum imóvel vinculado</strong>
                    <p>Você pode cadastrar ou vincular um imóvel para este cadastro.</p>
                  </div>
                </div>
              ) : (
                <div style={styles.propertyListClean}>
                  {linkedProperties.map((property) => (
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
                  + Cadastrar imóvel
                </button>
              </div>
            </section>

            <div style={styles.formActions}>
              <button type="submit" style={styles.saveButton}>
                Salvar cadastro
              </button>

              {editingId && (
                <button type="button" style={styles.deleteButton} onClick={handleDelete}>
                  Excluir
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return screenMode === "list" ? renderList() : renderForm();
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    color: "#111827"
  },
  topBar: {
    height: "58px",
    backgroundColor: "#1e88e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "0 22px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
    position: "sticky",
    top: 0,
    zIndex: 30
  },
  backButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer"
  },
  topTitle: {
    flex: 1,
    margin: 0,
    fontSize: "22px",
    fontWeight: "700"
  },
  menuWrapper: {
    position: "relative"
  },
  menuButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    width: "42px",
    height: "42px"
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "46px",
    minWidth: "220px",
    backgroundColor: "#fff",
    color: "#111827",
    borderRadius: "12px",
    boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
    padding: "8px",
    zIndex: 50
  },
  dropdownItem: {
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    padding: "11px 12px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#374151"
  },
  listContent: {
    maxWidth: "1380px",
    margin: "0 auto",
    padding: "28px 18px 70px"
  },
  heroCard: {
    borderRadius: "24px",
    background: "linear-gradient(135deg, #111827, #1f2937)",
    color: "#fff",
    padding: "30px",
    marginBottom: "22px",
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: "24px",
    boxShadow: "0 22px 55px rgba(15,23,42,0.25)"
  },
  heroBadge: {
    display: "inline-flex",
    backgroundColor: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px"
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "34px",
    lineHeight: 1.12
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.78)",
    fontSize: "15px",
    lineHeight: 1.5
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    alignItems: "stretch"
  },
  statCard: {
    borderRadius: "16px",
    backgroundColor: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "22px",
    marginBottom: "18px"
  },
  pageTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800"
  },
  pageSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "15px"
  },
  listHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  filtersCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap"
  },
  searchInputTop: {
    flex: 1,
    minWidth: "280px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "13px 15px",
    fontSize: "14px",
    outline: "none"
  },
  typeFilterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  typeFilterButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#374151",
    borderRadius: "999px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "800"
  },
  typeFilterButtonActive: {
    backgroundColor: "#111827",
    color: "#fff",
    borderColor: "#111827"
  },
  checkboxSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    fontWeight: "700",
    fontSize: "13px"
  },
  primaryButton: {
    backgroundColor: "#d4a62a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  primaryButtonDark: {
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  secondaryButton: {
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  personTableCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 14px 34px rgba(15,23,42,0.1)"
  },
  personTableHeader: {
    display: "grid",
    gridTemplateColumns: "2.2fr 1fr 1.3fr 1.3fr 0.9fr 0.7fr",
    gap: "12px",
    padding: "14px 18px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase"
  },
  personRow: {
    display: "grid",
    gridTemplateColumns: "2.2fr 1fr 1.3fr 1.3fr 0.9fr 0.7fr",
    gap: "12px",
    alignItems: "center",
    padding: "16px 18px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    backgroundColor: "#fff"
  },
  personRowActive: {
    backgroundColor: "#fff7ed"
  },
  personNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0
  },
  avatarButton: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#1e88e5",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
    flex: "0 0 auto"
  },
  personName: {
    display: "block",
    color: "#111827",
    fontSize: "15px"
  },
  personSub: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "3px"
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },
  clientBadge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8"
  },
  ownerBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534"
  },
  bothBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
  },
  neutralBadge: {
    backgroundColor: "#f3f4f6",
    color: "#374151"
  },
  contactCell: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    color: "#374151",
    fontSize: "13px",
    minWidth: 0
  },
  captorCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    fontSize: "13px"
  },
  captorAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "11px"
  },
  temperatureBadge: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "900"
  },
  tempHot: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  },
  tempWarm: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
  },
  tempCold: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1"
  },
  propertyCountBadge: {
    minWidth: "34px",
    height: "34px",
    borderRadius: "999px",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  emptyState: {
    padding: "42px",
    textAlign: "center",
    color: "#6b7280"
  },
  emptyStateSmall: {
    padding: "18px",
    textAlign: "center",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderRadius: "12px"
  },
  formShell: {
    maxWidth: "1380px",
    margin: "0 auto",
    padding: "28px 18px 70px",
    display: "grid",
    gridTemplateColumns: "310px 1fr",
    gap: "22px"
  },
  formSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  backListButton: {
    border: "none",
    borderRadius: "999px",
    padding: "12px 16px",
    backgroundColor: "#111827",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer"
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "10px"
  },
  profileAvatar: {
    width: "86px",
    height: "86px",
    borderRadius: "50%",
    backgroundColor: "#1e88e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "900"
  },
  sidebarSummary: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  formContent: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },
  sectionHeader: {
    marginBottom: "20px"
  },
  rowTriple: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "16px"
  },
  fieldContent: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },
  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "800"
  },
  lineInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff"
  },
  lineSelect: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff"
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "13px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical"
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    fontWeight: "700",
    marginBottom: "14px"
  },
  activityInputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    marginBottom: "14px"
  },
  activitiesBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #eef2f7"
  },
  removeActivityButton: {
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "800"
  },
  emptyPropertyBox: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "18px",
    color: "#777",
    border: "1px dashed #d1d5db",
    borderRadius: "14px"
  },
  propertyListClean: {
    display: "flex",
    flexDirection: "column"
  },
  propertyCleanItem: {
    display: "grid",
    gridTemplateColumns: "70px 1fr auto",
    alignItems: "center",
    gap: "18px",
    padding: "16px",
    borderBottom: "1px solid #eeeeee"
  },
  propertyIconLarge: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    backgroundColor: "#d1d5db",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "900"
  },
  propertyCleanInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  propertyCleanTitle: {
    fontSize: "15px",
    color: "#374151"
  },
  propertyPrice: {
    color: "#d4a62a",
    fontWeight: "900"
  },
  propertyAddress: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px"
  },
  propertyCodeBadge: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
    padding: "8px 10px",
    fontWeight: "800",
    fontSize: "12px"
  },
  propertyActionsClean: {
    paddingTop: "16px"
  },
  propertyActionButton: {
    border: "none",
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: "900"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    position: "sticky",
    bottom: "14px",
    zIndex: 20
  },
  saveButton: {
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    borderRadius: "12px",
    padding: "14px 22px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 12px 24px rgba(22,163,74,0.25)"
  },
  deleteButton: {
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    borderRadius: "12px",
    padding: "14px 22px",
    cursor: "pointer",
    fontWeight: "900"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100
  },
  quickViewModal: {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 48px)",
    overflow: "auto",
    backgroundColor: "#fff",
    borderRadius: "22px",
    padding: "26px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
    position: "relative"
  },
  modalCloseButton: {
    position: "absolute",
    right: "18px",
    top: "16px",
    border: "none",
    backgroundColor: "#f3f4f6",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    fontSize: "22px"
  },
  quickHeader: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "22px"
  },
  quickAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#1e88e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "900"
  },
  quickTitle: {
    margin: 0,
    fontSize: "26px"
  },
  quickSub: {
    margin: "6px 0 0",
    color: "#6b7280"
  },
  quickInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "20px"
  },
  quickSection: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "18px"
  },
  emptyLinkedText: {
    color: "#6b7280"
  },
  linkedPropertyItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  quickActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "22px"
  },
  whatsappButton: {
    textDecoration: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "900"
  }
};

export default Persons;
