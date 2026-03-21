# Particle QR Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Built with Pollinations](https://img.shields.io/badge/Built%20with-Pollinations-8a2be2?style=for-the-badge&logo=data:image/png;base64,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&logoColor=white&labelColor=6a0dad)](https://pollinations.ai)

A Next.js web application that generates QR codes rendered as interactive, physics-based particle systems. Particles animate from random positions into formation, react to mouse movement with repulsion physics, and return smoothly to their rest positions. URL-type QR codes support real-time scan detection via Supabase Realtime. AI-generated color themes and backgrounds are powered by [pollinations.ai](https://pollinations.ai).

## Features

- **Animated particle QR codes** — particles assemble from scattered positions using an eased entrance animation with a wave delay effect.
- **Interactive physics** — hover over the canvas to repel particles; they spring back to their base positions using a damped velocity model.
- **Seven QR content types** — URL, plain text, WiFi credentials, email (with subject and body), phone number, SMS, and vCard contact.
- **Real-time scan detection** — URL QR codes embed a unique instance ID and a redirect endpoint. Enabling "Track Scans" opens a Supabase Realtime subscription so the UI updates instantly when the code is scanned.
- **New Instance** — generate a fresh tracking ID for the same URL without changing the destination, useful for measuring distinct distribution channels.
- **Customisable style** — sliders control particle size, color, mouse interaction radius, repulsion strength, return speed, and animation speed.
- **PNG download** — export the current canvas state at full resolution.
- **AI-generated themes** — after each QR code is generated, [pollinations.ai](https://pollinations.ai) produces 3 color/background combinations; select one and download a composited PNG.
- **Dark/light theme** — inherits the system preference via `next-themes`.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| QR generation | [qrcode](https://github.com/soldair/node-qrcode) |
| Database / Realtime | [Supabase](https://supabase.com) |
| AI (themes & images) | [pollinations.ai](https://pollinations.ai) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| Fonts | Geist, Geist Mono |

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [pnpm](https://pnpm.io) (recommended) — or npm / yarn
- A [Supabase](https://supabase.com) project (required for URL-type QR codes and scan tracking; non-URL QR types still work without it)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/TeddyJubu/v0-QR-particle.git
cd v0-QR-particle
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Optional — improves AI theme/image generation rate limits (https://pollinations.ai)
POLLINATIONS_API_KEY=<your-pollinations-key>
```

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. Do **not** expose it as a `NEXT_PUBLIC_*` variable.
>
> **Supabase requirement details:**
> - **URL-type QR code generation** (stored `qr_instances` + redirect URL creation) requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
> - **Scan logging via** `/api/qr/[id]` requires `SUPABASE_SERVICE_ROLE_KEY`.
> - **Non-URL QR types** (Text, WiFi, Email, Phone, SMS, Contact) work without Supabase.
>
> If you need a URL QR without Supabase, use the **Text** type and paste the URL there (this skips redirect-based tracking).

### 3. Set up the database (required for URL-type QR codes and scan tracking)

Run the SQL migration scripts in order from the [`scripts/`](scripts/) directory against your Supabase project:

```bash
# In the Supabase SQL editor or via the CLI:
scripts/001_create_qr_scans.sql
scripts/002_enable_realtime.sql
scripts/003_create_qr_instances.sql
```

These scripts create the `qr_scans` and `qr_instances` tables, configure Row Level Security policies, and enable Supabase Realtime on both tables.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select a QR content type** from the *Content* tab (URL, Text, WiFi, Email, Phone, SMS, or Contact).
2. **Fill in the required fields** and click **Generate QR Code**.
3. **Hover** over the canvas to interact with the particle simulation.
4. Use the **Style** tab to adjust particle appearance and physics parameters.
5. Click **Replay** to restart the entrance animation, or **Download** to save the QR code as a PNG.
6. For URL codes, click **Track Scans** to start a real-time listener. The badge in the header updates each time the code is scanned. Use **New Instance** to issue a fresh tracking ID for the same destination URL.

## Project Structure

```
.
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout and metadata
│   └── page.tsx             # Entry point (lazy-loads QRCodeGenerator)
├── components/
│   ├── qr-code-generator.tsx  # Main application component
│   ├── qr-particle-canvas.tsx # Canvas renderer and particle physics
│   ├── qr-code-input.tsx      # Content-type form
│   ├── qr-controls.tsx        # Style/physics sliders
│   └── ...                    # shadcn/ui wrappers
├── hooks/
│   ├── use-qr-scan-detection.ts  # Supabase Realtime subscription
│   └── ...
├── lib/
│   ├── qr-utils.ts          # QR matrix generation and data formatting
│   ├── noise.ts             # Noise utilities
│   └── utils.ts             # Shared helpers
└── scripts/
    ├── 001_create_qr_scans.sql
    ├── 002_enable_realtime.sql
    └── 003_create_qr_instances.sql
```

## Contributing

Contributions are welcome. Please open an issue to discuss your idea before submitting a pull request.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Commit your changes: `git commit -m "feat: add your feature"`.
4. Push the branch: `git push origin feat/your-feature`.
5. Open a pull request against `main`.

## License

This project is licensed under the [MIT License](LICENSE).
