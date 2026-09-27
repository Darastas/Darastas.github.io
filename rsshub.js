const form = document.getElementById("rss-form");
const pathInput = document.getElementById("rss-path");
const result = document.getElementById("rss-result");
const urlInput = document.getElementById("rss-url");
const openLink = document.getElementById("rss-open");
const copyButton = document.getElementById("rss-copy");
const status = document.getElementById("rss-status");
const base = new URL(form.dataset.base);

function feedUrl(input) {
  const value = input.trim();
  if (!value) throw new Error("请输入 RSSHub 路由路径。");

  let route = value;
  if (/^https?:\/\//i.test(value)) {
    const pasted = new URL(value);
    const allowed = ["rsshub.app", "rsshub.netlify.app", base.hostname];
    if (!allowed.includes(pasted.hostname)) throw new Error("请粘贴 RSSHub 官方示例链接或路由路径。");
    route = pasted.pathname + pasted.search;
  }
  if (route.startsWith("//")) throw new Error("请输入单个斜杠开头的路由路径。");
  if (!route.startsWith("/")) route = `/${route}`;

  const url = new URL(route, base);
  if (url.origin !== base.origin || url.pathname === "/") throw new Error("请输入有效的 RSSHub 路由路径。");
  return url.href;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const url = feedUrl(pathInput.value);
    urlInput.value = url;
    openLink.href = url;
    result.hidden = false;
    status.textContent = "地址已生成。打开检查后再添加到 FocusFeed。";
  } catch (error) {
    result.hidden = true;
    status.textContent = error.message;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(urlInput.value);
    status.textContent = "订阅地址已复制。";
  } catch {
    urlInput.select();
    status.textContent = "请按 Ctrl+C 复制选中的地址。";
  }
});
