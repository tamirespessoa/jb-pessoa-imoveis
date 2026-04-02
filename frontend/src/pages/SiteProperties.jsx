import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import publicApi from "../services/publicApi";
import SiteLayout from "../components/SiteLayout";
import "./SiteProperties.css";

export default function SiteProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await publicApi.get("/properties/public");
        setProperties(response.data || []);
      } catch (err) {
        console.error("Erro ao carregar imóveis:", err);
        setError("Não foi possível carregar os imóveis.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const cities = useMemo(() => {
    const uniqueCities = [
      ...new Set(
        properties
          .map((property) => property.city)
          .filter(Boolean)
      )
    ];

    return uniqueCities.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [properties]);

  const types = useMemo(() => {
    const uniqueTypes = [
      ...new Set(
        properties
          .map((property) => property.type)
          .filter(Boolean)
      )
    ];

    return uniqueTypes.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const titleMatch =
        !search ||
        property.title?.toLowerCase().includes(search.toLowerCase()) ||
        property.description?.toLowerCase().includes(search.toLowerCase()) ||
        property.district?.toLowerCase().includes(search.toLowerCase()) ||
        property.neighborhood?.toLowerCase().includes(search.toLowerCase());

      const cityMatch = !city || property.city === city;
      const typeMatch = !type || property.type === type;
      const priceMatch =
        !maxPrice || Number(property.price || 0) <= Number(maxPrice);

      return titleMatch && cityMatch && typeMatch && priceMatch;
    });
  }, [properties, search, city, type, maxPrice]);

  function clearFilters() {
    setSearch("");
    setCity("");
    setType("");
    setMaxPrice("");
  }

  return (
    <div className="site-properties-page">
      <section className="site-properties-hero">
        <div className="site-properties-hero-overlay" />
        <div className="site-properties-container site-properties-hero-content">
          <span className="site-properties-badge">Catálogo</span>
          <h1>Todos os imóveis</h1>
          <p>
            Explore imóveis selecionados com conforto, sofisticação e excelentes
            oportunidades.
          </p>
        </div>
      </section>

      <section className="site-properties-list-section">
        <div className="site-properties-container">
          <div className="site-properties-section-header">
            <div>
              <span className="site-properties-section-label">
                Imóveis disponíveis
              </span>
              <h2>Encontre o imóvel ideal</h2>
              <p>
                Apartamentos, casas e oportunidades selecionadas para compra e
                locação.
              </p>
            </div>
          </div>

          <div className="site-properties-filters">
            <div className="site-properties-filters-grid">
              <div className="site-filter-group site-filter-group-search">
                <label htmlFor="search">Buscar</label>
                <input
                  id="search"
                  type="text"
                  placeholder="Digite bairro, título ou descrição"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="site-filter-group">
                <label htmlFor="city">Cidade</label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">Todas</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="site-filter-group">
                <label htmlFor="type">Tipo</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">Todos</option>
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="site-filter-group">
                <label htmlFor="maxPrice">Preço máximo</label>
                <input
                  id="maxPrice"
                  type="number"
                  placeholder="Ex: 500000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="site-properties-filters-actions">
              <button
                type="button"
                className="site-properties-clear-button"
                onClick={clearFilters}
              >
                Limpar filtros
              </button>

              <span className="site-properties-results-count">
                {filteredProperties.length} imóvel(is) encontrado(s)
              </span>
            </div>
          </div>

          {loading && (
            <div className="site-properties-message">
              Carregando imóveis...
            </div>
          )}

          {!loading && error && (
            <div className="site-properties-message site-properties-message-error">
              {error}
            </div>
          )}

          {!loading && !error && filteredProperties.length === 0 && (
            <div className="site-properties-message">
              Nenhum imóvel encontrado com os filtros selecionados.
            </div>
          )}

          {!loading && !error && filteredProperties.length > 0 && (
            <div className="site-properties-grid">
              {filteredProperties.map((property) => {
                const imageUrl = property.coverImage
                  ? `http://localhost:3001${property.coverImage}`
                  : property.images && property.images.length > 0
                  ? `http://localhost:3001${property.images[0]}`
                  : "/sem-imagem.png";

                const location = [
                  property.neighborhood || property.district,
                  property.city
                ]
                  .filter(Boolean)
                  .join(" - ");

                const formattedPrice = property.price
                  ? Number(property.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })
                  : "Valor a consultar";

                return (
                  <article key={property.id} className="site-property-card">
                    <div className="site-property-card-image-wrap">
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="site-property-card-image"
                      />

                      <div className="site-property-card-tag">
                        {property.type || "Imóvel"}
                      </div>

                      {property.status && (
                        <div className="site-property-card-status">
                          {property.status}
                        </div>
                      )}
                    </div>

                    <div className="site-property-card-content">
                      <p className="site-property-card-location">
                        {location || "Localização não informada"}
                      </p>

                      <h3 className="site-property-card-title">
                        {property.title}
                      </h3>

                      <p className="site-property-card-price">
                        {formattedPrice}
                      </p>

                      <div className="site-property-card-features">
                        <span>{property.rooms || 0} quartos</span>
                        <span>{property.bathrooms || 0} banheiros</span>
                        <span>{property.area || 0} m²</span>
                      </div>

                      <Link
                        to={`/site/imoveis/${property.id}`}
                        className="site-property-card-button"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}