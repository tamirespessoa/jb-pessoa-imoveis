const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const personRoutes = require("./src/routes/person.routes");
const propertyRoutes = require("./src/routes/property.routes");
const documentRoutes = require("./src/routes/document.routes");
const appointmentRoutes = require("./src/routes/appointment.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://jb-pessoa-imoveis.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("CORS bloqueou a origem:", origin);
        return callback(new Error("Origem não permitida pelo CORS."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "API JB Pessoa Imóveis funcionando!" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/persons", personRoutes);
app.use("/properties", propertyRoutes);
app.use("/documents", documentRoutes);
app.use("/appointments", appointmentRoutes);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});