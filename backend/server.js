const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
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
const portalRoutes = require("./src/routes/portal.routes");
const siteVisitRoutes = require("./src/routes/siteVisit.routes");

const app = express();
const server = http.createServer(app);

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://jb-pessoa-imoveis.vercel.app",
  "https://jbpessoaimoveis.com.br",
  "https://www.jbpessoaimoveis.com.br"
];

function isAllowedOrigin(origin) {
  // Permite requisições sem Origin,
  // como navegador acessando diretamente uma URL ou Postman
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Permite previews do Vercel
  return /^https:\/\/jb-pessoa-imoveis(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
    origin
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.log("CORS bloqueou a origem:", origin);

    return callback(
      new Error("Origem não permitida pelo CORS.")
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

/* =========================================================
   SOCKET.IO
========================================================= */

setupSocket(server);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "50mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb"
  })
);

/* =========================================================
   UPLOADS
========================================================= */

const uploadDir =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/uploads"
    : path.join(__dirname, "uploads");

console.log("Pasta de uploads:", uploadDir);

/*
  Permite acessar uma imagem diretamente:

  https://jb-pessoa-imoveis.onrender.com/uploads/nome-da-foto.webp
*/
app.use(
  "/uploads",
  express.static(uploadDir)
);

/* =========================================================
   DOWNLOAD DE FOTOS
========================================================= */

/*
  Exemplo:

  https://jb-pessoa-imoveis.onrender.com/api/download/foto.webp
*/

app.get("/api/download/:filename", (req, res) => {
  try {
    // Evita que alguém tente acessar outras pastas
    const filename = path.basename(
      req.params.filename
    );

    const filePath = path.join(
      uploadDir,
      filename
    );

    console.log(
      "Solicitação de download:",
      filePath
    );

    if (!fs.existsSync(filePath)) {
      console.log(
        "Arquivo não encontrado:",
        filePath
      );

      return res.status(404).json({
        error: "Arquivo não encontrado."
      });
    }

    return res.download(
      filePath,
      filename,
      (error) => {
        if (error) {
          console.error(
            "Erro durante download:",
            error
          );

          /*
            Se os headers ainda não tiverem sido enviados,
            podemos retornar o erro.
          */
          if (!res.headersSent) {
            return res.status(500).json({
              error:
                "Não foi possível baixar o arquivo."
            });
          }
        }
      }
    );
  } catch (error) {
    console.error(
      "Erro ao baixar arquivo:",
      error
    );

    return res.status(500).json({
      error: "Erro ao baixar arquivo."
    });
  }
});

/* =========================================================
   ROTA PRINCIPAL
========================================================= */

app.get("/", (req, res) => {
  return res.json({
    message:
      "API JB Pessoa Imóveis funcionando!"
  });
});

/* =========================================================
   ROTAS DA API
========================================================= */

app.use(
  "/auth",
  authRoutes
);

app.use(
  "/users",
  userRoutes
);

app.use(
  "/persons",
  personRoutes
);

app.use(
  "/properties",
  propertyRoutes
);

app.use(
  "/documents",
  documentRoutes
);

app.use(
  "/appointments",
  appointmentRoutes
);

app.use(
  "/proposals",
  proposalRoutes
);

app.use(
  "/property-requests",
  propertyRequestRoutes
);

app.use(
  "/leads",
  leadRoutes
);

app.use(
  "/chat",
  chatRoutes
);

app.use(
  "/portals",
  portalRoutes
);

app.use(
  "/site-visits",
  siteVisitRoutes
);

/* =========================================================
   TRATAMENTO GLOBAL DE ERROS
========================================================= */

app.use(
  (err, req, res, next) => {
    console.error(
      "Erro global:",
      err
    );

    return res.status(500).json({
      error:
        "Erro interno do servidor.",
      details: err.message
    });
  }
);

/* =========================================================
   SERVIDOR
========================================================= */

const PORT =
  process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});