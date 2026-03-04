"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { QRCodeInput } from "@/components/qr-code-input"
import { QRParticleCanvas } from "@/components/qr-particle-canvas"
import { QRControls } from "@/components/qr-controls"
import { generateQRMatrix, formatQRData, type QRType, type WifiData, type VCardData, type EmailData, type SMSData } from "@/lib/qr-utils"
import { Download, QrCode, Settings2, RefreshCw } from "lucide-react"

export default function QRCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrMatrix, setQrMatrix] = useState<boolean[][] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Particle controls
  const [particleSize, setParticleSize] = useState(8)
  const [particleColor, setParticleColor] = useState("#0f172a")
  const [mouseRadius, setMouseRadius] = useState(80)
  const [repulsionStrength, setRepulsionStrength] = useState(8)
  const [returnSpeed, setReturnSpeed] = useState(0.8)
  const [animationSpeed, setAnimationSpeed] = useState(1.5)

  const handleGenerate = useCallback(async (type: QRType, data: string | WifiData | VCardData | EmailData | SMSData) => {
    setIsGenerating(true)
    try {
      const formattedData = formatQRData(type, data)
      const matrix = await generateQRMatrix(formattedData)
      setQrMatrix(null) // Reset to trigger re-animation
      setTimeout(() => setQrMatrix(matrix), 50)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [])

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
            Create beautiful, animated QR codes with interactive particle effects
          </p>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          {/* Left Panel - QR Display */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">Preview</CardTitle>
                <div className="flex gap-2">
                  {qrMatrix && (
                    <>
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
        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Hover over the QR code to see the particle interaction effect</p>
        </footer>
      </div>
    </main>
  )
}
