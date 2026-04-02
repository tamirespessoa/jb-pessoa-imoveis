import { Link } from "react-router-dom";
import FeaturedProperties from "../components/site/FeaturedProperties";
import logo from "../assets/logo-jb.png";
import "./SiteHome.css";

export default function SiteHome() {
  return (
    <div className="site-home">
      <header className="site-header">
        <div className="site-container header-content">
          <Link to="/site" className="site-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className="site-nav">
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Cadastre seu imóvel</Link>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-overlay">
          <div className="site-container">
            <div className="hero-content">
              <span className="hero-badge">
                Imóveis com elegância e confiança
              </span>

              <h1>Encontre o imóvel ideal para morar ou investir</h1>

              <p>
                Atendimento próximo, oportunidades selecionadas e a experiência
                que você precisa para fazer o melhor negócio.
              </p>

              <div className="hero-actions">
                <Link to="/site/imoveis" className="hero-primary-btn">
                  Ver imóveis
                </Link>

                <Link
                  to="/site/cadastrar-imovel"
                  className="hero-secondary-btn"
                >
                  Cadastrar meu imóvel
                </Link>
              </div>

              <div className="hero-search">
                <input
                  type="text"
                  placeholder="Busque por cidade, bairro, tipo ou código do imóvel"
                />
                <button type="button">Buscar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-register-highlight">
        <div className="site-container register-highlight-content">
          <div className="register-text">
            <span className="section-badge">Para proprietários</span>
            <h2>Quer anunciar seu imóvel conosco?</h2>
            <p>
              Cadastre seu imóvel pelo site e nossa equipe entrará em contato
              para analisar as informações e dar continuidade ao atendimento.
            </p>
          </div>

          <Link
            to="/site/cadastrar-imovel"
            className="register-highlight-button"
          >
            Cadastrar meu imóvel
          </Link>
        </div>
      </section>

      <FeaturedProperties />

      <section className="site-about" id="sobre">
        <div className="site-container about-content">
          <span className="section-badge">Sobre nós</span>
          <h2>JB Pessoa Imóveis</h2>
          <p>
            Trabalhamos com seriedade, transparência e dedicação para conectar
            pessoas aos melhores imóveis. Nosso objetivo é oferecer um
            atendimento humanizado e uma experiência segura em cada etapa da
            negociação.
          </p>
        </div>
      </section>

      <footer className="site-footer" id="contato">
        <div className="site-container footer-content">
          <div className="site-footer-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </div>

          <div className="footer-info">
            <h3>JB Pessoa Imóveis</h3>
            <p>Telefone: (11) 98318-5430</p>
            <p>Email: contato@jbpessoaimoveis.com.br</p>
          </div>
        </div>
      </footer>
    </div>
  );
}