import { Link } from "react-router-dom";
import propertiesData from "../../data/propertiesData";
import PropertyCard from "./PropertyCard";
import "./FeaturedProperties.css";

export default function FeaturedProperties() {
  const featured = propertiesData.slice(0, 3);

  return (
    <section className="featured-properties">
      <div className="featured-properties-container">
        <div className="featured-properties-header">
          <div>
            <span className="featured-properties-badge">Destaques</span>
            <h2>Imóveis em destaque</h2>
            <p>
              Confira oportunidades selecionadas para morar ou investir com
              segurança e exclusividade.
            </p>
          </div>

          <Link to="/site/imoveis" className="featured-properties-link">
            Ver todos os imóveis
          </Link>
        </div>

        <div className="featured-properties-grid">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}