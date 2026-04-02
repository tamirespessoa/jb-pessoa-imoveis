import { Link } from "react-router-dom";
import logo from "../assets/logo-jb.png";

export default function SiteLayout({ children }) {
  return (
    <>
      <header className="site-header">
        <div className="site-container header-content">
          <Link to="/site" className="site-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </Link>

          <nav className="site-nav">
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">Cadastre seu imóvel</Link>
            <a href="/site#sobre">Sobre</a>
            <a href="/site#contato">Contato</a>
          </nav>
        </div>
      </header>

      <main>{children}</main>

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
    </>
  );
}