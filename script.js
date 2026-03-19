const IMAGES = {
  "PT": [
    "PT_01.jpeg","PT_02.jpeg","PT_03.jpeg","PT_04.jpeg","PT_05.jpeg","PT_06.jpeg","PT_07.jpeg","PT_08.jpeg","PT_09.jpeg","PT_10.jpeg","PT_11.jpeg"
  ],
  "EN": [
    "EN_01.jpeg","EN_02.jpeg","EN_03.jpeg","EN_04.jpeg","EN_05.jpeg","EN_06.jpeg","EN_07.jpeg","EN_08.jpeg","EN_09.jpeg","EN_10.jpeg","EN_11.jpeg"
  ]
};

let currentLang = "PT";
let currentPage = 0;
let zoom = 1;
let overlayDismissed = false;
let uiTimer = null;
let overlayDelayTimer = null;
let overlayAutoHideTimer = null;
let overlayInterval = null;
let toastTimer = null;
let isAnimating = false;
let uiVisible = false;
let isDragging = false;
let dragStarted = false;
let dragStartX = 0;
let dragCurrentX = 0;
let baseScale = 1;
let suppressClickUntil = 0;

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
const fullscreenBtn = document.getElementById("fullscreenBtn");
const exitLandscapeBtn = document.getElementById("exitLandscapeBtn");
const pageDots = document.getElementById("pageDots");
const rotationToast = document.getElementById("rotationToast");

const overlayMessages = [
  "Gire o smartphone para a horizontal para uma visualização mais elegante.",
  "Rotate your smartphone to landscape for a more elegant view."
];

function clampPage(page, lang) {
  const total = (IMAGES[lang] || []).length;
  if (!total) return 0;
  if (page < 0) return total - 1;
  if (page >= total) return 0;
  return page;
}

function imagePath(lang, page) {
  const pages = IMAGES[lang] || [];
  return `Menu_${lang}/${pages[clampPage(page, lang)]}`;
}

function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches || window.innerWidth > window.innerHeight;
}

function isPizzaPage() {
  return currentPage >= 2;
}

function showToast(message) {
  if (!rotationToast) return;
  rotationToast.textContent = message;
  rotationToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => rotationToast.classList.remove("show"), 2200);
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

async function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch (err) {
    // Browser may require user gesture; keep silent and allow manual retry.
  }
}

async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch (err) {
    // ignore
  }
}

function syncLandscapeState() {
  const landscape = isLandscape();
  body.classList.toggle("landscape-mode", landscape);
  if (landscape) {
    dismissOverlay();
    hideUi();
    enterFullscreen();
  }
}

function updateWhatsApp() {
  if (!waButton) return;
  if (!isPizzaPage()) {
    waButton.style.display = "none";
    return;
  }
  waButton.style.display = "flex";
  waButton.textContent = "WhatsApp";
  if (currentLang === "PT") waButton.href = "https://wa.me/16073895617?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20meu%20pedido%20pelo%20card%C3%A1pio.";
  else waButton.href = "https://wa.me/16073895617?text=Hello%2C%20I%20would%20like%20to%20place%20my%20order%20from%20the%20menu.";
}

function renderDots() {
  if (!pageDots) return;
  const total = (IMAGES[currentLang] || []).length;
  pageDots.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `page-dot${i === currentPage ? " active" : ""}`;
    dot.setAttribute("aria-label", `Ir para a página ${i + 1}`);
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      if (consumeToShowUi()) return;
      if (i === currentPage || isAnimating) return;
      animateFlip(i > currentPage ? "next" : "prev", () => {
        currentPage = i;
        updateImage();
      });
    });
    pageDots.appendChild(dot);
  }
}

function applyScaleOnly() {
  pageWrap.style.transform = `translateX(0px) scale(${zoom})`;
  menuImage.style.transform = "scale(1)";
}

function updateImage() {
  const pages = IMAGES[currentLang] || [];
  if (!pages.length) return;
  currentPage = clampPage(currentPage, currentLang);
  menuImage.src = imagePath(currentLang, currentPage);
  applyScaleOnly();
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  updateWhatsApp();
  renderDots();
}

function hideUi() {
  uiVisible = false;
  body.classList.add("hide-ui");
}

function showUiTemporarily() {
  uiVisible = true;
  body.classList.remove("hide-ui");
  clearTimeout(uiTimer);
  uiTimer = setTimeout(hideUi, isLandscape() ? 1400 : 2200);
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
  }, 1800);
  clearTimeout(overlayAutoHideTimer);
  overlayAutoHideTimer = setTimeout(dismissOverlay, 6500);
}

function scheduleOverlay() {
  clearTimeout(overlayDelayTimer);
  overlayDelayTimer = setTimeout(maybeShowOverlay, 2000);
}

function consumeToShowUi(e) {
  if (e) e.stopPropagation();
  if (Date.now() < suppressClickUntil) return true;
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
  if (isAnimating || isDragging) return;
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
    applyScaleOnly();
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

function dragProgress(deltaX) {
  const width = Math.max(window.innerWidth, 1);
  return Math.max(-1, Math.min(1, deltaX / width));
}

function updateDragVisual(deltaX) {
  const progress = dragProgress(deltaX);
  const rotate = progress * 7;
  const translate = deltaX * 0.9;
  const scale = zoom * (1 - Math.min(Math.abs(progress) * 0.04, 0.04));
  pageWrap.classList.add("dragging");
  pageWrap.style.transform = `translateX(${translate}px) rotateY(${rotate}deg) scale(${scale})`;
  pageShadow.style.opacity = String(Math.min(0.55, Math.abs(progress) * 0.9));
  pageFold.style.opacity = String(Math.min(0.7, Math.abs(progress) * 1.2));
  if (progress < 0) {
    pageFold.style.left = "auto";
    pageFold.style.right = "0";
    pageFold.style.transformOrigin = "right center";
    pageFold.style.transform = `perspective(1200px) rotateY(${progress * 36}deg)`;
    pageShadow.style.transform = "scaleX(1)";
  } else {
    pageFold.style.left = "0";
    pageFold.style.right = "auto";
    pageFold.style.transformOrigin = "left center";
    pageFold.style.transform = `perspective(1200px) rotateY(${progress * 36}deg) scaleX(-1)`;
    pageShadow.style.transform = "scaleX(-1)";
  }
}

function resetDragVisual(animated = true) {
  pageWrap.classList.remove("dragging");
  if (animated) pageWrap.style.transition = "transform .28s cubic-bezier(.22,.8,.2,1), filter .28s cubic-bezier(.22,.8,.2,1)";
  else pageWrap.style.transition = "";
  applyScaleOnly();
  pageShadow.style.opacity = "0";
  pageFold.style.opacity = "0";
  pageShadow.style.transform = "";
  pageFold.style.transform = "";
  setTimeout(() => { pageWrap.style.transition = ""; }, 300);
}

function onTouchStart(e) {
  if (isAnimating || overlay.classList.contains("show")) return;
  if (e.touches.length !== 1) return;
  dragStarted = true;
  isDragging = false;
  dragStartX = e.touches[0].clientX;
  dragCurrentX = dragStartX;
  baseScale = zoom;
}

function onTouchMove(e) {
  if (!dragStarted || isAnimating || e.touches.length !== 1) return;
  dragCurrentX = e.touches[0].clientX;
  const deltaX = dragCurrentX - dragStartX;
  if (!isDragging && Math.abs(deltaX) > 10) {
    isDragging = true;
    showUiTemporarily();
  }
  if (!isDragging) return;
  e.preventDefault();
  updateDragVisual(deltaX);
}

function onTouchEnd() {
  if (!dragStarted) return;
  const deltaX = dragCurrentX - dragStartX;
  dragStarted = false;
  if (!isDragging) return;
  isDragging = false;
  suppressClickUntil = Date.now() + 250;
  const threshold = Math.max(45, window.innerWidth * 0.09);
  if (deltaX <= -threshold) {
    resetDragVisual(false);
    goNext();
    return;
  }
  if (deltaX >= threshold) {
    resetDragVisual(false);
    goPrev();
    return;
  }
  resetDragVisual(true);
}

prevBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; goPrev(); });
nextBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; goNext(); });
tapLeft.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi(e)) return; goPrev(); });
tapRight.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi(e)) return; goNext(); });
viewer.addEventListener("click", (e) => { if (consumeToShowUi(e)) return; showUiTemporarily(); });
viewer.addEventListener("touchstart", onTouchStart, { passive: true });
viewer.addEventListener("touchmove", onTouchMove, { passive: false });
viewer.addEventListener("touchend", onTouchEnd, { passive: true });
viewer.addEventListener("touchcancel", () => { dragStarted = false; if (isDragging) resetDragVisual(true); isDragging = false; }, { passive: true });
zoomInBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; zoom = Math.min(3, +(zoom + 0.1).toFixed(2)); updateImage(); showUiTemporarily(); });
zoomOutBtn.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2)); updateImage(); showUiTemporarily(); });
langPT.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; setLang("PT"); });
langEN.addEventListener("click", (e) => { e.stopPropagation(); if (consumeToShowUi()) return; setLang("EN"); });
fullscreenBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  showUiTemporarily();
  if (getFullscreenElement()) await exitFullscreen();
  else await enterFullscreen();
});
exitLandscapeBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  await exitFullscreen();
  showToast(currentLang === "PT" ? "Gire o smartphone para voltar ao modo vertical." : "Rotate your smartphone back to portrait mode.");
  showUiTemporarily();
});
if (waButton) {
  waButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (consumeToShowUi()) { e.preventDefault(); return; }
    showUiTemporarily();
  });
}
overlay.addEventListener("click", dismissOverlay);
window.addEventListener("orientationchange", syncLandscapeState);
window.addEventListener("resize", syncLandscapeState);
document.addEventListener("fullscreenchange", syncLandscapeState);
document.addEventListener("webkitfullscreenchange", syncLandscapeState);
window.addEventListener("keydown", (e) => {
  if (overlay.classList.contains("show")) { dismissOverlay(); return; }
  if (e.key === "ArrowRight") { if (!uiVisible) { showUiTemporarily(); return; } goNext(); }
  if (e.key === "ArrowLeft") { if (!uiVisible) { showUiTemporarily(); return; } goPrev(); }
  if (e.key === "+" || e.key === "=") zoomInBtn.click();
  if (e.key === "-") zoomOutBtn.click();
});

updateImage();
syncLandscapeState();
scheduleOverlay();
