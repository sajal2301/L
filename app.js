// ---- Elements (safe lookups) ----
const playArea = document.getElementById("playArea");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const msg = document.getElementById("msg");
const stats = document.getElementById("stats");

const modal = document.getElementById("imageModal");
const closeModal = document.getElementById("closeModal");
const loveImg = document.getElementById("loveImg"); // make sure your <img> has id="loveImg"

// If any critical element is missing, stop and show a helpful message.
function requireEl(el, name) {
  if (!el) {
    console.error(`${name} not found in HTML`);
    if (msg) msg.textContent = `Error: Missing element ${name}. Check your index.html IDs.`;
    return false;
  }
  return true;
}

// ---- Local counter (browser only) ----
const KEY = "yesClicks";
const getClicks = () => Number(localStorage.getItem(KEY) || "0");
const setClicks = (n) => localStorage.setItem(KEY, String(n));

if (stats) stats.textContent = `YES clicks (this device): ${getClicks()}`;

// ---- Utility ----
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rect(el) { return el.getBoundingClientRect(); }

// ---- Initial positions ----
function initPositions() {
  if (!playArea || !yesBtn || !noBtn) return;

  const area = rect(playArea);
  const noR = rect(noBtn);

  yesBtn.style.left = `${area.width * 0.22}px`;
  yesBtn.style.top  = `${area.height * 0.56}px`;

  noBtn.style.left  = `${clamp(area.width * 0.62, 10, area.width - noR.width - 10)}px`;
  noBtn.style.top   = `${clamp(area.height * 0.56, 10, area.height - noR.height - 10)}px`;
}

window.addEventListener("load", initPositions);
window.addEventListener("resize", initPositions);

// ---- YES grows bigger over time ----
let yesScale = 1;
const MAX_SCALE = 3.2;
const GROW_PER_SEC = 0.12;

let lastT = performance.now();
function tick(t) {
  if (!yesBtn) return;
  const dt = (t - lastT) / 1000;
  lastT = t;

  yesScale = Math.min(MAX_SCALE, yesScale + GROW_PER_SEC * dt);
  yesBtn.style.transform = `scale(${yesScale})`;

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---- NO dodges pointer ----
const DODGE_DISTANCE = 120;

function randomPositionWithinArea(btn) {
  const area = rect(playArea);
  const b = rect(btn);
  const pad = 10;

  const x = Math.random() * (area.width - b.width - pad * 2) + pad;
  const y = Math.random() * (area.height - b.height - pad * 2) + pad;
  return { x, y };
}

function dodgeFrom(clientX, clientY) {
  const area = rect(playArea);
  const noR = rect(noBtn);

  let best = null;
  for (let i = 0; i < 10; i++) {
    const p = randomPositionWithinArea(noBtn);
    const cx = area.left + p.x + noR.width / 2;
    const cy = area.top  + p.y + noR.height / 2;
    const d = Math.hypot(clientX - cx, clientY - cy);
    if (!best || d > best.d) best = { p, d };
  }

  if (best) {
    noBtn.style.left = `${best.p.x}px`;
    noBtn.style.top  = `${best.p.y}px`;
  }
}

if (playArea && noBtn) {
  playArea.addEventListener("pointermove", (e) => {
    const noR = rect(noBtn);
    const centerX = noR.left + noR.width / 2;
    const centerY = noR.top + noR.height / 2;

    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    if (dist < DODGE_DISTANCE) dodgeFrom(e.clientX, e.clientY);
  });

  playArea.addEventListener("pointerdown", (e) => {
    const noR = rect(noBtn);
    const centerX = noR.left + noR.width / 2;
    const centerY = noR.top + noR.height / 2;

    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    if (dist < DODGE_DISTANCE + 40) dodgeFrom(e.clientX, e.clientY);
  });
}

// ---- Modal open/close (bulletproof) ----
function openModal() {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.style.display = "grid";          // fallback if CSS class fails
  modal.setAttribute("aria-hidden", "false");
}

function closeModalFn() {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";          // fallback if CSS class fails
  modal.setAttribute("aria-hidden", "true");
}

// Force modal hidden on load (prevents it appearing by default)
window.addEventListener("load", () => closeModalFn());

// Try both image locations: root and /images/
function setImageFallbacks() {
  if (!loveImg) return;

  const candidates = ["love.jpg", "images/love.jpg"]; // supports root-level or images folder
  let idx = 0;

  function tryNext() {
    if (idx >= candidates.length) {
      console.error("Image not found in root or images/");
      if (msg) msg.textContent = "Image not found. Upload love.jpg in repo root or images/love.jpg.";
      return;
    }
    loveImg.src = candidates[idx++];
  }

  loveImg.onerror = tryNext;
  tryNext();
}
window.addEventListener("load", setImageFallbacks);

// ---- Click handlers ----
if (requireEl(yesBtn, "yesBtn") && requireEl(modal, "imageModal")) {
  yesBtn.addEventListener("click", () => {
    if (msg) msg.textContent = "Yayy!";

    const clicks = getClicks() + 1;
    setClicks(clicks);
    if (stats) stats.textContent = `YES clicks (this device): ${clicks}`;

    openModal();
  });
}

if (closeModal) closeModal.addEventListener("click", closeModalFn);

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModalFn();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModalFn();
});
