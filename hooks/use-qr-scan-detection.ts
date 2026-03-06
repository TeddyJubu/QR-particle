"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type ScanStatus = "idle" | "waiting" | "scanned"

export function useQRScanDetection(qrId: string | null) {
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [scanCount, setScanCount] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startListening = useCallback(() => {
    if (!qrId) return

    setStatus("waiting")
    
    const supabase = createClient()
    
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to new scans for this QR ID
    channelRef.current = supabase
      .channel(`qr-scans-${qrId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "qr_scans",
          filter: `qr_id=eq.${qrId}`,
        },
        () => {
          setStatus("scanned")
          setScanCount((prev) => prev + 1)
          
          // Reset to waiting after showing success
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            setStatus("waiting")
          }, 3000)
        }
      )
      .subscribe()
  }, [qrId])

  const stopListening = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setStatus("idle")
  }, [])

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return {
    status,
    scanCount,
    startListening,
    stopListening,
  }
}
