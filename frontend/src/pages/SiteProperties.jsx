import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import publicApi from "../services/publicApi";
import SiteLayout from "../components/SiteLayout";
import "./SiteProperties.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

function getImageUrl(path) {
  if (!path) return "/sem-imagem.png";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function formatPrice(value) {
  if (!value) return "Valor a consultar";

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatBusinessType(value) {
  if (!value) return "Imóvel";
  if (value === "SALE") return "Venda";
  if (value === "RENT") return "Aluguel";
  return value;
}

export default function SiteProperties() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || ""
  );
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || ""
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(
    searchParams.get("priceRange") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recentes");

  const [properties, setProperties] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function updateUrl(nextPage = 1, overrides = {}) {
    const params = new URLSearchParams();

    const nextSearch =
      overrides.search !== undefined ? overrides.search : search;
    const nextType =
      overrides.selectedType !== undefined
        ? overrides.selectedType
        : selectedType;
    const nextCity =
      overrides.selectedCity !== undefined ? overrides.selectedCity : selectedCity;
    const nextPriceRange =
      overrides.selectedPriceRange !== undefined
        ? overrides.selectedPriceRange
        : selectedPriceRange;
    const nextSortBy =
      overrides.sortBy !== undefined ? overrides.sortBy : sortBy;

    if (nextSearch) params.set("search", nextSearch);
    if (nextType) params.set("type", nextType);
    if (nextCity) params.set("city", nextCity);
    if (nextPriceRange) params.set("priceRange", nextPriceRange);
    if (nextSortBy && nextSortBy !== "recentes") params.set("sort", nextSortBy);
    if (nextPage > 1) params.set("page", String(nextPage));

    navigate(`/site/imoveis?${params.toString()}`);
  }

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSelectedType(searchParams.get("type") || "");
    setSelectedCity(searchParams.get("city") || "");
    setSelectedPriceRange(searchParams.get("priceRange") || "");
    setSortBy(searchParams.get("sort") || "recentes");
  }, [searchParams]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await publicApi.get("/properties/public", {
          params: {
            search: searchParams.get("search") || "",
            type: searchParams.get("type") || "",
            city: searchParams.get("city") || "",
            priceRange: searchParams.get("priceRange") || "",
            sort: searchParams.get("sort") || "recentes",
            page: Number(searchParams.get("page") || 1),
            limit: 9
          }
        });

        setProperties(response.data?.data || []);
        setPagination(
          response.data?.pagination || {
            page: 1,
            limit: 9,
            total: 0,
            totalPages: 1
          }
        );
        setCityOptions(response.data?.filters?.cities || []);
      } catch (err) {
        console.error("Erro ao carregar imóveis:", err);
        setError("Não foi possível carregar os imóveis.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [searchParams]);

  function handleApplyFilters() {
    updateUrl(1);
  }

  function clearFilters() {
    setSearch("");
    setSelectedType("");
    setSelectedCity("");
    setSelectedPriceRange("");
    setSortBy("recentes");
    navigate("/site/imoveis");
  }

  function goToPage(page) {
    updateUrl(page);
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="site-properties-page">
          <div className="site-properties-container">
            <div className="site-properties-message">Carregando imóveis...</div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error) {
    return (
      <SiteLayout>
        <div className="site-properties-page">
          <div className="site-properties-container">
            <div className="site-properties-message site-properties-message-error">
              <h2>Erro ao carregar imóveis</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="site-properties-page">
        <section className="site-properties-hero">
          <div className="site-properties-container">
            <span className="site-properties-badge">Imóveis disponíveis</span>
            <h1>Encontre o imóvel ideal para você</h1>
            <p>
              Explore oportunidades selecionadas com atendimento profissional e
              suporte em todas as etapas da negociação.
            </p>
          </div>
        </section>

        <section className="site-properties-filters-section">
          <div className="site-properties-container">
            <div className="site-properties-filters-card">
              <div className="site-properties-filters-grid">
                <div className="site-properties-field site-properties-field-search">
                  <label>Buscar</label>
                  <input
                    type="text"
                    placeholder="Título, bairro, cidade ou código"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="site-properties-field">
                  <label>Tipo</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="SALE">Venda</option>
                    <option value="RENT">Aluguel</option>
                  </select>
                </div>

                <div className="site-properties-field">
                  <label>Cidade</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="site-properties-field">
                  <label>Faixa de preço</label>
                  <select
                    value={selectedPriceRange}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="ate-200">Até R$ 200 mil</option>
                    <option value="200-500">R$ 200 mil a R$ 500 mil</option>
                    <option value="500-1000">R$ 500 mil a R$ 1 milhão</option>
                    <option value="acima-1000">Acima de R$ 1 milhão</option>
                  </select>
                </div>

                <div className="site-properties-field">
                  <label>Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="menor-preco">Menor preço</option>
                    <option value="maior-preco">Maior preço</option>
                    <option value="maior-area">Maior área</option>
                    <option value="a-z">Título A-Z</option>
                    <option value="z-a">Título Z-A</option>
                  </select>
                </div>
              </div>

              <div className="site-properties-filters-footer">
                <p>
                  <strong>{pagination.total}</strong> imóvel(is) encontrado(s)
                </p>

                <div className="site-properties-filters-actions">
                  <button
                    type="button"
                    className="site-properties-apply-button"
                    onClick={handleApplyFilters}
                  >
                    Aplicar filtros
                  </button>

                  <button
                    type="button"
                    className="site-properties-clear-button"
                    onClick={clearFilters}
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-properties-list-section">
          <div className="site-properties-container">
            {properties.length === 0 ? (
              <div className="site-properties-message">
                <h2>Nenhum imóvel encontrado</h2>
                <p>Tente ajustar os filtros para ver mais opções.</p>
              </div>
            ) : (
              <>
                <div className="site-properties-grid">
                  {properties.map((property) => {
                    const image = property.coverImage
                      ? getImageUrl(property.coverImage)
                      : property.images?.length > 0
                      ? getImageUrl(property.images[0])
                      : "/sem-imagem.png";

                    const locationText = [
                      property.district || property.neighborhood,
                      property.city,
                      property.state
                    ]
                      .filter(Boolean)
                      .join(" - ");

                    return (
                      <article
                        key={property.id}
                        className="site-properties-card"
                      >
                        <Link
                          to={`/site/imoveis/${property.id}`}
                          className="site-properties-image-link"
                        >
                          <div className="site-properties-image-wrap">
                            <img
                              src={image}
                              alt={property.title}
                              className="site-properties-image"
                            />

                            <div className="site-properties-card-badge">
                              {formatBusinessType(property.type)}
                            </div>
                          </div>
                        </Link>

                        <div className="site-properties-card-content">
                          <p className="site-properties-card-code">
                            Código: {property.id}
                          </p>

                          <h2>{property.title}</h2>

                          <p className="site-properties-card-location">
                            {locationText || "Localização não informada"}
                          </p>

                          <div className="site-properties-card-features">
                            <span>{property.rooms || 0} quartos</span>
                            <span>{property.bathrooms || 0} banheiros</span>
                            <span>{property.garage || 0} vagas</span>
                            <span>{property.area || 0} m²</span>
                          </div>

                          <div className="site-properties-card-footer">
                            <strong>{formatPrice(property.price)}</strong>

                            <Link
                              to={`/site/imoveis/${property.id}`}
                              className="site-properties-details-button"
                            >
                              Ver detalhes
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="site-properties-pagination">
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="site-properties-page-button"
                  >
                    Anterior
                  </button>

                  <span className="site-properties-page-indicator">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="site-properties-page-button"
                  >
                    Próxima
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}