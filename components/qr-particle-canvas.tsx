"use client"

import { useEffect, forwardRef, useImperativeHandle, useRef, useState, useCallback } from "react"
import { smoothNoise } from "@/lib/noise"

interface QRParticleCanvasProps {
  qrMatrix: boolean[][] | null
  particleSize: number
  particleColor: string
  mouseRadius: number
  repulsionStrength: number
  returnSpeed: number
  animationSpeed: number
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
  ({ qrMatrix, particleSize, particleColor, mouseRadius, repulsionStrength, returnSpeed, animationSpeed }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
    const animationFrameRef = useRef<number>()
    const mouseTrailRef = useRef<TrailPoint[]>([])
    const lastMoveTimeRef = useRef(0)
    const isFirstMoveRef = useRef(true)
    const animationStartTimeRef = useRef(0)
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 })

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
        ctx.fillStyle = "#fafafa"
        ctx.fillRect(0, 0, totalSize, totalSize)

        const timeSinceStart = (Date.now() - animationStartTimeRef.current) / 1000
        const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
        const isMouseMoving = timeSinceLastMove < 100
        const time = Date.now() * 0.001

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
            let maxDistanceFactor = 0

            // Mouse trail interaction
            if (mouseTrailRef.current.length > 0) {
              mouseTrailRef.current.forEach((trailPoint) => {
                const dx = trailPoint.x - particle.x
                const dy = trailPoint.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouseRadius * 1.5 && distance > 0.1) {
                  const noiseValue = smoothNoise(particle.baseX, particle.baseY, 0.02, time)
                  const irregularRadius = mouseRadius * (0.7 + noiseValue * 0.6)

                  if (distance < irregularRadius) {
                    const distanceFactor = 1 - distance / irregularRadius
                    const smoothFactor = distanceFactor * distanceFactor * (3 - 2 * distanceFactor)
                    maxDistanceFactor = Math.max(maxDistanceFactor, smoothFactor)

                    const force = repulsionStrength * smoothFactor * trailPoint.strength * 0.5
                    totalForceX -= (dx / distance) * force
                    totalForceY -= (dy / distance) * force
                  }
                }
              })
            }

            // Direct mouse interaction
            const dx = mouseRef.current.x - particle.x
            const dy = mouseRef.current.y - particle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < mouseRadius && distance > 0.1) {
              const noiseValue = smoothNoise(particle.baseX, particle.baseY, 0.02, time)
              const irregularRadius = mouseRadius * (0.7 + noiseValue * 0.6)

              if (distance < irregularRadius) {
                const distanceFactor = 1 - distance / irregularRadius
                const smoothFactor = distanceFactor * distanceFactor * (3 - 2 * distanceFactor)
                maxDistanceFactor = Math.max(maxDistanceFactor, smoothFactor)

                const force = repulsionStrength * smoothFactor * 0.3
                totalForceX -= (dx / distance) * force
                totalForceY -= (dy / distance) * force
              }
            }

            // Apply forces
            particle.vx += totalForceX
            particle.vy += totalForceY

            // Return to base position
            const returnForceX = (particle.baseX - particle.x) * returnSpeed * 0.1
            const returnForceY = (particle.baseY - particle.y) * returnSpeed * 0.1
            particle.vx += returnForceX
            particle.vy += returnForceY

            // Damping
            particle.vx *= 0.85
            particle.vy *= 0.85

            particle.x += particle.vx
            particle.y += particle.vy

            // Twinkle effect when interacting
            if (maxDistanceFactor > 0) {
              particle.twinklePhase += particle.twinkleSpeed
            }
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
    }, [qrMatrix, particleSize, particleColor, mouseRadius, repulsionStrength, returnSpeed, animationSpeed, handleMouseMove])

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

    return (
      <div className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair rounded-xl shadow-lg"
          style={{
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>
    )
  },
)

QRParticleCanvas.displayName = "QRParticleCanvas"
