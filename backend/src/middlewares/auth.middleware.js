const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token não enviado." });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      return res.status(401).json({ error: "Token mal formatado." });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: "Token mal formatado." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "JWT_SECRET não configurado no servidor."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded.sub ||
      decoded._id ||
      null;

    req.user = {
      id: userId,
      userId,
      email: decoded.email || null,
      name: decoded.name || decoded.fullName || null,
      role: decoded.role || null
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido ou expirado."
    });
  }
}

module.exports = authMiddleware;