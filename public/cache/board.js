// board view: hand-rolled pan/zoom canvas. The works sit at the same
// x/y/w/h the tldraw file carried (data.js), drawn as plain positioned
// images inside one transformed layer — no tldraw, no react, no CDN.

let cleanup = null

export function mountBoard(container, items, onPick) {
  const view = document.createElement('div')
  view.className = 'bd-view'
  const world = document.createElement('div')
  world.className = 'bd-world'
  view.append(world)

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
  }

  /* camera: screen = translate(tx,ty) then scale(s), origin 0 0 */
  let s = 1, tx = 0, ty = 0
  const apply = () => { world.style.transform = `translate(${tx}px, ${ty}px) scale(${s})` }

  const minX = Math.min(...items.map(it => it.x))
  const minY = Math.min(...items.map(it => it.y))
  const maxX = Math.max(...items.map(it => it.x + it.w))
  const maxY = Math.max(...items.map(it => it.y + it.h))
  const S_MIN = 0.02, S_MAX = 4

  function fit() {
    const r = view.getBoundingClientRect()
    const inset = 64
    s = Math.min(
      (r.width - inset * 2) / (maxX - minX),
      (r.height - inset * 2) / (maxY - minY),
    )
    s = Math.min(Math.max(s, S_MIN), S_MAX)
    tx = (r.width - s * (maxX - minX)) / 2 - s * minX
    ty = (r.height - s * (maxY - minY)) / 2 - s * minY
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
      if (it._full || s * it.w < 700) continue
      const sx = tx + s * it.x, sy = ty + s * it.y
      if (sx > r.width || sy > r.height || sx + s * it.w < 0 || sy + s * it.h < 0) continue
      it._full = true
      const img = world.querySelector(`.bd-item[data-n="${it.n}"] img`)
      const full = new Image()
      full.onload = () => { img.src = full.src }
      full.src = `img/full/${it.img}.jpg`
    }
  }

  /* trackpad: two-finger scroll pans, pinch (ctrlKey) zooms — tldraw's mapping */
  const onWheel = e => {
    e.preventDefault()
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

  cleanup = () => {
    window.removeEventListener('resize', onResize)
    clearTimeout(upTimer)
    for (const it of items) it._full = false
    view.remove()
  }
}

export function unmountBoard() {
  cleanup?.()
  cleanup = null
}
