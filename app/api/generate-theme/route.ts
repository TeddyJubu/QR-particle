import { NextResponse } from "next/server"

export interface AITheme {
  name: string
  foreground: string
  imagePrompt: string
  backgroundUrl: string | null
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

Theme mood guidelines (generate exactly 2 themes):
- Theme 1: Vibrant & bold (e.g. rich colors, dramatic lighting — strong contrast)
- Theme 2: Artistic & unique (e.g. painterly, abstract, unexpected — surprising but beautiful)

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

    const pureTheme: AITheme = {
      name: "Pure QR",
      foreground: "#0f172a",
      imagePrompt: "",
      backgroundUrl: null,
      seed: 0,
    }

    const aiThemes: AITheme[] = parsed.themes.slice(0, 2).map((theme) => {
      const seed =
        typeof theme.seed === "number" && theme.seed > 0
          ? theme.seed
          : Math.floor(Math.random() * 99999)

      const imagePrompt =
        theme.imagePrompt || "abstract colorful artistic background"
      const foreground = /^#[0-9a-fA-F]{6}$/.test(theme.foreground)
        ? theme.foreground
        : "#ffffff"

      const backgroundUrl = `/api/bg-image?prompt=${encodeURIComponent(imagePrompt)}&seed=${seed}`

      return {
        name: theme.name || `Theme ${Math.random()}`,
        foreground,
        imagePrompt,
        backgroundUrl,
        seed,
      }
    })

    while (aiThemes.length < 2) {
      const seed = Math.floor(Math.random() * 99999)
      aiThemes.push({
        name: `Theme ${aiThemes.length + 2}`,
        foreground: "#ffffff",
        imagePrompt: "abstract gradient fluid art, pastel tones",
        backgroundUrl: `/api/bg-image?prompt=${encodeURIComponent("abstract gradient fluid art, pastel tones")}&seed=${seed}`,
        seed,
      })
    }

    const themes = [pureTheme, ...aiThemes]

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Error in generate-theme route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
