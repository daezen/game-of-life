# Conway's Game of Life

A sleek, performance-oriented implementation of **Conway's Game of Life** using JavaScript, HTML5 Canvas, and direct memory manipulation for smooth simulation even at high resolutions.

## 🚀 Key Features

* **Memory Efficient:** Uses `Uint8Array` for state management and `Uint32Array` for direct pixel manipulation.
* **Offscreen Rendering:** Utilizes an `OffscreenCanvas` buffer to decouple logic from the main render loop, ensuring high FPS.
* **Interactive Sandbox:** Draw or erase cells in real-time, even while the simulation is running.
* **Advanced Navigation:** Includes zoom (scroll) and pan (middle-click) functionality to explore large grids.
* **Bresenham's Line Algorithm:** Implements smooth line drawing between mouse coordinates to prevent "gaps" when moving the mouse quickly.

## 🕹️ Controls

| Action | Control |
| :--- | :--- |
| **Play / Pause** | `Space` |
| **Randomize Grid** | `R` Key |
| **Clear Grid** | `C` Key |
| **Draw Cells** | `Left Click` + Drag |
| **Erase Cells** | `Right Click` + Drag |
| **Zoom In/Out** | `Mouse Wheel` |
| **Pan / Move** | `Middle Mouse Button` (Hold) |

## 🛠️ Technical Details

### Performance Optimization
Instead of drawing individual rectangles for every cell (which is expensive), this project writes directly to the canvas's image data buffer. By using a `Uint32Array` linked to the `ImageData.data.buffer`, we can update a single pixel's color by writing a single 32-bit integer.

### The Algorithm
The simulation follows the standard Conway rules:
1.  **Survival:** Any live cell with 2 or 3 neighbors survives.
2.  **Death:** Any live cell with fewer than 2 or more than 3 neighbors dies.
3.  **Birth:** Any dead cell with exactly 3 neighbors becomes a live cell.

### Code Highlights
* **Padding (PAD):** The grid includes a 1-pixel buffer around the edges to simplify neighbor calculation without complex boundary checks.
* **Typed Arrays:** Using `Uint8Array` for `current` and `next` states minimizes memory overhead and improves access speed.
* **Bresenham Drawing:** The `setLine` function ensures that fast mouse movements still result in continuous lines of cells.
