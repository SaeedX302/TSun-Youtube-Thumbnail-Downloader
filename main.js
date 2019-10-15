const form = document.getElementById("ifrm");
const input = document.getElementById("urlTxt");
const button = document.getElementById("btn-grab");
const statusEl = document.getElementById("status");
const iframe = document.getElementById("youtube");
const selectSection = document.getElementById("select");
const thumbnailGrid = document.querySelector(".thumbnail-grid");
const copyButton = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");

let currentVideoId = "";

const currentTheme = localStorage.getItem("theme");
if (currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme);
  document.documentElement.setAttribute("data-bs-theme", currentTheme);
  themeToggle.setAttribute("aria-label", currentTheme === "light" ? "Switch to dark mode" : "Switch to light mode");
} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.setAttribute("data-bs-theme", "light");
  themeToggle.setAttribute("aria-label", "Switch to dark mode");
} else {
  document.documentElement.setAttribute("data-bs-theme", "dark");
}

themeToggle.addEventListener("click", () => {
  let theme = document.documentElement.getAttribute("data-theme");
  if (theme === "light") {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.setAttribute("data-bs-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("data-bs-theme", "light");
    localStorage.setItem("theme", "light");
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  }
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "error");

  if (type) {
    statusEl.classList.add(type);
  }
}

function getYouTubeId(urlText) {
  const value = (urlText || "").trim();

  if (!value) return null;

  // Exact 11-char match
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  // Modern and robust regex for YouTube domains and youtu.be short links
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = value.match(regex);
  
  if (match && match[1]) {
    return match[1];
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
    item.className = "col-12 col-sm-6 col-md-4";
    item.innerHTML = `
      <div class="card h-100 shadow-sm overflow-hidden border-secondary-subtle">
        <img src="${imageUrl}" alt="Thumbnail ${fileName}" loading="lazy" class="card-img-top object-fit-cover" style="aspect-ratio: 16/9; background-color: var(--bs-secondary-bg);" />
        <div class="card-body d-flex flex-column">
          <h6 class="card-title text-truncate mb-3" title="${fileName}">${fileName}</h6>
          <a class="btn btn-primary btn-sm fw-bold w-100 mt-auto" href="${imageUrl}" download="${videoId}-${fileName}">Download</a>
        </div>
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