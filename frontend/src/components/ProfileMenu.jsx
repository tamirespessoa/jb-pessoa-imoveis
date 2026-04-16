import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  }

  function initials() {
    if (!user?.name) return "US";

    return user.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function openChat() {
    navigate("/chat");
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: 45,
          height: 45,
          borderRadius: "50%",
          background: "#3b82f6",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontWeight: "bold",
          userSelect: "none"
        }}
      >
        {initials()}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 60,
            width: 640,
            maxWidth: "calc(100vw - 24px)",
            background: "#f2f2f2",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 999
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "flex-start"
            }}
          >
            <div
              style={{
                width: 124,
                height: 124,
                borderRadius: "50%",
                background: "#60a5fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                color: "#fff",
                flexShrink: 0
              }}
            >
              👤
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 22,
                  lineHeight: 1.2,
                  color: "#1f2937"
                }}
              >
                {user?.name || "Usuário"}
              </h3>

              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: 15,
                  color: "#374151",
                  wordBreak: "break-word"
                }}
              >
                {user?.email || ""}
              </p>

              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 15,
                  color: "#374151",
                  wordBreak: "break-word"
                }}
              >
                {user?.name || "Usuário"}{" "}
                <strong style={{ color: "#1d4ed8" }}>
                  (Cód: {user?.id || ""})
                </strong>
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 15,
                  color: "#1f2937"
                }}
              >
                <span>💬 Chat</span>

                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: user?.online ? "green" : "gray",
                    display: "inline-block"
                  }}
                />

                <span>{user?.online ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>

          <hr
            style={{
              margin: "22px 0",
              border: "none",
              borderTop: "1px solid #d1d5db"
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            <button
              onClick={() => navigate("/perfil")}
              style={{
                minWidth: 150,
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              MEU PERFIL
            </button>

            <button
              onClick={openChat}
              style={{
                minWidth: 150,
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: "#16a34a",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 14
              }}
            >
              ABRIR CHAT
            </button>

            <button
              onClick={logout}
              style={{
                minWidth: 150,
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              SAIR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}