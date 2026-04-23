import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function SiteChatWidget() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showQuickPanel, setShowQuickPanel] = useState(true);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  const wrapperRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  async function startConversation() {
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message || "Olá! Gostaria de falar com um corretor."
      };

      const res = await api.post("/chat", payload);

      setConversation(res.data);
      setMessages(res.data.messages || []);
      setShowQuickPanel(false);

      socket.emit("joinConversation", res.data.id);
    } catch (err) {
      console.error("Erro completo /chat:", err?.response?.data || err);
      setError(err?.response?.data?.error || "Erro ao iniciar atendimento.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!conversation || !text.trim()) return;

    try {
      await api.post(`/chat/${conversation.id}/message`, {
        text: text.trim()
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          senderType: "CLIENTE",
          text: text.trim()
        }
      ]);

      setText("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err?.response?.data || err);
    }
  }

  function openWhatsApp() {
    window.open(
      "https://wa.me/5511983185430?text=Olá! Gostaria de atendimento sobre imóveis.",
      "_blank"
    );
    setMenuOpen(false);
  }

  function openQuickChat() {
    setChatOpen(true);
    setMenuOpen(false);
    setShowQuickPanel(true);
    setConversation(null);
    setMessages([]);
    setError("");
  }

  function closeChat() {
    setChatOpen(false);
    setMenuOpen(false);
    setShowQuickPanel(true);
    setConversation(null);
    setMessages([]);
    setError("");
    setText("");
  }

  function goToProperties() {
    navigate("/site/imoveis");
    setChatOpen(false);
    setMenuOpen(false);
  }

  function chooseBroker() {
    setShowQuickPanel(false);
    setForm((prev) => ({
      ...prev,
      message: prev.message || "Olá! Gostaria de falar com um corretor."
    }));
  }

  const widgetWidth = isMobile ? "calc(100vw - 20px)" : 390;
  const widgetRight = isMobile ? 10 : 24;
  const widgetBottom = isMobile ? 10 : 24;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        right: widgetRight,
        bottom: widgetBottom,
        zIndex: 5,
        pointerEvents: "none",
        fontFamily: "Arial, sans-serif"
      }}
    >
      {!chatOpen && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            pointerEvents: "none"
          }}
        >
          {menuOpen && (
            <div
              style={{
                width: isMobile ? 235 : 270,
                background: "#ffffff",
                borderRadius: 20,
                boxShadow: "0 22px 55px rgba(8, 26, 58, 0.22)",
                border: "1px solid rgba(201, 166, 72, 0.18)",
                overflow: "hidden",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? "translateY(0) scale(1)"
                  : "translateY(10px) scale(0.98)",
                transition: "all 0.25s ease",
                pointerEvents: "auto"
              }}
            >
              <button
                type="button"
                onClick={openQuickChat}
                style={premiumMenuItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fbf8ef";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <span style={menuIconStyle}>💬</span>
                <span>Atendimento online</span>
              </button>

              <button
                type="button"
                onClick={openWhatsApp}
                style={{
                  ...premiumMenuItem,
                  borderBottom: "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fbf8ef";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <span style={menuIconStyle}>☎</span>
                <span>Fale Conosco</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir contato"
            style={{
              minWidth: isMobile ? 180 : 210,
              height: 62,
              padding: "0 22px",
              borderRadius: 999,
              border: "1px solid rgba(212, 175, 55, 0.42)",
              background:
                "linear-gradient(135deg, #081a3a 0%, #0d234c 55%, #102b59 100%)",
              color: "#f8e7a8",
              cursor: "pointer",
              boxShadow:
                "0 18px 38px rgba(8, 26, 58, 0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              position: "relative",
              transition: "all 0.25s ease",
              pointerEvents: "auto"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 24px 46px rgba(8, 26, 58, 0.35), inset 0 1px 0 rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 18px 38px rgba(8, 26, 58, 0.30), inset 0 1px 0 rgba(255,255,255,0.08)";
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(212, 175, 55, 0.14)",
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#f4d77d",
                  flexShrink: 0
                }}
              >
                💬
              </span>

              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.1
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(244, 215, 125, 0.72)",
                    fontWeight: 700
                  }}
                >
                  Atendimento
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f8e7a8"
                  }}
                >
                  Fale conosco
                </span>
              </span>
            </span>

            <span
              style={{
                fontSize: 16,
                color: "#d4af37",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease"
              }}
            >
              ▾
            </span>
          </button>
        </div>
      )}

      <div
        style={{
          width: widgetWidth,
          background: "#ffffff",
          borderRadius: isMobile ? 18 : 22,
          boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
          overflow: "hidden",
          border: "1px solid rgba(17,24,39,0.06)",
          opacity: chatOpen ? 1 : 0,
          transform: chatOpen
            ? "translateY(0) scale(1)"
            : "translateY(18px) scale(0.98)",
          pointerEvents: chatOpen ? "auto" : "none",
          transition: "all 0.28s ease"
        }}
      >
        <div
          style={{
            background: "#d4a300",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#111827",
            fontWeight: 700,
            fontSize: 16
          }}
        >
          <span>Corretor Online</span>

          <button
            type="button"
            onClick={closeChat}
            style={{
              border: "none",
              background: "transparent",
              color: "#111827",
              fontSize: 18,
              cursor: "pointer",
              padding: 0,
              lineHeight: 1
            }}
          >
            ▾
          </button>
        </div>

        {showQuickPanel ? (
          <div
            style={{
              background: "#f5f5f5",
              minHeight: 430,
              padding: "18px 18px 22px"
            }}
          >
            <div style={{ textAlign: "center", margin: "10px 0 20px" }}>
              <img
                src="/logo-jb.png"
                alt="JB Pessoa Imóveis"
                style={{
                  width: 120,
                  maxWidth: "100%",
                  opacity: 0.95
                }}
              />
            </div>

            <div
              style={{
                background: "#e7e7e7",
                borderRadius: 20,
                padding: "18px 20px",
                maxWidth: "88%",
                fontSize: 14,
                color: "#111827",
                lineHeight: 1.7,
                marginBottom: 20,
                position: "relative",
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
              }}
            >
              Boa tarde, em que posso ajudar?
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  fontSize: 12,
                  color: "#6b7280"
                }}
              >
                13:17
              </span>
            </div>

            <button
              type="button"
              onClick={goToProperties}
              style={quickButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#cfcfcf";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d9d9d9";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={quickButtonIcon}>🏠</span>
              <span>Procurar Imóveis</span>
            </button>

            <button
              type="button"
              onClick={chooseBroker}
              style={quickButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#cfcfcf";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d9d9d9";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={quickButtonIcon}>👨‍💼</span>
              <span>Fale com um Corretor</span>
            </button>

            <button
              type="button"
              onClick={openWhatsApp}
              style={quickButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#cfcfcf";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d9d9d9";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={quickButtonIcon}>📞</span>
              <span>Falar via WhatsApp</span>
            </button>
          </div>
        ) : !conversation ? (
          <div style={{ padding: 18, background: "#ffffff" }}>
            <div
              style={{
                marginBottom: 14,
                fontSize: 14,
                color: "#4b5563",
                lineHeight: 1.6
              }}
            >
              Preencha os dados abaixo para iniciar o atendimento.
            </div>

            <input
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={premiumField}
            />

            <input
              placeholder="Seu telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={premiumField}
            />

            <input
              placeholder="Seu email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={premiumField}
            />

            <textarea
              placeholder="Como podemos ajudar?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={{
                ...premiumField,
                minHeight: 96,
                resize: "none",
                paddingTop: 14
              }}
            />

            {error ? (
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#dc2626",
                  lineHeight: 1.5
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={startConversation}
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                border: "none",
                borderRadius: 14,
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 12px 24px rgba(22,163,74,0.22)",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "Iniciando..." : "Iniciar atendimento"}
            </button>
          </div>
        ) : (
          <>
            <div
              ref={messagesRef}
              style={{
                height: isMobile ? 280 : 320,
                overflowY: "auto",
                padding: 16,
                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)"
              }}
            >
              {messages.map((m) => {
                const isClient = m.senderType === "CLIENTE";

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: isClient ? "flex-start" : "flex-end",
                      marginBottom: 12
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        background: isClient ? "#ffffff" : "#dcfce7",
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        padding: "10px 12px",
                        fontSize: 14,
                        color: "#111827",
                        lineHeight: 1.6,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                padding: 14,
                borderTop: "1px solid #e5e7eb",
                background: "#ffffff"
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                style={{
                  flex: 1,
                  height: 46,
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "0 14px",
                  outline: "none",
                  fontSize: 14
                }}
              />

              <button
                type="button"
                onClick={sendMessage}
                style={{
                  width: 50,
                  height: 46,
                  border: "none",
                  borderRadius: 12,
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: "0 10px 20px rgba(37,99,235,0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const premiumMenuItem = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  textAlign: "left",
  padding: "18px 18px",
  fontSize: 16,
  color: "#111827",
  cursor: "pointer",
  borderBottom: "1px solid #f1f5f9",
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontWeight: 600,
  transition: "background 0.2s ease"
};

const menuIconStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#f8fafc",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0
};

const premiumField = {
  width: "100%",
  height: 46,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "0 14px",
  marginBottom: 12,
  outline: "none",
  boxSizing: "border-box",
  fontSize: 14,
  color: "#111827",
  background: "#ffffff",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease"
};

const quickButton = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "fit-content",
  maxWidth: "100%",
  marginBottom: 14,
  background: "#d9d9d9",
  border: "none",
  padding: "14px 18px",
  borderRadius: 18,
  textAlign: "left",
  fontSize: 15,
  color: "#111827",
  cursor: "pointer",
  lineHeight: 1.4,
  textDecoration: "none",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
};

const quickButtonIcon = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#ececec",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0
};