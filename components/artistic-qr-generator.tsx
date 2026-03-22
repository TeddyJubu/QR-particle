"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { generateQRMatrixHighEC } from "@/lib/qr-utils"
import {
  renderArtisticQR,
  ALL_STYLE_IDS,
  getStyleConfig,
  type ArtStyleId,
} from "@/lib/qr-art-renderer"
import {
  Download,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Cpu,
  Map,
  Mountain,
  Brain,
  Cog,
  Leaf,
  ScanLine,
  CheckCircle2,
  Star,
} from "lucide-react"
import Link from "next/link"

interface StylePreset {
  id: ArtStyleId
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "circuit-board",
    name: "Circuit Board",
    description: "PCB traces with electronic glow",
    icon: <Cpu className="h-5 w-5" />,
    color: "from-blue-600 to-cyan-500",
  },
  {
    id: "city-grid",
    name: "City Grid",
    description: "Urban blocks and lit streets",
    icon: <Map className="h-5 w-5" />,
    color: "from-emerald-600 to-teal-500",
  },
  {
    id: "topographic",
    name: "Topographic",
    description: "Warm contour map terrain",
    icon: <Mountain className="h-5 w-5" />,
    color: "from-amber-600 to-yellow-500",
  },
  {
    id: "neural-network",
    name: "Neural Network",
    description: "Glowing nodes and synaptic links",
    icon: <Brain className="h-5 w-5" />,
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "mechanical",
    name: "Mechanical",
    description: "Brass gears and clockwork cogs",
    icon: <Cog className="h-5 w-5" />,
    color: "from-orange-600 to-red-500",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Microscopic cell tissue",
    icon: <Leaf className="h-5 w-5" />,
    color: "from-rose-600 to-fuchsia-500",
  },
  {
    id: "galactic-stars",
    name: "Galactic Stars",
    description: "Glowing stars in deep space",
    icon: <Star className="h-5 w-5" />,
    color: "from-slate-900 to-blue-900",
  },
]

export default function ArtisticQRGenerator() {
  const [url, setUrl] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<ArtStyleId>("circuit-board")
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999))
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [hasGenerated, setHasGenerated] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const doRender = useCallback(
    async (targetUrl: string, style: ArtStyleId, renderSeed: number) => {
      if (!canvasRef.current || !targetUrl.trim()) return

      try {
        const { matrix } = await generateQRMatrixHighEC(targetUrl.trim())
        renderArtisticQR(canvasRef.current, matrix, style, renderSeed, 800)
        setHasGenerated(true)
        setCurrentUrl(targetUrl.trim())
      } catch (err) {
        console.error("Failed to generate QR:", err)
      }
    },
    [],
  )

  const handleGenerate = useCallback(() => {
    if (!url.trim()) return
    doRender(url, selectedStyle, seed)
  }, [url, selectedStyle, seed, doRender])

  const handleRegenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 99999)
    setSeed(newSeed)
    if (currentUrl) {
      doRender(currentUrl, selectedStyle, newSeed)
    }
  }, [currentUrl, selectedStyle, doRender])

  // Re-render when style changes (if already generated)
  useEffect(() => {
    if (hasGenerated && currentUrl) {
      doRender(currentUrl, selectedStyle, seed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStyle])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !hasGenerated) return
    const link = document.createElement("a")
    link.download = `qr-art-${selectedStyle}-${seed}.png`
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
  }, [hasGenerated, selectedStyle, seed])

  const activeStyleConfig = getStyleConfig(selectedStyle)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <header className="text-center mb-10 lg:mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <FlaskConical className="h-7 w-7 text-purple-500" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              QR Art Lab
            </h1>
            <Badge variant="outline" className="text-xs font-medium border-green-500/30 text-green-600">
              <ScanLine className="h-3 w-3 mr-1" />
              Scannable
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Generate beautiful artistic QR codes that actually work. Each style produces a fully scannable code with unique visual flair.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Particle QR Generator
          </Link>
        </header>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start max-w-6xl mx-auto">
          {/* Left Column - Controls */}
          <div className="flex flex-col gap-6">
            {/* URL Input */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Content</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="url-input" className="text-sm font-medium">
                    URL or Text
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!url.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Art QR
                </Button>
              </CardContent>
            </Card>

            {/* Style Presets */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Art Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedStyle(preset.id)}
                      className={`relative flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all ${
                        selectedStyle === preset.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/50 hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md bg-gradient-to-br ${preset.color} text-white`}
                      >
                        {preset.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{preset.name}</p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                      {selectedStyle === preset.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-0">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Advanced Settings
                  </CardTitle>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="pt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="seed-input" className="text-sm">
                      Seed (for reproducible results)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="seed-input"
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon" onClick={handleRegenerate} title="Random seed">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="flex flex-col gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Preview</CardTitle>
                  {hasGenerated && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleRegenerate}>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Regenerate
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="relative aspect-square rounded-2xl bg-background border border-border/50 shadow-inner flex items-center justify-center group transition-colors duration-500 overflow-hidden"
                  style={hasGenerated ? { backgroundColor: activeStyleConfig.background } : {}}
                >
                  <div className={`w-full h-full p-3 ${!hasGenerated ? "hidden" : ""}`}>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full rounded-xl"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                  
                  {!hasGenerated && (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="p-3 rounded-xl bg-muted/50">
                        <FlaskConical className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Enter a URL and click Generate
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Creates a scannable artistic QR code instantly
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Confirmation */}
            {hasGenerated && (
              <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-sm min-w-0">
                      <p className="font-medium text-green-700 dark:text-green-400">
                        This QR code is fully scannable
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Generated with maximum error correction (Level H). Point your camera at it or download and share — it will scan correctly.
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1 truncate font-mono">{currentUrl}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="border-purple-500/20 bg-purple-500/5 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <FlaskConical className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground/80">About QR Art Lab</p>
                    <p>
                      Unlike traditional QR generators, Art Lab produces codes with unique visual styles
                      while maintaining full scannability. Each style uses shaped modules, color themes,
                      and effects — all built on a real QR data matrix with Level H error correction.
                    </p>
                    <p>
                      Try different styles, regenerate with new seeds, or download and share your creations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="text-center mt-12 text-sm text-muted-foreground space-y-2">
          <p className="text-xs">
            All QR codes generated client-side using canvas rendering &mdash; no external API required
          </p>
        </footer>
      </div>
    </main>
  )
}
