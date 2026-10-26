const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, progress) => from + (to - from) * progress;
const ease = (value) => 1 - Math.pow(1 - value, 3);
const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function setPressed(buttons, active) {
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button === active)));
}

const hero = document.querySelector(".hero-scroll");
const heroIntro = document.querySelector(".hero-intro");
const heroApp = document.querySelector(".app-shell");
const flyingMark = document.querySelector(".flying-mark");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let heroFrame = 0;

function updateHero() {
  heroFrame = 0;
  if (!hero || !heroIntro || !heroApp || !flyingMark) return;
  if (motionPreference.matches) {
    document.body.classList.remove("has-motion");
    hero.removeAttribute("style");
    heroIntro.inert = false;
    heroApp.inert = false;
    heroApp.style.removeProperty("pointer-events");
    flyingMark.removeAttribute("style");
    return;
  }

  document.body.classList.add("has-motion");
  const distance = Math.max(1, hero.offsetHeight - innerHeight);
  const progress = clamp(-hero.getBoundingClientRect().top / distance);
  const introOut = clamp((progress - .05) / .22);
  const appIn = ease(clamp((progress - .2) / .48));
  const markIn = ease(clamp((progress - .1) / .62));
  const mobile = innerWidth <= 700;
  const compact = innerWidth <= 900;
  const markSize = mobile ? 88 : 112;
  const targetSize = compact ? 20 : 32;
  const startX = innerWidth / 2;
  const stickyHeight = hero.querySelector(".hero-sticky").clientHeight;
  const startY = stickyHeight * (mobile ? .18 : .22);
  const targetX = heroApp.offsetLeft - heroApp.offsetWidth / 2 + (compact ? 18 : 42);
  const targetY = heroApp.offsetTop - heroApp.offsetHeight / 2 + (compact ? 18 : 54);
  const markX = lerp(startX, targetX, markIn);
  const markY = lerp(startY, targetY, markIn);
  const markScale = lerp(1, targetSize / markSize, markIn);

  hero.style.setProperty("--hero-progress", progress.toFixed(4));
  hero.style.setProperty("--intro-opacity", String(1 - introOut));
  hero.style.setProperty("--intro-y", `${-42 * introOut}px`);
  hero.style.setProperty("--app-opacity", appIn.toFixed(4));
  hero.style.setProperty("--app-y", `${70 * (1 - appIn)}px`);
  hero.style.setProperty("--app-scale", String(lerp(.86, 1, appIn)));
  hero.style.setProperty("--cue-opacity", String(1 - clamp((progress - .72) / .16)));
  flyingMark.style.opacity = String(1 - clamp((progress - .69) / .06));
  flyingMark.style.transform = `translate(${markX - markSize / 2}px, ${markY - markSize / 2}px) scale(${markScale})`;
  heroIntro.inert = introOut >= 1;
  heroApp.inert = appIn <= .92;
  heroApp.style.pointerEvents = appIn > .92 ? "auto" : "none";
}

function requestHeroUpdate() {
  if (!heroFrame) heroFrame = requestAnimationFrame(updateHero);
}

addEventListener("scroll", requestHeroUpdate, { passive: true });
addEventListener("resize", requestHeroUpdate);
motionPreference.addEventListener("change", requestHeroUpdate);
updateHero();

function setupSummary(prefix) {
  const id = (name) => document.querySelector(`#${prefix}${name}`);
  const openButton = id("summary-open");
  const card = id("summary-card");
  const ball = id("summary-ball");
  const minimize = id("summary-minimize");
  const closeButton = id("summary-close");
  let closeTimer;

  function open() {
    clearTimeout(closeTimer);
    card.hidden = false;
    ball.hidden = true;
    card.dataset.state = "closed";
    requestAnimationFrame(() => requestAnimationFrame(() => { card.dataset.state = "open"; }));
  }

  function close() {
    clearTimeout(closeTimer);
    card.dataset.state = "closed";
    ball.hidden = true;
    closeTimer = setTimeout(() => { card.hidden = true; }, 170);
  }

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  minimize.addEventListener("click", () => { card.hidden = true; ball.hidden = false; });
  ball.addEventListener("click", open);
}

setupSummary("lab-");

function setupFloat(windowElement, ball, minimizeButton, dragHandle) {
  let shrinkTimer;
  let restoreTimer;

  function open() {
    clearTimeout(shrinkTimer);
    windowElement.hidden = false;
    ball.hidden = true;
    windowElement.classList.remove("ai-win-shrink");
    windowElement.classList.add("ai-win-restore");
    restoreTimer = setTimeout(() => windowElement.classList.remove("ai-win-restore"), 330);
  }

  function minimize() {
    clearTimeout(restoreTimer);
    windowElement.classList.remove("ai-win-restore");
    windowElement.classList.add("ai-win-shrink");
    shrinkTimer = setTimeout(() => {
      windowElement.hidden = true;
      windowElement.classList.remove("ai-win-shrink");
      ball.hidden = false;
    }, 180);
  }

  minimizeButton.addEventListener("click", minimize);
  ball.addEventListener("click", open);

  let drag = null;
  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const parent = windowElement.offsetParent;
    const parentRect = parent.getBoundingClientRect();
    const rect = windowElement.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: rect.left - parentRect.left, top: rect.top - parentRect.top, parent };
    windowElement.style.right = "auto";
    windowElement.classList.add("float-win-dragging");
    dragHandle.setPointerCapture(event.pointerId);
  });
  dragHandle.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const left = clamp(drag.left + event.clientX - drag.x, 0, drag.parent.clientWidth - windowElement.offsetWidth);
    const top = clamp(drag.top + event.clientY - drag.y, 0, drag.parent.clientHeight - windowElement.offsetHeight);
    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${top}px`;
  });
  const stopDrag = () => { drag = null; windowElement.classList.remove("float-win-dragging"); };
  dragHandle.addEventListener("pointerup", stopDrag);
  dragHandle.addEventListener("pointercancel", stopDrag);
}

setupFloat(
  document.querySelector("#lab-float-window"),
  document.querySelector("#lab-float-ball"),
  document.querySelector("#lab-float-minimize"),
  document.querySelector("#lab-float-drag")
);

const discoveryData = {
  feed: { address: "https://darastas.github.io/announcements.xml", message: "原地址就是有效 RSS，直接解析为「FocusFeed 官方公告」。" },
  site: { address: "https://darastas.github.io/", message: "从官网首页的 head alternate 订阅声明发现「FocusFeed 官方公告」。" },
  article: { address: "https://darastas.github.io/announcements/release-0-2-4.html", message: "从 0.2.4 公告文章页的 head alternate 订阅声明发现同一公告 RSS。" }
};
const discoveryButtons = [...document.querySelectorAll("[data-discovery]")];
discoveryButtons.forEach((button) => button.addEventListener("click", () => {
  const data = discoveryData[button.dataset.discovery];
  discoveryButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  document.querySelector("#discovery-address").textContent = data.address;
  document.querySelector("#discovery-message").textContent = data.message;
}));

const marginWidths = { 1: "72rem", 2: "62rem", 3: "52rem", 4: "44rem", 5: "36rem" };
const labReadingInputs = [...document.querySelectorAll("[data-lab-reading]")];
const labReadingSample = document.querySelector(".lab-reading-sample");
function formatReadingValue(key, value) {
  if (key === "fontSize") return `${value}px`;
  if (key === "letterSpacing") return `${value}em`;
  return value;
}
labReadingInputs.forEach((input) => input.addEventListener("input", () => {
  const key = input.dataset.labReading;
  const properties = { fontSize: "--reading-font-size", fontWeight: "--reading-font-weight", letterSpacing: "--reading-letter-spacing", lineHeight: "--reading-line-height" };
  if (key === "marginLevel") labReadingSample.style.setProperty("--reading-max", marginWidths[input.value]);
  else labReadingSample.style.setProperty(properties[key], key === "fontSize" ? `${input.value}px` : key === "letterSpacing" ? `${input.value}em` : input.value);
  input.nextElementSibling.textContent = formatReadingValue(key, input.value);
}));

const labHighlight = document.querySelector("#lab-highlight");
const colorButtons = [...document.querySelectorAll("[data-highlight-color]")];
const markStyleButtons = [...document.querySelectorAll("[data-mark-style]")];
let highlightColor = "#f5c518";
let highlightStyle = "marker";
function applyLabMark() {
  labHighlight.style.background = highlightStyle === "marker" ? `${highlightColor}4D` : "transparent";
  labHighlight.style.borderBottom = highlightStyle === "underline" ? `2px solid ${highlightColor}` : "0";
  labHighlight.style.textDecoration = highlightStyle === "wavy" ? `underline wavy ${highlightColor} 1.5px` : "none";
  labHighlight.style.textUnderlineOffset = "3px";
}
colorButtons.forEach((button) => button.addEventListener("click", () => { highlightColor = button.dataset.highlightColor; setPressed(colorButtons, button); applyLabMark(); }));
markStyleButtons.forEach((button) => button.addEventListener("click", () => { highlightStyle = button.dataset.markStyle; setPressed(markStyleButtons, button); applyLabMark(); }));

const labThemeButtons = [...document.querySelectorAll("[data-lab-theme]")];
const accentButtons = [...document.querySelectorAll("[data-accent-color]")];
const themeSample = document.querySelector(".theme-sample");
labThemeButtons.forEach((button) => button.addEventListener("click", () => { themeSample.dataset.theme = button.dataset.labTheme; setPressed(labThemeButtons, button); }));
accentButtons.forEach((button) => button.addEventListener("click", () => { themeSample.style.setProperty("--sample-accent", button.dataset.accentColor); setPressed(accentButtons, button); }));

const demoTabs = [...document.querySelectorAll(".demo-tab")];
const demoPanel = document.querySelector("#demo-panel");
const demoVideo = document.querySelector("#demo-video");
function selectDemoTab(tab, focus = false) {
  demoTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  demoVideo.pause();
  demoVideo.querySelector("source").src = `/videos/${tab.dataset.video}.mp4`;
  demoVideo.poster = `/assets/poster-${tab.dataset.video}.jpg`;
  demoVideo.setAttribute("aria-label", `${tab.dataset.title}演示视频`);
  demoVideo.load();
  demoPanel.setAttribute("aria-labelledby", tab.id);
  document.querySelector("#demo-caption-title").textContent = tab.dataset.title;
  document.querySelector("#demo-caption-description").textContent = tab.dataset.description;
  if (focus) tab.focus();
}
demoTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectDemoTab(tab));
  tab.addEventListener("keydown", (event) => {
    const move = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    selectDemoTab(demoTabs[(index + move + demoTabs.length) % demoTabs.length], true);
  });
});
document.querySelectorAll("[data-demo-select]").forEach((link) => link.addEventListener("click", () => {
  const tab = document.querySelector(`#demo-tab-${link.dataset.demoSelect}`);
  if (tab) selectDemoTab(tab);
}));

if (!motionPreference.matches && "IntersectionObserver" in window) {
  document.body.classList.add("reveal-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -36px" });
  document.querySelectorAll(".section-intro, .lab-card, .story-grid figure, .demo-layout, .service-section > div, .download-header, .download-item, .linux-install").forEach((element) => {
    element.setAttribute("data-reveal", "");
    revealObserver.observe(element);
  });
}

document.querySelectorAll(".hash-button").forEach((button) => button.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(button.dataset.hash); showToast("SHA-256 已复制"); }
  catch { showToast("复制失败，请使用安全连接后重试"); }
}));
document.querySelectorAll(".command-button").forEach((button) => button.addEventListener("click", async () => {
  const command = document.getElementById(button.dataset.copyTarget);
  try { await navigator.clipboard.writeText(command.textContent); showToast("安装命令已复制"); }
  catch { showToast("复制失败，请选中命令手动复制"); }
}));
