import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [persons, setPersons] = useState([]);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "",
    personId: "",
    propertyId: "",
    file: null
  });

  async function loadDocuments() {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar documentos.");
    }
  }

  async function loadPersons() {
    try {
      const response = await api.get("/persons");
      setPersons(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadProperties() {
    try {
      const response = await api.get("/properties");
      setProperties(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadDocuments();
    loadPersons();
    loadProperties();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) =>
      `${doc.title} ${doc.type} ${doc.person?.fullName || ""} ${doc.property?.title || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [documents, search]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setForm({ ...form, file: e.target.files[0] });
  }

  function handleSelectDocument(doc) {
    setSelectedDocument(doc);
    setForm({
      title: doc.title || "",
      type: doc.type || "",
      personId: doc.personId ? String(doc.personId) : "",
      propertyId: doc.propertyId ? String(doc.propertyId) : "",
      file: null
    });

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  }

  function handleNewDocument() {
    setSelectedDocument(null);
    setForm({
      title: "",
      type: "",
      personId: "",
      propertyId: "",
      file: null
    });

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("type", form.type);

      if (form.personId) formData.append("personId", form.personId);
      if (form.propertyId) formData.append("propertyId", form.propertyId);
      if (form.file) formData.append("file", form.file);

      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Documento enviado com sucesso.");
      handleNewDocument();
      loadDocuments();
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar documento.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Documentos</h2>
          <p style={styles.pageSubtitle}>
            Cadastro e organização de documentos do cliente, proprietário e imóvel
          </p>
        </div>

        <div style={styles.topActions}>
          <button style={styles.iconButton} onClick={() => setShowMenu(!showMenu)}>
            ⋮
          </button>

          {showMenu && (
            <div style={styles.dropdownMenu}>
              <button style={styles.dropdownItem} type="button" onClick={handleNewDocument}>
                Novo documento
              </button>
              <button style={styles.dropdownItem} type="button" onClick={() => loadDocuments()}>
                Atualizar lista
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        <aside style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <h3 style={styles.leftTitle}>Arquivos ({filteredDocuments.length})</h3>
          </div>

          <input
            style={styles.search}
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={styles.documentList}>
            {filteredDocuments.length === 0 ? (
              <div style={styles.emptyBox}>Nenhum documento encontrado.</div>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDocument(doc)}
                  style={{
                    ...styles.docCard,
                    ...(selectedDocument?.id === doc.id ? styles.docCardActive : {})
                  }}
                >
                  <div style={styles.docIcon}>📄</div>
                  <div style={styles.docInfo}>
                    <strong>{doc.title}</strong>
                    <div style={styles.docMeta}>Tipo: {doc.type}</div>
                    <div style={styles.docMeta}>
                      Pessoa: {doc.person?.fullName || "-"}
                    </div>
                    <div style={styles.docMeta}>
                      Imóvel: {doc.property?.title || "-"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section style={styles.mainPanel}>
          <div style={styles.sectionHeader}>
            <div style={styles.greenDot}></div>
            <h2 style={styles.sectionTitle}>Cadastro</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Título do documento</label>
                <input
                  style={styles.input}
                  name="title"
                  placeholder="Ex: RG Maria / IPTU Apartamento Centro"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo do documento</label>
                <select
                  style={styles.input}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  <option value="RG">RG</option>
                  <option value="CPF">CPF</option>
                  <option value="CERTIDAO_ESTADO_CIVIL">Certidão de Estado Civil</option>
                  <option value="COMPROVANTE_ENDERECO">Comprovante de Endereço</option>
                  <option value="COMPROVANTE_RENDA">Comprovante de Renda</option>
                  <option value="CARTEIRA_PROFISSIONAL">Carteira Profissional</option>
                  <option value="FGTS">FGTS</option>
                  <option value="DEPENDENTE">Dependente</option>
                  <option value="ESCRITURA_IMOVEL">Escritura do Imóvel</option>
                  <option value="IPTU">IPTU</option>
                  <option value="MATRICULA_IMOVEL">Matrícula do Imóvel</option>
                  <option value="CONTRATO_COMPRA_VENDA">Contrato Compra e Venda</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Pessoa vinculada</label>
                <select
                  style={styles.input}
                  name="personId"
                  value={form.personId}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Imóvel vinculado</label>
                <select
                  style={styles.input}
                  name="propertyId"
                  value={form.propertyId}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Arquivo</label>
                <input
                  id="fileInput"
                  style={styles.input}
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {selectedDocument && (
              <div style={styles.previewBox}>
                <h3 style={styles.previewTitle}>Documento selecionado</h3>
                <p><strong>Título:</strong> {selectedDocument.title}</p>
                <p><strong>Tipo:</strong> {selectedDocument.type}</p>
                <p><strong>Pessoa:</strong> {selectedDocument.person?.fullName || "-"}</p>
                <p><strong>Imóvel:</strong> {selectedDocument.property?.title || "-"}</p>

                <a
                  href={`http://localhost:3001${selectedDocument.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.openLink}
                >
                  Abrir arquivo atual
                </a>
              </div>
            )}

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
    position: "relative"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
    position: "relative"
  },
  pageTitle: {
    margin: 0,
    fontSize: "34px",
    color: "#2d2d2d"
  },
  pageSubtitle: {
    margin: "6px 0 0 0",
    color: "#777"
  },
  topActions: {
    position: "relative"
  },
  iconButton: {
    border: "none",
    backgroundColor: "#2f86d6",
    color: "#fff",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "22px",
    cursor: "pointer"
  },
  dropdownMenu: {
    position: "absolute",
    top: "50px",
    right: 0,
    width: "200px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    overflow: "hidden",
    zIndex: 10
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    backgroundColor: "#fff",
    padding: "14px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "20px"
  },
  leftPanel: {
    backgroundColor: "#f8f8f8",
    borderRadius: "18px",
    padding: "18px",
    minHeight: "700px",
    border: "1px solid #e3e3e3"
  },
  leftHeader: {
    marginBottom: "14px"
  },
  leftTitle: {
    margin: 0,
    color: "#2f86d6",
    fontSize: "22px"
  },
  search: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    marginBottom: "16px",
    boxSizing: "border-box"
  },
  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  emptyBox: {
    color: "#999",
    padding: "30px 10px",
    textAlign: "center"
  },
  docCard: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    width: "100%",
    textAlign: "left",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
    backgroundColor: "#fff"
  },
  docCardActive: {
    border: "2px solid #2f86d6",
    backgroundColor: "#eef6ff"
  },
  docIcon: {
    fontSize: "28px"
  },
  docInfo: {
    flex: 1
  },
  docMeta: {
    color: "#666",
    fontSize: "13px",
    marginTop: "4px"
  },
  mainPanel: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "26px",
    minHeight: "700px",
    border: "1px solid #e3e3e3",
    position: "relative"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px"
  },
  greenDot: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#9dd39e"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#1f1f1f"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column"
  },
  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gridColumn: "1 / -1"
  },
  label: {
    marginBottom: "8px",
    color: "#777",
    fontSize: "15px"
  },
  input: {
    padding: "14px 12px",
    border: "none",
    borderBottom: "1px solid #ccc",
    outline: "none",
    fontSize: "18px",
    backgroundColor: "transparent"
  },
  previewBox: {
    marginTop: "28px",
    padding: "18px",
    borderRadius: "16px",
    backgroundColor: "#fafafa",
    border: "1px solid #e3e3e3"
  },
  previewTitle: {
    marginTop: 0
  },
  openLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#2f86d6",
    textDecoration: "none",
    fontWeight: "bold"
  },
  floatingSaveButton: {
    position: "fixed",
    right: "30px",
    bottom: "28px",
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#ff4b3e",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
  }
};

export default Documents;