import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import FeaturedProperties from "../components/site/FeaturedProperties";
import SiteChatWidget from "../components/SiteChatWidget";
import SiteFinancingSimulator from "../components/SiteFinancingSimulator";
import logo from "../assets/logo-jb.png";
import "./SiteHome.css";

export default function SiteHome() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const whatsappLink =
    "https://wa.me/5511983185430?text=Olá! Gostaria de atendimento sobre imóveis.";

  function handleSearch() {
    const value = search.trim();

    if (!value) {
      navigate("/site/imoveis");
      return;
    }

    const params = new URLSearchParams();
    params.set("search", value);

    navigate(`/site/imoveis?${params.toString()}`);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function handleGoToRegisterProperty() {
    window.location.href = "/site/cadastrar-imovel";
  }

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
            <a href="#simulador">Simulador</a>
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

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hero-whatsapp-btn"
                >
                  Falar no WhatsApp
                </a>
              </div>

              <div className="hero-search">
                <input
                  type="text"
                  placeholder="Busque por cidade, bairro ou código do imóvel"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />

                <button type="button" onClick={handleSearch}>
                  Buscar
                </button>
              </div>

              <div className="hero-mini-info">
                <span>Compra</span>
                <span>Venda</span>
                <span>Atendimento personalizado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-register-highlight">
        <div className="site-container">
          <div className="register-highlight-shell">
            <div className="register-highlight-content">
              <div className="register-text">
                <span className="section-badge">Para proprietários</span>
                <h2>Quer anunciar seu imóvel conosco?</h2>
                <p>
                  Cadastre seu imóvel pelo site e nossa equipe entrará em
                  contato para avaliar, orientar e ajudar na venda ou locação
                  com segurança.
                </p>
              </div>

              <div className="register-highlight-action">
                <button
                  type="button"
                  className="register-highlight-button"
                  onClick={handleGoToRegisterProperty}
                >
                  Cadastrar meu imóvel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedProperties />

      <section className="site-diferenciais">
        <div className="site-container">
          <div className="section-header-center">
            <span className="section-badge">Diferenciais</span>
            <h2>Por que escolher a JB Pessoa Imóveis?</h2>
            <p>
              Uma experiência mais próxima, segura e focada em resultado para
              compradores, vendedores e proprietários.
            </p>
          </div>

          <div className="diferenciais-grid">
            <div className="diferencial-card">
              <div className="diferencial-icon">01</div>
              <h3>Atendimento personalizado</h3>
              <p>
                Você recebe suporte direto e humano em todas as etapas da
                negociação.
              </p>
            </div>

            <div className="diferencial-card">
              <div className="diferencial-icon">02</div>
              <h3>Imóveis selecionados</h3>
              <p>
                Trabalhamos com oportunidades bem apresentadas e com informações
                claras.
              </p>
            </div>

            <div className="diferencial-card">
              <div className="diferencial-icon">03</div>
              <h3>Agilidade no processo</h3>
              <p>
                Mais rapidez no atendimento, nas visitas e na condução da
                negociação.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="site-about" id="sobre">
        <div className="site-container">
          <div className="about-content">
            <span className="section-badge">Sobre nós</span>
            <h2>JB Pessoa Imóveis</h2>
            <p>
              Trabalhamos com seriedade, transparência e dedicação para conectar
              pessoas aos melhores imóveis. Nosso objetivo é oferecer um
              atendimento humanizado e uma experiência segura em cada etapa da
              negociação.
            </p>
          </div>
        </div>
      </section>

      <section id="simulador">
        <SiteFinancingSimulator />
      </section>

      <section className="site-contact-cta" id="contato">
        <div className="site-container">
          <div className="site-contact-cta-card">
            <div>
              <span className="section-badge">Atendimento</span>
              <h2>Pronto para encontrar ou anunciar seu imóvel?</h2>
              <p>
                Fale agora com a JB Pessoa Imóveis e receba atendimento rápido
                pelo WhatsApp.
              </p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="site-contact-cta-button"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-container footer-content">
          <div className="site-footer-brand">
            <div className="site-footer-logo">
              <img src={logo} alt="JB Pessoa Imóveis" />
            </div>

            <p>
              Atendimento com seriedade, transparência e foco no melhor negócio.
            </p>
          </div>

          <div className="footer-info">
            <h3>JB Pessoa Imóveis</h3>
            <p>Telefone: (11) 98318-5430</p>
            <p>Email: contato@jbpessoaimoveis.com.br</p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="footer-whatsapp"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </footer>

      <SiteChatWidget />
    </div>
  );
}