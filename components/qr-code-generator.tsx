"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCodeInput } from "@/components/qr-code-input"
import { QRParticleCanvas } from "@/components/qr-particle-canvas"
import { QRControls } from "@/components/qr-controls"
import { QRVersionPicker, type AITheme } from "@/components/qr-version-picker"
import {
  generateQRMatrix,
  formatQRData,
  type QRType,
  type WifiData,
  type VCardData,
  type EmailData,
  type SMSData,
} from "@/lib/qr-utils"
import { useQRScanDetection } from "@/hooks/use-qr-scan-detection"
import {
  Download,
  QrCode,
  Settings2,
  RefreshCw,
  Radio,
  CircleOff,
  Fingerprint,
  Sparkles,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function QRCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrMatrix, setQrMatrix] = useState<boolean[][] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQrId, setCurrentQrId] = useState<string | null>(null)
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null)
  const [currentTargetUrl, setCurrentTargetUrl] = useState<string | null>(null)

  const [particleSize, setParticleSize] = useState(8)
  const [particleColor, setParticleColor] = useState("#0f172a")
  const [mouseRadius, setMouseRadius] = useState(80)
  const [repulsionStrength, setRepulsionStrength] = useState(8)
  const [returnSpeed, setReturnSpeed] = useState(0.8)
  const [animationSpeed, setAnimationSpeed] = useState(1.5)

  const [aiThemes, setAiThemes] = useState<AITheme[] | null>(null)
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0)
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false)
  const [themeError, setThemeError] = useState<string | null>(null)
  const [lastQrPayload, setLastQrPayload] = useState<{
    content: string | WifiData | VCardData | EmailData | SMSData
    type: QRType
  } | null>(null)

  const { status: scanStatus, scanCount, startListening, stopListening } =
    useQRScanDetection(currentInstanceId)

  const generateThemes = useCallback(
    async (content: string | WifiData | VCardData | EmailData | SMSData, type: QRType) => {
      setIsGeneratingTheme(true)
      setThemeError(null)
      setAiThemes(null)

      try {
        const res = await fetch("/api/generate-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(err.error || "Theme generation failed")
        }

        const data = await res.json()
        if (!data.themes?.length) throw new Error("No themes returned")

        setAiThemes(data.themes)
        setSelectedThemeIndex(0)
        setParticleColor(data.themes[0].foreground)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to generate AI themes"
        setThemeError(msg)
        console.error("Theme generation error:", err)
      } finally {
        setIsGeneratingTheme(false)
      }
    },
    []
  )

  const handleThemeSelect = useCallback(
    (index: number) => {
      setSelectedThemeIndex(index)
      if (aiThemes?.[index]) {
        setParticleColor(aiThemes[index].foreground)
      }
    },
    [aiThemes]
  )

  const downloadComposite = useCallback(
    async (themeIndex: number) => {
      if (!canvasRef.current || !aiThemes) return

      const theme = aiThemes[themeIndex]
      const particleCanvas = canvasRef.current

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = particleCanvas.width
      tempCanvas.height = particleCanvas.height
      const ctx = tempCanvas.getContext("2d")
      if (!ctx) return

      if (theme.backgroundUrl) {
        const img = new Image()
        img.src = theme.backgroundUrl
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
      } else {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      }

      ctx.drawImage(particleCanvas, 0, 0)

      const link = document.createElement("a")
      link.download = `qr-${theme.name.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = tempCanvas.toDataURL("image/png")
      link.click()
    },
    [aiThemes]
  )

  const generateUniqueQR = useCallback(
    async (
      type: QRType,
      data: string | WifiData | VCardData | EmailData | SMSData,
      isNewInstance = false
    ) => {
      setIsGenerating(true)
      stopListening()

      try {
        const formattedData = formatQRData(type, data)

        let qrData = formattedData
        let newQrId: string | null = currentQrId
        let newInstanceId: string | null = null
        let targetUrl: string | null = null

        if (type === "url" && typeof data === "string") {
          if (!isNewInstance || !currentQrId) {
            newQrId = crypto.randomUUID()
          }
          newInstanceId = crypto.randomUUID().slice(0, 8)
          targetUrl = data

          try {
            const supabase = createClient()
            const { error } = await supabase.from("qr_instances").insert({
              qr_id: newQrId,
              instance_id: newInstanceId,
              target_url: targetUrl,
            })

            if (error) throw error

            const origin = typeof window !== "undefined" ? window.location.origin : ""
            qrData = `${origin}/api/qr/${newInstanceId}?url=${encodeURIComponent(data)}`
          } catch (error) {
            const errorDetails = error instanceof Error ? error.message : String(error)
            console.warn(
              "Failed to create trackable redirect URL, using direct URL:",
              errorDetails
            )
            qrData = formattedData
            newQrId = null
            newInstanceId = null
            targetUrl = null
          }
        }

        const matrix = await generateQRMatrix(qrData)
        setQrMatrix(null)
        setCurrentQrId(newQrId)
        setCurrentInstanceId(newInstanceId)
        setCurrentTargetUrl(targetUrl)
        setAiThemes(null)
        setThemeError(null)
        setLastQrPayload({ content: data, type })
        setTimeout(() => setQrMatrix(matrix), 50)
      } catch (error) {
        console.error("Failed to generate QR code:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [stopListening, currentQrId]
  )

  const handleGenerate = useCallback(
    async (type: QRType, data: string | WifiData | VCardData | EmailData | SMSData) => {
      await generateUniqueQR(type, data, false)
    },
    [generateUniqueQR]
  )

  const handleNewInstance = useCallback(async () => {
    if (currentTargetUrl) {
      await generateUniqueQR("url", currentTargetUrl, true)
    }
  }, [generateUniqueQR, currentTargetUrl])

  const handleGenerateAIBackgrounds = useCallback(() => {
    if (lastQrPayload) {
      generateThemes(lastQrPayload.content, lastQrPayload.type)
    }
  }, [lastQrPayload, generateThemes])

  const handleReplay = useCallback(() => {
    if (qrMatrix) {
      const currentMatrix = qrMatrix
      setQrMatrix(null)
      setTimeout(() => setQrMatrix(currentMatrix), 50)
    }
  }, [qrMatrix])

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return

    if (aiThemes?.length) {
      await downloadComposite(selectedThemeIndex)
    } else {
      const link = document.createElement("a")
      link.download = "qr-code-particles.png"
      link.href = canvasRef.current.toDataURL("image/png")
      link.click()
    }
  }, [aiThemes, selectedThemeIndex, downloadComposite])

  const handleToggleTracking = useCallback(() => {
    if (scanStatus === "idle") {
      startListening()
    } else {
      stopListening()
    }
  }, [scanStatus, startListening, stopListening])

  const isTrackable = currentQrId !== null
  const activeTheme = aiThemes?.[selectedThemeIndex] ?? null

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <header className="text-center mb-10 lg:mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <QrCode className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Particle QR Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
            Create beautiful, animated QR codes with AI-generated backgrounds and interactive particle effects
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold text-foreground">Preview</CardTitle>
                    {scanCount > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {scanCount} scan{scanCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {activeTheme && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: activeTheme.foreground }}
                        />
                        {activeTheme.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {qrMatrix && (
                      <>
                        {isTrackable && (
                          <Button
                            variant={scanStatus !== "idle" ? "default" : "outline"}
                            size="sm"
                            onClick={handleToggleTracking}
                            className={scanStatus !== "idle" ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {scanStatus !== "idle" ? (
                              <>
                                <Radio className="h-4 w-4 mr-1.5 animate-pulse" />
                                Tracking
                              </>
                            ) : (
                              <>
                                <CircleOff className="h-4 w-4 mr-1.5" />
                                Track Scans
                              </>
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleReplay}>
                          <RefreshCw className="h-4 w-4 mr-1.5" />
                          Replay
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-1.5" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {isTrackable && currentTargetUrl && (
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="text-xs text-muted-foreground min-w-0 flex-1">
                      <span>Instance: </span>
                      <code className="font-mono text-foreground/70 bg-muted px-1 py-0.5 rounded">
                        {currentInstanceId}
                      </code>
                      <span className="mx-1.5">→</span>
                      <span className="font-mono text-foreground/70 truncate">{currentTargetUrl}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewInstance}
                      disabled={isGenerating}
                      className="shrink-0 text-xs h-7"
                    >
                      <Fingerprint className="h-3.5 w-3.5 mr-1" />
                      New Instance
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {activeTheme?.backgroundUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={activeTheme.backgroundUrl}
                      alt={activeTheme.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      aria-hidden="true"
                    />
                    <div className="relative">
                      <QRParticleCanvas
                        ref={canvasRef}
                        qrMatrix={qrMatrix}
                        particleSize={particleSize}
                        particleColor={particleColor}
                        mouseRadius={mouseRadius}
                        repulsionStrength={repulsionStrength}
                        returnSpeed={returnSpeed}
                        animationSpeed={animationSpeed}
                        scanStatus={scanStatus}
                        transparent={true}
                      />
                    </div>
                  </div>
                ) : (
                  <QRParticleCanvas
                    ref={canvasRef}
                    qrMatrix={qrMatrix}
                    particleSize={particleSize}
                    particleColor={particleColor}
                    mouseRadius={mouseRadius}
                    repulsionStrength={repulsionStrength}
                    returnSpeed={returnSpeed}
                    animationSpeed={animationSpeed}
                    scanStatus={scanStatus}
                    transparent={false}
                  />
                )}
              </CardContent>
            </Card>

            {qrMatrix && (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="pt-5">
                  {isGeneratingTheme ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm font-medium">AI is designing your backgrounds…</p>
                      <p className="text-xs text-muted-foreground/70">Generating color themes &amp; images</p>
                    </div>
                  ) : themeError ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <p className="text-sm text-destructive">{themeError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAIBackgrounds}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  ) : aiThemes ? (
                    <QRVersionPicker
                      themes={aiThemes}
                      qrMatrix={qrMatrix}
                      particleSize={particleSize}
                      selectedIndex={selectedThemeIndex}
                      onSelect={handleThemeSelect}
                      onDownload={downloadComposite}
                      onRegenerate={handleGenerateAIBackgrounds}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-sm font-medium text-foreground">Want AI-styled versions?</p>
                        <p className="text-xs text-muted-foreground">Generate 2 unique AI backgrounds for your QR</p>
                      </div>
                      <Button
                        onClick={handleGenerateAIBackgrounds}
                        className="gap-2"
                        disabled={!lastQrPayload}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate AI Backgrounds
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-border/50 shadow-sm">
            <Tabs defaultValue="content" className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="style" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Style
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="content" className="mt-0">
                  <QRCodeInput onGenerate={handleGenerate} isGenerating={isGenerating} />
                </TabsContent>
                <TabsContent value="style" className="mt-0">
                  <QRControls
                    particleSize={particleSize}
                    setParticleSize={setParticleSize}
                    particleColor={particleColor}
                    setParticleColor={setParticleColor}
                    mouseRadius={mouseRadius}
                    setMouseRadius={setMouseRadius}
                    repulsionStrength={repulsionStrength}
                    setRepulsionStrength={setRepulsionStrength}
                    returnSpeed={returnSpeed}
                    setReturnSpeed={setReturnSpeed}
                    animationSpeed={animationSpeed}
                    setAnimationSpeed={setAnimationSpeed}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <footer className="text-center mt-12 text-sm text-muted-foreground space-y-2">
          <p>Hover over the QR code to interact with the particles</p>
          <p className="text-xs">
            Optionally generate 3 styled versions with AI backgrounds — select one and download as a merged image
          </p>
          <p className="text-xs pt-1">
            AI themes &amp; backgrounds powered by{" "}
            <a
              href="https://pollinations.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              pollinations.ai
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
