const API_URL = "";
const token = localStorage.getItem("token");

const socket = io(API_URL, {
  auth: { token }
});

let peer = null;

function createPeer(initiator) {
  peer = new SimplePeer({
    initiator,
    trickle: false,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    }
  });

  peer.on("signal", data => {
    socket.emit("signal", {
      to: "target",
      data
    });
  });

  peer.on("data", data => {
    console.log("Data reçue", data);
  });
}

document.getElementById("createBtn").addEventListener("click", async () => {
  const res = await fetch(API_URL + "/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();

  document.getElementById("sessionCode").textContent = data.code;

  socket.emit("join-session", {
    code: data.code
  });

  createPeer(true);
});

document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = document.getElementById("joinCode").value;

  await fetch(API_URL + "/api/sessions/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ code })
  });

  socket.emit("join-session", { code });

  createPeer(false);
});

const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();

  const files = [...e.dataTransfer.files];

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    peer.send(buffer);
  }
});
