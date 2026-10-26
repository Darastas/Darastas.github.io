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
const sidebarBrand = document.querySelector(".sidebar-brand img");
const windowBrand = document.querySelector(".window-brand");
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
  const brand = compact ? windowBrand : sidebarBrand;
  const markSize = mobile ? 88 : 112;
  const targetSize = compact ? 20 : 32;
  const startX = innerWidth / 2;
  const stickyHeight = hero.querySelector(".hero-sticky").clientHeight;
  const startY = stickyHeight * (mobile ? .18 : .22);
  const targetX = heroApp.offsetLeft - heroApp.offsetWidth / 2 + brand.offsetLeft + targetSize / 2;
  const targetY = heroApp.offsetTop - heroApp.offsetHeight / 2 + brand.offsetTop + targetSize / 2;
  const markX = lerp(startX, targetX, markIn);
  const markY = lerp(startY, targetY, markIn);
  const markScale = lerp(1, targetSize / markSize, markIn);

  hero.style.setProperty("--hero-progress", progress.toFixed(4));
  hero.style.setProperty("--intro-opacity", String(1 - introOut));
  hero.style.setProperty("--intro-y", `${-42 * introOut}px`);
  hero.style.setProperty("--app-opacity", appIn.toFixed(4));
  hero.style.setProperty("--app-y", `${70 * (1 - appIn)}px`);
  hero.style.setProperty("--app-scale", String(lerp(.86, 1, appIn)));
  hero.style.setProperty("--brand-opacity", String(clamp((progress - .65) / .08)));
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

function setupSummary(prefix = "") {
  const id = (name) => document.querySelector(`#${prefix}${name}`);
  const openButton = id("summary-open");
  const card = id("summary-card");
  const ball = id("summary-ball");
  const minimize = id("summary-minimize");
  const closeButton = id("summary-close");
  const expand = id("summary-expand");
  let closeTimer;

  function open() {
    clearTimeout(closeTimer);
    card.hidden = false;
    ball.hidden = true;
    card.dataset.state = "closed";
    requestAnimationFrame(() => requestAnimationFrame(() => { card.dataset.state = "open"; }));
  }

  function close(immediate = false) {
    clearTimeout(closeTimer);
    card.dataset.state = "closed";
    ball.hidden = true;
    if (immediate) card.hidden = true;
    else closeTimer = setTimeout(() => { card.hidden = true; }, 170);
  }

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", () => close());
  minimize.addEventListener("click", () => { card.hidden = true; ball.hidden = false; });
  ball.addEventListener("click", open);
  if (expand) {
    expand.addEventListener("click", () => {
      const expanded = id("summary-text").classList.toggle("expanded");
      expand.textContent = expanded ? "收起" : "展开";
    });
  }
  return { open, close };
}

const heroSummary = setupSummary();
const labSummary = setupSummary("lab-");

function setupFloat(windowElement, ball, openButton, minimizeButton, closeButton, dragHandle) {
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

  function close(immediate = false) {
    clearTimeout(shrinkTimer);
    clearTimeout(restoreTimer);
    windowElement.hidden = true;
    ball.hidden = true;
    windowElement.classList.remove("ai-win-shrink", "ai-win-restore");
    if (!immediate) openButton?.focus();
  }

  openButton?.addEventListener("click", open);
  minimizeButton.addEventListener("click", minimize);
  closeButton?.addEventListener("click", () => close());
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
  return { open, close };
}

const interpretFloat = setupFloat(
  document.querySelector("#interpret-window"),
  document.querySelector("#interpret-ball"),
  document.querySelector("#interpret-open"),
  document.querySelector("#interpret-minimize"),
  document.querySelector("#interpret-close"),
  document.querySelector("#interpret-drag")
);

setupFloat(
  document.querySelector("#lab-float-window"),
  document.querySelector("#lab-float-ball"),
  null,
  document.querySelector("#lab-float-minimize"),
  null,
  document.querySelector("#lab-float-drag")
);

const articles = [
  {
    title: "FocusFeed 0.2.4：粘贴网页地址，自动查找订阅源",
    meta: "FocusFeed 官方公告 · 2026 年 10 月 25 日",
    summary: "0.2.4 修复将网页直接当作 Feed 解析的问题。\n支持 RSS、Atom 和 JSON Feed。\n首页和文章链接会查找订阅声明。\n文章页没有声明时继续检查网站首页。\n候选地址必须实际解析成功。\n保留分组、收藏和已读状态。\n重复订阅会识别已有公告源。\n请安装完整安装包获得核心修复。",
    body: "<p><strong>FocusFeed 0.2.4 改善订阅地址识别。</strong> 除了直接填写 RSS、Atom 或 JSON Feed 地址，也可以粘贴网站首页或文章链接。</p><h3>修复网页地址订阅失败</h3><p>应用会查找网页中声明的订阅链接；文章页没有声明时，继续查找网站首页及常见订阅路径。<span class=\"ff-mark\">候选地址必须实际解析成 Feed，网页本身不会被当成订阅源。</span></p><p>文章链接会订阅该网站的更新，不等同于保存单篇网页。找不到可解析的订阅源时，也会明确说明原因。</p>"
  },
  {
    title: "FocusFeed 0.2.3：系统托盘、备份恢复与朗读进度",
    meta: "FocusFeed 官方公告 · 2026 年 10 月 15 日",
    summary: "桌面端可以收起到系统托盘。\n后台同步和朗读可以继续。\n单击托盘图标即可恢复窗口。\n单文件备份使用 .ffbackup 格式。\n备份可包含订阅、配置和阅读记录。\n恢复前会校验并保留原数据副本。\n朗读支持点击和拖动跳转。\nAndroid 通过系统文件选择器迁移备份。",
    body: "<p><strong>FocusFeed 0.2.3 加入系统托盘与单文件备份恢复，并改进 AI 朗读进度。</strong></p><h3>用一份文件备份与恢复</h3><p>备份包含订阅、账号、AI 配置、个人许可、阅读记录、收藏、批注和外观设置。<span class=\"ff-mark\">备份中包含账号凭据、API 密钥和许可信息，请妥善保管，不要公开分享。</span></p><p>恢复会替换当前本地配置与阅读数据，建议先导出当前设备的备份。</p>"
  },
  {
    title: "FocusFeed 0.2.2.1：可选启动预加载与外链打开修复",
    meta: "FocusFeed 官方公告 · 2026 年 10 月 12 日",
    summary: "启动预加载默认关闭。\n可以选择最近 20 或 30 篇未读。\n也支持自定义 1–1000 篇。\n预加载保留未读、收藏和批注。\n已有全文缓存会跳过。\n官方公告和电子书不参与预加载。\n图片和音视频仍按需加载。\n普通正文外链交给系统浏览器打开。",
    body: "<p><strong>FocusFeed 0.2.2.1 增加可选的启动预加载，并修复正文外链无法访问的问题。</strong></p><h3>先准备几篇未读文章</h3><p>每次打开软件时，可以按发布时间缓存最近的未读文章。<span class=\"ff-mark\">预加载会访问文章原网页，可能消耗较多流量，建议在 Wi-Fi 下开启。</span></p><p>普通正文外链交给系统浏览器打开，同时保留打开前的确认设置。</p>"
  }
];

const articleButtons = [...document.querySelectorAll("[data-article]")];
const appTitle = document.querySelector("#app-article-title");
const appMeta = document.querySelector("#app-article-meta");
const appBody = document.querySelector("#app-article-body");
const heroPen = document.querySelector("#hero-pen");

articleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const article = articles[Number(button.dataset.article)];
    articleButtons.forEach((item) => item.classList.toggle("active", item === button));
    appTitle.textContent = article.title;
    appMeta.textContent = article.meta;
    appBody.innerHTML = article.body;
    document.querySelector("#summary-text").textContent = article.summary;
    document.querySelector("#summary-text").classList.remove("expanded");
    document.querySelector("#summary-expand").textContent = "展开";
    heroSummary.close(true);
    interpretFloat.close(true);
    heroPen.setAttribute("aria-pressed", "true");
  });
});
document.querySelector("#summary-text").textContent = articles[0].summary;

const articleSearch = document.querySelector("#article-search");
articleSearch.addEventListener("input", () => {
  const query = articleSearch.value.trim().toLowerCase();
  let visible = 0;
  articleButtons.forEach((button) => {
    const match = articles[Number(button.dataset.article)].title.toLowerCase().includes(query);
    button.hidden = !match;
    if (match) visible += 1;
  });
  document.querySelector(".article-items").hidden = visible === 0;
  document.querySelector("#list-empty").hidden = visible > 0;
});

heroPen.addEventListener("click", () => {
  const active = heroPen.getAttribute("aria-pressed") !== "true";
  heroPen.setAttribute("aria-pressed", String(active));
  appBody.querySelectorAll(".ff-mark").forEach((mark) => mark.classList.toggle("is-off", !active));
});

const zenButton = document.querySelector("#zen-toggle");
zenButton.addEventListener("click", () => {
  const zen = heroApp.classList.toggle("is-zen");
  zenButton.setAttribute("aria-pressed", String(zen));
  zenButton.textContent = zen ? "退出专注" : "专注阅读";
});

const appThemeButton = document.querySelector(".app-theme");
const themeRipple = document.querySelector("#theme-ripple");
appThemeButton.addEventListener("click", (event) => {
  const dark = !heroApp.classList.contains("is-dark");
  const rect = heroApp.getBoundingClientRect();
  const x = event.clientX ? event.clientX - rect.left : rect.width - 60;
  const y = event.clientY ? event.clientY - rect.top : rect.height - 30;
  heroApp.classList.toggle("is-dark", dark);
  appThemeButton.setAttribute("aria-pressed", String(dark));
  appThemeButton.textContent = dark ? "浅色" : "深色";
  themeRipple.style.left = `${x}px`;
  themeRipple.style.top = `${y}px`;
  themeRipple.style.background = dark ? "#17151a" : "#faf7f2";
  themeRipple.hidden = false;
  themeRipple.addEventListener("animationend", () => { themeRipple.hidden = true; }, { once: true });
});

const settingsModal = document.querySelector("#reading-settings-modal");
const settingsOpen = document.querySelector("#reading-settings-open");
const settingsClose = document.querySelector("#reading-settings-close");
const articleInner = document.querySelector("#article-inner");
const readingInputs = [...document.querySelectorAll("[data-reading]")];
const readingDefaults = { fontSize: "17", fontWeight: "400", letterSpacing: "0", lineHeight: "1.75", marginLevel: "3" };
const marginWidths = { 1: "72rem", 2: "62rem", 3: "52rem", 4: "44rem", 5: "36rem" };

function formatReadingValue(key, value) {
  if (key === "fontSize") return `${value}px`;
  if (key === "letterSpacing") return `${value}em`;
  return value;
}

function applyReadingInput(input) {
  const key = input.dataset.reading;
  const properties = { fontSize: "--reading-font-size", fontWeight: "--reading-font-weight", letterSpacing: "--reading-letter-spacing", lineHeight: "--reading-line-height" };
  if (key === "marginLevel") articleInner.style.setProperty("--reading-max", marginWidths[input.value]);
  else articleInner.style.setProperty(properties[key], key === "fontSize" ? `${input.value}px` : key === "letterSpacing" ? `${input.value}em` : input.value);
  input.nextElementSibling.textContent = formatReadingValue(key, input.value);
}

readingInputs.forEach((input) => input.addEventListener("input", () => applyReadingInput(input)));
const alignButtons = [...document.querySelectorAll("[data-reading-align]")];
alignButtons.forEach((button) => button.addEventListener("click", () => {
  articleInner.style.setProperty("--reading-align", button.dataset.readingAlign);
  setPressed(alignButtons, button);
}));

function closeSettings() {
  settingsModal.hidden = true;
  settingsOpen.focus();
}
settingsOpen.addEventListener("click", () => { settingsModal.hidden = false; settingsClose.focus(); });
settingsClose.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", (event) => { if (event.target === settingsModal) closeSettings(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !settingsModal.hidden) closeSettings(); });
document.querySelector("#reading-reset").addEventListener("click", () => {
  readingInputs.forEach((input) => { input.value = readingDefaults[input.dataset.reading]; applyReadingInput(input); });
  articleInner.style.setProperty("--reading-align", "left");
  setPressed(alignButtons, alignButtons[0]);
});

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

const labReadingInputs = [...document.querySelectorAll("[data-lab-reading]")];
const labReadingSample = document.querySelector(".lab-reading-sample");
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
