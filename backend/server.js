const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
require("dotenv").config();

const { setupSocket } = require("./src/socket");

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const personRoutes = require("./src/routes/person.routes");
const propertyRoutes = require("./src/routes/property.routes");
const documentRoutes = require("./src/routes/document.routes");
const appointmentRoutes = require("./src/routes/appointment.routes");
const proposalRoutes = require("./src/routes/proposal.routes");
const propertyRequestRoutes = require("./src/routes/propertyRequest.routes");
const leadRoutes = require("./src/routes/lead.routes");
const chatRoutes = require("./src/routes/chat.routes");

const app = express();
const server = http.createServer(app);

setupSocket(server);

const allowedOrigins = [
  "http://localhost:5173",
  "https://jb-pessoa-imoveis.vercel.app"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS bloqueou a origem:", origin);
      return callback(new Error("Origem não permitida pelo CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "API JB Pessoa Imóveis funcionando!" });
});

// ROTAS
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/persons", personRoutes);
app.use("/properties", propertyRoutes);
app.use("/documents", documentRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/proposals", proposalRoutes);
app.use("/property-requests", propertyRequestRoutes);
app.use("/leads", leadRoutes);
app.use("/chat", chatRoutes);

// ERRO GLOBAL
app.use((err, req, res, next) => {
  console.error("Erro global:", err);

  res.status(500).json({
    error: "Erro interno do servidor.",
    details: err.message
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});