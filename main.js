const form = document.getElementById("ifrm");
const input = document.getElementById("urlTxt");
const btnGrab = document.getElementById("btn-grab");
const statusEl = document.getElementById("status");
const iframe = document.getElementById("youtube");
const resultsSection = document.getElementById("results");
const thumbnailGrid = document.getElementById("thumbnailGrid");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");
const videoLoader = document.getElementById("videoLoader");
const toastContainer = document.getElementById("toastContainer");

let currentVideoId = "";

// --- THEME MANAGEMENT ---
const initTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || (!savedTheme && systemDark)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};
initTheme();

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

// --- TOAST NOTIFICATIONS ---
const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  const bgClass = type === "success" ? "bg-emerald-500" : (type === "error" ? "bg-red-500" : "bg-brand-500");
  const iconClass = type === "success" ? "ph-check-circle" : (type === "error" ? "ph-warning-circle" : "ph-info");
  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium shadow-xl ${bgClass}`;
  toast.innerHTML = `<i class="ph-fill ${iconClass} text-xl"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hiding");
    toast.addEventListener("animationend", () => toast.remove());
  }, 3000);
};

// --- CORE LOGIC ---
const setStatus = (msg, type = "info") => {
  statusEl.textContent = msg;
  statusEl.style.opacity = msg ? "1" : "0";
  statusEl.className = `mt-4 text-sm font-medium h-5 transition-all ${type === "error" ? "text-red-500" : type === "success" ? "text-emerald-500" : "text-brand-500"}`;
};

const getYouTubeId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match && match[1] ? match[1] : (url.length === 11 ? url : null);
};

const triggerDownload = async (url, filename, btn) => {
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Fetching...`;
  btn.disabled = true;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image proxy error");
    const blob = await response.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
    showToast(`Downloaded ${filename}`);
  } catch (error) {
    showToast("Failed to download directly. Opening in new tab.", "info");
    window.open(url, "_blank");
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};

const fallbackCopyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("Copied to clipboard!");
  } catch (err) {
    showToast("Failed to copy", "error");
  }
  document.body.removeChild(textArea);
};

const copyToClipboard = async (text) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!");
    } catch (err) {
      fallbackCopyToClipboard(text);
    }
  } else {
    fallbackCopyToClipboard(text);
  }
};

copyBtn.addEventListener("click", () => {
  if (currentVideoId) copyToClipboard(currentVideoId);
});

const renderThumbnails = (videoId) => {
  const formats = [
    { file: "maxresdefault.jpg", name: "Maximum Resolution", badge: "HD", color: "bg-brand-500" },
    { file: "hqdefault.jpg", name: "High Quality", badge: "HQ", color: "bg-purple-500" },
    { file: "sddefault.jpg", name: "Standard Definition", badge: "SD", color: "bg-blue-500" },
    { file: "mqdefault.jpg", name: "Medium Quality", badge: "MQ", color: "bg-emerald-500" },
    { file: "default.jpg", name: "Default", badge: "Normal", color: "bg-surface-500" },
    { file: "0.jpg", name: "Player Background", badge: "bg", color: "bg-amber-500" },
    { file: "1.jpg", name: "Start Frame", badge: "thumb", color: "bg-rose-500" },
    { file: "2.jpg", name: "Middle Frame", badge: "thumb", color: "bg-rose-500" },
    { file: "3.jpg", name: "End Frame", badge: "thumb", color: "bg-rose-500" }
  ];
  thumbnailGrid.innerHTML = "";
  formats.forEach((fmt, index) => {
    const imgUrl = `https://img.youtube.com/vi/${videoId}/${fmt.file}`;
    const li = document.createElement("li");
    li.style.animationDelay = `${index * 0.1}s`;
    li.className = "thumbnail-card animate-slide-up bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-lg group flex flex-col";
    li.innerHTML = `
      <div class="relative w-full aspect-video bg-surface-100 dark:bg-surface-800 overflow-hidden">
        <img src="${imgUrl}" alt="${fmt.name}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='https://via.placeholder.com/640x360?text=Not+Found'" />
        <div class="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-md text-white shadow-md ${fmt.color}">${fmt.badge}</div>
      </div>
      <div class="p-5 flex flex-col flex-grow">
        <h3 class="font-display font-bold text-lg mb-1 dark:text-white">${fmt.name}</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400 mb-4 font-mono">${fmt.file}</p>
        <div class="mt-auto flex gap-2">
          <button class="download-btn flex-1 bg-surface-100 hover:bg-brand-500 hover:text-white text-surface-700 dark:text-surface-200 dark:bg-surface-800 dark:hover:bg-brand-500 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <i class="ph-bold ph-download-simple"></i><span>Wait...</span>
          </button>
          <button class="copy-link-btn w-12 flex-shrink-0 bg-surface-100 hover:bg-surface-200 text-surface-700 dark:text-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center">
            <i class="ph-bold ph-link"></i>
          </button>
        </div>
      </div>
    `;
    const dBtn = li.querySelector(".download-btn");
    const dSpan = dBtn.querySelector("span");
    const imgCheck = new Image();
    imgCheck.onload = () => {
      if (imgCheck.width === 120 && imgCheck.height === 90) {
         dBtn.disabled = true;
         dBtn.classList.add("opacity-50", "cursor-not-allowed");
         dBtn.classList.remove("hover:bg-brand-500", "hover:text-white");
         dSpan.textContent = "Unavailable";
      } else {
         dSpan.textContent = "Save";
         dBtn.addEventListener("click", () => triggerDownload(imgUrl, `${videoId}-${fmt.file}`, dBtn));
      }
    };
    imgCheck.onerror = () => { dBtn.disabled = true; dSpan.textContent = "Error"; };
    imgCheck.src = imgUrl;
    li.querySelector(".copy-link-btn").addEventListener("click", () => copyToClipboard(imgUrl));
    thumbnailGrid.appendChild(li);
  });
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const url = input.value.trim();
  const videoId = getYouTubeId(url);
  if (!videoId) {
    setStatus("Invalid YouTube URL.", "error");
    input.focus();
    return;
  }
  currentVideoId = videoId;
  setStatus("Extracting resources...", "success");
  btnGrab.disabled = true;
  btnGrab.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Processing`;
  resultsSection.classList.add("hidden", "opacity-0");
  setTimeout(() => {
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.onload = () => { iframe.classList.remove("opacity-0"); videoLoader.classList.add("hidden"); };
    renderThumbnails(videoId);
    btnGrab.disabled = false;
    btnGrab.innerHTML = `<span>Extract</span><i class="ph-bold ph-arrow-right"></i>`;
    resultsSection.classList.remove("hidden");
    requestAnimationFrame(() => {
      resultsSection.classList.remove("opacity-0");
      setStatus("", "");
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, 600);
});
