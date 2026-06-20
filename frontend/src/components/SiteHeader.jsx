import { Link, useLocation } from "react-router-dom";
import "./SiteHeader.css";

export default function SiteHeader() {
  const location = useLocation();

  function isActive(path) {
    if (path === "/site") {
      return location.pathname === "/site";
    }

    return location.pathname.startsWith(path);
  }

  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link to="/site" className="site-header-brand">
          <img
            src="/logo-jb.png"
            alt="JB Pessoa Imóveis"
            className="site-header-logo"
          />

          <div className="site-header-brand-text">
            <strong>JB Pessoa Imóveis</strong>
            <span>Compra • Venda • Locação</span>
          </div>
        </Link>

        <nav className="site-header-nav">
          <Link
            to="/site"
            className={`site-header-link ${
              isActive("/site") && location.pathname === "/site" ? "active" : ""
            }`}
          >
            Início
          </Link>

          <Link
            to="/site/imoveis"
            className={`site-header-link ${
              isActive("/site/imoveis") ? "active" : ""
            }`}
          >
            Imóveis
          </Link>

          <Link
            to="/site/cadastrar-imovel"
            className={`site-header-link ${
              isActive("/site/cadastrar-imovel") ? "active" : ""
            }`}
          >
            Cadastre seu imóvel
          </Link>

          <Link to="/site#sobre" className="site-header-link">
            Sobre
          </Link>

          <Link to="/site#contato" className="site-header-link">
            Contato
          </Link>
        </nav>

        <a
          href="https://wa.me/5511983416160"
          target="_blank"
          rel="noreferrer"
          className="site-header-button"
        >
          Fale conosco
        </a>
      </div>
    </header>
  );
}
