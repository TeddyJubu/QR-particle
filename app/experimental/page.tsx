"use client"

import dynamic from "next/dynamic"

const ArtisticQRGenerator = dynamic(
  () => import("@/components/artistic-qr-generator"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading QR Art Lab...</div>
      </main>
    ),
  }
)

export default function ExperimentalPage() {
  return <ArtisticQRGenerator />
}
