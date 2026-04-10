const THUMBNAIL_TYPES = [
  { key: 'maxresdefault', label: 'Max Resolution', filename: 'maxresdefault.jpg' },
  { key: 'sddefault', label: 'Standard Definition', filename: 'sddefault.jpg' },
  { key: 'hqdefault', label: 'High Quality', filename: 'hqdefault.jpg' },
  { key: 'mqdefault', label: 'Medium Quality', filename: 'mqdefault.jpg' },
  { key: 'default', label: 'Default', filename: 'default.jpg' },
  { key: '0', label: 'Frame 0', filename: '0.jpg' },
  { key: '1', label: 'Frame 1', filename: '1.jpg' },
  { key: '2', label: 'Frame 2', filename: '2.jpg' },
  { key: '3', label: 'Frame 3', filename: '3.jpg' },
];

const urlInput = document.getElementById('urlTxt');
const statusEl = document.getElementById('status');
const youtubeFrame = document.getElementById('youtube');
const resultSection = document.getElementById('resultSection');
const thumbGrid = document.getElementById('thumbGrid');
const resultMeta = document.getElementById('resultMeta');
const copyIdBtn = document.getElementById('btn-copy-id');

// --- Theme Switcher ---
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Initialize theme
const savedTheme = localStorage.getItem('tsun-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('tsun-theme', newTheme);
  
  // Optional: Trigger a small animation on toggle if needed
  if (window.gsap) {
    gsap.fromTo('.action-btn.theme-toggle i', 
      { rotation: -90, opacity: 0 }, 
      { rotation: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
    );
  }
});

let currentVideoId = '';

document.getElementById('btn-grab').addEventListener('click', generateThumbnails);
document.getElementById('btn-paste').addEventListener('click', pasteFromClipboard);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && document.activeElement === urlInput) {
    generateThumbnails();
  }
});

copyIdBtn.addEventListener('click', async () => {
  if (!currentVideoId) return;
  try {
    await navigator.clipboard.writeText(currentVideoId);
    setStatus(`Copied video ID: ${currentVideoId}`, 'ok');
  } catch (error) {
    setStatus('Could not copy video ID. Your browser may block clipboard access.', 'warn');
  }
});

async function pasteFromClipboard() {
  if (!navigator.clipboard?.readText) {
    setStatus('Clipboard API is not available in this browser.', 'warn');
    return;
  }

  try {
    const pasted = await navigator.clipboard.readText();
    urlInput.value = pasted.trim();
    setStatus('URL pasted from clipboard.', 'ok');
  } catch (error) {
    setStatus('Clipboard read was blocked by the browser.', 'warn');
  }
}

function setStatus(message, variant = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${variant}`.trim();
  if (window.ClayAnimations?.animateStatus) {
    window.ClayAnimations.animateStatus();
  }
}

function getYouTubeId(value) {
  const input = value.trim();
  if (!input) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (url.hostname.includes('youtu.be')) {
      const idFromPath = url.pathname.split('/').filter(Boolean)[0];
      if (idFromPath && idFromPath.length === 11) return idFromPath;
    }

    const vParam = url.searchParams.get('v');
    if (vParam && vParam.length === 11) return vParam;

    const segments = url.pathname.split('/').filter(Boolean);
    const embedded = segments.find((part) => /^[a-zA-Z0-9_-]{11}$/.test(part));
    if (embedded) return embedded;
  } catch (error) {
    return null;
  }

  return null;
}

function buildThumbUrl(videoId, key) {
  return `https://img.youtube.com/vi/${videoId}/${key}.jpg`;
}

function imageIsUsable(img) {
  if (!img.complete || !img.naturalWidth) return false;
  return !(img.naturalWidth === 120 && img.naturalHeight === 90);
}

function createCard(videoId, type, img) {
  const card = document.createElement('article');
  card.className = 'thumb-card';

  const link = buildThumbUrl(videoId, type.key);
  const resolution = `${img.naturalWidth}×${img.naturalHeight}`;

  card.innerHTML = `
    <img src="${link}" alt="${type.label} thumbnail preview" loading="lazy" />
    <div class="thumb-card__meta">
      <strong>${type.label}</strong>
      <span>${resolution}</span>
    </div>
    <a href="${link}" download="${videoId}-${type.filename}">Download JPG</a>
  `;

  return card;
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function generateThumbnails() {
  const source = urlInput.value;
  const videoId = getYouTubeId(source);

  thumbGrid.innerHTML = '';
  resultSection.classList.add('hidden');

  if (!videoId) {
    currentVideoId = '';
    copyIdBtn.disabled = true;
    youtubeFrame.removeAttribute('src');
    resultMeta.textContent = '';
    setStatus('Please enter a valid YouTube URL or 11-character video ID.', 'warn');
    return;
  }

  currentVideoId = videoId;
  copyIdBtn.disabled = false;
  youtubeFrame.src = `https://www.youtube.com/embed/${videoId}`;
  setStatus('Loading available thumbnail qualities…');

  const checks = THUMBNAIL_TYPES.map(async (type) => {
    const url = buildThumbUrl(videoId, type.key);
    const img = await loadImage(url);
    if (!img || !imageIsUsable(img)) return null;
    return { type, img };
  });

  const available = (await Promise.all(checks)).filter(Boolean);

  if (!available.length) {
    resultMeta.textContent = '';
    setStatus('No thumbnails were found for this video.', 'warn');
    return;
  }

  available.forEach(({ type, img }) => {
    thumbGrid.append(createCard(videoId, type, img));
  });

  resultMeta.textContent = `${available.length} qualities found • Video ID: ${videoId}`;
  resultSection.classList.remove('hidden');

  if (window.ClayAnimations?.animateResultsReveal) {
    window.ClayAnimations.animateResultsReveal();
  }

  setStatus('Ready. Click any quality to download.', 'ok');
}
