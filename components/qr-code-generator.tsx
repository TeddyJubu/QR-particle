"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCodeInput } from "@/components/qr-code-input"
import { QRParticleCanvas } from "@/components/qr-particle-canvas"
import { QRControls } from "@/components/qr-controls"
import { generateQRMatrix, formatQRData, type QRType, type WifiData, type VCardData, type EmailData, type SMSData } from "@/lib/qr-utils"
import { useQRScanDetection } from "@/hooks/use-qr-scan-detection"
import { Download, QrCode, Settings2, RefreshCw, Radio, CircleOff, Fingerprint } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function QRCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrMatrix, setQrMatrix] = useState<boolean[][] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQrId, setCurrentQrId] = useState<string | null>(null)
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null)
  const [currentTargetUrl, setCurrentTargetUrl] = useState<string | null>(null)

  // Particle controls
  const [particleSize, setParticleSize] = useState(8)
  const [particleColor, setParticleColor] = useState("#0f172a")
  const [mouseRadius, setMouseRadius] = useState(80)
  const [repulsionStrength, setRepulsionStrength] = useState(8)
  const [returnSpeed, setReturnSpeed] = useState(0.8)
  const [animationSpeed, setAnimationSpeed] = useState(1.5)

  // Scan detection - now uses instance_id for unique tracking
  const { status: scanStatus, scanCount, startListening, stopListening } = useQRScanDetection(currentInstanceId)

  const generateUniqueQR = useCallback(async (type: QRType, data: string | WifiData | VCardData | EmailData | SMSData, isNewInstance = false) => {
    setIsGenerating(true)
    stopListening() // Stop any existing listener
    
    try {
      const formattedData = formatQRData(type, data)
      
      // For URL type, create a trackable redirect URL with unique instance
      let qrData = formattedData
      let newQrId: string | null = currentQrId
      let newInstanceId: string | null = null
      let targetUrl: string | null = null
      
      if (type === "url" && typeof data === "string") {
        // Generate a unique QR ID only for new generations (not new instances)
        if (!isNewInstance || !currentQrId) {
          newQrId = crypto.randomUUID()
        }
        // Always generate a unique instance ID
        newInstanceId = crypto.randomUUID().slice(0, 8) // Short instance ID
        targetUrl = data

        try {
          // Store the instance in Supabase
          const supabase = createClient()
          const { error } = await supabase.from("qr_instances").insert({
            qr_id: newQrId,
            instance_id: newInstanceId,
            target_url: targetUrl,
          })

          if (error) {
            throw error
          }

          // Create trackable URL with instance ID
          const origin = typeof window !== "undefined" ? window.location.origin : ""
          qrData = `${origin}/api/qr/${newInstanceId}?url=${encodeURIComponent(data)}`
        } catch (error) {
          console.warn("Failed to create trackable redirect URL, generating QR with direct URL instead:", error)
          qrData = formattedData
          newQrId = null
          newInstanceId = null
          targetUrl = null
        }
      }
      
      const matrix = await generateQRMatrix(qrData)
      setQrMatrix(null) // Reset to trigger re-animation
      setCurrentQrId(newQrId)
      setCurrentInstanceId(newInstanceId)
      setCurrentTargetUrl(targetUrl)
      setTimeout(() => setQrMatrix(matrix), 50)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [stopListening, currentQrId])

  const handleGenerate = useCallback(async (type: QRType, data: string | WifiData | VCardData | EmailData | SMSData) => {
    await generateUniqueQR(type, data, false)
  }, [generateUniqueQR])

  const handleNewInstance = useCallback(async () => {
    if (currentTargetUrl) {
      await generateUniqueQR("url", currentTargetUrl, true)
    }
  }, [generateUniqueQR, currentTargetUrl])

  const handleReplay = useCallback(() => {
    if (qrMatrix) {
      const currentMatrix = qrMatrix
      setQrMatrix(null)
      setTimeout(() => setQrMatrix(currentMatrix), 50)
    }
  }, [qrMatrix])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    
    const link = document.createElement("a")
    link.download = "qr-code-particles.png"
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
  }, [])

  const handleToggleTracking = useCallback(() => {
    if (scanStatus === "idle") {
      startListening()
    } else {
      stopListening()
    }
  }, [scanStatus, startListening, stopListening])

  const isTrackable = currentQrId !== null

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
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
            Create beautiful, animated QR codes with interactive particle effects and real-time scan detection
          </p>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          {/* Left Panel - QR Display */}
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
                    <code className="font-mono text-foreground/70 bg-muted px-1 py-0.5 rounded">{currentInstanceId}</code>
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
              />
            </CardContent>
          </Card>

          {/* Right Panel - Controls */}
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

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-muted-foreground space-y-1">
          <p>Hover over the QR code to see the particle interaction effect</p>
          <p className="text-xs">URL QR codes support real-time scan detection - click "Track Scans" to enable</p>
        </footer>
      </div>
    </main>
  )
}
