// board view: hand-rolled pan/zoom canvas. The works sit at the same
// x/y/w/h the tldraw file carried (data.js), drawn as plain positioned
// images inside one transformed layer — no tldraw, no react, no CDN.
//
// Three orders over one wall. plan: the curated spatial arrangement.
// time (t): a justified chronological wall, century numerals as ghost
// markers, undated works settling at the end. color (c): the same wall
// resolved into a hue spectrum, greys last. The drift between orders is
// animated — the arrangement is the graphic.

let cleanup = null
let toggleRef = null

const EASE = 'cubic-bezier(.22,.9,.24,1)'
const ROW_H = 420, ROW_W = 7600, HGAP = 48, VGAP = 72

export function mountBoard(container, items, onPick) {
  const view = document.createElement('div')
  view.className = 'bd-view'
  const world = document.createElement('div')
  world.className = 'bd-world'
  view.append(world)

  const cells = new Map(), imgs = new Map()
  for (const it of items) {
    const cell = document.createElement('div')
    cell.className = 'bd-item'
    cell.dataset.n = it.n
    cell.style.left = it.x + 'px'
    cell.style.top = it.y + 'px'
    cell.style.width = it.w + 'px'
    const img = new Image()
    img.src = `img/thumb/${it.img}.jpg`
    img.decoding = 'async'
    img.loading = 'lazy'
    img.draggable = false
    img.style.height = it.h + 'px'
    img.alt = it.title || it.artist || 'artwork'
    cell.append(img)
    const cap = [it.title, [it.artist, it.year].filter(Boolean).join(', ')].filter(Boolean).join('\n')
    if (cap) {
      const capEl = document.createElement('div')
      capEl.className = 'bd-cap'
      capEl.textContent = cap
      cell.append(capEl)
    }
    world.append(cell)
    cells.set(it.n, cell); imgs.set(it.n, img)
  }

  /* camera: screen = translate(tx,ty) then scale(s), origin 0 0 */
  let s = 1, tx = 0, ty = 0
  const apply = () => { world.style.transform = `translate(${tx}px, ${ty}px) scale(${s})` }
  const S_MIN = 0.02, S_MAX = 4

  /* current rect per work — the plan to begin with */
  let arrangement = 'plan'
  const pos = new Map(items.map(it => [it.n, { x: it.x, y: it.y, w: it.w, h: it.h }]))
  let bounds = null
  const measure = () => {
    let x0 = 1/0, y0 = 1/0, x1 = -1/0, y1 = -1/0
    for (const r of pos.values()) {
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y)
      x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h)
    }
    bounds = { x0, y0, x1, y1 }
  }
  measure()

  function fit() {
    const r = view.getBoundingClientRect()
    const inset = 64
    s = Math.min(
      (r.width - inset * 2) / (bounds.x1 - bounds.x0),
      (r.height - inset * 2) / (bounds.y1 - bounds.y0),
    )
    s = Math.min(Math.max(s, S_MIN), S_MAX)
    tx = (r.width - s * (bounds.x1 - bounds.x0)) / 2 - s * bounds.x0
    ty = (r.height - s * (bounds.y1 - bounds.y0)) / 2 - s * bounds.y0
    apply()
  }

  function zoomAt(cx, cy, f) {
    f = Math.min(Math.max(s * f, S_MIN), S_MAX) / s
    const r = view.getBoundingClientRect()
    const px = cx - r.left, py = cy - r.top
    tx = px - (px - tx) * f
    ty = py - (py - ty) * f
    s *= f
    apply()
    queueUpscale()
  }

  /* once zoomed in, a 512px thumb goes soft — swap visible ones to the full */
  let upTimer
  function queueUpscale() { clearTimeout(upTimer); upTimer = setTimeout(upscale, 250) }
  function upscale() {
    const r = view.getBoundingClientRect()
    for (const it of items) {
      const p = pos.get(it.n)
      if (it._full || s * p.w < 700) continue
      const sx = tx + s * p.x, sy = ty + s * p.y
      if (sx > r.width || sy > r.height || sx + s * p.w < 0 || sy + s * p.h < 0) continue
      it._full = true
      const full = new Image()
      full.onload = () => { imgs.get(it.n).src = full.src }
      full.src = `img/full/${it.img}.jpg`
    }
  }

  /* ---------- the other orders ---------- */

  const yearOf = it => { const m = /(\d{4})/.exec(it.year || ''); return m ? +m[1] : null }

  // dominant hue from the (cached, same-origin) thumbs — no build step
  let huesDone = false
  function computeHues() {
    if (huesDone) return; huesDone = true
    const cv = document.createElement('canvas')
    cv.width = cv.height = 24
    const c2 = cv.getContext('2d', { willReadFrequently: true })
    for (const it of items) {
      const img = imgs.get(it.n)
      it._grey = true; it._hue = 0; it._lit = .5
      if (!img.complete || !img.naturalWidth) continue
      try {
        c2.drawImage(img, 0, 0, 24, 24)
        const d = c2.getImageData(0, 0, 24, 24).data
        const bins = new Float32Array(24)
        let satSum = 0, litSum = 0, n = 0
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b), ch = mx - mn
          const l = (mx + mn) / 2
          const sat = ch === 0 ? 0 : ch / (1 - Math.abs(2 * l - 1))
          let h = 0
          if (ch > 0) {
            if (mx === r) h = ((g - b) / ch + 6) % 6
            else if (mx === g) h = (b - r) / ch + 2
            else h = (r - g) / ch + 4
            h *= 60
          }
          bins[Math.floor(h / 15) % 24] += sat
          satSum += sat; litSum += l; n++
        }
        let peak = 0
        for (let k = 1; k < 24; k++) if (bins[k] > bins[peak]) peak = k
        it._grey = satSum / n < .09
        it._hue = peak * 15 + 7.5
        it._lit = litSum / n
      } catch { /* keep the grey fallback */ }
    }
  }

  // justified rows of uniform height; a marker entry breaks the row
  function layout(seq) {
    const rects = new Map(), marks = []
    const delays = new Map()
    let x = 0, y = 0, i = 0
    const nl = () => { if (x > 0) { x = 0; y += ROW_H + VGAP } }
    for (const e of seq) {
      if (e.marker) {
        nl()
        const w = e.marker.length <= 4 ? 560 : 120 * e.marker.length
        marks.push({ text: e.marker, x, y, w, h: ROW_H })
        x += w + HGAP
        continue
      }
      const w = Math.round(ROW_H * e.it.ar)
      if (x > 0 && x + w > ROW_W) nl()
      rects.set(e.it.n, { x, y, w, h: ROW_H })
      delays.set(e.it.n, i++ * 4)
      x += w + HGAP
    }
    return { rects, marks, delays }
  }

  function seqFor(name) {
    if (name === 'time') {
      const dated = items.filter(it => yearOf(it) !== null)
        .sort((a, b) => yearOf(a) - yearOf(b) || a.n - b.n)
      const undated = items.filter(it => yearOf(it) === null)
      const seq = []
      let century = null
      for (const it of dated) {
        const c = Math.floor(yearOf(it) / 100) * 100
        if (c !== century) { century = c; seq.push({ marker: String(c) }) }
        seq.push({ it })
      }
      if (undated.length) seq.push({ marker: 'undated' }, ...undated.map(it => ({ it })))
      return seq
    }
    // color: the spectrum, then the greys light→dark
    computeHues()
    const chroma = items.filter(it => !it._grey)
      .sort((a, b) => a._hue - b._hue || a._lit - b._lit)
    const greys = items.filter(it => it._grey).sort((a, b) => b._lit - a._lit)
    return [...chroma, ...greys].map(it => ({ it }))
  }

  function setArrangement(name) {
    arrangement = name
    world.querySelectorAll('.bd-mark').forEach(el => el.remove())
    let rects, delays, marks = []
    if (name === 'plan') {
      rects = new Map(items.map(it => [it.n, { x: it.x, y: it.y, w: it.w, h: it.h }]))
      delays = new Map(items.map((it, i) => [it.n, i * 4]))
    } else {
      ({ rects, marks, delays } = layout(seqFor(name)))
    }
    for (const it of items) {
      const r = rects.get(it.n), cell = cells.get(it.n), img = imgs.get(it.n)
      const d = delays.get(it.n) || 0
      cell.style.transition = `left .9s ${EASE} ${d}ms, top .9s ${EASE} ${d}ms, width .9s ${EASE} ${d}ms`
      img.style.transition = `height .9s ${EASE} ${d}ms`
      cell.style.left = r.x + 'px'; cell.style.top = r.y + 'px'; cell.style.width = r.w + 'px'
      img.style.height = r.h + 'px'
      pos.set(it.n, r)
    }
    for (const m of marks) {
      const el = document.createElement('div')
      el.className = 'bd-mark'
      el.textContent = m.text
      el.style.left = m.x + 'px'; el.style.top = m.y + 'px'
      el.style.width = m.w + 'px'; el.style.height = m.h + 'px'
      world.append(el)
      requestAnimationFrame(() => el.classList.add('in'))
    }
    measure()
    world.style.transition = `transform .9s ${EASE}`
    fit()
    clearTimeout(setArrangement._t)
    setArrangement._t = setTimeout(() => {
      world.style.transition = ''
      for (const it of items) { cells.get(it.n).style.transition = ''; imgs.get(it.n).style.transition = '' }
      queueUpscale()
    }, 1800)
    syncBtns()
  }
  const toggle = name => setArrangement(arrangement === name ? 'plan' : name)
  toggleRef = toggle
  function syncBtns() {
    document.getElementById('arrTime')?.classList.toggle('on', arrangement === 'time')
    document.getElementById('arrColor')?.classList.toggle('on', arrangement === 'color')
  }

  const onKey = e => {
    if (e.target.matches?.('input,textarea')) return
    if (document.querySelector('#plate')?.hidden === false) return
    if (document.querySelector('#lightbox')?.hidden === false) return
    if (e.key === 't') toggle('time')
    if (e.key === 'c') toggle('color')
  }
  document.addEventListener('keydown', onKey)

  /* trackpad: two-finger scroll pans, pinch (ctrlKey) zooms */
  const onWheel = e => {
    e.preventDefault()
    world.style.transition = ''
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01))
    else { tx -= e.deltaX; ty -= e.deltaY; apply(); queueUpscale() }
  }
  view.addEventListener('wheel', onWheel, { passive: false })

  /* pointers: one drags, two pinch; a still click on a work opens its plate */
  const pts = new Map()
  let moved = false, downEl = null
  const onDown = e => {
    // capture retargets later events to the view, so keep the real target now
    downEl = e.target
    world.style.transition = ''
    try { view.setPointerCapture(e.pointerId) } catch { /* already released */ }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 1) moved = false
    view.classList.add('dragging')
  }
  const onMove = e => {
    const p = pts.get(e.pointerId)
    if (!p) return
    if (pts.size === 1) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      if (moved || Math.hypot(dx, dy) > 4) {
        moved = true
        tx += dx; ty += dy
        apply(); queueUpscale()
      } else return
    } else if (pts.size === 2) {
      moved = true
      const [a, b] = [...pts.values()]
      const prevD = Math.hypot(a.x - b.x, a.y - b.y)
      const prevM = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      p.x = e.clientX; p.y = e.clientY
      const [a2, b2] = [...pts.values()]
      const d = Math.hypot(a2.x - b2.x, a2.y - b2.y)
      const m = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 }
      tx += m.x - prevM.x; ty += m.y - prevM.y
      if (prevD > 0) zoomAt(m.x, m.y, d / prevD)
      else apply()
      return
    }
    p.x = e.clientX; p.y = e.clientY
  }
  const onUp = e => {
    pts.delete(e.pointerId)
    if (!pts.size) view.classList.remove('dragging')
    if (!moved && e.type === 'pointerup') {
      const cell = downEl?.closest?.('.bd-item')
      if (cell) onPick?.(+cell.dataset.n)
    }
  }
  view.addEventListener('pointerdown', onDown)
  view.addEventListener('pointermove', onMove)
  view.addEventListener('pointerup', onUp)
  view.addEventListener('pointercancel', onUp)

  const onResize = () => fit()
  window.addEventListener('resize', onResize)

  container.append(view)
  fit()
  syncBtns()

  cleanup = () => {
    window.removeEventListener('resize', onResize)
    document.removeEventListener('keydown', onKey)
    clearTimeout(upTimer); clearTimeout(setArrangement._t)
    for (const it of items) it._full = false
    toggleRef = null
    view.remove()
  }
}

export function toggleArrangement(name) { toggleRef?.(name) }

export function unmountBoard() {
  cleanup?.()
  cleanup = null
}
