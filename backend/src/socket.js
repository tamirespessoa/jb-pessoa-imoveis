const { Server } = require("socket.io");

let io;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://jb-pessoa-imoveis.vercel.app"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io não inicializado");
  }
  return io;
}

module.exports = {
  setupSocket,
  getIO
};