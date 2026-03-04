"use client"

import dynamic from "next/dynamic"

const QRCodeGenerator = dynamic(
  () => import("@/components/qr-code-generator"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    ),
  }
)

export default function Page() {
  return <QRCodeGenerator />
}
