// ── Stars background ──────────────────────────────────────────────
const canvas = document.getElementById('stars-canvas');
const ctx    = canvas.getContext('2d');
let stars    = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
function initStars(n = 320) {
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.3,
    a: Math.random(),
    speed: Math.random() * 0.004 + 0.001
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.a += s.speed;
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.a));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });
resizeCanvas(); initStars(); drawStars();

// ── Content (localStorage → content.json → fallback) ─────────────
const STORAGE_KEY = 'starwars-intro-content';

const FALLBACK = {
  preTitle:   "A long time ago, in a galaxy far,\nfar away....",
  title:      "STAR WARS",
  subtitle:   "Episode IX",
  crawlTitle: "HAPPY BIRTHDAY!",
  crawlBody:  "A great celebration begins today.\n\nThe Force is strong with this one."
};

async function loadContent() {
  // URL params take priority (shared links). Consume once: save to localStorage
  // and clean the URL so reloads after the crawl use localStorage instead.
  const params = new URLSearchParams(window.location.search);
  if (params.has('body') || params.has('title') || params.has('heading')) {
    const content = {
      preTitle:   params.get('pre')     || FALLBACK.preTitle,
      title:      params.get('title')   || FALLBACK.title,
      subtitle:   params.get('ep')      || FALLBACK.subtitle,
      crawlTitle: params.get('heading') || FALLBACK.crawlTitle,
      crawlBody:  params.get('body')    || FALLBACK.crawlBody,
    };
    saveContent(content);
    history.replaceState(null, '', window.location.pathname);
    return content;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  try { const r = await fetch('content.json'); return await r.json(); } catch(e) {}
  return FALLBACK;
}

function saveContent(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function runIntro(content) {
  const prompt    = document.getElementById('prompt');
  const scene     = document.getElementById('scene');
  const preTitle  = document.getElementById('pre-title');
  const preTitleP = document.getElementById('pre-title-text');
  const logoWrap  = document.getElementById('logo-wrap');
  const logo      = document.getElementById('logo');
  const crawlStage= document.getElementById('crawl-stage');
  const crawlPlane= document.getElementById('crawl-plane');

  // Populate content
  preTitleP.textContent   = content.preTitle  || '';
  logo.textContent        = content.title     || 'STAR WARS';
  document.getElementById('crawl-subtitle').textContent = content.subtitle  || '';
  document.getElementById('crawl-heading').textContent  = content.crawlTitle || '';
  document.getElementById('crawl-body').textContent     = content.crawlBody  || '';

  // PHASE 1 – hide prompt, show scene
  document.body.classList.add('playing');
  prompt.classList.add('hidden');
  await delay(900);
  scene.classList.add('active');

  // PHASE 2 – pre-title fade in
  preTitle.style.opacity = '0';
  preTitle.style.pointerEvents = 'none';
  preTitle.classList.add('fade-in');
  await delay(2800);

  // PHASE 3 – pre-title fade out
  preTitle.classList.remove('fade-in');
  preTitle.classList.add('fade-out');
  await delay(1300);

  // PHASE 4 – logo pops in
  logoWrap.classList.add('pop');
  await delay(1000);

  // PHASE 5 – logo shrinks away
  logoWrap.classList.remove('pop');
  logoWrap.classList.add('shrink');
  await delay(4200);

  // PHASE 6 – crawl begins
  // Measure actual rendered height now that the scene is live, then derive
  // a duration so the animation ends exactly when the last line leaves screen.
  crawlStage.classList.add('visible');
  const planeHeight = crawlPlane.offsetHeight;
  const totalTravel = planeHeight + window.innerHeight;
  crawlPlane.style.setProperty('--crawl-end', `-${window.innerHeight}px`);
  const crawlDuration = Math.max(15, Math.round(totalTravel / 25));
  crawlPlane.style.setProperty('--crawl-duration', crawlDuration + 's');
  void crawlPlane.offsetWidth;
  crawlPlane.classList.add('rolling');

  // PHASE 7 – reload when the crawl animation completes
  await new Promise(resolve => crawlPlane.addEventListener('animationend', resolve, { once: true }));
  location.reload();
}

// ── Editor ────────────────────────────────────────────────────────
const editor     = document.getElementById('editor');
const editorForm = document.getElementById('editor-form');

document.getElementById('btn-edit').addEventListener('click', async () => {
  const content = await loadContent();
  editorForm.elements.preTitle.value   = content.preTitle   || '';
  editorForm.elements.title.value      = content.title      || '';
  editorForm.elements.subtitle.value   = content.subtitle   || '';
  editorForm.elements.crawlTitle.value = content.crawlTitle || '';
  editorForm.elements.crawlBody.value  = content.crawlBody  || '';
  editor.classList.remove('hidden');
});

document.getElementById('btn-cancel').addEventListener('click', () => {
  editor.classList.add('hidden');
});

editorForm.addEventListener('submit', e => {
  e.preventDefault();
  saveContent({
    preTitle:   editorForm.elements.preTitle.value,
    title:      editorForm.elements.title.value,
    subtitle:   editorForm.elements.subtitle.value,
    crawlTitle: editorForm.elements.crawlTitle.value,
    crawlBody:  editorForm.elements.crawlBody.value,
  });
  editor.classList.add('hidden');
});

// ── Share ─────────────────────────────────────────────────────────
const BASE_URL = window.location.origin + window.location.pathname;

document.getElementById('btn-share').addEventListener('click', async () => {
  const content = await loadContent();
  const params = new URLSearchParams();
  if (content.preTitle)   params.set('pre',     content.preTitle);
  if (content.title)      params.set('title',   content.title);
  if (content.subtitle)   params.set('ep',      content.subtitle);
  if (content.crawlTitle) params.set('heading', content.crawlTitle);
  if (content.crawlBody)  params.set('body',    content.crawlBody);

  const url = `${BASE_URL}?${params.toString()}`;
  await navigator.clipboard.writeText(url);

  const btn = document.getElementById('btn-share');
  const original = btn.textContent;
  btn.textContent = '✓ Copied!';
  setTimeout(() => { btn.textContent = original; }, 2000);
});

// ── Entry point ───────────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', async () => {
  document.getElementById('prompt').classList.add('hidden');
  const content = await loadContent();
  runIntro(content);
});
