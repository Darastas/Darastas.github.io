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
const appBrand = document.querySelector(".app-brand");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let heroFrame = 0;

function updateHero() {
  heroFrame = 0;
  if (!hero || !heroIntro || !heroApp || !flyingMark || !appBrand) return;
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
  const fragmentIn = clamp((progress - .04) / .18);
  const fragmentOut = clamp((progress - .42) / .24);
  const mobile = innerWidth <= 700;
  const markSize = mobile ? 88 : 112;
  const targetSize = mobile ? 25 : 28;
  const startX = innerWidth / 2;
  const stickyHeight = hero.querySelector(".hero-sticky").clientHeight;
  const startY = stickyHeight * (mobile ? .18 : .22);
  const targetX = heroApp.offsetLeft - heroApp.offsetWidth / 2 + appBrand.offsetLeft + targetSize / 2;
  const targetY = heroApp.offsetTop - heroApp.offsetHeight / 2 + appBrand.offsetTop + targetSize / 2;
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
  hero.style.setProperty("--fragment-opacity", String(fragmentIn * (1 - fragmentOut)));
  hero.style.setProperty("--fragment-scale", String(.65 + fragmentIn * .35));
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

const appViewTabs = [...document.querySelectorAll("[data-app-view]")];
const appPanels = [...document.querySelectorAll("[data-app-panel]")];
const appSummary = document.querySelector("#app-summary");
const appSummaryButton = document.querySelector("#app-summary-button");

function selectAppView(tab, focus = false) {
  appViewTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  appPanels.forEach((panel) => { panel.hidden = panel.dataset.appPanel !== tab.dataset.appView; });
  appSummaryButton.hidden = tab.dataset.appView !== "reading";
  if (focus) tab.focus();
}

appViewTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectAppView(tab));
  tab.addEventListener("keydown", (event) => {
    const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    selectAppView(appViewTabs[(index + move + appViewTabs.length) % appViewTabs.length], true);
  });
});

const articles = [
  {
    source: "独立博客 · 今天 09:30",
    title: "重新拥有自己的信息入口",
    lead: "当订阅列表由自己决定，阅读就不再被下一次刷新牵着走。",
    body: "RSS 把网站更新带回一个简单的入口。没有热度排行，也不必追逐提醒，只有主动选择的内容和适合读完它的时间。"
  },
  {
    source: "设计观察 · 今天 10:15",
    title: "留白不是空，而是节奏",
    lead: "舒适的阅读界面，不会让装饰比文字更先被看见。",
    body: "恰当的页宽、行距与留白共同建立节奏。工具退到背景里，视线才能从一个段落自然地走向下一个段落。"
  },
  {
    source: "效率笔记 · 今天 11:20",
    title: "把稍后读变成真正读过",
    lead: "收藏不是终点，一个能随时回来的阅读空间才是。",
    body: "给订阅做减法，给未读设一个可以完成的范围。读完之后，把高亮和批注导出，让一篇文章真正成为自己的笔记。"
  }
];

document.querySelectorAll("[data-article]").forEach((button) => {
  button.addEventListener("click", () => {
    const article = articles[Number(button.dataset.article)];
    document.querySelectorAll("[data-article]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelector("#app-article-source").textContent = article.source;
    document.querySelector("#app-article-title").textContent = article.title;
    document.querySelector("#app-article-lead").textContent = article.lead;
    document.querySelector("#app-article-body").textContent = article.body;
    appSummary.hidden = true;
    appSummaryButton.setAttribute("aria-expanded", "false");
    appSummaryButton.textContent = "查看摘要";
    selectAppView(appViewTabs[0]);
  });
});

const appFontButtons = [...document.querySelectorAll("[data-app-font]")];
appFontButtons.forEach((button) => {
  button.addEventListener("click", () => {
    heroApp.dataset.appFont = button.dataset.appFont;
    setPressed(appFontButtons, button);
  });
});

const appThemeButton = document.querySelector(".app-theme");
appThemeButton.addEventListener("click", () => {
  const dark = heroApp.classList.toggle("is-dark");
  appThemeButton.setAttribute("aria-pressed", String(dark));
  appThemeButton.textContent = dark ? "浅色" : "深色";
});

appSummaryButton.addEventListener("click", () => {
  const expanded = appSummaryButton.getAttribute("aria-expanded") !== "true";
  appSummaryButton.setAttribute("aria-expanded", String(expanded));
  appSummaryButton.textContent = expanded ? "收起摘要" : "查看摘要";
  appSummary.hidden = !expanded;
});

const labFontButtons = [...document.querySelectorAll("[data-lab-font]")];
const labReadingSample = document.querySelector(".lab-reading-sample");
labFontButtons.forEach((button) => {
  button.addEventListener("click", () => {
    labReadingSample.dataset.size = button.dataset.labFont;
    setPressed(labFontButtons, button);
  });
});

const themeButtons = [...document.querySelectorAll("[data-theme-choice]")];
const themeSample = document.querySelector(".theme-sample");
themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    themeSample.dataset.theme = button.dataset.themeChoice;
    setPressed(themeButtons, button);
  });
});

const discoveryResult = document.querySelector("#discovery-result");
const discoveryMessages = {
  feed: "直接添加 Feed 地址：FocusFeed 会验证并订阅这个地址。",
  site: "网站首页示例：已发现 /feed.xml，可以继续添加订阅。",
  article: "文章链接示例：已从页面声明中发现同站 Feed，可以继续添加。"
};
document.querySelectorAll("[data-discovery]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-discovery]").forEach((item) => item.classList.toggle("active", item === button));
    discoveryResult.textContent = discoveryMessages[button.dataset.discovery];
  });
});

const highlight = document.querySelector("#lab-highlight");
const highlightButton = document.querySelector(".highlight-button");
const colorButtons = [...document.querySelectorAll("[data-highlight-color]")];
colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    highlight.style.setProperty("--demo-highlight", button.dataset.highlightColor);
    highlight.classList.remove("is-off");
    highlightButton.setAttribute("aria-pressed", "true");
    highlightButton.textContent = "取消高亮";
    setPressed(colorButtons, button);
  });
});
highlightButton.addEventListener("click", () => {
  const active = highlight.classList.toggle("is-off") === false;
  highlightButton.setAttribute("aria-pressed", String(active));
  highlightButton.textContent = active ? "取消高亮" : "高亮这句话";
});

const labSummaryButton = document.querySelector(".summary-button");
const labSummary = document.querySelector("#lab-summary");
labSummaryButton.addEventListener("click", () => {
  const expanded = labSummaryButton.getAttribute("aria-expanded") !== "true";
  labSummaryButton.setAttribute("aria-expanded", String(expanded));
  labSummaryButton.textContent = expanded ? "收起摘要" : "查看摘要示例";
  labSummary.hidden = !expanded;
});

const syncInterval = document.querySelector("#sync-interval");
const preloadToggle = document.querySelector(".preload-toggle");
const syncStatus = document.querySelector("#sync-status");
function updateSyncStatus() {
  const interval = syncInterval.value === "0" ? "定时同步已关闭" : `每 ${syncInterval.value} 分钟同步`;
  const preload = preloadToggle.getAttribute("aria-checked") === "true" ? "已开启" : "已关闭";
  syncStatus.textContent = `${interval} · 启动预加载${preload}`;
}
syncInterval.addEventListener("change", updateSyncStatus);
preloadToggle.addEventListener("click", () => {
  preloadToggle.setAttribute("aria-checked", String(preloadToggle.getAttribute("aria-checked") !== "true"));
  updateSyncStatus();
});

const demoTabs = [...document.querySelectorAll(".demo-tab")];
const demoPanel = document.querySelector("#demo-panel");
const demoVideo = document.querySelector("#demo-video");
const demoCaptionTitle = document.querySelector("#demo-caption-title");
const demoCaptionDescription = document.querySelector("#demo-caption-description");

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
  demoCaptionTitle.textContent = tab.dataset.title;
  demoCaptionDescription.textContent = tab.dataset.description;
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

document.querySelectorAll(".hash-button").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.hash);
      showToast("SHA-256 已复制");
    } catch {
      showToast("复制失败，请使用安全连接后重试");
    }
  });
});

document.querySelectorAll(".command-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const command = document.getElementById(button.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(command.textContent);
      showToast("安装命令已复制");
    } catch {
      showToast("复制失败，请选中命令手动复制");
    }
  });
});
