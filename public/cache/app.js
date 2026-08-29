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
  if (!t && !a) return '<span class="t">untitled</span>';
  return [t, t && a ? ' — ' : '', a, y].join('');
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
    <td class="title">${it.title ? esc(it.title) : '<span class="unt">untitled</span>'}</td>
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

  let shown = null;
  function show(it) {
    shown = it;
    stageImg.src = `img/full/${it.img}.jpg`;
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
  show(list[0]);
  main.replaceChildren(wrap);
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
    <div class="pimg"><img src="img/full/${it.img}.jpg" alt="${esc(it.title || it.artist || 'artwork')}"></div>`;
  plateEl.hidden = false;
}
function stepPlate(d) { plIdx = (plIdx + d + plList.length) % plList.length; showPlate(); }
$('#plClose').addEventListener('click', () => plateEl.hidden = true);
plateEl.addEventListener('click', e => {
  if (!e.target.closest('.pimg img')) plateEl.hidden = true;
});

/* ---------- board: the original canvas in <Tldraw>, chrome hidden ---------- */
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
  $('#lbImg').src = `img/full/${it.img}.jpg`;
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
