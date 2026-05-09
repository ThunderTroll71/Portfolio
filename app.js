// ── Config ──────────────────────────────────────────────────────
const API_URL = localStorage.getItem("apiUrl") || "https://siteweb-production-8e78.up.railway.app";
const token = localStorage.getItem("token");

// Rediriger si pas connecté
if (!token) location.href = "index.html";

document.getElementById("usernameDisplay").textContent = localStorage.getItem("username") || "";

// ── Socket.IO ────────────────────────────────────────────────────
const socket = io(API_URL, { auth: { token } });

socket.on("connect_error", (err) => {
  if (err.message === "Unauthorized") {
    localStorage.clear();
    location.href = "index.html";
  }
});

// ── État ─────────────────────────────────────────────────────────
let peer = null;
let currentCode = null;
let peerSocketId = null;
let isInitiator = false;

// Buffers de réception
let receiveBuffers = [];
let receiveSize = 0;
let receiveMeta = null;

// ── Signaling ────────────────────────────────────────────────────
// Le serveur nous dit qu'un pair est déjà là (on arrive en second)
socket.on("room-info", ({ peers }) => {
  if (peers.length > 0) {
    peerSocketId = peers[0].id;
    document.getElementById("peerName").textContent = peers[0].username;
    startPeer(false); // on n'est pas l'initiateur
  }
});

// Un pair vient de nous rejoindre (on était là en premier)
socket.on("peer-joined", ({ peerId, username }) => {
  peerSocketId = peerId;
  document.getElementById("peerName").textContent = username;
  startPeer(true); // on est l'initiateur
});

socket.on("peer-left", () => {
  showToast("L'autre utilisateur a quitté la session", "info");
  resetTransferUI();
});

// Relais de signal WebRTC
socket.on("signal", ({ from, data }) => {
  peerSocketId = from;
  if (peer) peer.signal(data);
});

// ── SimplePeer ───────────────────────────────────────────────────
function startPeer(initiator) {
  isInitiator = initiator;

  peer = new SimplePeer({
    initiator,
    trickle: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ]
    }
  });

  peer.on("signal", (data) => {
    socket.emit("signal", { to: peerSocketId, data });
  });

  peer.on("connect", () => {
    document.getElementById("waitingZone").style.display = "none";
    document.getElementById("setupZone").style.display = "none";
    document.getElementById("transferZone").style.display = "block";
    showToast("Connexion P2P établie !", "success");
  });

  peer.on("data", (chunk) => {
    handleIncomingData(chunk);
  });

  peer.on("error", (err) => {
    console.error("Peer error:", err);
    showToast("Erreur de connexion P2P", "error");
    resetTransferUI();
  });

  peer.on("close", () => {
    resetTransferUI();
  });
}

// ── Réception de données ─────────────────────────────────────────
function handleIncomingData(chunk) {
  // Les métadonnées arrivent sous forme de string JSON
  if (typeof chunk === "string" || chunk instanceof String) {
    processMessage(chunk.toString());
    return;
  }

  // Sinon c'est un ArrayBuffer ou Uint8Array
  const str = new TextDecoder().decode(chunk);

  // Essayer de parser comme JSON (métadonnées)
  if (str.startsWith("{")) {
    try {
      processMessage(str);
      return;
    } catch {}
  }

  // C'est un chunk binaire
  if (!receiveMeta) return;
  receiveBuffers.push(chunk);
  receiveSize += chunk.byteLength || chunk.length;

  updateReceiveProgress(receiveSize / receiveMeta.size);

  if (receiveSize >= receiveMeta.size) {
    const blob = new Blob(receiveBuffers, { type: receiveMeta.type || "application/octet-stream" });
    addReceivedFile(receiveMeta.name, receiveMeta.size, blob);
    receiveBuffers = [];
    receiveSize = 0;
    receiveMeta = null;
  }
}

function processMessage(str) {
  const msg = JSON.parse(str);
  if (msg.type === "file-start") {
    receiveMeta = { name: msg.name, size: msg.size, type: msg.mimeType };
    receiveBuffers = [];
    receiveSize = 0;
    addReceiveProgressItem(msg.name, msg.size);
  }
}

// ── Envoi de fichiers ────────────────────────────────────────────
const CHUNK = 64 * 1024; // 64 Ko

async function sendFiles(files) {
  if (!peer || !peer.connected) return showToast("Non connecté", "error");
  for (const file of files) {
    await sendFile(file);
  }
}

async function sendFile(file) {
  const itemId = addSendItem(file.name, file.size);

  // Envoyer les métadonnées
  peer.send(JSON.stringify({ type: "file-start", name: file.name, size: file.size, mimeType: file.type }));

  // Envoyer les chunks
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK);
    const buffer = await slice.arrayBuffer();

    // Attendre que le buffer se libère
    await new Promise(resolve => {
      const wait = () => {
        if (peer._channel && peer._channel.bufferedAmount > CHUNK * 8) {
          setTimeout(wait, 50);
        } else {
          resolve();
        }
      };
      wait();
    });

    peer.send(buffer);
    offset += buffer.byteLength;
    updateSendProgress(itemId, offset / file.size);
  }
}

// ── UI helpers ───────────────────────────────────────────────────
function fmtSize(b) {
  if (b < 1024) return b + " o";
  if (b < 1048576) return (b / 1024).toFixed(1) + " Ko";
  return (b / 1048576).toFixed(1) + " Mo";
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function addSendItem(name, size) {
  const id = "s-" + Date.now();
  const el = document.createElement("div");
  el.className = "file-item";
  el.id = id;
  el.innerHTML = `<span>📄</span><div class="fi-info"><div class="fi-name">${escHtml(name)}</div><div class="fi-size">${fmtSize(size)}</div><div class="fi-bar-wrap"><div class="fi-bar" style="width:0%"></div></div></div>`;
  document.getElementById("sendList").appendChild(el);
  return id;
}

function updateSendProgress(id, ratio) {
  const bar = document.querySelector(`#${id} .fi-bar`);
  if (bar) bar.style.width = Math.round(ratio * 100) + "%";
}

let currentReceiveItemId = null;

function addReceiveProgressItem(name, size) {
  const el = document.querySelector("#receiveList .hint");
  if (el) el.remove();

  const id = "r-" + Date.now();
  currentReceiveItemId = id;
  const div = document.createElement("div");
  div.className = "file-item";
  div.id = id;
  div.innerHTML = `<span>⬇️</span><div class="fi-info"><div class="fi-name">${escHtml(name)}</div><div class="fi-size">${fmtSize(size)}</div><div class="fi-bar-wrap"><div class="fi-bar" style="width:0%"></div></div></div>`;
  document.getElementById("receiveList").appendChild(div);
}

function updateReceiveProgress(ratio) {
  if (!currentReceiveItemId) return;
  const bar = document.querySelector(`#${currentReceiveItemId} .fi-bar`);
  if (bar) bar.style.width = Math.round(ratio * 100) + "%";
}

function addReceivedFile(name, size, blob) {
  if (currentReceiveItemId) {
    const item = document.getElementById(currentReceiveItemId);
    if (item) {
      updateReceiveProgress(1);
      const link = document.createElement("a");
      link.className = "btn-dl";
      link.textContent = "⬇ Télécharger";
      link.href = URL.createObjectURL(blob);
      link.download = name;
      item.appendChild(link);
    }
  }
  showToast(`Fichier reçu : ${name}`, "success");
  currentReceiveItemId = null;
}

// ── Actions ──────────────────────────────────────────────────────
document.getElementById("createBtn").addEventListener("click", async () => {
  const btn = document.getElementById("createBtn");
  btn.disabled = true;
  btn.textContent = "...";

  try {
    const res = await fetch(API_URL + "/api/sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    currentCode = data.code;
    document.getElementById("codeText").textContent = data.code;
    document.getElementById("codeDisplay").style.display = "block";
    document.getElementById("waitCode").textContent = data.code;
    document.getElementById("setupZone").style.display = "none";
    document.getElementById("waitingZone").style.display = "block";

    socket.emit("join-session", { code: data.code });
  } catch (err) {
    showToast(err.message || "Erreur", "error");
    btn.disabled = false;
    btn.textContent = "Créer";
  }
});

document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = document.getElementById("joinCode").value.trim().toUpperCase();
  if (code.length !== 6) return showToast("Le code doit faire 6 caractères", "error");

  try {
    const res = await fetch(API_URL + "/api/sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    currentCode = code;
    document.getElementById("setupZone").style.display = "none";
    document.getElementById("waitingZone").style.display = "block";
    document.getElementById("waitCode").textContent = code;

    socket.emit("join-session", { code });
  } catch (err) {
    showToast(err.message || "Session introuvable", "error");
  }
});

// Drag & Drop
const dropZone = document.getElementById("dropZone");
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("over"));
dropZone.addEventListener("drop", e => { e.preventDefault(); dropZone.classList.remove("over"); sendFiles(e.dataTransfer.files); });

function copyCode() {
  if (currentCode) navigator.clipboard.writeText(currentCode).then(() => showToast("Code copié !", "success"));
}

function resetTransferUI() {
  document.getElementById("transferZone").style.display = "none";
  document.getElementById("waitingZone").style.display = "none";
  document.getElementById("setupZone").style.display = "block";
  document.getElementById("codeDisplay").style.display = "none";
  document.getElementById("createBtn").disabled = false;
  document.getElementById("createBtn").textContent = "Créer";
  document.getElementById("sendList").innerHTML = "";
  document.getElementById("receiveList").innerHTML = '<p class="hint" style="text-align:center;padding:20px">En attente de fichiers…</p>';
  peer = null; currentCode = null; peerSocketId = null;
}

function disconnect() {
  if (peer) peer.destroy();
  resetTransferUI();
}

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => t.className = "toast", 3000);
}
