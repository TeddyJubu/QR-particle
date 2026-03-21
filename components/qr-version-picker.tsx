"use client"

import { useEffect, useRef, useCallback } from "react"
import { Download, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface AITheme {
  name: string
  foreground: string
  imagePrompt: string
  backgroundUrl: string | null
  seed: number
}

interface QRVersionPickerProps {
  themes: AITheme[]
  qrMatrix: boolean[][]
  particleSize: number
  selectedIndex: number
  onSelect: (index: number) => void
  onDownload: (index: number) => void
  onRegenerate: () => void
}

function StaticQRPreview({
  qrMatrix,
  foreground,
  backgroundUrl,
  size = 200,
}: {
  qrMatrix: boolean[][]
  foreground: string
  backgroundUrl: string | null
  size?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawDots = useCallback(
    (ctx: CanvasRenderingContext2D, matrixSize: number, moduleSize: number, padding: number) => {
      ctx.fillStyle = foreground
      for (let row = 0; row < matrixSize; row++) {
        for (let col = 0; col < matrixSize; col++) {
          if (qrMatrix[row][col]) {
            const x = padding + col * moduleSize + moduleSize / 2
            const y = padding + row * moduleSize + moduleSize / 2
            ctx.beginPath()
            ctx.arc(x, y, (moduleSize * 0.85) / 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    },
    [qrMatrix, foreground]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const matrixSize = qrMatrix.length
    const padding = 10
    const moduleSize = (size - padding * 2) / matrixSize

    if (!backgroundUrl) {
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, size, size)
      drawDots(ctx, matrixSize, moduleSize, padding)
      return
    }

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      drawDots(ctx, matrixSize, moduleSize, padding)
    }
    img.onerror = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = "#1a1a1a"
      ctx.fillRect(0, 0, size, size)
      drawDots(ctx, matrixSize, moduleSize, padding)
    }
    img.src = backgroundUrl
  }, [qrMatrix, backgroundUrl, size, drawDots])

  useEffect(() => {
    render()
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full object-cover rounded-lg"
    />
  )
}

export function QRVersionPicker({
  themes,
  qrMatrix,
  selectedIndex,
  onSelect,
  onDownload,
  onRegenerate,
}: QRVersionPickerProps) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
          3 Style Versions
        </span>
        <div className="h-px flex-1 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={onRegenerate}
          title="Regenerate AI backgrounds"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme, index) => {
          const isSelected = index === selectedIndex
          return (
            <div
              key={index}
              className="group relative flex flex-col gap-1.5"
            >
              <button
                onClick={() => onSelect(index)}
                className={[
                  "relative overflow-hidden rounded-lg aspect-square cursor-pointer transition-all duration-200",
                  "ring-2 ring-offset-2",
                  isSelected
                    ? "ring-primary ring-offset-background scale-[1.03] shadow-lg"
                    : "ring-transparent hover:ring-border hover:scale-[1.01]",
                ].join(" ")}
              >
                <StaticQRPreview
                  qrMatrix={qrMatrix}
                  foreground={theme.foreground}
                  backgroundUrl={theme.backgroundUrl}
                />

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-xs font-medium truncate">
                    {theme.name}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1.5 px-0.5">
                <div
                  className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                  style={{ backgroundColor: theme.foreground }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {theme.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(index)
                  }}
                  title={`Download ${theme.name}`}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Click a version to preview it animated · Click{" "}
        <Download className="inline h-3 w-3 mx-0.5" /> to download
      </p>
    </div>
  )
}
