import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import FeaturedProperties from "../components/site/FeaturedProperties";
import SiteChatWidget from "../components/SiteChatWidget";
import SiteFinancingSimulator from "../components/SiteFinancingSimulator";
import publicApi from "../services/publicApi";
import logo from "../assets/logo-jb.png";
import "./SiteHome.css";

export default function SiteHome() {
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState("SALE");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStatus, setLeadStatus] = useState("");
  const [sendingLead, setSendingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const navigate = useNavigate();

  const whatsappLink =
    "https://wa.me/5511983416160?text=Olá! Gostaria de atendimento sobre imóveis.";

  function handleSearch() {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (businessType) {
      params.set("type", businessType);
    }

    navigate(`/site/imoveis?${params.toString()}`);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function handleLeadChange(event) {
    const { name, value } = event.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();

    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      setLeadStatus("Informe seu nome e telefone para continuarmos.");
      return;
    }

    try {
      setSendingLead(true);
      setLeadStatus("");

      await publicApi.post("/leads", {
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim() || null,
        message:
          leadForm.message.trim() ||
          "Lead enviado pelo formulário da página inicial."
      });

      setLeadStatus("Contato enviado. Nossa equipe falará com você em breve.");
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Erro ao enviar lead:", error);
      setLeadStatus(
        error.response?.data?.error ||
          "Não foi possível enviar agora. Fale conosco pelo WhatsApp."
      );
    } finally {
      setSendingLead(false);
    }
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="modern-home">
      <header className="modern-header">
        <div className="modern-shell modern-header-inner">
          <Link to="/site" className="modern-brand" onClick={closeMobileMenu}>
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className={`modern-nav ${menuOpen ? "is-open" : ""}`}>
            <Link to="/site" className="active" onClick={closeMobileMenu}>
              Início
            </Link>
            <Link to="/site/imoveis" onClick={closeMobileMenu}>
              Imóveis
            </Link>
            <Link to="/site/cadastrar-imovel" onClick={closeMobileMenu}>
              Anuncie seu imóvel
            </Link>
            <a href="#sobre" onClick={closeMobileMenu}>
              Sobre
            </a>
            <a href="#contato" onClick={closeMobileMenu}>
              Contato
            </a>
          </nav>

          <div className="modern-header-actions">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="modern-header-contact"
            >
              <MessageCircle size={18} strokeWidth={1.9} />
              Fale conosco
            </a>

            <button
              type="button"
              className="modern-menu-button"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="modern-hero">
          <div className="modern-hero-backdrop" />

          <div className="modern-shell modern-hero-content">
            <div className="modern-hero-copy">
              <span className="modern-kicker">
                <Sparkles size={15} />
                Imóveis em São Paulo
              </span>

              <h1>
                Um jeito mais simples de encontrar
                <span> o seu próximo imóvel.</span>
              </h1>

              <p>
                Curadoria de oportunidades, atendimento próximo e segurança para
                comprar, vender ou alugar com tranquilidade.
              </p>
            </div>

            <div className="modern-search-panel">
              <div className="modern-search-tabs" role="tablist">
                <button
                  type="button"
                  className={businessType === "SALE" ? "active" : ""}
                  onClick={() => setBusinessType("SALE")}
                >
                  Comprar
                </button>
                <button
                  type="button"
                  className={businessType === "RENT" ? "active" : ""}
                  onClick={() => setBusinessType("RENT")}
                >
                  Alugar
                </button>
              </div>

              <div className="modern-search-row">
                <div className="modern-search-field">
                  <Search size={21} strokeWidth={1.7} />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Bairro, cidade, condomínio ou código"
                    aria-label="Buscar imóvel"
                  />
                </div>

                <button type="button" className="modern-search-button" onClick={handleSearch}>
                  Buscar imóveis
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="modern-hero-meta">
              <div>
                <ShieldCheck size={21} />
                <span>
                  <strong>CRECI 45715-J</strong>
                  Negociação com segurança
                </span>
              </div>

              <div>
                <MapPin size={21} />
                <span>
                  <strong>São Paulo</strong>
                  Atendimento local e próximo
                </span>
              </div>

              <div>
                <Home size={21} />
                <span>
                  <strong>Compra, venda e locação</strong>
                  Soluções para cada momento
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="modern-featured-section">
          <div className="modern-shell modern-section-heading">
            <div>
              <span className="modern-section-label">Seleção da semana</span>
              <h2>Imóveis que merecem sua atenção</h2>
              <p>
                Oportunidades escolhidas para quem busca morar bem ou investir com
                mais segurança.
              </p>
            </div>

            <Link to="/site/imoveis" className="modern-text-link">
              Ver todos
              <ArrowRight size={17} />
            </Link>
          </div>

          <FeaturedProperties />
        </section>

        <section className="modern-about" id="sobre">
          <div className="modern-shell modern-about-grid">
            <div className="modern-about-image" aria-hidden="true">
              <div className="modern-about-badge">
                <Building2 size={21} />
                <span>
                  <strong>JB Pessoa Imóveis</strong>
                  Atendimento que acompanha você do início ao fim.
                </span>
              </div>
            </div>

            <div className="modern-about-copy">
              <span className="modern-section-label">Sobre a JB Pessoa</span>
              <h2>Imobiliária próxima, eficiente e transparente.</h2>
              <p>
                Mais do que anunciar imóveis, ajudamos pessoas a tomar decisões
                importantes com informação clara, atendimento humano e conhecimento
                da região.
              </p>

              <div className="modern-check-list">
                <div>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Atendimento personalizado</strong>
                    Você fala com pessoas, não com respostas automáticas.
                  </span>
                </div>
                <div>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Divulgação profissional</strong>
                    Seu imóvel apresentado com clareza nos canais certos.
                  </span>
                </div>
                <div>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Acompanhamento da negociação</strong>
                    Suporte em todas as etapas até a conclusão do negócio.
                  </span>
                </div>
              </div>

              <a href={whatsappLink} target="_blank" rel="noreferrer" className="modern-dark-link">
                Conversar com um corretor
                <ChevronRight size={18} />
              </a>
            </div>
          </div>
        </section>

        <section className="modern-owner-section">
          <div className="modern-shell modern-owner-card">
            <div>
              <span className="modern-section-label modern-section-label-light">
                Para proprietários
              </span>
              <h2>Seu imóvel merece uma apresentação profissional.</h2>
              <p>
                Cadastre seu imóvel e nossa equipe entra em contato para entender a
                oportunidade, orientar a divulgação e conduzir o atendimento.
              </p>
            </div>

            <Link to="/site/cadastrar-imovel" className="modern-owner-button">
              Quero anunciar meu imóvel
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="modern-financing" id="simulador">
          <div className="modern-shell modern-section-heading modern-section-heading-single">
            <div>
              <span className="modern-section-label">Planejamento</span>
              <h2>Simule seu financiamento</h2>
              <p>
                Faça uma estimativa inicial e entenda melhor as possibilidades para o
                seu próximo imóvel.
              </p>
            </div>
          </div>
          <SiteFinancingSimulator />
        </section>

        <section className="modern-contact" id="contato">
          <div className="modern-shell modern-contact-card">
            <div>
              <span className="modern-section-label">Atendimento</span>
              <h2>Quer ajuda para encontrar o imóvel certo?</h2>
              <p>
                Conte o que você procura. Nossa equipe pode ajudar a filtrar as opções
                e encontrar oportunidades compatíveis com seu perfil.
              </p>
            </div>

            <div className="modern-contact-actions">
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="modern-primary-link">
                <MessageCircle size={18} />
                Chamar no WhatsApp
              </a>
              <button type="button" className="modern-secondary-link" onClick={() => setShowLeadForm(true)}>
                Solicitar contato
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="modern-footer">
        <div className="modern-shell modern-footer-grid">
          <div className="modern-footer-brand">
            <img src={logo} alt="JB Pessoa Imóveis" />
            <p>
              Compra, venda e locação de imóveis com atendimento próximo e
              transparente em São Paulo.
            </p>
          </div>

          <div>
            <h3>Navegação</h3>
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Anuncie seu imóvel</Link>
          </div>

          <div>
            <h3>Contato</h3>
            <a href={whatsappLink} target="_blank" rel="noreferrer">
              (11) 98341-6160
            </a>
            <a href="mailto:imobiliaria@jbpessoaimoveis.com">
              imobiliaria@jbpessoaimoveis.com
            </a>
            <span>Rua Paulo Badi, 67</span>
            <span>Cidade Tiradentes — São Paulo</span>
          </div>

          <div>
            <h3>Redes sociais</h3>
            <a href="https://www.instagram.com/jbpessoaimoveis" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://www.facebook.com/jbpessoaimoveis" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </div>
        </div>

        <div className="modern-shell modern-footer-bottom">
          <span>© {new Date().getFullYear()} JB Pessoa Imóveis</span>
          <span>CRECI 45715-J</span>
        </div>
      </footer>

      {showLeadForm && (
        <div className="modern-modal-backdrop" onMouseDown={() => setShowLeadForm(false)}>
          <div className="modern-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modern-modal-close"
              aria-label="Fechar formulário"
              onClick={() => setShowLeadForm(false)}
            >
              <X size={21} />
            </button>

            <span className="modern-section-label">Solicitar contato</span>
            <h2>Como podemos ajudar?</h2>
            <p>Deixe seus dados e uma breve mensagem. Entraremos em contato.</p>

            <form onSubmit={handleLeadSubmit}>
              <label>
                Nome
                <input name="name" value={leadForm.name} onChange={handleLeadChange} placeholder="Seu nome" />
              </label>
              <label>
                Telefone / WhatsApp
                <input name="phone" value={leadForm.phone} onChange={handleLeadChange} placeholder="(11) 99999-9999" />
              </label>
              <label>
                E-mail
                <input name="email" value={leadForm.email} onChange={handleLeadChange} placeholder="voce@email.com" />
              </label>
              <label>
                Mensagem
                <textarea name="message" value={leadForm.message} onChange={handleLeadChange} placeholder="Conte o que você procura" rows="4" />
              </label>

              {leadStatus && <div className="modern-form-status">{leadStatus}</div>}

              <button type="submit" disabled={sendingLead}>
                {sendingLead ? "Enviando..." : "Enviar contato"}
                {!sendingLead && <ArrowRight size={17} />}
              </button>
            </form>
          </div>
        </div>
      )}

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="modern-floating-whatsapp"
        aria-label="Falar pelo WhatsApp"
      >
        <MessageCircle size={24} fill="currentColor" />
      </a>

      <SiteChatWidget />
    </div>
  );
}
