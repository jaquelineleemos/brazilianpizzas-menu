let IMAGES = { PT: [], EN: [] };

let currentLang = "PT";
let currentPage = 0;
let zoom = 1;
let overlayDismissed = false;
let uiTimer = null;
let overlayDelayTimer = null;
let overlayAutoHideTimer = null;
let overlayInterval = null;
let isAnimating = false;
let uiVisible = false;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let swipeTracking = false;
let isDraggingSwipe = false;

const body = document.body;
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlayText");
const viewer = document.getElementById("viewer");
const menuImage = document.getElementById("menuImage");
const zoomLabel = document.getElementById("zoomLabel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const langPT = document.getElementById("langPT");
const langEN = document.getElementById("langEN");
const tapLeft = document.getElementById("tapLeft");
const tapRight = document.getElementById("tapRight");
const pageWrap = document.getElementById("pageWrap");
const waButton = document.getElementById("waButton");
const pageDots = document.getElementById("pageDots");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const exitLandscapeBtn = document.getElementById("exitLandscapeBtn");

const overlayMessages = [
  "Gire o smartphone para a horizontal para uma visualização mais elegante.",
  "Rotate your smartphone to landscape for a more elegant view."
];

async function loadImages() {
  try {
    const response = await fetch("./images.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    IMAGES = await response.json();
    updateImage();
    renderDots();
  } catch (error) {
    console.error("Erro ao carregar images.json:", error);
    overlayText.textContent = "Não foi possível carregar o cardápio. Verifique o arquivo images.json.";
    overlay.classList.add("show");
  }
}

function clampPage(page, lang) {
  const total = (IMAGES[lang] || []).length;
  if (!total) return 0;
  if (page < 0) return total - 1;
  if (page >= total) return 0;
  return page;
}

function imagePath(lang, page) {
  const pages = IMAGES[lang] || [];
  const file = pages[clampPage(page, lang)];
  return file ? `Menu_${lang}/${file}` : "";
}

function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches || window.innerWidth > window.innerHeight;
}

function isPizzaPage() {
  return currentPage >= 2;
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

async function requestFullscreenForApp() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch (_) {}
  syncFullscreenState();
}

async function exitFullscreenMode() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch (_) {}
  syncFullscreenState();
}

function syncFullscreenState() {
  const active = !!fullscreenElement() || isLandscape();
  body.classList.toggle("fullscreen-active", active);
}

function updateWhatsApp() {
  if (!waButton) return;
  if (!isPizzaPage()) {
    waButton.style.display = "none";
    return;
  }
  waButton.style.display = "flex";
  waButton.textContent = currentLang === "PT" ? "Faça o seu pedido" : "Place your order";
  waButton.href =
    currentLang === "PT"
      ? "https://wa.me/16073895617?text=Olá%2C%20gostaria%20de%20fazer%20meu%20pedido%20pelo%20cardápio."
      : "https://wa.me/16073895617?text=Hello%2C%20I%20would%20like%20to%20place%20my%20order%20from%20the%20menu.";
}

function renderDots() {
  if (!pageDots) return;
  const total = (IMAGES[currentLang] || []).length;
  pageDots.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `page-dot${i === currentPage ? " active" : ""}`;
    dot.setAttribute("aria-label", `${currentLang === "PT" ? "Ir para a página" : "Go to page"} ${i + 1}`);
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      if (consumeToShowUi()) return;
      currentPage = i;
      updateImage();
      showUiTemporarily();
    });
    pageDots.appendChild(dot);
  }
}

function updateImage() {
  const pages = IMAGES[currentLang] || [];
  if (!pages.length) return;
  currentPage = clampPage(currentPage, currentLang);
  menuImage.src = imagePath(currentLang, currentPage);
  menuImage.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  updateWhatsApp();
  renderDots();
}

function hideUi() {
  uiVisible = false;
  body.classList.add("hide-ui");
  body.classList.remove("ui-peek");
}

function showUiTemporarily() {
  uiVisible = true;
  body.classList.remove("hide-ui");
  if (isLandscape()) body.classList.add("ui-peek");
  clearTimeout(uiTimer);
  uiTimer = setTimeout(hideUi, isLandscape() ? 1200 : 2200);
}

function dismissOverlay() {
  overlayDismissed = true;
  clearInterval(overlayInterval);
  clearTimeout(overlayAutoHideTimer);
  overlay.classList.remove("show");
}

function maybeShowOverlay() {
  if (overlayDismissed || isLandscape()) return;
  overlay.classList.add("show");
  let idx = 0;
  overlayText.textContent = overlayMessages[0];
  clearInterval(overlayInterval);
  overlayInterval = setInterval(() => {
    idx = (idx + 1) % overlayMessages.length;
    overlayText.textContent = overlayMessages[idx];
  }, 1600);
  clearTimeout(overlayAutoHideTimer);
  overlayAutoHideTimer = setTimeout(dismissOverlay, 6500);
}

function scheduleOverlay() {
  clearTimeout(overlayDelayTimer);
  overlayDelayTimer = setTimeout(maybeShowOverlay, 2000);
}

function consumeToShowUi(e) {
  if (e) e.stopPropagation();
  if (overlay.classList.contains("show")) {
    dismissOverlay();
    return true;
  }
  if (!uiVisible) {
    showUiTemporarily();
    return true;
  }
  return false;
}

function animateFlip(direction, callback) {
  if (isAnimating) return;
  isAnimating = true;
  const cls = direction === "next" ? "flip-next" : "flip-prev";
  pageWrap.classList.add(cls);
  showUiTemporarily();
  setTimeout(() => {
    pageWrap.classList.add("swap");
    callback();
  }, 220);
  setTimeout(() => {
    pageWrap.classList.remove(cls);
    pageWrap.classList.remove("swap");
    isAnimating = false;
  }, 640);
}

function goNext() {
  animateFlip("next", () => {
    currentPage = clampPage(currentPage + 1, currentLang);
    updateImage();
  });
}

function goPrev() {
  animateFlip("prev", () => {
    currentPage = clampPage(currentPage - 1, currentLang);
    updateImage();
  });
}

function setLang(lang) {
  currentLang = lang;
  currentPage = clampPage(currentPage, currentLang);
  updateImage();
  showUiTemporarily();
}

function resetDragVisual() {
  isDraggingSwipe = false;
  pageWrap.classList.remove("dragging");
  pageWrap.style.setProperty("--drag-x", "0px");
  pageWrap.style.setProperty("--drag-rotate", "0deg");
  pageWrap.style.setProperty("--drag-scale", "1");
}

function onTouchStart(e) {
  if (!e.touches || e.touches.length !== 1 || isAnimating) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchEndX = touchStartX;
  touchEndY = touchStartY;
  swipeTracking = true;
  isDraggingSwipe = false;
}

function onTouchMove(e) {
  if (!swipeTracking || !e.touches || e.touches.length !== 1 || isAnimating) return;
  touchEndX = e.touches[0].clientX;
  touchEndY = e.touches[0].clientY;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
  isDraggingSwipe = true;
  pageWrap.classList.add("dragging");
  const limitedX = Math.max(-120, Math.min(120, dx * 0.35));
  const rotate = Math.max(-7, Math.min(7, dx / 28));
  const scale = Math.max(0.988, 1 - Math.min(0.012, Math.abs(dx) / 1800));
  pageWrap.style.setProperty("--drag-x", `${limitedX}px`);
  pageWrap.style.setProperty("--drag-rotate", `${rotate}deg`);
  pageWrap.style.setProperty("--drag-scale", `${scale}`);
}

function onTouchEnd() {
  if (!swipeTracking) return;
  swipeTracking = false;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const shouldFlip = absX >= 45 && absX > absY;
  if (!shouldFlip) {
    resetDragVisual();
    return;
  }
  showUiTemporarily();
  resetDragVisual();
  if (dx < 0) goNext();
  else goPrev();
}

function syncOrientationMode() {
  const landscape = isLandscape();
  body.classList.toggle("landscape-mode", landscape);
  if (!landscape) body.classList.remove("ui-peek");
}

async function handleOrientationUi() {
  syncFullscreenState();
  syncOrientationMode();
  if (isLandscape()) {
    dismissOverlay();
    hideUi();
    await requestFullscreenForApp();
  }
}

prevBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; goPrev(); });
nextBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; goNext(); });
tapLeft.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi(e)) return; goPrev(); });
tapRight.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi(e)) return; goNext(); });
viewer.addEventListener("click", (e) => { if (consumeToShowUi(e)) return; showUiTemporarily(); });
viewer.addEventListener("touchstart", onTouchStart, { passive: true });
viewer.addEventListener("touchmove", onTouchMove, { passive: true });
viewer.addEventListener("touchend", onTouchEnd, { passive: true });
viewer.addEventListener("touchcancel", resetDragVisual, { passive: true });
zoomInBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; zoom = Math.min(3, +(zoom + 0.1).toFixed(2)); updateImage(); showUiTemporarily(); });
zoomOutBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2)); updateImage(); showUiTemporarily(); });
langPT.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; setLang("PT"); });
langEN.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; setLang("EN"); });
fullscreenBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  showUiTemporarily();
  await requestFullscreenForApp();
});
exitLandscapeBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  showUiTemporarily();
  await exitFullscreenMode();
  if (screen.orientation && screen.orientation.lock) {
    try { await screen.orientation.lock("portrait"); } catch (_) {}
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
});
if (waButton) {
  waButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (consumeToShowUi()) { e.preventDefault(); return; }
    showUiTemporarily();
  });
}
overlay.addEventListener("click", dismissOverlay);
window.addEventListener("orientationchange", handleOrientationUi);
window.addEventListener("resize", handleOrientationUi);
document.addEventListener("fullscreenchange", syncFullscreenState);
document.addEventListener("webkitfullscreenchange", syncFullscreenState);
window.addEventListener("keydown", (e) => {
  if (overlay.classList.contains("show")) { dismissOverlay(); return; }
  if (e.key === "ArrowRight") { if (!uiVisible) { showUiTemporarily(); return; } goNext(); }
  if (e.key === "ArrowLeft") { if (!uiVisible) { showUiTemporarily(); return; } goPrev(); }
  if (e.key === "+" || e.key === "=") zoomInBtn.click();
  if (e.key === "-") zoomOutBtn.click();
});

loadImages();
scheduleOverlay();
handleOrientationUi();