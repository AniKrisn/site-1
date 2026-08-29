// Cache — an index and a board over one collection.

const $ = (s, el = document) => el.querySelector(s);
const main = $('#main');

const state = { view: 'index', idxMode: 'cursor' };

const items = DATA.items.map((it, i) => ({ ...it, n: i + 1, ar: it.iw / it.ih }));

function filtered() {
  return items;
}

function capHtml(it) {
  const t = it.title ? `<span class="t">${esc(it.title)}</span>` : '';
  const a = it.artist ? esc(it.artist) : '';
  const y = it.year ? ` <span class="y">${esc(it.year)}</span>` : '';
  if (!t && !a) return '';
  return [t, t && a ? ' — ' : '', a, y].join('');
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* show the (cached) thumb at once, swap in the full when it arrives.
   token guards against a stale full landing after the target moved on. */
function progressive(imgEl, it, delay = 0) {
  const token = (imgEl._tok = (imgEl._tok || 0) + 1);
  imgEl.src = `img/thumb/${it.img}.jpg`;
  const start = () => {
    if (token !== imgEl._tok) return;
    const full = new Image();
    full.onload = () => { if (token === imgEl._tok) imgEl.src = full.src; };
    full.src = `img/full/${it.img}.jpg`;
  };
  delay ? setTimeout(start, delay) : start();
}
function preloadFull(it) { if (it) new Image().src = `img/full/${it.img}.jpg`; }

/* ---------- index ----------
   Two modes. cursor: hover previews near the cursor, click opens the centre.
   stage: catalog left, fixed stage right; hover drives it, click the stage for the plate. */
function renderIndex() {
  if (state.idxMode === 'cursor') return renderIndexCursor();
  return renderIndexStage();
}

function idxRows(list) {
  return list.map(it => `<tr data-n="${it.n}" tabindex="0">
    <td class="no">${String(it.n).padStart(3, '0')}</td>
    <td class="title">${esc(it.title || '')}</td>
    <td class="artist">${esc(it.artist || '')}</td>
    <td class="year">${esc(it.year || '')}</td>
  </tr>`).join('');
}

function renderIndexCursor() {
  main.className = '';
  const list = filtered();
  const wrap = document.createElement('div');
  wrap.className = 'v-index cursor';
  wrap.innerHTML = `
    <div class="idx-list"><table><tbody>${idxRows(list)}</tbody></table></div>
    <img id="hoverThumb" alt="">`;
  const thumb = wrap.querySelector('#hoverThumb');
  wrap.querySelectorAll('tr').forEach(tr => {
    const it = items[+tr.dataset.n - 1];
    tr.addEventListener('mouseenter', () => { thumb.src = `img/thumb/${it.img}.jpg`; thumb.style.display = 'block'; });
    tr.addEventListener('mouseleave', () => { thumb.style.display = 'none'; });
    tr.addEventListener('mousemove', e => {
      thumb.style.left = Math.min(e.clientX + 24, innerWidth - 280) + 'px';
      thumb.style.top = Math.min(e.clientY + 16, innerHeight - 280) + 'px';
    });
    tr.addEventListener('click', () => openLightbox(it));
  });
  indexKeyHandler = null;
  main.replaceChildren(wrap);
}

function renderIndexStage() {
  main.className = '';
  const list = filtered();
  const wrap = document.createElement('div');
  wrap.className = 'v-index';

  wrap.innerHTML = `
    <div class="idx-list"><table><tbody>${idxRows(list)}</tbody></table></div>
    <div class="idx-stage">
      <div class="stage-frame" id="stageFrame">
        <img id="stageImg" alt="">
      </div>
      <div class="stage-cap" id="stageCap"></div>
    </div>`;

  const stageImg = wrap.querySelector('#stageImg');
  const stageCap = wrap.querySelector('#stageCap');
  const frame = wrap.querySelector('#stageFrame');

  let shown = null, nbTimer;
  const BASE = 24, GUT = 16, STAGE_COLS = 7;
  function show(it) {
    shown = it;
    // snap the image to the grid: whole columns wide, whole baselines tall
    const stage = wrap.querySelector('.idx-stage');
    const availH = stage.clientHeight - BASE - 2 * BASE;   // top pad + caption
    const colW = (stage.clientWidth - (STAGE_COLS - 1) * GUT) / STAGE_COLS;
    let k = STAGE_COLS;
    while (k > 1 && (colW * k + GUT * (k - 1)) / it.ar > availH) k--;
    const w = Math.round(colW * k + GUT * (k - 1));
    const h = Math.max(BASE, Math.floor(Math.min(availH, w / it.ar) / BASE) * BASE);
    const mt = Math.max(0, Math.floor((availH - h) / 2 / BASE) * BASE);
    stageImg.style.width = w + 'px';
    stageImg.style.height = h + 'px';
    stageImg.style.marginTop = mt + 'px';
    frame.style.height = (mt + h) + 'px';
    // thumb paints at once; the full only fetches after the cursor rests,
    // so sweeping the list doesn't queue a pile of megabyte requests
    progressive(stageImg, it, 150);
    // once settled, warm the rows either side — hovers tend to be neighbours
    clearTimeout(nbTimer);
    nbTimer = setTimeout(() => {
      preloadFull(list[it.n % list.length]);
      preloadFull(list[(it.n - 2 + list.length) % list.length]);
    }, 600);
    stageCap.innerHTML = `<span class="no">${String(it.n).padStart(3, '0')}</span>
      ${it.title ? `<span class="t">${esc(it.title)}</span>` : ''}
      <span class="a">${esc(it.artist || '')}</span>
      ${it.year ? `<span class="y">${esc(it.year)}</span>` : ''}`;
  }

  wrap.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('mouseenter', () => show(items[+tr.dataset.n - 1]));
  });
  frame.addEventListener('click', () => { if (shown) openPlate(shown.n); });

  indexKeyHandler = null;
  main.replaceChildren(wrap);
  show(list[0]);   // after attach: snapping needs real clientWidth
}
let indexKeyHandler = null;

/* ---------- plate: single-work detail, opened from the board ---------- */
const plateEl = $('#plate');
let plList = [], plIdx = 0;
function openPlate(n) {
  plList = filtered();
  plIdx = plList.findIndex(it => it.n === n);
  if (plIdx < 0) return;
  showPlate();
}
function showPlate() {
  const it = plList[plIdx];
  $('#plateInner').innerHTML = `
    <div class="pcap">
      <span class="no">${String(it.n).padStart(3, '0')}</span>
      ${it.title ? `<span class="t">${esc(it.title)}</span>` : ''}
      <span class="a">${esc(it.artist || '')}</span>
      ${it.year ? `<span class="y">${esc(it.year)}</span>` : ''}
    </div>
    <div class="pimg"><img decoding="async" alt="${esc(it.title || it.artist || 'artwork')}"></div>`;
  progressive($('#plateInner .pimg img'), it);
  plateEl.hidden = false;
  preloadFull(plList[(plIdx + 1) % plList.length]);
  preloadFull(plList[(plIdx - 1 + plList.length) % plList.length]);
}
function stepPlate(d) { plIdx = (plIdx + d + plList.length) % plList.length; showPlate(); }
$('#plClose').addEventListener('click', () => plateEl.hidden = true);
plateEl.addEventListener('click', e => {
  if (!e.target.closest('.pimg img')) plateEl.hidden = true;
});

/* ---------- board: the original canvas, hand-rolled pan/zoom ---------- */
let boardMod = null;
function renderBoard() {
  main.className = '';
  const wrap = document.createElement('div');
  wrap.className = 'v-board';
  wrap.textContent = 'loading canvas…';
  main.replaceChildren(wrap);
  (boardMod ??= import('./board.js')).then(mod => {
    if (state.view !== 'board') return;
    wrap.textContent = '';
    mod.mountBoard(wrap, filtered(), openPlate);
  }).catch(err => { wrap.textContent = 'canvas failed to load: ' + err.message; });
}
function teardownBoard() {
  boardMod?.then(mod => mod.unmountBoard()).catch(() => {});
}

/* ---------- lightbox ---------- */
const lb = $('#lightbox');
let lbList = [], lbIdx = 0;
function openLightbox(it) {
  lbList = filtered();
  lbIdx = lbList.indexOf(it);
  showLb();
}
function showLb() {
  const it = lbList[lbIdx];
  progressive($('#lbImg'), it);
  preloadFull(lbList[(lbIdx + 1) % lbList.length]);
  preloadFull(lbList[(lbIdx - 1 + lbList.length) % lbList.length]);
  $('#lbCap').innerHTML = `${it.title ? `<span class="t">${esc(it.title)}</span>` : ''}
    <span class="a">${esc(it.artist || '')}</span>
    ${it.year ? `<span class="y">${esc(it.year)}</span>` : ''}`;
  lb.hidden = false;
}
$('#lbClose').addEventListener('click', () => lb.hidden = true);
$('#lbPrev').addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; showLb(); });
$('#lbNext').addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbList.length; showLb(); });
lb.addEventListener('click', e => { if (e.target === lb) lb.hidden = true; });

/* ---------- chrome ---------- */
const renderers = { index: renderIndex, board: renderBoard };
function render() {
  teardownBoard();
  renderers[state.view]();
  $('#viewBtn').textContent = state.view === 'index' ? 'canvas' : 'index';
  $('#modeBtn').textContent = state.idxMode === 'cursor' ? 'stage' : 'cursor';
  $('#modeBtn').classList.toggle('hide', state.view !== 'index');
}
/* ---------- grid overlay ---------- */
const overlay = $('#gridOverlay');
overlay.innerHTML = `<div class="cols">${'<div class="col"></div>'.repeat(12)}</div>`;
function toggleGrid() {
  overlay.hidden = !overlay.hidden;
  document.body.classList.toggle('grid', !overlay.hidden);
  $('#gridBtn').classList.toggle('on', !overlay.hidden);
}
$('#gridBtn').addEventListener('click', toggleGrid);

// each toggle names where it takes you, and swaps
$('#viewBtn').addEventListener('click', () => {
  state.view = state.view === 'index' ? 'board' : 'index';
  render();
});
$('#modeBtn').addEventListener('click', () => {
  state.idxMode = state.idxMode === 'cursor' ? 'stage' : 'cursor';
  render();
});
document.addEventListener('keydown', e => {
  if (e.target.matches?.('input,textarea')) return;
  if (e.key === 'g') toggleGrid();
  if (!lb.hidden) {
    if (e.key === 'Escape') lb.hidden = true;
    if (e.key === 'ArrowLeft') $('#lbPrev').click();
    if (e.key === 'ArrowRight') $('#lbNext').click();
    return;
  }
  if (!plateEl.hidden) {
    if (e.key === 'Escape') plateEl.hidden = true;
    if (e.key === 'ArrowLeft') stepPlate(-1);
    if (e.key === 'ArrowRight') stepPlate(1);
    return;
  }
  if (state.view === 'index' && indexKeyHandler) indexKeyHandler(e);
});
let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(render, 150); });

render();

// warm the thumb cache once the page is up, so hovers don't wait on the network
window.addEventListener('load', () => {
  const queue = items.map(it => `img/thumb/${it.img}.jpg`);
  const next = () => {
    const src = queue.shift();
    if (!src) return;
    const im = new Image();
    im.onload = im.onerror = next;
    im.src = src;
  };
  next(); next(); next();
});

// pull the canvas bundle in the background too, so the toggle is instant
window.addEventListener('load', () => { boardMod ??= import('./board.js'); });
