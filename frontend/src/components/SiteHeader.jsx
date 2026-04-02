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
            <span>Seu imóvel com segurança</span>
          </div>
        </Link>

        <nav className="site-header-nav">
          <Link
            to="/site"
            className={`site-header-link ${isActive("/site") && location.pathname === "/site" ? "active" : ""}`}
          >
            Início
          </Link>

          <Link
            to="/site/imoveis"
            className={`site-header-link ${isActive("/site/imoveis") ? "active" : ""}`}
          >
            Imóveis
          </Link>

          <Link
            to="/site/cadastrar-imovel"
            className={`site-header-link ${isActive("/site/cadastrar-imovel") ? "active" : ""}`}
          >
            Cadastre seu imóvel
          </Link>
        </nav>

        <a
          href="https://wa.me/5511983185430"
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