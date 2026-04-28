import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Owners() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newActivityText, setNewActivityText] = useState("");

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
          return;
        }
      }
      // Não seleciona proprietário automaticamente. O usuário escolhe na lista.
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

      alert(`Erro ao carregar proprietários:
${apiMessage}`);
      setOwners([]);
      setSelectedOwner(null);
      setEditingId(null);
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
      `${owner.fullName || ""} ${owner.cpf || ""} ${owner.email || ""} ${
        owner.phone || ""
      } ${owner.createdBy?.name || ""} ${owner.category || ""} ${owner.firstContact || ""}`
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
      whatsapp: parseWhatsapp(owner.whatsapp),
      category: owner.category || "PROPRIETARIO",
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
      activities: Array.isArray(owner.activities) ? owner.activities : []
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
      whatsapp: false,
      category: "PROPRIETARIO",
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
        activities: Array.isArray(form.activities) ? form.activities : []
      };

      if (editingId) {
        const response = await api.put(`/persons/${editingId}`, payload);
        alert("Proprietário atualizado com sucesso.");
        await loadOwners(response.data?.person?.id || response.data?.id || editingId);
      } else {
        const response = await api.post("/persons", payload);
        alert("Proprietário cadastrado com sucesso.");
        await loadOwners(response.data?.person?.id || response.data?.id || null);
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
      alert("Proprietário excluído com sucesso.");
      handleNewOwner();
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
          <p><strong>WhatsApp:</strong> ${
            parseWhatsapp(selectedOwner.whatsapp) ? "Sim" : "Não"
          }</p>
          <p><strong>Captador:</strong> ${
            selectedOwner.createdBy?.name || "-"
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
Proprietário: ${selectedOwner.fullName}
Código: ${selectedOwner.id}
CPF: ${selectedOwner.cpf || "-"}
Telefone: ${selectedOwner.phone || "-"}
E-mail: ${selectedOwner.email || "-"}
Captador: ${selectedOwner.createdBy?.name || "-"}
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


  function getCaptadorName(person) {
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
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenHistory}
              >
                Histórico do proprietário
              </button>
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
                onClick={handleOpenDocuments}
              >
                Documentos do proprietário
              </button>
              <button
                type="button"
                style={styles.dropdownItem}
                onClick={handleOpenService}
              >
                Atendimentos
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.activitiesBox} id="atividades">
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
                      👤 {activity.createdBy || getCaptadorName(selectedOwner)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyActivities}>
                  Proprietário sem anotações ou atividades
                </div>
              )}
            </div>
          </div>

          <div style={styles.leftPanelHeader}>
            <h3 style={styles.leftPanelTitle}>
              {user.role === "ADMIN"
                ? "Lista de proprietários"
                : "Meus proprietários"}
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
                  {owner.createdBy?.name && (
                    <div style={styles.responsibleText}>
                      Captador: {owner.createdBy.name}
                    </div>
                  )}
                </button>
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
                <label style={styles.label}>Captador</label>
                <input
                  style={styles.lineInput}
                  value={getCaptadorName(selectedOwner)}
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
  responsibleText: {
    color: "#a16207",
    fontSize: "13px",
    marginTop: "6px",
    fontWeight: "600"
  },
  mainPanel: {
    backgroundColor: "#fffdf8",
    padding: "26px 150px 26px 34px",
    position: "relative",
    overflowX: "hidden"
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