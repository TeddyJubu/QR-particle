import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prompt = searchParams.get("prompt")
    const seed = searchParams.get("seed") || String(Math.floor(Math.random() * 99999))

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const apiKey = process.env.POLLINATIONS_API_KEY

    const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(
      prompt
    )}?model=zimage&width=512&height=512&seed=${seed}`

    const response = await fetch(imageUrl, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // Allow up to 30 seconds for image generation
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error("Pollinations image error:", response.status, await response.text())
      return NextResponse.json(
        { error: "Failed to generate background image" },
        { status: 502 }
      )
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour — same prompt+seed always yields same image
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error in bg-image route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
