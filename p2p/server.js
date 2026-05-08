import express from "express";
import http from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

const db = new Database(path.join(__dirname, "data", "app.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`);

const app = express();
app.use(express.json());

app.use(cors({
  origin: FRONTEND_ORIGIN
}));

app.use(express.static(path.join(__dirname, "public")));

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Non connecté" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

function randomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare(
    "SELECT * FROM users WHERE username = ?"
  ).get(username);

  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      username: user.username,
      role: user.role
    }
  });
});

app.post("/api/sessions", authRequired, (req, res) => {
  const code = randomCode();

  db.prepare(
    "INSERT INTO sessions (code, owner_id, created_at) VALUES (?, ?, ?)"
  ).run(code, req.user.id, new Date().toISOString());

  res.json({ code });
});

app.post("/api/sessions/join", authRequired, (req, res) => {
  const { code } = req.body;

  const session = db.prepare(
    "SELECT * FROM sessions WHERE code = ?"
  ).get(code);

  if (!session) {
    return res.status(404).json({ error: "Session inconnue" });
  }

  res.json({ ok: true });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: FRONTEND_ORIGIN
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-session", ({ code }) => {
    socket.join(code);
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", {
      from: socket.id,
      data
    });
  });
});

server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
