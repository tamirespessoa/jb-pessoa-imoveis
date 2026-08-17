const { Server } = require("socket.io");

let io;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://jb-pessoa-imoveis.vercel.app",
  "https://jbpessoaimoveis.com.br",
  "https://www.jbpessoaimoveis.com.br"
];

function isAllowedSocketOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^https:\/\/jb-pessoa-imoveis(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
}

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isAllowedSocketOrigin(origin)) return callback(null, true);
        console.log("Socket.IO bloqueou a origem:", origin);
        return callback(new Error("Origem não permitida pelo Socket.IO."));
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    pingTimeout: 20000,
    pingInterval: 25000
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("joinConversation", (conversationId) => {
      if (!conversationId) return;
      socket.join(String(conversationId));
    });

    socket.on("disconnect", (reason) => {
      console.log("Cliente desconectado:", socket.id, reason);
    });

    socket.on("error", (error) => {
      console.error("Erro Socket.IO:", socket.id, error);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io não inicializado");
  return io;
}

module.exports = {
  setupSocket,
  getIO
};
