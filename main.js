const TILE_SIZE = 0.5
const PAD = 1
const WIDTH = Math.floor(window.innerWidth / TILE_SIZE) + PAD
const HEIGHT = Math.floor(window.innerHeight / TILE_SIZE) + PAD
const GRID_SIZE = (WIDTH + PAD * 2) * (HEIGHT + PAD * 2)
const W_STRIDE = WIDTH + PAD * 2

const c = document.querySelector('canvas')
const ctx = c.getContext('2d')
c.width = window.innerWidth
c.height = window.innerHeight
ctx.imageSmoothingEnabled = false

const oc = new OffscreenCanvas(WIDTH, HEIGHT)
const octx = oc.getContext('2d')

let current = new Uint8Array(GRID_SIZE)
let next = new Uint8Array(GRID_SIZE)

const img = octx.createImageData(WIDTH, HEIGHT)
const pixels = new Uint32Array(img.data.buffer)

const colors = [0x00000000, 0xffa98d77]

const fps = 20
const fpsInterval = 1000 / fps
let lastTime = 0

let isPaused = true
let mouse = {
  x: null,
  y: null,
}

let zoom = 1
let offsetX = 0
let offsetY = 0

let isPanning = false
let panStart = { x: 0, y: 0 }

function randomize(grid) {
  for (let y = PAD; y < HEIGHT + PAD; y++) {
    const rowOffset = y * W_STRIDE
    for (let x = PAD; x < WIDTH + PAD; x++) {
      const index = rowOffset + x
      grid[index] = Math.random() > 0.69 ? 1 : 0
    }
  }
}

function draw(grid) {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const srcIndex = (y + PAD) * W_STRIDE + (x + PAD)
      const val = grid[srcIndex]

      const pixelIndex = y * WIDTH + x
      pixels[pixelIndex] = colors[val]
    }
  }

  ctx.clearRect(0, 0, c.width, c.height)
  octx.putImageData(img, 0, 0)
  ctx.drawImage(
    oc,
    0,
    0,
    WIDTH,
    HEIGHT,
    offsetX,
    offsetY,
    WIDTH * zoom,
    HEIGHT * zoom,
  )
}

function loop(timestamp) {
  requestAnimationFrame(loop)
  const elapsed = timestamp - lastTime
  draw(current)

  if (!isPaused && elapsed > fpsInterval) {
    nextState(current, next)
      ;[current, next] = [next, current]
    lastTime = timestamp - (elapsed % fpsInterval)
  }
}

function resizeCanvas() {
  c.width = window.innerWidth
  c.height = window.innerHeight
  ctx.imageSmoothingEnabled = false
}

function nextState(src, dst) {
  for (let y = 1; y <= HEIGHT; y++) {
    const prevRow = (y - 1) * W_STRIDE
    const currRow = y * W_STRIDE
    const nextRow = (y + 1) * W_STRIDE

    for (let x = 1; x <= WIDTH; x++) {
      const i = currRow + x
      const neighbors =
        src[prevRow + x - 1] +
        src[prevRow + x] +
        src[prevRow + x + 1] +
        src[currRow + x - 1] +
        src[currRow + x + 1] +
        src[nextRow + x - 1] +
        src[nextRow + x] +
        src[nextRow + x + 1]

      const self = src[i]
      if (self === 1) {
        dst[i] = neighbors === 2 || neighbors === 3 ? 1 : 0
      } else {
        dst[i] = neighbors === 3 ? 1 : 0
      }
    }
  }
}

function clearState() {
  current = new Uint8Array(GRID_SIZE)
  next = new Uint8Array(GRID_SIZE)
}

function setPixel(x, y, toErase = false) {
  current[y * W_STRIDE + x] = toErase ? 0 : 1
}

function setLine(x0, y0, x1, y1, toErase = false) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy

  while (true) {
    setPixel(x0, y0, toErase)
    if (x0 === x1 && y0 === y1) break
    let e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

function getTileCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.floor((e.clientX - rect.left - offsetX) / zoom) + PAD,
    y: Math.floor((e.clientY - rect.top - offsetY) / zoom) + PAD,
  }
}

function handleMouse(e, mouseDown = false) {
  const { x, y } = getTileCoords(e, c)
  const isRightClick = e.buttons === 2

  if (isPanning) {
    offsetX = e.clientX - panStart.x
    offsetY = e.clientY - panStart.y
    clampOffset()
  }

  if (e.buttons !== 1 && e.buttons !== 2) {
    mouse.x = null
    mouse.y = null
    return
  }

  if (mouseDown) setPixel(x, y, isRightClick)
  if (mouse.x !== null && mouse.y !== null) {
    setLine(mouse.x, mouse.y, x, y, isRightClick)
  }
  mouse.x = x
  mouse.y = y
}

function handleWheel(e) {
  e.preventDefault()
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoom = Math.max(1, zoom * zoomFactor)

  const mouseX = e.clientX
  const mouseY = e.clientY

  offsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom)
  offsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom)
  zoom = newZoom

  clampOffset()
}

function handleKeyboard(e) {
  if (e.code === 'KeyC') clearState()
  if (e.code === 'KeyR') randomize(current)
  if (e.code === 'Space') {
    isPaused = isPaused ? false : true
  }
}

function clampOffset() {
  offsetX = Math.min(0, Math.max(offsetX, window.innerWidth - WIDTH * zoom))
  offsetY = Math.min(0, Math.max(offsetY, window.innerHeight - HEIGHT * zoom))
}

c.addEventListener('wheel', handleWheel, { passive: false })

c.addEventListener('mousedown', e => {
  if (e.button === 1) {
    isPanning = true
    panStart = { x: e.clientX - offsetX, y: e.clientY - offsetY }
    e.preventDefault()
  }
})

c.addEventListener('mouseup', e => {
  if (e.button === 1) isPanning = false
})

window.addEventListener('keydown', handleKeyboard)
window.addEventListener('resize', resizeCanvas)
c.addEventListener('mousemove', handleMouse)
c.addEventListener('mousedown', e => handleMouse(e, true))
c.addEventListener('contextmenu', e => e.preventDefault())

requestAnimationFrame(loop)
