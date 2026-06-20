import { Link } from "react-router-dom";
import "./SiteFooter.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="site-footer-brand">
          <img
            src="/logo-jb.png"
            alt="JB Pessoa Imóveis"
            className="site-footer-logo"
          />
          <div>
            <h3>JB Pessoa Imóveis</h3>
            <p>Atendimento com segurança, agilidade e confiança.</p>
          </div>
        </div>

        <div className="site-footer-links">
          <div>
            <h4>Navegação</h4>
            <Link to="/site">Início</Link>
            <Link to="/site/imoveis">Imóveis</Link>
            <Link to="/site/cadastrar-imovel">
              Cadastre seu imóvel
            </Link>
          </div>

          <div>
            <h4>Contato</h4>

            <a
              href="https://wa.me/5511983416160"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp: (11) 98341-6160
            </a>

            <a href="mailto:imobiliaria@jbpessoaimoveis.com.br">
              imobiliaria@jbpessoaimoveis.com.br
            </a>

            <a
              href="https://www.instagram.com/jbpessoaimoveis"
              target="_blank"
              rel="noreferrer"
            >
              Instagram: @jbpessoaimoveis
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61588653701470"
              target="_blank"
              rel="noreferrer"
            >
              Facebook: JB Pessoa Imóveis
            </a>

            <span>São Paulo - SP</span>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        © 2026 JB Pessoa Imóveis. Todos os direitos reservados.
      </div>
    </footer>
  );
}