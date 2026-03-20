"use client"

import { useEffect, forwardRef, useImperativeHandle, useRef, useState, useCallback } from "react"

import type { ScanStatus } from "@/hooks/use-qr-scan-detection"

interface QRParticleCanvasProps {
  qrMatrix: boolean[][] | null
  particleSize: number
  particleColor: string
  mouseRadius: number
  repulsionStrength: number
  returnSpeed: number
  animationSpeed: number
  scanStatus?: ScanStatus
  transparent?: boolean
}

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  startX: number
  startY: number
  size: number
  vx: number
  vy: number
  twinklePhase: number
  twinkleSpeed: number
  animationProgress: number
  delay: number
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
  strength: number
}

export const QRParticleCanvas = forwardRef<HTMLCanvasElement, QRParticleCanvasProps>(
  ({ qrMatrix, particleSize, particleColor, mouseRadius, repulsionStrength, returnSpeed, animationSpeed, scanStatus = "idle", transparent = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
    const animationFrameRef = useRef<number>()
    const mouseTrailRef = useRef<TrailPoint[]>([])
    const lastMoveTimeRef = useRef(0)
    const isFirstMoveRef = useRef(true)
    const animationStartTimeRef = useRef(0)
    const scanStatusRef = useRef(scanStatus)
    const successAnimationStartRef = useRef(0)
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 })

    // Keep scanStatus ref updated
    useEffect(() => {
      scanStatusRef.current = scanStatus
      if (scanStatus === "scanned") {
        successAnimationStartRef.current = Date.now()
      }
    }, [scanStatus])

    useImperativeHandle(ref, () => canvasRef.current!)

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top

      lastMoveTimeRef.current = Date.now()

      if (isFirstMoveRef.current) {
        mouseRef.current = { x: newX, y: newY, prevX: newX, prevY: newY }
        isFirstMoveRef.current = false
        return
      }

      const velX = newX - mouseRef.current.x
      const velY = newY - mouseRef.current.y
      const speed = Math.sqrt(velX * velX + velY * velY)

      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = newX
      mouseRef.current.y = newY

      const steps = Math.max(1, Math.ceil(speed / 10))
      for (let i = 0; i < steps; i++) {
        const t = i / steps
        mouseTrailRef.current.push({
          x: mouseRef.current.prevX + velX * t,
          y: mouseRef.current.prevY + velY * t,
          timestamp: Date.now(),
          strength: Math.min(speed / 10, 1),
        })
      }

      mouseTrailRef.current = mouseTrailRef.current.filter((p) => Date.now() - p.timestamp < 150)
    }, [])

    useEffect(() => {
      if (!canvasRef.current || !qrMatrix || qrMatrix.length === 0) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      const matrixSize = qrMatrix.length
      const moduleSize = particleSize
      const padding = moduleSize * 4
      const totalSize = matrixSize * moduleSize + padding * 2

      const dpr = window.devicePixelRatio || 1
      canvas.width = totalSize * dpr
      canvas.height = totalSize * dpr
      canvas.style.width = `${totalSize}px`
      canvas.style.height = `${totalSize}px`
      ctx.scale(dpr, dpr)

      setCanvasSize({ width: totalSize, height: totalSize })

      // Create particles from QR matrix
      const particles: Particle[] = []
      const centerX = totalSize / 2
      const centerY = totalSize / 2

      for (let row = 0; row < matrixSize; row++) {
        for (let col = 0; col < matrixSize; col++) {
          if (qrMatrix[row][col]) {
            const baseX = padding + col * moduleSize + moduleSize / 2
            const baseY = padding + row * moduleSize + moduleSize / 2

            // Random start position (scattered)
            const angle = Math.random() * Math.PI * 2
            const distance = 200 + Math.random() * 300
            const startX = centerX + Math.cos(angle) * distance
            const startY = centerY + Math.sin(angle) * distance

            // Delay based on distance from center for wave effect
            const distFromCenter = Math.sqrt((baseX - centerX) ** 2 + (baseY - centerY) ** 2)
            const delay = (distFromCenter / (totalSize / 2)) * 0.5

            particles.push({
              x: startX,
              y: startY,
              baseX,
              baseY,
              startX,
              startY,
              size: moduleSize * 0.85,
              vx: 0,
              vy: 0,
              twinklePhase: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03,
              animationProgress: 0,
              delay,
            })
          }
        }
      }

      particlesRef.current = particles
      animationStartTimeRef.current = Date.now()

      const animate = () => {
        if (transparent) {
          ctx.clearRect(0, 0, totalSize, totalSize)
        } else {
          ctx.fillStyle = "#fafafa"
          ctx.fillRect(0, 0, totalSize, totalSize)
        }

        const timeSinceStart = (Date.now() - animationStartTimeRef.current) / 1000
        const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
        const isMouseMoving = timeSinceLastMove < 100

        if (!isMouseMoving) {
          mouseTrailRef.current = []
        }

        particles.forEach((particle) => {
          // Entrance animation
          if (particle.animationProgress < 1) {
            const adjustedTime = timeSinceStart - particle.delay
            if (adjustedTime > 0) {
              particle.animationProgress = Math.min(1, adjustedTime * animationSpeed)
              const eased = 1 - Math.pow(1 - particle.animationProgress, 3) // easeOutCubic

              particle.x = particle.startX + (particle.baseX - particle.startX) * eased
              particle.y = particle.startY + (particle.baseY - particle.startY) * eased
            }
          } else {
            // Physics-based interaction
            let totalForceX = 0
            let totalForceY = 0

            // Mouse trail interaction
            if (mouseTrailRef.current.length > 0) {
              mouseTrailRef.current.forEach((trailPoint) => {
                const dx = trailPoint.x - particle.x
                const dy = trailPoint.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouseRadius && distance > 0.1) {
                  const distanceFactor = 1 - distance / mouseRadius
                  const smoothFactor = distanceFactor * distanceFactor
                  const force = repulsionStrength * smoothFactor * trailPoint.strength * 0.15
                  totalForceX -= (dx / distance) * force
                  totalForceY -= (dy / distance) * force
                }
              })
            }

            // Direct mouse interaction
            const dx = mouseRef.current.x - particle.x
            const dy = mouseRef.current.y - particle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < mouseRadius && distance > 0.1) {
              const distanceFactor = 1 - distance / mouseRadius
              const smoothFactor = distanceFactor * distanceFactor
              const force = repulsionStrength * smoothFactor * 0.1
              totalForceX -= (dx / distance) * force
              totalForceY -= (dy / distance) * force
            }

            // Apply forces
            particle.vx += totalForceX
            particle.vy += totalForceY

            // Strong return to base position - snaps back quickly
            const returnForceX = (particle.baseX - particle.x) * returnSpeed * 0.25
            const returnForceY = (particle.baseY - particle.y) * returnSpeed * 0.25
            particle.vx += returnForceX
            particle.vy += returnForceY

            // Heavy damping so particles settle fast
            particle.vx *= 0.7
            particle.vy *= 0.7

            particle.x += particle.vx
            particle.y += particle.vy
          }

          // Draw particle
          const opacity = particle.animationProgress
          ctx.globalAlpha = opacity
          ctx.fillStyle = particleColor
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animate()

      canvas.addEventListener("mousemove", handleMouseMove)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        canvas.removeEventListener("mousemove", handleMouseMove)
      }
    }, [qrMatrix, particleSize, particleColor, mouseRadius, repulsionStrength, returnSpeed, animationSpeed, handleMouseMove, transparent])

    if (!qrMatrix) {
      return (
        <div className="flex items-center justify-center w-full aspect-square bg-muted/30 rounded-xl border-2 border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Your QR code will appear here</p>
            <p className="text-sm mt-1">Enter your data and click generate</p>
          </div>
        </div>
      )
    }

    // Determine border/glow classes based on scan status
    const getBorderClasses = () => {
      switch (scanStatus) {
        case "waiting":
          return "ring-2 ring-blue-400/60"
        case "scanned":
          return "ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        default:
          return ""
      }
    }

    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={`relative rounded-xl transition-all duration-500 ${getBorderClasses()}`}>
          <canvas
            ref={canvasRef}
            className="cursor-crosshair rounded-xl shadow-lg"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          {scanStatus === "scanned" && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl animate-in fade-in duration-300">
              <div className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Scanned!
              </div>
            </div>
          )}
        </div>
        {scanStatus === "waiting" && (
          <p className="text-xs text-blue-500 font-medium tracking-wide">
            Waiting for scan...
          </p>
        )}
      </div>
    )
  },
)

QRParticleCanvas.displayName = "QRParticleCanvas"
