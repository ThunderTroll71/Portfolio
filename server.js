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
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
const db = new Database(path.join(__dirname, "data", "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    code TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    user_a TEXT NOT NULL,
    user_b TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER
  );
`);

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.static(__dirname));

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Non connecté" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Token invalide" }); }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
    next();
  });
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Auth ─────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Champs manquants" });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Identifiants invalides" });
  res.json({ token: signToken(user), user: { username: user.username, role: user.role } });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

// ── Sessions ──────────────────────────────────────────────────────
app.post("/api/sessions", authRequired, (req, res) => {
  const code = randomCode();
  db.prepare("INSERT INTO sessions (code, owner_id, created_at) VALUES (?, ?, ?)").run(code, req.user.id, new Date().toISOString());
  res.json({ code });
});

app.post("/api/sessions/join", authRequired, (req, res) => {
  const { code } = req.body;
  const session = db.prepare("SELECT * FROM sessions WHERE code = ?").get(code?.toUpperCase());
  if (!session) return res.status(404).json({ error: "Session inconnue" });
  res.json({ ok: true });
});

// ── TURN config ───────────────────────────────────────────────────
app.get("/api/turn-config", authRequired, (req, res) => {
  const url = process.env.TURN_URL;
  const username = process.env.TURN_USERNAME;
  const credential = process.env.TURN_CREDENTIAL;
  if (!url || !username || !credential) return res.json({ servers: [] });
  res.json({
    servers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: `turn:${url}:3478`,              username, credential },
      { urls: `turn:${url}:3478?transport=tcp`, username, credential },
      { urls: `turn:${url}:443?transport=tcp`,  username, credential }
    ]
  });
});

// ── Admin ─────────────────────────────────────────────────────────
app.get("/api/admin/users", adminRequired, (req, res) => {
  res.json(db.prepare("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC").all());
});

app.post("/api/admin/users", adminRequired, (req, res) => {
  const { username, password, role = "user" } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Champs manquants" });
  if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Rôle invalide" });
  if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) return res.status(409).json({ error: "Nom déjà pris" });
  const result = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run(username, bcrypt.hashSync(password, 12), role);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete("/api/admin/users/:id", adminRequired, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: "Impossible de se supprimer" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/admin/users/:id/password", adminRequired, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: "Minimum 6 caractères" });
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/stats", adminRequired, (req, res) => {
  res.json({
    users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
    sessions: db.prepare("SELECT COUNT(*) as c FROM sessions").get().c,
    logs: db.prepare("SELECT COUNT(*) as c FROM session_logs").get().c
  });
});

app.get("/api/admin/session-logs", adminRequired, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM session_logs ORDER BY started_at DESC LIMIT 100
  `).all();
  res.json(logs);
});

// ── Socket.IO — Signaling WebRTC ──────────────────────────────────
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: FRONTEND_ORIGIN } });
const rooms = new Map(); // code → [{ id, username }]
const sessionStartTimes = new Map(); // code → { startedAt, userA, userB }

io.use((socket, next) => {
  try { socket.user = jwt.verify(socket.handshake.auth.token, JWT_SECRET); next(); }
  catch { next(new Error("Unauthorized")); }
});

io.on("connection", (socket) => {
  socket.on("join-session", ({ code }) => {
    code = code.toUpperCase();

    // Quitter l'ancienne room proprement
    if (socket.currentRoom && socket.currentRoom !== code) {
      const oldRoom = rooms.get(socket.currentRoom);
      if (oldRoom) {
        const idx = oldRoom.findIndex(p => p.id === socket.id);
        if (idx !== -1) oldRoom.splice(idx, 1);
        if (oldRoom.length === 0) rooms.delete(socket.currentRoom);
      }
      socket.leave(socket.currentRoom);
    }

    socket.join(code);
    socket.currentRoom = code;
    if (!rooms.has(code)) rooms.set(code, []);
    const room = rooms.get(code);

    // Éviter les doublons
    if (room.find(p => p.id === socket.id)) return;
    room.push({ id: socket.id, username: socket.user.username });

    const others = room.filter(p => p.id !== socket.id);

    if (others.length > 0) {
      // Deuxième pair — envoyer room-info ET notifier le premier
      socket.emit("room-info", { peers: others });
      socket.to(code).emit("peer-joined", { peerId: socket.id, username: socket.user.username });

      // Enregistrer le début de session dans les logs
      const userA = others[0].username;
      const userB = socket.user.username;
      const startedAt = new Date().toISOString();
      sessionStartTimes.set(code, { startedAt, userA, userB });
      db.prepare("INSERT INTO session_logs (code, user_a, user_b, started_at) VALUES (?, ?, ?, ?)")
        .run(code, userA, userB, startedAt);
    }
    // Premier pair : il attend juste peer-joined
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("disconnect", () => {
    if (!socket.currentRoom) return;
    const room = rooms.get(socket.currentRoom);
    if (!room) return;
    const idx = room.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      room.splice(idx, 1);
      socket.to(socket.currentRoom).emit("peer-left", { peerId: socket.id, username: socket.user.username });

      // Clôturer le log de session si les deux étaient connectés
      const sessionInfo = sessionStartTimes.get(socket.currentRoom);
      if (sessionInfo) {
        const endedAt = new Date().toISOString();
        const duration = Math.round((new Date(endedAt) - new Date(sessionInfo.startedAt)) / 1000);
        db.prepare(`
          UPDATE session_logs SET ended_at = ?, duration_seconds = ?
          WHERE code = ? AND ended_at IS NULL
        `).run(endedAt, duration, socket.currentRoom);
        sessionStartTimes.delete(socket.currentRoom);
      }

      if (room.length === 0) rooms.delete(socket.currentRoom);
    }
  });
});

server.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));