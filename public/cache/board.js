// board view: the actual canvas, rendered by <Tldraw> with all UI hidden.
// https://tldraw.dev/examples/hide-ui
import React from 'https://esm.sh/react@18.3.1'
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1'
import {
  Tldraw, AssetRecordType, createShapeId, toRichText, react, Box,
} from 'https://esm.sh/tldraw@3.15.1?deps=react@18.3.1,react-dom@18.3.1'

let root = null
let mountToken = 0

// tldraw.css is only needed here, so it stays out of the page head
const css = new Promise(resolve => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/tldraw@3.15.1/tldraw.css'
  link.onload = link.onerror = resolve
  document.head.append(link)
})

// same key the code editor ships; locked to *.anikrisn.com
const LICENSE_KEY =
  'tldraw-2031-05-04/WyJwYkFiRF9nYiIsWyIqLmFuaWtyaXNuLmNvbSJdLDksIjIwMzEtMDUtMDQiXQ.CS3+s2htHT+HSMOeL5DkZegH5Io/oDQFj6SwCtz9ElSuEfJTyzsK7O3rQg3bkWs2xE0whupSvrw5nqI+hP0puw'

export async function mountBoard(container, items, onPick) {
  await css
  const onMount = (editor) => {
    const assets = []
    const shapes = []
    for (const it of items) {
      const assetId = AssetRecordType.createId(it.img)
      assets.push(AssetRecordType.create({
        id: assetId,
        type: 'image',
        props: {
          name: it.title || it.artist || 'artwork',
          src: new URL(`img/thumb/${it.img}.jpg`, document.baseURI).href,
          w: it.w, h: it.h,
          mimeType: 'image/jpeg',
          isAnimated: false,
        },
      }))
      shapes.push({
        id: createShapeId('w' + it.n),
        type: 'image',
        x: it.x, y: it.y,
        props: { w: it.w, h: it.h, assetId },
      })
      const cap = [it.title, [it.artist, it.year].filter(Boolean).join(', ')].filter(Boolean).join('\n')
      if (cap) {
        shapes.push({
          id: createShapeId('c' + it.n),
          type: 'text',
          x: it.x, y: it.y + it.h + 8,
          props: { richText: toRichText(cap), size: 's', color: 'grey', font: 'sans', textAlign: 'start', autoSize: true },
        })
      }
    }
    editor.createAssets(assets)

    // aim the camera first, then stream the shapes in over a few frames
    // so the canvas paints right away instead of blocking on all 157
    const minX = Math.min(...items.map(it => it.x))
    const minY = Math.min(...items.map(it => it.y))
    const maxX = Math.max(...items.map(it => it.x + it.w))
    const maxY = Math.max(...items.map(it => it.y + it.h))
    editor.zoomToBounds(new Box(minX, minY, maxX - minX, maxY - minY), { inset: 64 })

    const token = ++mountToken
    let i = 0
    const step = () => {
      if (token !== mountToken) return
      editor.createShapes(shapes.slice(i, i += 20))
      if (i < shapes.length) setTimeout(step, 32)
      else editor.updateInstanceState({ isReadonly: true })
    }
    step()
    editor.user.updateUserPreferences({ colorScheme: 'light' })

    // selecting a work opens its plate
    react('plate on select', () => {
      const ids = editor.getSelectedShapeIds()
      if (ids.length === 1 && ids[0].startsWith('shape:w')) {
        const n = parseInt(ids[0].slice('shape:w'.length), 10)
        if (Number.isFinite(n)) {
          editor.selectNone()
          onPick?.(n)
        }
      }
    })
  }

  root = createRoot(container)
  root.render(React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0 } },
    React.createElement(Tldraw, { hideUi: true, licenseKey: LICENSE_KEY, onMount }),
  ))
}

export function unmountBoard() {
  mountToken++
  if (root) { root.unmount(); root = null }
}
