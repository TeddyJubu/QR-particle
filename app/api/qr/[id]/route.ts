import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Extract the target URL - everything after "url=" to preserve query params
  const fullUrl = request.url
  const urlParamIndex = fullUrl.indexOf("url=")
  
  if (urlParamIndex === -1) {
    return NextResponse.json({ error: "Missing target URL" }, { status: 400 })
  }
  
  // Get everything after "url=" and decode it
  const encodedUrl = fullUrl.substring(urlParamIndex + 4)
  const targetUrl = decodeURIComponent(encodedUrl)
  
  // Validate it's a proper URL
  try {
    new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 })
  }

  // Get user agent and IP for analytics
  const userAgent = request.headers.get("user-agent") || "unknown"
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown"

  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    
    // The id is now the instance_id
    const instanceId = id
    
    // Mark the instance as scanned
    await supabase.from("qr_instances").update({
      scanned: true,
      scanned_at: new Date().toISOString(),
    }).eq("instance_id", instanceId)
    
    // Also log to qr_scans for detailed analytics
    const { error } = await supabase.from("qr_scans").insert({
      qr_id: instanceId, // Use instance_id for realtime subscription matching
      target_url: targetUrl,
      user_agent: userAgent,
      ip_address: ipAddress,
    })
    
    if (error) {
      console.error("Failed to log scan:", error)
    }
  } catch (error) {
    console.error("Failed to log scan:", error)
    // Continue with redirect even if logging fails
  }

  // Redirect to the target URL
  return NextResponse.redirect(targetUrl)
}
