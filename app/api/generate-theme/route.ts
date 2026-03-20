import { NextResponse } from "next/server"

export interface AITheme {
  name: string
  foreground: string
  imagePrompt: string
  backgroundUrl: string
  seed: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, type } = body as { content: string; type: string }

    const apiKey = process.env.POLLINATIONS_API_KEY

    const contentPreview =
      typeof content === "string"
        ? content.slice(0, 200)
        : JSON.stringify(content).slice(0, 200)

    const systemPrompt = `You are a visual design expert specializing in QR code aesthetics and color theory. You always return valid JSON only.`

    const userPrompt = `Generate 3 visually distinct color themes for a particle-based QR code visualization.

QR code type: ${type}
QR code content: ${contentPreview}

For each theme:
1. Choose a particle/foreground hex color that will be CLEARLY VISIBLE and SCANNABLE against the generated background
2. Write a vivid, artistic image generation prompt (12-18 words) for the background that is tonally consistent with the particle color
3. Ensure the image has relatively uniform brightness so particles remain scannable across the whole QR code

Theme mood guidelines:
- Theme 1: Elegant & minimal (e.g. soft atmospheric, monochrome — use light particles on dark bg OR dark on light)
- Theme 2: Vibrant & bold (e.g. rich colors, dramatic lighting — strong contrast)
- Theme 3: Artistic & unique (e.g. painterly, abstract, unexpected — surprising but beautiful)

Critical contrast rule:
- If the background image will be dark (night, deep sea, dark forest), use a LIGHT particle color (#ffffff or light hex)
- If the background image will be light (snow, clouds, white marble), use a DARK particle color (#000000 or dark hex)
- Always ensure at least 4.5:1 WCAG AA contrast ratio

Return ONLY this JSON (no markdown, no explanation, no code fences):
{
  "themes": [
    {
      "name": "Theme Name",
      "foreground": "#hexcolor",
      "imagePrompt": "specific artistic description for background image",
      "seed": 12345
    }
  ]
}`

    const response = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: "gemini-fast",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
          seed: -1,
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("Pollinations LLM error:", response.status, errText)
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      )
    }

    const data = await response.json()
    const messageContent = data.choices?.[0]?.message?.content

    if (!messageContent) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      )
    }

    let parsed: {
      themes: Array<{
        name: string
        foreground: string
        imagePrompt: string
        seed: number
      }>
    }

    try {
      parsed = JSON.parse(messageContent)
    } catch {
      // Try to extract JSON object from raw response
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error("Could not parse AI response:", messageContent)
        return NextResponse.json(
          { error: "Invalid AI response format" },
          { status: 500 }
        )
      }
      parsed = JSON.parse(jsonMatch[0])
    }

    if (!parsed.themes || !Array.isArray(parsed.themes)) {
      return NextResponse.json(
        { error: "Invalid theme structure from AI" },
        { status: 500 }
      )
    }

    // Build themes with proxied background image URLs
    const themes: AITheme[] = parsed.themes.slice(0, 3).map((theme) => {
      const seed =
        typeof theme.seed === "number" && theme.seed > 0
          ? theme.seed
          : Math.floor(Math.random() * 99999)

      const imagePrompt =
        theme.imagePrompt || "abstract colorful artistic background"
      const foreground = /^#[0-9a-fA-F]{6}$/.test(theme.foreground)
        ? theme.foreground
        : "#ffffff"

      // Background URL is our own proxy route — no key exposed to client
      const backgroundUrl = `/api/bg-image?prompt=${encodeURIComponent(imagePrompt)}&seed=${seed}`

      return {
        name: theme.name || `Theme ${Math.random()}`,
        foreground,
        imagePrompt,
        backgroundUrl,
        seed,
      }
    })

    // Pad to exactly 3 themes if AI returned fewer
    while (themes.length < 3) {
      const seed = Math.floor(Math.random() * 99999)
      themes.push({
        name: `Theme ${themes.length + 1}`,
        foreground: themes.length === 0 ? "#ffffff" : "#1a1a2e",
        imagePrompt: "abstract gradient fluid art, pastel tones",
        backgroundUrl: `/api/bg-image?prompt=${encodeURIComponent("abstract gradient fluid art, pastel tones")}&seed=${seed}`,
        seed,
      })
    }

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Error in generate-theme route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
