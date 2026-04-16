import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  const [attendanceStatus, setAttendanceStatus] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")?.attendanceStatus || "ONLINE"
  );

  const statusMenuRef = useRef(null);

  async function loadConversations() {
    try {
      const res = await api.get("/chat");
      setConversations(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  }

  useEffect(() => {
    loadConversations();

    socket.off("newConversation");
    socket.on("newConversation", () => {
      loadConversations();
    });

    return () => {
      socket.off("newConversation");
    };
  }, []);

  useEffect(() => {
    if (!selected) return;

    setMessages(selected.messages || []);

    socket.emit("joinConversation", selected.id);

    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [selected]);

  useEffect(() => {
    function syncUser() {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(localUser);
      setAttendanceStatus(localUser?.attendanceStatus || "ONLINE");
    }

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target)
      ) {
        setStatusMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function sendMessage() {
    if (!selected || !text.trim()) return;

    try {
      await api.post(`/chat/${selected.id}/message`, {
        text: text.trim()
      });
      setText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }

  function getStatusConfig(status) {
    switch (status) {
      case "ONLINE":
        return {
          label: "Online",
          color: "#9ad59f"
        };
      case "BUSY":
        return {
          label: "Ocupado",
          color: "#ef8b8b"
        };
      case "INVISIBLE":
        return {
          label: "Invisível",
          color: "#f3b160"
        };
      case "OFFLINE":
      default:
        return {
          label: "Offline",
          color: "#d8d8d8"
        };
    }
  }

  function updateStatus(status) {
    const isOnline = status === "ONLINE";

    const updatedUser = {
      ...user,
      online: isOnline,
      attendanceStatus: status
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setAttendanceStatus(status);
    setStatusMenuOpen(false);
    window.dispatchEvent(new Event("storage"));
  }

  const conversationCount = useMemo(
    () => conversations.length,
    [conversations]
  );

  const currentStatus = getStatusConfig(attendanceStatus);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  const statusOptions = [
    { key: "ONLINE", label: "Online", color: "#9ad59f" },
    { key: "BUSY", label: "Ocupado", color: "#ef8b8b" },
    { key: "INVISIBLE", label: "Invisível", color: "#f3b160" },
    { key: "OFFLINE", label: "Offline", color: "#d8d8d8" }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr 280px",
        height: "calc(100vh - 190px)",
        minHeight: 640,
        background: "#f3f4f6",
        border: "1px solid #dcdfe4",
        borderRadius: 18,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          background: "#f7f7f8",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          style={{
            minHeight: 78,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
            background: "#ffffff"
          }}
        >
          <div style={{ fontSize: 28 }}>☰</div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#2563eb",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800
            }}
          >
            JB
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              JB Pessoa Chat
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Atendimento em tempo real
            </div>
          </div>
        </div>

        <div
          style={{
            minHeight: 70,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa"
          }}
        >
          <strong style={{ fontSize: 18, color: "#111827" }}>
            Clientes ({conversationCount})
          </strong>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c7c7c7",
                fontSize: 22,
                textAlign: "center",
                padding: 30
              }}
            >
              Nenhum cliente online
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = selected?.id === conversation.id;
              const lastMessage =
                conversation.messages?.[conversation.messages.length - 1];

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid #ececec",
                    background: isActive ? "#eef4ff" : "#fff",
                    textAlign: "left",
                    padding: 16,
                    cursor: "pointer"
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#111827",
                      marginBottom: 4
                    }}
                  >
                    {conversation.visitorName || "Cliente"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 6
                    }}
                  >
                    {conversation.visitorPhone || "Sem telefone"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#4b5563",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {lastMessage?.text || "Nova conversa"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#ffffff"
        }}
      >
        <div
          style={{
            minHeight: 78,
            borderBottom: "1px solid #e5e7eb",
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fafafa"
          }}
        >
          {selected ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                {selected.visitorName}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {selected.visitorEmail || selected.visitorPhone || "Contato"}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              Atendimento
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 22,
              color: "#d1d5db"
            }}
          >
            <span>👥</span>
            <span>⇄</span>
            <span>✕</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#f8fafc",
            padding: 20
          }}
        >
          {!selected ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c7c7c7",
                fontSize: 22
              }}
            >
              Selecione um cliente para conversar
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c7c7c7",
                fontSize: 20
              }}
            >
              Nenhuma mensagem ainda
            </div>
          ) : (
            messages.map((message) => {
              const isBroker =
                message.senderType === "CORRETOR" ||
                message.senderType === "ADMIN";

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isBroker ? "flex-end" : "flex-start",
                    marginBottom: 14
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: isBroker ? "#dcfce7" : "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "10px 14px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6b7280",
                        marginBottom: 4
                      }}
                    >
                      {message.senderName}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#111827",
                        lineHeight: 1.5
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            minHeight: 82,
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px"
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
            placeholder="Digite uma mensagem..."
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              border: "1px solid #d1d5db",
              padding: "0 16px",
              outline: "none",
              fontSize: 15
            }}
          />

          <button
            type="button"
            onClick={sendMessage}
            style={{
              width: 56,
              height: 50,
              border: "none",
              borderRadius: 14,
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: 700
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#f7f7f8",
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          ref={statusMenuRef}
          style={{
            minHeight: 78,
            borderBottom: "1px solid #e5e7eb",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#6db2f2",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 18,
                flexShrink: 0
              }}
            >
              {userInitials}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#111827",
                  fontSize: 14,
                  lineHeight: 1.2
                }}
              >
                {user?.name || "Usuário"}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#4b5563",
                  marginTop: 4,
                  fontSize: 14
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: currentStatus.color,
                    display: "inline-block"
                  }}
                />
                <span>{currentStatus.label}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatusMenuOpen((prev) => !prev)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              color: "#6b7280",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ˅
          </button>

          {statusMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: 76,
                right: 14,
                width: 190,
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: 14,
                boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
                padding: "8px 0",
                zIndex: 30
              }}
            >
              {statusOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateStatus(item.key)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: "14px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: item.color,
                        display: "inline-block"
                      }}
                    />
                    <span>{item.label}</span>
                  </span>

                  <span
                    style={{
                      color:
                        attendanceStatus === item.key
                          ? "#1f2937"
                          : "transparent",
                      fontSize: 18,
                      fontWeight: 700
                    }}
                  >
                    ✓
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            minHeight: 70,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa"
          }}
        >
          <strong style={{ fontSize: 18, color: "#111827" }}>
            Corretores Online
          </strong>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c7c7c7",
            fontSize: 22,
            textAlign: "center",
            padding: 24
          }}
        >
          {currentStatus.label === "Online"
            ? "Você está online"
            : `Status atual: ${currentStatus.label}`}
        </div>
      </div>
    </div>
  );
}