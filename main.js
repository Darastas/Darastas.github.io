const tabs = [...document.querySelectorAll(".demo-tab")];
const panel = document.querySelector("#demo-panel");
const video = document.querySelector("#demo-video");
const captionTitle = document.querySelector("#demo-caption-title");
const captionDescription = document.querySelector("#demo-caption-description");
const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function selectTab(tab, focus = false) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  video.pause();
  video.querySelector("source").src = `/videos/${tab.dataset.video}.mp4`;
  video.poster = `/assets/poster-${tab.dataset.video}.jpg`;
  video.setAttribute("aria-label", `${tab.dataset.title}演示视频`);
  video.load();
  panel.setAttribute("aria-labelledby", tab.id);
  captionTitle.textContent = tab.dataset.title;
  captionDescription.textContent = tab.dataset.description;
  if (focus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const move = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    selectTab(tabs[(index + move + tabs.length) % tabs.length], true);
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
