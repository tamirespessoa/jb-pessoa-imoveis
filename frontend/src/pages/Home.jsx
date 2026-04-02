import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-topbar">
          <div className="home-logo">JB Pessoa Imóveis</div>

          <nav className="home-nav">
            <Link to="/">Início</Link>
            <Link to="/imoveis">Imóveis</Link>
            <Link to="/login" className="home-login-btn">
              Área interna
            </Link>
          </nav>
        </div>

        <div className="home-hero">
          <div className="home-hero-content">
            <span className="home-badge">Imobiliária em São Paulo</span>
            <h1>Encontre o imóvel ideal para você</h1>
            <p>
              Compra, venda e locação de imóveis com atendimento direto,
              transparência e praticidade.
            </p>

            <div className="home-hero-actions">
              <Link to="/imoveis" className="btn-primary">
                Ver imóveis
              </Link>

              <a
                href="https://wa.me/5511983185430"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="home-section">
          <h2>Destaques</h2>
          <p>
            Consulte os imóveis disponíveis e fale diretamente com a equipe da
            JB Pessoa Imóveis.
          </p>

          <div className="home-cards">
            <div className="home-card">
              <h3>Compra</h3>
              <p>Encontre apartamentos, casas e oportunidades para investir.</p>
            </div>

            <div className="home-card">
              <h3>Venda</h3>
              <p>Anuncie seu imóvel com atendimento personalizado.</p>
            </div>

            <div className="home-card">
              <h3>Atendimento rápido</h3>
              <p>Contato direto pelo WhatsApp para agilizar sua negociação.</p>
            </div>
          </div>
        </section>

        <section className="home-section home-cta">
          <h2>Quer ver todos os imóveis?</h2>
          <p>Confira a lista completa de imóveis disponíveis no site.</p>
          <Link to="/imoveis" className="btn-primary">
            Acessar imóveis
          </Link>
        </section>
      </main>
    </div>
  );
}