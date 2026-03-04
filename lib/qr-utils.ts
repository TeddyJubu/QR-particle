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
