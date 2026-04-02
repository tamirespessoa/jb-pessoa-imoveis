import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function PropertiesList() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    ativos: true,
    arquivados: false,
    venda: false,
    locacao: false,
    apartamento: false,
    casa: false,
    cidade: "",
    valorMin: "",
    valorMax: ""
  });

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || api.defaults.baseURL || "http://localhost:3001";

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const response = await api.get("/properties");
      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao carregar imóveis:", error.response?.data || error);
      alert("Erro ao carregar imóveis.");
    }
  }

  function getImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${apiBaseUrl}${imagePath}`;
  }

  function handleFilterChange(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleOpenProperty(property) {
    navigate(`/imoveis/${property.id}`);
  }

  function handleNewProperty() {
    navigate("/imoveis/novo");
  }

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const fullText =
        `${property.title || ""} ${property.code || ""} ${property.type || ""} ${property.street || ""} ${property.district || ""} ${property.city || ""} ${property.state || ""}`
          .toLowerCase();

      const matchesSearch = fullText.includes(search.toLowerCase());

      const matchesCidade = filters.cidade
        ? (property.city || "").toLowerCase().includes(filters.cidade.toLowerCase())
        : true;

      const matchesValorMin = filters.valorMin
        ? Number(property.price) >= Number(filters.valorMin)
        : true;

      const matchesValorMax = filters.valorMax
        ? Number(property.price) <= Number(filters.valorMax)
        : true;

      const matchesApartamento = filters.apartamento
        ? (property.type || "").toLowerCase().includes("apart")
        : true;

      const matchesCasa = filters.casa
        ? (property.type || "").toLowerCase().includes("casa")
        : true;

      const matchesStatus = filters.ativos
        ? (property.status || "DISPONIVEL") !== "ARQUIVADO"
        : true;

      return (
        matchesSearch &&
        matchesCidade &&
        matchesValorMin &&
        matchesValorMax &&
        matchesApartamento &&
        matchesCasa &&
        matchesStatus
      );
    });
  }, [properties, search, filters]);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button type="button" style={styles.topIconButton} onClick={() => navigate("/dashboard")}>
            ←
          </button>
          <span style={styles.topTitle}>Imóveis</span>
        </div>

        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            style={styles.searchInput}
            placeholder="Pesquise por referência, tipo, endereço ou condomínio"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.topBarRight}>
          <button type="button" style={styles.topIconButton} onClick={handleNewProperty}>
            ＋
          </button>
          <button type="button" style={styles.topIconButton} onClick={() => window.print()}>
            🖨
          </button>
          <button type="button" style={styles.topIconButton} onClick={loadProperties}>
            ⭳
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Filtros rápidos</h3>

            <div style={styles.checkRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.ativos}
                  onChange={(e) => handleFilterChange("ativos", e.target.checked)}
                />
                Ativos
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.arquivados}
                  onChange={(e) => handleFilterChange("arquivados", e.target.checked)}
                />
                Arquivados
              </label>
            </div>
          </div>

          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Pretensão</h3>

            <div style={styles.checkColumn}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.venda}
                  onChange={(e) => handleFilterChange("venda", e.target.checked)}
                />
                Venda
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.locacao}
                  onChange={(e) => handleFilterChange("locacao", e.target.checked)}
                />
                Locação
              </label>
            </div>
          </div>

          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Tipo do imóvel</h3>

            <div style={styles.checkColumn}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.apartamento}
                  onChange={(e) => handleFilterChange("apartamento", e.target.checked)}
                />
                Apartamento
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.casa}
                  onChange={(e) => handleFilterChange("casa", e.target.checked)}
                />
                Casa
              </label>
            </div>
          </div>

          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Valor</h3>

            <div style={styles.inputGroup}>
              <input
                style={styles.sidebarInput}
                placeholder="De R$"
                value={filters.valorMin}
                onChange={(e) => handleFilterChange("valorMin", e.target.value)}
              />
              <input
                style={styles.sidebarInput}
                placeholder="Até R$"
                value={filters.valorMax}
                onChange={(e) => handleFilterChange("valorMax", e.target.value)}
              />
            </div>
          </div>

          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Localização</h3>

            <input
              style={styles.sidebarInputFull}
              placeholder="Cidade"
              value={filters.cidade}
              onChange={(e) => handleFilterChange("cidade", e.target.value)}
            />
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.tabsRow}>
            <div style={{ ...styles.tabItem, ...styles.tabItemActive }}>
              🏢 Imobiliária
            </div>
            <div style={styles.tabItem}>🌐 Radar de Imóveis</div>

            <div style={styles.rightAction}>
              <button type="button" style={styles.evalButton}>
                ☆ AVALIADOR DE IMÓVEIS
              </button>
            </div>
          </div>

          <div style={styles.tableBox}>
            <h2 style={styles.mainTitle}>Últimos imóveis cadastrados</h2>

            <div style={styles.tableHeader}>
              <div style={styles.colPhoto}></div>
              <div style={styles.colReference}>Referência</div>
              <div style={styles.colType}>Tipo</div>
              <div style={styles.colValue}>Valor</div>
              <div style={styles.colSmall}>Dorm.</div>
              <div style={styles.colSmall}>Ban.</div>
              <div style={styles.colSmall}>Gar.</div>
              <div style={styles.colArea}>Área</div>
              <div style={styles.colDistrict}>Bairro/Cidade</div>
              <div style={styles.colAddress}>Endereço</div>
            </div>

            <div>
              {filteredProperties.length === 0 ? (
                <div style={styles.emptyState}>Nenhum imóvel encontrado.</div>
              ) : (
                filteredProperties.map((property) => {
                  const firstImage = property.images?.[0];

                  return (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => handleOpenProperty(property)}
                      style={styles.tableRow}
                    >
                      <div style={styles.colPhoto}>
                        {firstImage ? (
                          <img
                            src={getImageUrl(firstImage)}
                            alt={property.title}
                            style={styles.rowImage}
                          />
                        ) : (
                          <div style={styles.noImage}>Sem foto</div>
                        )}
                      </div>

                      <div style={styles.colReference}>
                        <strong>{property.code}</strong>
                      </div>

                      <div style={styles.colType}>
                        <div>{property.type || "-"}</div>
                        <div style={styles.subText}>{property.status || "Normal"}</div>
                      </div>

                      <div style={styles.colValue}>
                        {Number(property.price || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </div>

                      <div style={styles.colSmall}>{property.rooms ?? "-"}</div>
                      <div style={styles.colSmall}>{property.bathrooms ?? "-"}</div>
                      <div style={styles.colSmall}>{property.garage ?? "-"}</div>
                      <div style={styles.colArea}>{property.area ? `${property.area}m²` : "-"}</div>

                      <div style={styles.colDistrict}>
                        <div>{property.district || "-"}</div>
                        <div style={styles.subText}>
                          {property.city || "-"}-{property.state || "-"}
                        </div>
                      </div>

                      <div style={styles.colAddress}>
                        <div>
                          {property.street || "-"}, {property.number || "-"}
                        </div>
                        {property.complement && (
                          <div style={styles.subText}>{property.complement}</div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f2f2f2",
    fontFamily: "Arial, sans-serif"
  },
  topBar: {
    height: "66px",
    background: "#2f86d6",
    display: "grid",
    gridTemplateColumns: "220px 1fr 220px",
    alignItems: "center",
    padding: "0 18px",
    gap: "18px",
    color: "#fff"
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  topBarRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px"
  },
  topIconButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer"
  },
  topTitle: {
    fontSize: "20px",
    fontWeight: "bold"
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "30px",
    padding: "0 18px",
    height: "48px"
  },
  searchIcon: {
    fontSize: "22px",
    marginRight: "10px",
    color: "#dcecff"
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "18px"
  },
  content: {
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    minHeight: "calc(100vh - 66px)"
  },
  sidebar: {
    background: "#fff",
    borderRight: "1px solid #ddd",
    padding: "18px 20px"
  },
  filterSection: {
    marginBottom: "28px",
    paddingBottom: "18px",
    borderBottom: "1px solid #ececec"
  },
  filterTitle: {
    margin: "0 0 18px 0",
    fontSize: "18px",
    color: "#222"
  },
  checkRow: {
    display: "flex",
    gap: "26px",
    flexWrap: "wrap"
  },
  checkColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    color: "#555"
  },
  inputGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  sidebarInput: {
    border: "none",
    borderBottom: "1px solid #ccc",
    padding: "10px 2px",
    outline: "none",
    fontSize: "15px"
  },
  sidebarInputFull: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #ccc",
    padding: "10px 2px",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box"
  },
  main: {
    padding: "18px"
  },
  tabsRow: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
    borderBottom: "1px solid #ddd",
    marginBottom: "18px"
  },
  tabItem: {
    padding: "14px 0",
    fontSize: "17px",
    color: "#777"
  },
  tabItemActive: {
    color: "#2f86d6",
    borderBottom: "4px solid #2f86d6",
    fontWeight: "bold"
  },
  rightAction: {
    marginLeft: "auto"
  },
  evalButton: {
    border: "1px solid #2f86d6",
    background: "#fff",
    color: "#2f86d6",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px"
  },
  tableBox: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    overflow: "hidden"
  },
  mainTitle: {
    margin: 0,
    padding: "22px 18px",
    fontSize: "24px",
    fontWeight: "normal"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "100px 110px 140px 150px 70px 70px 70px 90px 260px 280px",
    padding: "18px",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    fontWeight: "bold",
    color: "#222",
    alignItems: "center"
  },
  tableRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "100px 110px 140px 150px 70px 70px 70px 90px 260px 280px",
    padding: "18px",
    borderBottom: "1px solid #f0f0f0",
    background: "#fff",
    textAlign: "left",
    alignItems: "center",
    cursor: "pointer",
    borderLeft: "none",
    borderRight: "none",
    borderTop: "none"
  },
  colPhoto: {
    display: "flex",
    alignItems: "center"
  },
  colReference: {},
  colType: {},
  colValue: {},
  colSmall: {},
  colArea: {},
  colDistrict: {},
  colAddress: {},
  rowImage: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    objectFit: "cover"
  },
  noImage: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#e9e9e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#666"
  },
  subText: {
    color: "#888",
    marginTop: "6px",
    fontSize: "14px"
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#777"
  }
};

export default PropertiesList;