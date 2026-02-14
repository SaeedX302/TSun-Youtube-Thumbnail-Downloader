const form = document.getElementById("ifrm");
const input = document.getElementById("urlTxt");
const btnGrab = document.getElementById("btn-grab");
const statusEl = document.getElementById("status");
const iframe = document.getElementById("youtube");
const resultsSection = document.getElementById("results");
const thumbnailGrid = document.getElementById("thumbnailGrid");
const downloadAllSection = document.getElementById("downloadAllSection");
const btnDownloadAll = document.getElementById("btnDownloadAll");
const txtDownloadAll = document.getElementById("txtDownloadAll");
const zipProgressWrapper = document.getElementById("zipProgressWrapper");
const zipStatusText = document.getElementById("zipStatusText");
const zipPercentage = document.getElementById("zipPercentage");
const zipProgressBar = document.getElementById("zipProgressBar");

const analysisBadge = document.getElementById("smartAnalysisBadge");
const analysisIcon = document.getElementById("analysisIcon");
const analysisText = document.getElementById("analysisText");

// Elements for History
const searchHistoryContainer = document.getElementById("searchHistoryContainer");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

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
  const bgClass = type === "success" ? "bg-emerald-500/20 border-emerald-400 text-emerald-400" : (type === "error" ? "bg-red-500/20 border-red-400 text-red-500" : "bg-brand-500/20 border-brand-500 text-brand-400");
  const iconClass = type === "success" ? "ph-check-circle" : (type === "error" ? "ph-warning-circle" : "ph-info");
  const shadowClass = type === "success" ? "shadow-[0_0_15px_rgba(16,185,129,0.3)]" : (type === "error" ? "shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "shadow-[0_0_15px_rgba(0,240,255,0.3)]");
  
  toast.className = `animate-slide-in flex items-center gap-3 px-5 py-4 rounded-xl font-mono font-bold uppercase tracking-wider border backdrop-blur-xl ${bgClass} ${shadowClass}`;
  toast.innerHTML = `<i class="ph-bold ${iconClass} text-2xl drop-shadow-[0_0_8px_currentColor]"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("animate-slide-in");
    toast.classList.add("animate-slide-out");
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

// --- DATA PERSISTENCE ---
const MAX_HISTORY = 5;

const loadHistory = () => JSON.parse(localStorage.getItem("tsun_history") || "[]");
const saveHistory = (items) => localStorage.setItem("tsun_history", JSON.stringify(items));

const addSearchToHistory = (videoId, title = "Unknown Video") => {
  let history = loadHistory();
  history = history.filter(item => item.id !== videoId); // Remove duplicates
  history.unshift({ id: videoId, title: "Video " + videoId, timestamp: Date.now() }); // Prepend
  if (history.length > MAX_HISTORY) history.pop(); // Keep only max
  saveHistory(history);
  renderSearchHistory();
};

const renderSearchHistory = () => {
  const history = loadHistory();
  
  if (history.length === 0) {
    searchHistoryContainer.classList.add("hidden");
    return;
  }
  
  searchHistoryContainer.classList.remove("hidden");
  historyList.innerHTML = "";
  
  history.forEach((item) => {
    const thumbUrl = `https://img.youtube.com/vi/${item.id}/default.jpg`;
    const btn = document.createElement("button");
    btn.className = "group flex items-center bg-white/90 dark:bg-surface-900/80 hover:bg-surface-100 dark:hover:bg-brand-500/10 border border-surface-200 dark:border-brand-500/20 rounded-xl p-1.5 pr-4 shadow-glass transition-all gap-3 backdrop-blur-sm";
    btn.innerHTML = `
      <img src="${thumbUrl}" alt="Thumbnail" class="w-12 h-8 rounded border border-surface-700 object-cover">
      <span class="text-sm font-bold font-mono text-surface-700 dark:text-brand-400">${item.id}</span>
      <i class="ph-bold ph-arrow-right text-brand-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"></i>
    `;
    
    // When a history item is clicked, run extraction process on it
    btn.addEventListener("click", () => {
      input.value = `https://youtube.com/watch?v=${item.id}`;
      // Trigger extraction flow natively using fake submit
      form.dispatchEvent(new Event('submit'));
    });
    
    historyList.appendChild(btn);
  });
};

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("tsun_history");
  renderSearchHistory();
  showToast("History cleared", "info");
});

// Initialize history on page load
renderSearchHistory();

const runSmartAnalysis = (videoId) => {
  analysisBadge.classList.replace("hidden", "flex");
  analysisBadge.className = "flex text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 border border-brand-500/30 rounded-xl items-center gap-2 shadow-neon-surface backdrop-blur-md transition bg-surface-100 dark:bg-surface-900/80 text-surface-500 animate-pulse";
  analysisIcon.className = "ph-bold ph-spinner animate-spin text-brand-500 drop-shadow-[0_0_5px_rgba(0,240,255,0.6)]";
  analysisText.textContent = "Analyzing Source...";

  const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const imgCheck = new Image();

  imgCheck.onload = () => {
    if (imgCheck.width === 120 && imgCheck.height === 90) {
      // It's the fallback unavailable image
      analysisBadge.className = "flex text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 rounded-xl items-center gap-2 transition bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-slide-up backdrop-blur-md";
      analysisIcon.className = "ph-bold ph-warning-circle drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]";
      analysisText.innerHTML = "Sub-HD only";
    } else {
      // HD / 4K is available
      const is4K = imgCheck.width >= 1920;
      const resLabel = is4K ? "4K UHD" : "Max HD";
      analysisBadge.className = `flex text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 rounded-xl items-center gap-2 transition animate-slide-up backdrop-blur-md ${
        is4K ? 'bg-purple-500/10 text-purple-400 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
             : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
      }`;
      analysisIcon.className = "ph-bold ph-check-circle drop-shadow-[0_0_5px_currentColor]";
      analysisText.innerHTML = `<span class="text-white">${resLabel}</span> â€¢ ${Math.max(imgCheck.width, 1280)}x${Math.max(imgCheck.height, 720)}`;
    }
  };

  imgCheck.onerror = () => {
    analysisBadge.className = "flex text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 rounded-xl items-center gap-2 transition bg-red-500/10 text-red-500 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-slide-up backdrop-blur-md";
    analysisIcon.className = "ph-bold ph-x-circle drop-shadow-[0_0_5px_rgba(239,68,68,0.6)]";
    analysisText.textContent = "Analysis failed";
  };
  
  imgCheck.src = maxResUrl;
};

let currentAvailableThumbs = [];

const downloadAllAsZip = async () => {
  if (!currentAvailableThumbs.length) return;
  
  if (typeof JSZip === 'undefined') {
    showToast("Zip component not loaded properly. Please refresh.", "error");
    return;
  }

  btnDownloadAll.disabled = true;
  btnDownloadAll.classList.add("opacity-50", "pointer-events-none");
  txtDownloadAll.textContent = "Processing...";
  zipProgressWrapper.classList.remove("hidden");
  
  // allow DOM repaint
  await new Promise(resolve => requestAnimationFrame(resolve));
  zipProgressWrapper.classList.remove("translate-y-2", "opacity-0");

  try {
    const zip = new JSZip();
    let completed = 0;
    const total = currentAvailableThumbs.length;

    // Fetch all thumbnails and add to zip
    for (const thumb of currentAvailableThumbs) {
      zipStatusText.textContent = `Gathering ${thumb.filename}...`;
      try {
        const response = await fetch(thumb.url);
        if (!response.ok) throw new Error("Image fetch error");
        const blob = await response.blob();
        zip.file(thumb.filename, blob);
      } catch (err) {
        console.warn(`Failed to fetch ${thumb.filename}`, err);
      }
      
      completed++;
      const percent = Math.round((completed / total) * 50); // Fetching is 50%
      zipPercentage.textContent = `${percent}%`;
      zipProgressBar.style.width = `${percent}%`;
    }

    zipStatusText.textContent = "Compressing archive...";
    
    // Generate zip
    const zipContent = await zip.generateAsync({ type: "blob" }, (metadata) => {
      const currentPercent = 50 + Math.round(metadata.percent / 2); // Gen is remaining 50%
      zipPercentage.textContent = `${currentPercent}%`;
      zipProgressBar.style.width = `${currentPercent}%`;
    });

    zipStatusText.textContent = "Finalizing download...";
    
    // Trigger download
    const objUrl = URL.createObjectURL(zipContent);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `TSun-Thumbnails-${currentVideoId}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
    
    showToast("Download Complete!", "success");
    
  } catch (error) {
    showToast("Error creating .zip file", "error");
    console.error(error);
  } finally {
    // Reset UI
    setTimeout(() => {
      zipProgressWrapper.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => {
        zipProgressWrapper.classList.add("hidden");
        zipPercentage.textContent = "0%";
        zipProgressBar.style.width = "0%";
      }, 300);
      
      btnDownloadAll.disabled = false;
      btnDownloadAll.classList.remove("opacity-50", "pointer-events-none");
      txtDownloadAll.textContent = "Download All (.zip)";
    }, 1500);
  }
};

btnDownloadAll.addEventListener("click", downloadAllAsZip);

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
    { file: "maxresdefault.jpg", name: "Maximum Resolution", badge: "HD", color: "bg-brand-500 shadow-[0_0_10px_rgba(0,240,255,0.6)]" },
    { file: "hqdefault.jpg", name: "High Quality", badge: "HQ", color: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]" },
    { file: "sddefault.jpg", name: "Standard Definition", badge: "SD", color: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" },
    { file: "mqdefault.jpg", name: "Medium Quality", badge: "MQ", color: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" },
    { file: "default.jpg", name: "Default", badge: "Normal", color: "bg-surface-500 shadow-[0_0_10px_rgba(100,116,139,0.6)]" },
    { file: "0.jpg", name: "Player Background", badge: "bg", color: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { file: "1.jpg", name: "Start Frame", badge: "thumb", color: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,114,0.6)]" },
    { file: "2.jpg", name: "Middle Frame", badge: "thumb", color: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,114,0.6)]" },
    { file: "3.jpg", name: "End Frame", badge: "thumb", color: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,114,0.6)]" }
  ];
    thumbnailGrid.innerHTML = "";
    currentAvailableThumbs = [];
    downloadAllSection.classList.add("hidden");
    downloadAllSection.classList.remove("opacity-100");

    let promises = formats.map((fmt, index) => {
      return new Promise((resolve) => {
        const imgUrl = `https://img.youtube.com/vi/${videoId}/${fmt.file}`;
        const li = document.createElement("li");
        li.style.animationDelay = `${index * 0.1}s`;
        li.className = "animate-slide-up bg-white/50 dark:bg-surface-900/60 backdrop-blur-xl border border-surface-200/50 dark:border-brand-500/20 rounded-2xl overflow-hidden shadow-neon-surface group flex flex-col transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-neon hover:border-brand-500/50";
        li.innerHTML = `
          <div class="relative w-full aspect-video bg-surface-100 dark:bg-surface-950 overflow-hidden border-b border-brand-500/20">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 z-10 transition-opacity duration-300"></div>
            <img src="${imgUrl}" alt="${fmt.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" onerror="this.src='https://via.placeholder.com/640x360?text=Not+Found'" />
            <div class="absolute top-3 right-3 text-[0.65rem] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 text-white z-20 ${fmt.color}">${fmt.badge}</div>
          </div>
          <div class="p-5 flex flex-col flex-grow relative z-20">
            <h3 class="font-display font-black uppercase tracking-wider text-lg mb-2 text-surface-900 dark:text-white flex items-center justify-between group-hover:text-brand-400 transition-colors drop-shadow-[0_0_8px_rgba(0,240,255,0)] group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              ${fmt.name}
              <button class="copy-link-btn w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800/80 hover:bg-brand-500 hover:text-surface-950 dark:hover:bg-brand-500 dark:text-brand-400 dark:hover:text-surface-950 border border-brand-500/20 flex items-center justify-center transition-all hover:shadow-neon hover:scale-110" title="Copy Image Link">
                <i class="ph-bold ph-link text-lg"></i>
              </button>
            </h3>
            <p class="text-xs text-surface-500 dark:text-surface-400 font-mono flex items-center gap-2">
              <span class="status-indicator"><i class="ph ph-spinner animate-spin text-brand-500 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"></i></span>
              <span class="opacity-40">•</span>
              <span>${fmt.file}</span>
            </p>
          </div>
        `;
        const statusIndicator = li.querySelector(".status-indicator");
        const imgCheck = new Image();
        imgCheck.onload = () => {
          if (imgCheck.width === 120 && imgCheck.height === 90) {
            statusIndicator.innerHTML = `<span class="text-red-500 dark:text-red-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">Unavailable</span>`;
            li.classList.add("opacity-40", "grayscale");
          } else {
            statusIndicator.innerHTML = `<span class="text-emerald-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"><i class="ph-bold ph-check"></i> Available</span>`;
            currentAvailableThumbs.push({ url: imgUrl, filename: `${videoId}-${fmt.file}` });
          }
          resolve();
        };
        imgCheck.onerror = () => {
          statusIndicator.innerHTML = `<span class="text-red-500 font-bold uppercase tracking-widest">Error</span>`;
          resolve();
        };
        imgCheck.src = imgUrl;
        li.querySelector(".copy-link-btn").addEventListener("click", () => copyToClipboard(imgUrl));
        thumbnailGrid.appendChild(li);
      });
    });

    Promise.all(promises).then(() => {
      if (currentAvailableThumbs.length > 0) {
        downloadAllSection.classList.remove("hidden");
        requestAnimationFrame(() => {
          downloadAllSection.classList.add("opacity-100");
          downloadAllSection.classList.remove("opacity-0");
        });
      }
    });
  };form.addEventListener("submit", (e) => {
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
  if(analysisBadge) analysisBadge.classList.replace("flex", "hidden");

  // Save successful search to history
  addSearchToHistory(videoId);
  
  setTimeout(() => {
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.onload = () => { iframe.classList.remove("opacity-0"); videoLoader.classList.add("hidden"); };
    
    // Execute Smart Analysis
    runSmartAnalysis(videoId);
    
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

// --- MAIN ---
initTheme();
renderSearchHistory();

// --- PWA & SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

let deferredPrompt;
const btnInstall = document.getElementById('btnInstall');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.classList.remove('hidden');
  btnInstall.classList.add('flex');
});

btnInstall.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    deferredPrompt = null;
    btnInstall.classList.add('hidden');
    btnInstall.classList.remove('flex');
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  btnInstall.classList.add('hidden');
  showToast('App installed successfully!');
});

// --- CHANGELOG MODAL CONTROLS ---
const btnChangelog = document.getElementById('btnChangelog');
const changelogModal = document.getElementById('changelogModal');
const changelogBackdrop = document.getElementById('changelogBackdrop');
const changelogContent = document.getElementById('changelogContent');
const btnCloseChangelog = document.getElementById('btnCloseChangelog');

const openChangelog = () => {
  changelogModal.classList.remove('hidden');
  // trigger reflow
  void changelogModal.offsetWidth;
  // Apply animations
  changelogBackdrop.classList.remove('opacity-0');
  changelogBackdrop.classList.add('opacity-100');
  changelogContent.classList.remove('opacity-0', 'scale-95');
  changelogContent.classList.add('opacity-100', 'scale-100');
};

const closeChangelog = () => {
  changelogBackdrop.classList.remove('opacity-100');
  changelogBackdrop.classList.add('opacity-0');
  changelogContent.classList.remove('opacity-100', 'scale-100');
  changelogContent.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    changelogModal.classList.add('hidden');
  }, 300); // Matches Tailwind transition duration default
};

btnChangelog.addEventListener('click', openChangelog);
btnCloseChangelog.addEventListener('click', closeChangelog);
changelogBackdrop.addEventListener('click', closeChangelog);
