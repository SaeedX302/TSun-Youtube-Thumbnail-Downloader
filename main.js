const form = document.getElementById("ifrm");
const input = document.getElementById("urlTxt");
const button = document.getElementById("btn-grab");
const statusEl = document.getElementById("status");
const iframe = document.getElementById("youtube");
const selectSection = document.getElementById("select");
const thumbnailGrid = document.querySelector(".thumbnail-grid");
const copyButton = document.getElementById("copyBtn");

let currentVideoId = "";

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "error");

  if (type) {
    statusEl.classList.add(type);
  }
}

function getYouTubeId(urlText) {
  const value = (urlText || "").trim();

  if (!value) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace("www.", "").toLowerCase();

    if (host === "youtu.be") {
      const shortId = parsed.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(shortId) ? shortId : null;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) {
        return fromQuery;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      const candidate = parts[1] || parts[0];
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function buildThumbnailUrl(videoId, name) {
  return `https://img.youtube.com/vi/${videoId}/${name}`;
}

function renderThumbnailCards(videoId) {
  const thumbnailFiles = [
    "0.jpg",
    "1.jpg",
    "2.jpg",
    "3.jpg",
    "default.jpg",
    "mqdefault.jpg",
    "hqdefault.jpg",
    "sddefault.jpg",
    "maxresdefault.jpg"
  ];

  thumbnailGrid.innerHTML = "";

  thumbnailFiles.forEach((fileName) => {
    const imageUrl = buildThumbnailUrl(videoId, fileName);

    const item = document.createElement("li");
    item.className = "thumb-card";
    item.innerHTML = `
      <img src="${imageUrl}" alt="Thumbnail ${fileName}" loading="lazy" />
      <div class="thumb-meta">
        <span class="thumb-name">${fileName}</span>
        <a class="thumb-download" href="${imageUrl}" download="${videoId}-${fileName}">Download</a>
      </div>
    `;

    thumbnailGrid.appendChild(item);
  });
}

function updatePreview(videoId) {
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
}

function resetOutput() {
  thumbnailGrid.innerHTML = "";
  iframe.removeAttribute("src");
  selectSection.hidden = true;
  currentVideoId = "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  button.disabled = true;

  const videoId = getYouTubeId(input.value);

  if (!videoId) {
    resetOutput();
    setStatus("Please enter a valid YouTube URL or 11-character video ID.", "error");
    button.disabled = false;
    return;
  }

  currentVideoId = videoId;
  updatePreview(videoId);
  renderThumbnailCards(videoId);
  selectSection.hidden = false;
  setStatus("Thumbnails loaded. Pick any version and download.", "ok");
  button.disabled = false;
});

copyButton.addEventListener("click", async () => {
  if (!currentVideoId) {
    setStatus("Load a video first to copy the ID.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(currentVideoId);
    setStatus("Video ID copied to clipboard.", "ok");
  } catch (error) {
    setStatus("Clipboard access failed. You can copy the ID manually.", "error");
  }
});