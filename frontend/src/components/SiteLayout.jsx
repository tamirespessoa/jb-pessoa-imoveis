import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo-jb.png";

export default function SiteLayout({ children }) {
  const [open, setOpen] = useState(false);

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

      {/* 🔥 MENU FLUTUANTE */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: "40%",
          zIndex: 9999
        }}
      >
        {/* BOTÃO LATERAL */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            background: "#d4af37",
            color: "#000",
            padding: "12px 8px",
            cursor: "pointer",
            borderTopRightRadius: "8px",
            borderBottomRightRadius: "8px",
            fontWeight: "bold"
          }}
        >
          Nossos Contatos
        </div>

        {/* PAINEL */}
        {open && (
          <div
            style={{
              position: "absolute",
              left: "50px",
              top: 0,
              background: "#fff",
              padding: "20px",
              width: "250px",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              JB Pessoa Imóveis
            </h3>

            <p><strong>Telefone:</strong><br /> (11) 98341-6160</p>

            <a
              href="https://wa.me/5511983416160"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                marginTop: "10px",
                background: "#25D366",
                color: "#fff",
                padding: "10px",
                textAlign: "center",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              WhatsApp
            </a>

            <a
              href="mailto:contato@jbpessoaimoveis.com.br"
              style={{
                display: "block",
                marginTop: "10px",
                background: "#333",
                color: "#fff",
                padding: "10px",
                textAlign: "center",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              Enviar Email
            </a>
          </div>
        )}
      </div>

      <main>{children}</main>

      <footer className="site-footer" id="contato">
        <div className="site-container footer-content">
          <div className="site-footer-logo">
            <img src={logo} alt="JB Pessoa Imóveis" />
          </div>

          <div className="footer-info">
            <h3>JB Pessoa Imóveis</h3>
            <p>Telefone: (11) 98341-6160</p>
            <p>Email: contato@jbpessoaimoveis.com.br</p>
          </div>
        </div>
      </footer>
    </>
  );
}