const c = document.querySelector('canvas')
const ctx = c.getContext('2d')
const ROWS = 100
const TILE_SIZE = window.innerHeight / ROWS
const COLUMNS = Math.floor(window.innerWidth / TILE_SIZE)
const colors = ['black', '#778da9']
const fps = 15
const fpsInterval = 1000 / fps
let lastTime = 0
let isPaused = true
let gridA = makeArray(ROWS, COLUMNS)
let gridB = makeArray(ROWS, COLUMNS)
const bounds = {
  minX: 0,
  maxX: COLUMNS - 1,
  minY: 0,
  maxY: ROWS - 1,
}
let mouse = {
  x: null,
  y: null,
}

function isPointInRect(x, y, { minX, maxX, minY, maxY }) {
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function makeArray(rows, columns) {
  const grid = []
  for (let i = 0; i < rows; i++) {
    grid[i] = []
    for (let j = 0; j < columns; j++) {
      grid[i][j] = 0
    }
  }

  return grid
}

function seedGrid(grid) {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      grid[i][j] = Math.random() > 0.85 ? 1 : 0
    }
  }
}

function countNeighbours(y, x, grid) {
  let count = 0
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const newY = y + i
      const newX = x + j
      if (isPointInRect(newX, newY, bounds)) {
        count += grid[newY][newX]
      }
    }
  }
  return count
}

function calculateNextGen(oldGen, newGen) {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      const n = countNeighbours(i, j, oldGen)
      const isAlive = oldGen[i][j] === 1
      newGen[i][j] = 0

      if (isAlive && (n === 2 || n === 3)) {
        newGen[i][j] = 1
      }

      if (!isAlive && n === 3) {
        newGen[i][j] = 1
      }
    }
  }
}

function drawPixel(x, y) {
  if (gridA[y] !== undefined && gridA[y][x] !== undefined) {
    gridA[y][x] = 1
  }
}

function loop(timestamp) {
  requestAnimationFrame(loop)
  const elapsed = timestamp - lastTime
  if (!(elapsed > fpsInterval)) return
  lastTime = timestamp - (elapsed % fpsInterval)

  if (!isPaused) {
    calculateNextGen(gridA, gridB)
    ;[gridA, gridB] = [gridB, gridA]
  }

  if (mouse.isDown && isPaused) {
    drawPixel(mouse.x, mouse.y)
  }

  ctx.clearRect(0, 0, c.width, c.height)
  draw(gridA)
}

function draw(grid) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      const tileValue = grid[y][x]
      if (tileValue === 1) {
        ctx.fillStyle = colors[tileValue]
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }
}

function resizeCanvas() {
  c.width = window.innerWidth
  c.height = window.innerHeight
}

function drawLine(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy

  while (true) {
    drawPixel(x0, y0)
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

function handleMouse({ clientX: x, clientY: y, buttons }, mouseDown = false) {
  if (buttons !== 1) {
    mouse.x = null
    mouse.y = null
    return
  }

  const rect = c.getBoundingClientRect()
  const currentX = Math.floor((x - rect.left) / TILE_SIZE)
  const currentY = Math.floor((y - rect.top) / TILE_SIZE)

  if (mouseDown) drawPixel(currentX, currentY)
  if (mouse.x !== null && mouse.y !== null) {
    drawLine(mouse.x, mouse.y, currentX, currentY)
  }
  mouse.x = currentX
  mouse.y = currentY
}

loop()
resizeCanvas()

window.addEventListener('keydown', e => {
  if (e.code === 'KeyC') gridA = makeArray(ROWS, COLUMNS)
  if (e.code === 'KeyR') seedGrid(gridA)
  if (e.code === 'Space') {
    isPaused = isPaused ? false : true
  }
})
window.addEventListener('resize', resizeCanvas)
c.addEventListener('mousemove', handleMouse)
c.addEventListener('mousedown', e => handleMouse(e, true))
