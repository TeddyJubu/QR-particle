import { getFinderPatternRegions } from "./qr-utils"

export type ArtStyleId = "circuit-board" | "city-grid" | "topographic" | "neural-network" | "mechanical" | "organic" | "galactic-stars"

export interface ArtStyleConfig {
  id: ArtStyleId
  name: string
  // Colors
  background: string
  darkModule: string
  lightModule: string
  finderOuter: string
  finderInner: string
  accentGlow: string
  // Module shape
  moduleShape: "circle" | "rounded-rect" | "diamond" | "hexagon" | "gear" | "blob" | "star"
  // Effects
  drawConnections: boolean
  glowIntensity: number // 0-1
}

const STYLE_CONFIGS: Record<ArtStyleId, ArtStyleConfig> = {
  "circuit-board": {
    id: "circuit-board",
    name: "Circuit Board",
    background: "#0a1628",
    darkModule: "#38bdf8",
    lightModule: "transparent",
    finderOuter: "#f59e0b",
    finderInner: "#fbbf24",
    accentGlow: "#38bdf8",
    moduleShape: "rounded-rect",
    drawConnections: true,
    glowIntensity: 0.6,
  },
  "city-grid": {
    id: "city-grid",
    name: "City Grid",
    background: "#1a1a2e",
    darkModule: "#e2e8f0",
    lightModule: "transparent",
    finderOuter: "#22c55e",
    finderInner: "#4ade80",
    accentGlow: "#f8fafc",
    moduleShape: "rounded-rect",
    drawConnections: false,
    glowIntensity: 0.3,
  },
  topographic: {
    id: "topographic",
    name: "Topographic",
    background: "#fef3c7",
    darkModule: "#78350f",
    lightModule: "transparent",
    finderOuter: "#92400e",
    finderInner: "#b45309",
    accentGlow: "#d97706",
    moduleShape: "circle",
    drawConnections: false,
    glowIntensity: 0.15,
  },
  "neural-network": {
    id: "neural-network",
    name: "Neural Network",
    background: "#030712",
    darkModule: "#a78bfa",
    lightModule: "transparent",
    finderOuter: "#ec4899",
    finderInner: "#f472b6",
    accentGlow: "#c084fc",
    moduleShape: "circle",
    drawConnections: true,
    glowIntensity: 0.8,
  },
  mechanical: {
    id: "mechanical",
    name: "Mechanical",
    background: "#1c1917",
    darkModule: "#d4a056",
    lightModule: "transparent",
    finderOuter: "#a3734c",
    finderInner: "#d4a056",
    accentGlow: "#fbbf24",
    moduleShape: "hexagon",
    drawConnections: false,
    glowIntensity: 0.25,
  },
  organic: {
    id: "organic",
    name: "Organic",
    background: "#fdf2f8",
    darkModule: "#a21caf",
    lightModule: "transparent",
    finderOuter: "#86198f",
    finderInner: "#c026d3",
    accentGlow: "#e879f9",
    moduleShape: "blob",
    drawConnections: false,
    glowIntensity: 0.35,
  },
  "galactic-stars": {
    id: "galactic-stars",
    name: "Galactic Stars",
    background: "#020617",
    darkModule: "#e0f2fe",
    lightModule: "transparent",
    finderOuter: "#38bdf8",
    finderInner: "#0ea5e9",
    accentGlow: "#7dd3fc",
    moduleShape: "star",
    drawConnections: false,
    glowIntensity: 0.8,
  },
}

export function getStyleConfig(styleId: ArtStyleId): ArtStyleConfig {
  return STYLE_CONFIGS[styleId]
}

// Seeded random for reproducible artistic variation
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Render an artistic QR code onto a canvas.
 * The QR matrix must be a valid boolean[][] from the qrcode library.
 * Returns the canvas for download.
 */
export function renderArtisticQR(
  canvas: HTMLCanvasElement,
  matrix: boolean[][],
  styleId: ArtStyleId,
  seed: number = 42,
  canvasPixelSize: number = 800,
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const style = STYLE_CONFIGS[styleId]
  const matrixSize = matrix.length
  const regions = getFinderPatternRegions(matrixSize)
  const rand = seededRandom(seed)

  // Calculate module size and padding (quiet zone)
  const quietZone = 4 // modules of white space
  const totalModules = matrixSize + quietZone * 2
  const modulePixelSize = canvasPixelSize / totalModules
  const offset = quietZone * modulePixelSize
  const cornerRadius = modulePixelSize * 2 // Overall corner radius for the QR area background

  // Set canvas size
  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1
  canvas.width = canvasPixelSize * dpr
  canvas.height = canvasPixelSize * dpr
  // Don't override CSS display size — let the parent flex/padding control layout
  ctx.scale(dpr, dpr)

  // --- Background ---
  // Clear the canvas to be transparent for the quiet zone (parent container will provide bg)
  ctx.clearRect(0, 0, canvasPixelSize, canvasPixelSize)

  // Draw styled background within the QR area
  const qrAreaX = offset
  const qrAreaY = offset
  const qrAreaSize = matrixSize * modulePixelSize

  ctx.fillStyle = style.background
  drawRoundedRect(ctx, qrAreaX, qrAreaY, qrAreaSize, qrAreaSize, cornerRadius)
  ctx.fill()

  // Subtle background texture
  if (styleId === "circuit-board" || styleId === "city-grid") {
    ctx.strokeStyle = style.darkModule + "10"
    ctx.lineWidth = 0.5
    const gridStep = modulePixelSize * 2
    for (let x = qrAreaX; x < qrAreaX + qrAreaSize; x += gridStep) {
      ctx.beginPath()
      ctx.moveTo(x, qrAreaY)
      ctx.lineTo(x, qrAreaY + qrAreaSize)
      ctx.stroke()
    }
    for (let y = qrAreaY; y < qrAreaY + qrAreaSize; y += gridStep) {
      ctx.beginPath()
      ctx.moveTo(qrAreaX, y)
      ctx.lineTo(qrAreaX + qrAreaSize, y)
      ctx.stroke()
    }
  }

  // --- Draw connections between nearby dark modules ---
  if (style.drawConnections) {
    ctx.strokeStyle = style.darkModule + "30"
    ctx.lineWidth = modulePixelSize * 0.15
    ctx.lineCap = "round"

    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        if (!matrix[row][col]) continue
        if (regions.isFinderModule(col, row)) continue

        const cx = offset + col * modulePixelSize + modulePixelSize / 2
        const cy = offset + row * modulePixelSize + modulePixelSize / 2

        // Check right and down neighbors
        const neighbors = [
          [col + 1, row],
          [col, row + 1],
        ]

        for (const [nc, nr] of neighbors) {
          if (nr < matrixSize && nc < matrixSize && matrix[nr][nc] && !regions.isFinderModule(nc, nr)) {
            const nx = offset + nc * modulePixelSize + modulePixelSize / 2
            const ny = offset + nr * modulePixelSize + modulePixelSize / 2
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(nx, ny)
            ctx.stroke()
          }
        }
      }
    }
  }

  // --- Glow layer (drawn before modules so it sits behind) ---
  if (style.glowIntensity > 0) {
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        if (!matrix[row][col]) continue
        if (regions.isFinderModule(col, row)) continue

        // Random chance for glow based on seed
        if (rand() > 0.3) continue

        const cx = offset + col * modulePixelSize + modulePixelSize / 2
        const cy = offset + row * modulePixelSize + modulePixelSize / 2
        const glowRadius = modulePixelSize * (1.5 + rand() * 1.5)

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
        gradient.addColorStop(0, style.accentGlow + Math.round(style.glowIntensity * 80).toString(16).padStart(2, "0"))
        gradient.addColorStop(1, style.accentGlow + "00")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // --- Draw data modules ---
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      // Skip finder pattern modules — we draw those separately
      if (regions.isFinderModule(col, row)) continue

      if (!matrix[row][col]) continue

      const x = offset + col * modulePixelSize
      const y = offset + row * modulePixelSize
      const cx = x + modulePixelSize / 2
      const cy = y + modulePixelSize / 2
      const s = modulePixelSize * 0.85 // slightly smaller than cell for gap
      const halfS = s / 2

      ctx.fillStyle = style.darkModule

      // Slight color variation per module based on seed
      const variation = rand() * 0.1 - 0.05
      if (variation > 0) {
        ctx.globalAlpha = 0.9 + variation
      }

      switch (style.moduleShape) {
        case "circle":
          ctx.beginPath()
          ctx.arc(cx, cy, halfS, 0, Math.PI * 2)
          ctx.fill()
          break

        case "rounded-rect": {
          const r = halfS * 0.35
          ctx.beginPath()
          ctx.moveTo(cx - halfS + r, cy - halfS)
          ctx.lineTo(cx + halfS - r, cy - halfS)
          ctx.arcTo(cx + halfS, cy - halfS, cx + halfS, cy - halfS + r, r)
          ctx.lineTo(cx + halfS, cy + halfS - r)
          ctx.arcTo(cx + halfS, cy + halfS, cx + halfS - r, cy + halfS, r)
          ctx.lineTo(cx - halfS + r, cy + halfS)
          ctx.arcTo(cx - halfS, cy + halfS, cx - halfS, cy + halfS - r, r)
          ctx.lineTo(cx - halfS, cy - halfS + r)
          ctx.arcTo(cx - halfS, cy - halfS, cx - halfS + r, cy - halfS, r)
          ctx.closePath()
          ctx.fill()
          break
        }

        case "diamond":
          ctx.beginPath()
          ctx.moveTo(cx, cy - halfS)
          ctx.lineTo(cx + halfS, cy)
          ctx.lineTo(cx, cy + halfS)
          ctx.lineTo(cx - halfS, cy)
          ctx.closePath()
          ctx.fill()
          break

        case "hexagon": {
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const hx = cx + halfS * Math.cos(angle)
            const hy = cy + halfS * Math.sin(angle)
            if (i === 0) ctx.moveTo(hx, hy)
            else ctx.lineTo(hx, hy)
          }
          ctx.closePath()
          ctx.fill()
          break
        }

        case "gear": {
          // Simple gear/cog shape
          const teeth = 6
          const innerR = halfS * 0.6
          const outerR = halfS
          ctx.beginPath()
          for (let i = 0; i < teeth * 2; i++) {
            const angle = (Math.PI / teeth) * i - Math.PI / 2
            const r = i % 2 === 0 ? outerR : innerR
            const gx = cx + r * Math.cos(angle)
            const gy = cy + r * Math.sin(angle)
            if (i === 0) ctx.moveTo(gx, gy)
            else ctx.lineTo(gx, gy)
          }
          ctx.closePath()
          ctx.fill()
          break
        }

        case "blob": {
          // Organic blob — slightly irregular circle
          ctx.beginPath()
          const points = 8
          for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 / points) * i
            const r = halfS * (0.8 + rand() * 0.4)
            const bx = cx + r * Math.cos(angle)
            const by = cy + r * Math.sin(angle)
            if (i === 0) ctx.moveTo(bx, by)
            else ctx.lineTo(bx, by)
          }
          ctx.closePath()
          ctx.fill()
          break
        }

        case "star": {
          const points = 5
          const outerR = halfS
          const innerR = halfS * 0.4
          ctx.beginPath()
          for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI / points) * i - Math.PI / 2
            const r = i % 2 === 0 ? outerR : innerR
            const sx = cx + r * Math.cos(angle)
            const sy = cy + r * Math.sin(angle)
            if (i === 0) ctx.moveTo(sx, sy)
            else ctx.lineTo(sx, sy)
          }
          ctx.closePath()
          ctx.fill()
          break
        }
      }

      ctx.globalAlpha = 1
    }
  }

  // --- Draw timing patterns (with slight styling) ---
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (!regions.isTimingPattern(col, row)) continue
      if (!matrix[row][col]) continue

      const cx = offset + col * modulePixelSize + modulePixelSize / 2
      const cy = offset + row * modulePixelSize + modulePixelSize / 2
      const halfS = modulePixelSize * 0.85 / 2

      ctx.fillStyle = style.darkModule
      ctx.beginPath()

      if (style.moduleShape === "star") {
        const points = 5
        const outerR = halfS
        const innerR = halfS * 0.4
        for (let i = 0; i < points * 2; i++) {
          const angle = (Math.PI / points) * i - Math.PI / 2
          const r = i % 2 === 0 ? outerR : innerR
          const sx = cx + r * Math.cos(angle)
          const sy = cy + r * Math.sin(angle)
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.closePath()
      } else if (style.moduleShape === "circle" || style.moduleShape === "blob") {
        ctx.arc(cx, cy, halfS, 0, Math.PI * 2)
      } else {
        // Simple square for timing — maximum clarity
        ctx.rect(cx - halfS, cy - halfS, halfS * 2, halfS * 2)
      }
      ctx.fill()
    }
  }

  // --- Draw finder patterns (always high contrast, always square-based) ---
  for (const finder of regions.finders) {
    const fx = offset + finder.x * modulePixelSize
    const fy = offset + finder.y * modulePixelSize
    const fSize = regions.finderSize * modulePixelSize

    // Outer border (3 rings: outer dark, middle light, inner dark)
    const cornerRadius = modulePixelSize * 0.8

    // Ring 1: Outer dark (7x7)
    ctx.fillStyle = style.finderOuter
    drawRoundedRect(ctx, fx, fy, fSize, fSize, cornerRadius)
    ctx.fill()

    // Ring 2: Inner light (5x5)
    const ring2Offset = modulePixelSize
    const ring2Size = fSize - modulePixelSize * 2
    ctx.fillStyle = style.background
    drawRoundedRect(ctx, fx + ring2Offset, fy + ring2Offset, ring2Size, ring2Size, cornerRadius * 0.65)
    ctx.fill()

    // Ring 3: Center dark (3x3)
    const ring3Offset = modulePixelSize * 2
    const ring3Size = fSize - modulePixelSize * 4
    ctx.fillStyle = style.finderInner
    drawRoundedRect(ctx, fx + ring3Offset, fy + ring3Offset, ring3Size, ring3Size, cornerRadius * 0.4)
    ctx.fill()

    // Glow around finder
    if (style.glowIntensity > 0.3) {
      const centerX = fx + fSize / 2
      const centerY = fy + fSize / 2
      const glowR = fSize * 0.8
      const gradient = ctx.createRadialGradient(centerX, centerY, fSize / 3, centerX, centerY, glowR)
      gradient.addColorStop(0, style.accentGlow + "20")
      gradient.addColorStop(1, style.accentGlow + "00")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, glowR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export const ALL_STYLE_IDS: ArtStyleId[] = [
  "circuit-board",
  "city-grid",
  "topographic",
  "neural-network",
  "mechanical",
  "organic",
  "galactic-stars",
]
