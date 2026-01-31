const playArea = document.getElementById("playArea");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const msg = document.getElementById("msg");
const stats = document.getElementById("stats");

const modal = document.getElementById("imageModal");
const closeModal = document.getElementById("closeModal");

// --- Local counter (browser only) ---
const KEY = "yesClicks";
const getClicks = () => Number(localStorage.getItem(KEY) || "0");
const setClicks = (n) => localStorage.setItem(KEY, String(n));
stats.textContent = `YES clicks (this device): ${getClicks()}`;

// --- Utility ---
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rect(el) { return el.getBoundingClientRect(); }

// --- Initial positions (px so movement is stable) ---
function initPositions() {
  const area = rect(playArea);
  const noR = rect(noBtn);

  // YES at left-ish
  yesBtn.style.left = `${area.width * 0.22}px`;
  yesBtn.style.top  = `${area.height * 0.56}px`;

  // NO at right-ish
  noBtn.style.left  = `${clamp(area.width * 0.62, 10, area.width - noR.width - 10)}px`;
  noBtn.style.top   = `${clamp(area.height * 0.56, 10, area.height - noR.height - 10)}px`;
}

window.addEventListener("load", initPositions);
window.addEventListener("resize", initPositions);

// --- YES grows bigger over time ---
let yesScale = 1;
const MAX_SCALE = 3.2;
const GROW_PER_SEC = 0.12;

let lastT = performance.now();
function tick(t) {
  const dt = (t - lastT) / 1000;
  lastT = t;

  yesScale = Math.min(MAX_SCALE, yesScale + GROW_PER_SEC * dt);
  yesBtn.style.transform = `scale(${yesScale})`;

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- NO dodges pointer ---
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

  // Try a few random spots and pick the farthest from the pointer
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

playArea.addEventListener("pointermove", (e) => {
  const noR = rect(noBtn);
  const centerX = noR.left + noR.width / 2;
  const centerY = noR.top + noR.height / 2;

  const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
  if (dist < DODGE_DISTANCE) {
    dodgeFrom(e.clientX, e.clientY);
  }
});

// Mobile-friendly: if you tap near NO, it dodges
playArea.addEventListener("pointerdown", (e) => {
  const noR = rect(noBtn);
  const centerX = noR.left + noR.width / 2;
  const centerY = noR.top + noR.height / 2;

  const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
  if (dist < DODGE_DISTANCE + 40) {
    dodgeFrom(e.clientX, e.clientY);
  }
});

// --- Modal open/close ---
function openModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModalFn() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

yesBtn.addEventListener("click", () => {
  msg.textContent = "Yay!! ❤️ Komal loves you 😄";

  const clicks = getClicks() + 1;
  setClicks(clicks);
  stats.textContent = `YES clicks (this device): ${clicks}`;

  openModal();
});

closeModal.addEventListener("click", closeModalFn);

// Click outside content closes modal
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModalFn();
});

// ESC closes modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModalFn();
});
