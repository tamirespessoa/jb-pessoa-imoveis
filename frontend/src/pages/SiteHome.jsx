import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import FeaturedProperties from "../components/site/FeaturedProperties";
import SiteChatWidget from "../components/SiteChatWidget";
import SiteFinancingSimulator from "../components/SiteFinancingSimulator";
import publicApi from "../services/publicApi";
import logo from "../assets/logo-jb.png";
import "./SiteHome.css";

export default function SiteHome() {
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState("comprar");
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    mobile: "",
    message: ""
  });
  const [showLeadBubbleForm, setShowLeadBubbleForm] = useState(false);
  const [leadStatus, setLeadStatus] = useState("");
  const [sendingLead, setSendingLead] = useState(false);

  const navigate = useNavigate();

  const whatsappLink =
    "https://wa.me/5511983416160?text=Olá! Gostaria de atendimento sobre imóveis.";

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

  function handleLeadChange(event) {
    const { name, value } = event.target;
    setLeadForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();

    if (!leadForm.name.trim()) {
      setLeadStatus("Informe seu nome para enviarmos seu atendimento.");
      return;
    }

    if (!leadForm.phone.trim() && !leadForm.mobile.trim()) {
      setLeadStatus("Informe um telefone ou celular para contato.");
      return;
    }

    try {
      setSendingLead(true);
      setLeadStatus("");

      await publicApi.post("/leads", {
        name: leadForm.name.trim(),
        phone: leadForm.mobile.trim() || leadForm.phone.trim(),
        email: leadForm.email.trim() || null,
        message:
          leadForm.message.trim() ||
          "Lead enviado pelo formulário premium da página inicial."
      });

      setLeadStatus("Contato enviado com sucesso. Um corretor falará com você em breve.");
      setLeadForm({
        name: "",
        email: "",
        phone: "",
        mobile: "",
        message: ""
      });
    } catch (error) {
      console.error("Erro ao enviar lead:", error);
      setLeadStatus(
        error.response?.data?.error ||
          "Não foi possível enviar agora. Tente pelo WhatsApp."
      );
    } finally {
      setSendingLead(false);
    }
  }

  return (
    <div className="site-home premium-site-home">
      <header className="premium-header">
        <div className="premium-container premium-header-content">
          <Link to="/site" className="premium-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className="premium-nav">
            <Link to="/site" className="active">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <a href="#servicos">Serviços</a>
            <a href="#sobre">Institucional</a>
            <a href="#contato">Contato</a>
          </nav>

          <div className="premium-header-actions">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="premium-phone">
              <span className="premium-phone-icon">☏</span>
              <span>
                <small>Fale pelo WhatsApp</small>
                <strong>(11) 98341-6160</strong>
              </span>
            </a>

            <a href={whatsappLink} target="_blank" rel="noreferrer" className="premium-online-btn">
              <span>♙</span>
              Corretor Online
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="premium-hero-overlay"></div>

          <div className="premium-container premium-hero-grid">
            <div className="premium-hero-content">
              <span className="premium-eyebrow">ENCONTRE O IMÓVEL IDEAL</span>

              <h1>
                Seu maior sonho
                <strong> tem um endereço</strong>
              </h1>

              <p>
                As melhores oportunidades para comprar ou alugar imóveis em São Paulo
                com segurança, transparência e exclusividade.
              </p>

              <div className="premium-tabs">
                <button
                  type="button"
                  className={businessType === "comprar" ? "active" : ""}
                  onClick={() => setBusinessType("comprar")}
                >
                  ⌂ Comprar
                </button>

                <button
                  type="button"
                  className={businessType === "alugar" ? "active" : ""}
                  onClick={() => setBusinessType("alugar")}
                >
                  ⚿ Alugar
                </button>
              </div>

              <div className="premium-search">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Digite bairro, cidade ou condomínio"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <button type="button" onClick={handleSearch}>
                  Buscar
                </button>
              </div>

              <div className="premium-benefits">
                <div>
                  <span>♜</span>
                  <strong>Imóveis</strong>
                  <small>Selecionados</small>
                </div>

                <div>
                  <span>♚</span>
                  <strong>Atendimento</strong>
                  <small>Personalizado</small>
                </div>

                <div>
                  <span>♛</span>
                  <strong>Segurança em</strong>
                  <small>todas as etapas</small>
                </div>

                <div>
                  <span>✺</span>
                  <strong>Avaliação</strong>
                  <small>Gratuita</small>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="premium-lead-bubble-callout"
              onClick={() => setShowLeadBubbleForm(true)}
            >
              <span className="premium-lead-bubble-icon">💬</span>
              <span>
                <strong>Não encontrou o imóvel ideal?</strong>
                <small>Descreva o que procura</small>
              </span>
            </button>
          </div>
        </section>

        <section className="premium-featured-wrap">
          <div className="premium-container premium-section-title-row">
            <div>
              <span className="premium-section-kicker">DESTAQUES</span>
              <h2>Imóveis em Destaque</h2>
            </div>

            <Link to="/site/imoveis" className="premium-outline-link">
              Ver todos os imóveis
              <span>›</span>
            </Link>
          </div>

          <FeaturedProperties />
        </section>

        <section className="premium-about-strip" id="servicos">
          <div className="premium-container premium-about-grid">
            <div>
              <span className="premium-section-kicker">SOBRE NÓS</span>
              <h2>Experiência e confiança para realizar bons negócios</h2>
              <p>
                A JB Pessoa Imóveis une atendimento humano, tecnologia e conhecimento
                local para conectar clientes aos imóveis certos com muito mais segurança.
              </p>
            </div>

            <div className="premium-stat-card">
              <strong>150+</strong>
              <span>imóveis cadastrados</span>
            </div>

            <div className="premium-stat-card">
              <strong>100%</strong>
              <span>atendimento personalizado</span>
            </div>
          </div>
        </section>

        <section className="site-register-highlight">
          <div className="premium-container">
            <div className="register-highlight-content">
              <div className="register-text">
                <span className="premium-section-kicker">PARA PROPRIETÁRIOS</span>
                <h2>Quer anunciar seu imóvel conosco?</h2>
                <p>
                  Cadastre seu imóvel pelo site e nossa equipe entrará em contato para
                  avaliar, orientar e ajudar na venda ou locação com segurança.
                </p>
              </div>

              <button
                type="button"
                className="register-highlight-button"
                onClick={handleGoToRegisterProperty}
              >
                Cadastrar meu imóvel
              </button>
            </div>
          </div>
        </section>

        <section id="simulador" className="premium-simulator-section">
          <SiteFinancingSimulator />
        </section>

        <section className="premium-contact-cta" id="contato">
          <div className="premium-container">
            <div className="premium-contact-card">
              <div>
                <span className="premium-section-kicker">ATENDIMENTO</span>
                <h2>Pronto para encontrar ou anunciar seu imóvel?</h2>
                <p>
                  Fale agora com a JB Pessoa Imóveis e receba atendimento rápido pelo WhatsApp.
                </p>
              </div>

              <a href={whatsappLink} target="_blank" rel="noreferrer">
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>


      {showLeadBubbleForm && (
        <div className="premium-lead-modal-overlay">
          <div className="premium-lead-card premium-lead-card-modal">
            <button
              type="button"
              className="premium-close-btn"
              aria-label="Fechar"
              onClick={() => setShowLeadBubbleForm(false)}
            >
              ×
            </button>

            <div className="premium-lead-image">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=620&q=80"
                alt="Atendimento JB Pessoa Imóveis"
              />
              <div className="premium-lead-logo">
                <img src={logo} alt="JB Pessoa Imóveis" />
              </div>
            </div>

            <form className="premium-lead-form" onSubmit={handleLeadSubmit}>
              <h2>
                Não vá embora! O imóvel dos seus sonhos pode estar aqui.
                <span> Descreva-o abaixo:</span>
              </h2>

              <label>
                <span>♙</span>
                <input
                  name="name"
                  value={leadForm.name}
                  onChange={handleLeadChange}
                  placeholder="Nome"
                />
              </label>

              <label>
                <span>@</span>
                <input
                  name="email"
                  value={leadForm.email}
                  onChange={handleLeadChange}
                  placeholder="E-mail"
                />
              </label>

              <label>
                <span>☎</span>
                <input
                  name="phone"
                  value={leadForm.phone}
                  onChange={handleLeadChange}
                  placeholder="Telefone"
                />
              </label>

              <label>
                <span>☎</span>
                <input
                  name="mobile"
                  value={leadForm.mobile}
                  onChange={handleLeadChange}
                  placeholder="Celular"
                />
              </label>

              <textarea
                name="message"
                value={leadForm.message}
                onChange={handleLeadChange}
                placeholder="Descreva o imóvel que procura"
              />

              {leadStatus && <p className="premium-lead-status">{leadStatus}</p>}

              <button type="submit" disabled={sendingLead}>
                ✈ {sendingLead ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="premium-footer">
        <div className="premium-container premium-footer-grid">
          <div>
            <img src={logo} alt="JB Pessoa Imóveis" />
            <p>
              Atendimento com seriedade, transparência e foco no melhor negócio.
              A JB Pessoa Imóveis conecta você às melhores oportunidades.
            </p>
          </div>

          <div>
            <h3>Contato</h3>
            <a href={whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp: (11) 98341-6160
            </a>
            <a href="mailto:imobiliaria@jbpessoaimoveis.com">
              imobiliaria@jbpessoaimoveis.com
            </a>
          </div>

          <div>
            <h3>Endereço</h3>
            <p>Rua Paulo Badi, 67</p>
            <p>Cidade Tiradentes — São Paulo</p>
            <p>CEP: 08471-080</p>
          </div>

          <div>
            <h3>Links rápidos</h3>
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Cadastre seu imóvel</Link>
          </div>
        </div>

        <div className="premium-footer-copy">
          © {new Date().getFullYear()} JB Pessoa Imóveis. Todos os direitos reservados.
        </div>
      </footer>

      <a href={whatsappLink} target="_blank" rel="noreferrer" className="premium-floating-whatsapp">
        ☎
      </a>

      <SiteChatWidget />
    </div>
  );
}
