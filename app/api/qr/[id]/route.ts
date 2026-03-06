import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const targetUrl = searchParams.get("url")

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing target URL" }, { status: 400 })
  }

  // Get user agent and IP for analytics
  const userAgent = request.headers.get("user-agent") || "unknown"
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown"

  try {
    const supabase = await createClient()
    
    console.log("[v0] Logging scan for qr_id:", id, "target:", targetUrl)
    
    // Log the scan
    const { data, error } = await supabase.from("qr_scans").insert({
      qr_id: id,
      target_url: targetUrl,
      user_agent: userAgent,
      ip_address: ipAddress,
    }).select()
    
    if (error) {
      console.error("[v0] Supabase insert error:", error)
    } else {
      console.log("[v0] Scan logged successfully:", data)
    }
  } catch (error) {
    console.error("[v0] Failed to log scan:", error)
    // Continue with redirect even if logging fails
  }

  // Redirect to the target URL
  return NextResponse.redirect(targetUrl)
}
