"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface QRControlsProps {
  particleSize: number
  setParticleSize: (v: number) => void
  particleColor: string
  setParticleColor: (v: string) => void
  mouseRadius: number
  setMouseRadius: (v: number) => void
  repulsionStrength: number
  setRepulsionStrength: (v: number) => void
  returnSpeed: number
  setReturnSpeed: (v: number) => void
  animationSpeed: number
  setAnimationSpeed: (v: number) => void
}

export function QRControls({
  particleSize,
  setParticleSize,
  particleColor,
  setParticleColor,
  mouseRadius,
  setMouseRadius,
  repulsionStrength,
  setRepulsionStrength,
  returnSpeed,
  setReturnSpeed,
  animationSpeed,
  setAnimationSpeed,
}: QRControlsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Particle Size</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{particleSize}px</span>
        </div>
        <Slider
          value={[particleSize]}
          onValueChange={([v]) => setParticleSize(v)}
          min={4}
          max={16}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Particle Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={particleColor}
            onChange={(e) => setParticleColor(e.target.value)}
            className="w-12 h-10 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={particleColor}
            onChange={(e) => setParticleColor(e.target.value)}
            className="flex-1 bg-background border-border font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Mouse Radius</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{mouseRadius}px</span>
        </div>
        <Slider
          value={[mouseRadius]}
          onValueChange={([v]) => setMouseRadius(v)}
          min={30}
          max={150}
          step={5}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Repulsion Force</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{repulsionStrength.toFixed(1)}</span>
        </div>
        <Slider
          value={[repulsionStrength]}
          onValueChange={([v]) => setRepulsionStrength(v)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Return Speed</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{returnSpeed.toFixed(1)}</span>
        </div>
        <Slider
          value={[returnSpeed]}
          onValueChange={([v]) => setReturnSpeed(v)}
          min={0.1}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Animation Speed</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{animationSpeed.toFixed(1)}x</span>
        </div>
        <Slider
          value={[animationSpeed]}
          onValueChange={([v]) => setAnimationSpeed(v)}
          min={0.5}
          max={3}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  )
}
