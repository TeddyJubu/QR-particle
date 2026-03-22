import QRCode from "qrcode"

export type QRType = "url" | "text" | "wifi" | "email" | "phone" | "sms" | "vcard"

export interface WifiData {
  ssid: string
  password: string
  encryption: "WPA" | "WEP" | "nopass"
  hidden: boolean
}

export interface VCardData {
  firstName: string
  lastName: string
  phone: string
  email: string
  organization: string
  title: string
  website: string
}

export interface EmailData {
  email: string
  subject: string
  body: string
}

export interface SMSData {
  phone: string
  message: string
}

export function formatQRData(type: QRType, data: string | WifiData | VCardData | EmailData | SMSData): string {
  switch (type) {
    case "url":
    case "text":
      return data as string

    case "wifi": {
      const wifi = data as WifiData
      const hidden = wifi.hidden ? "H:true;" : ""
      return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};${hidden};`
    }

    case "email": {
      const email = data as EmailData
      const params = []
      if (email.subject) params.push(`subject=${encodeURIComponent(email.subject)}`)
      if (email.body) params.push(`body=${encodeURIComponent(email.body)}`)
      return `mailto:${email.email}${params.length ? "?" + params.join("&") : ""}`
    }

    case "phone":
      return `tel:${data as string}`

    case "sms": {
      const sms = data as SMSData
      return `sms:${sms.phone}${sms.message ? `?body=${encodeURIComponent(sms.message)}` : ""}`
    }

    case "vcard": {
      const vc = data as VCardData
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${vc.lastName};${vc.firstName};;;`,
        `FN:${vc.firstName} ${vc.lastName}`,
        vc.organization ? `ORG:${vc.organization}` : "",
        vc.title ? `TITLE:${vc.title}` : "",
        vc.phone ? `TEL:${vc.phone}` : "",
        vc.email ? `EMAIL:${vc.email}` : "",
        vc.website ? `URL:${vc.website}` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n")
    }

    default:
      return data as string
  }
}

export async function generateQRMatrix(content: string): Promise<boolean[][]> {
  const qrData = await QRCode.create(content, {
    errorCorrectionLevel: "M",
  })

  const size = qrData.modules.size
  const modules = qrData.modules.data

  const matrix: boolean[][] = []
  for (let y = 0; y < size; y++) {
    const row: boolean[] = []
    for (let x = 0; x < size; x++) {
      row.push(modules[y * size + x] === 1)
    }
    matrix.push(row)
  }

  return matrix
}

export async function generateQRDataURL(content: string, size = 400): Promise<string> {
  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  })
}

/**
 * Generate a QR matrix with the highest error correction level (H = 30% recovery).
 * This allows up to 30% of the code to be obscured by artistic styling while remaining scannable.
 */
export async function generateQRMatrixHighEC(content: string): Promise<{ matrix: boolean[][]; size: number }> {
  const qrData = await QRCode.create(content, {
    errorCorrectionLevel: "H",
  })

  const size = qrData.modules.size
  const modules = qrData.modules.data

  const matrix: boolean[][] = []
  for (let y = 0; y < size; y++) {
    const row: boolean[] = []
    for (let x = 0; x < size; x++) {
      row.push(modules[y * size + x] === 1)
    }
    matrix.push(row)
  }

  return { matrix, size }
}

/**
 * Returns the bounding boxes of the 3 finder patterns (7x7 squares in the corners)
 * and their inner/outer rings, plus the timing pattern coordinates.
 * Renderers should draw these with maximum contrast to guarantee scannability.
 */
export function getFinderPatternRegions(matrixSize: number) {
  const finderSize = 7

  const finders = [
    { x: 0, y: 0 },                                    // top-left
    { x: matrixSize - finderSize, y: 0 },               // top-right
    { x: 0, y: matrixSize - finderSize },                // bottom-left
  ]

  return {
    finders,
    finderSize,
    isFinderModule: (col: number, row: number): boolean => {
      for (const f of finders) {
        if (col >= f.x && col < f.x + finderSize && row >= f.y && row < f.y + finderSize) {
          return true
        }
      }
      // Also include the separator (1-module white border around each finder)
      // Top-left separator
      if ((col === finderSize && row <= finderSize) || (row === finderSize && col <= finderSize)) return true
      // Top-right separator
      if ((col === matrixSize - finderSize - 1 && row <= finderSize) || (row === finderSize && col >= matrixSize - finderSize - 1)) return true
      // Bottom-left separator
      if ((col === finderSize && row >= matrixSize - finderSize - 1) || (row === matrixSize - finderSize - 1 && col <= finderSize)) return true

      return false
    },
    isTimingPattern: (col: number, row: number): boolean => {
      // Timing patterns run along row 6 and column 6
      return (row === 6 && col > finderSize && col < matrixSize - finderSize) ||
             (col === 6 && row > finderSize && row < matrixSize - finderSize)
    },
  }
}
