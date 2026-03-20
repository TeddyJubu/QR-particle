# Particle QR Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)

A Next.js web application that generates QR codes rendered as interactive, physics-based particle systems. Particles animate from random positions into formation, react to mouse movement with repulsion physics, and return smoothly to their rest positions. URL-type QR codes support real-time scan detection via Supabase Realtime.

## Features

- **Animated particle QR codes** — particles assemble from scattered positions using an eased entrance animation with a wave delay effect.
- **Interactive physics** — hover over the canvas to repel particles; they spring back to their base positions using a damped velocity model.
- **Seven QR content types** — URL, plain text, WiFi credentials, email (with subject and body), phone number, SMS, and vCard contact.
- **Real-time scan detection** — URL QR codes embed a unique instance ID and a redirect endpoint. Enabling "Track Scans" opens a Supabase Realtime subscription so the UI updates instantly when the code is scanned.
- **New Instance** — generate a fresh tracking ID for the same URL without changing the destination, useful for measuring distinct distribution channels.
- **Customisable style** — sliders control particle size, color, mouse interaction radius, repulsion strength, return speed, and animation speed.
- **PNG download** — export the current canvas state at full resolution.
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
```

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. Do **not** expose it as a `NEXT_PUBLIC_*` variable.
>
> **Supabase requirement details:**
> - **URL-type QR code generation** (stored `qr_instances` + redirect URL creation) requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
> - **Scan logging via** `/api/qr/[id]` requires `SUPABASE_SERVICE_ROLE_KEY`.
> - **Non-URL QR types** (Text, WiFi, Email, Phone, SMS, Contact) work without Supabase.
>
> If you need a URL QR without Supabase, use the **Text** type and paste the URL there (this skips redirect-based tracking).

### 3. Set up the database (optional — for scan tracking)

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
