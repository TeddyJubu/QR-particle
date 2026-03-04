"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Link, Type, Wifi, Mail, Phone, MessageSquare, User, Sparkles } from "lucide-react"
import type { QRType, WifiData, VCardData, EmailData, SMSData } from "@/lib/qr-utils"

interface QRCodeInputProps {
  onGenerate: (type: QRType, data: string | WifiData | VCardData | EmailData | SMSData) => void
  isGenerating: boolean
}

export function QRCodeInput({ onGenerate, isGenerating }: QRCodeInputProps) {
  const [qrType, setQrType] = useState<QRType>("url")
  const [urlValue, setUrlValue] = useState("https://")
  const [textValue, setTextValue] = useState("")
  const [wifiData, setWifiData] = useState<WifiData>({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  })
  const [emailData, setEmailData] = useState<EmailData>({
    email: "",
    subject: "",
    body: "",
  })
  const [phoneValue, setPhoneValue] = useState("")
  const [smsData, setSmsData] = useState<SMSData>({
    phone: "",
    message: "",
  })
  const [vcardData, setVcardData] = useState<VCardData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    organization: "",
    title: "",
    website: "",
  })

  const handleGenerate = () => {
    switch (qrType) {
      case "url":
        if (urlValue && urlValue !== "https://") onGenerate("url", urlValue)
        break
      case "text":
        if (textValue) onGenerate("text", textValue)
        break
      case "wifi":
        if (wifiData.ssid) onGenerate("wifi", wifiData)
        break
      case "email":
        if (emailData.email) onGenerate("email", emailData)
        break
      case "phone":
        if (phoneValue) onGenerate("phone", phoneValue)
        break
      case "sms":
        if (smsData.phone) onGenerate("sms", smsData)
        break
      case "vcard":
        if (vcardData.firstName || vcardData.lastName) onGenerate("vcard", vcardData)
        break
    }
  }

  const qrTypes = [
    { value: "url", label: "URL", icon: Link },
    { value: "text", label: "Text", icon: Type },
    { value: "wifi", label: "WiFi", icon: Wifi },
    { value: "email", label: "Email", icon: Mail },
    { value: "phone", label: "Phone", icon: Phone },
    { value: "sms", label: "SMS", icon: MessageSquare },
    { value: "vcard", label: "Contact", icon: User },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">QR Code Type</Label>
        <Select value={qrType} onValueChange={(v) => setQrType(v as QRType)}>
          <SelectTrigger className="w-full bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {qrTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {qrType === "url" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Website URL</Label>
            <Input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com"
              className="bg-background border-border"
            />
          </div>
        )}

        {qrType === "text" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Your Text</Label>
            <Textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter your text here..."
              rows={4}
              className="bg-background border-border resize-none"
            />
          </div>
        )}

        {qrType === "wifi" && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Network Name (SSID)</Label>
              <Input
                value={wifiData.ssid}
                onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                placeholder="My WiFi Network"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={wifiData.password}
                onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                placeholder="Enter password"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Encryption</Label>
              <Select
                value={wifiData.encryption}
                onValueChange={(v) => setWifiData({ ...wifiData, encryption: v as WifiData["encryption"] })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Hidden Network</Label>
              <Switch checked={wifiData.hidden} onCheckedChange={(v) => setWifiData({ ...wifiData, hidden: v })} />
            </div>
          </>
        )}

        {qrType === "email" && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="hello@example.com"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Subject (optional)</Label>
              <Input
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Body (optional)</Label>
              <Textarea
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                placeholder="Email body..."
                rows={3}
                className="bg-background border-border resize-none"
              />
            </div>
          </>
        )}

        {qrType === "phone" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Phone Number</Label>
            <Input
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              placeholder="+1 234 567 8900"
              className="bg-background border-border"
            />
          </div>
        )}

        {qrType === "sms" && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Phone Number</Label>
              <Input
                type="tel"
                value={smsData.phone}
                onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Message (optional)</Label>
              <Textarea
                value={smsData.message}
                onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                placeholder="Pre-filled message..."
                rows={3}
                className="bg-background border-border resize-none"
              />
            </div>
          </>
        )}

        {qrType === "vcard" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">First Name</Label>
                <Input
                  value={vcardData.firstName}
                  onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Last Name</Label>
                <Input
                  value={vcardData.lastName}
                  onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                value={vcardData.phone}
                onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={vcardData.email}
                onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Organization</Label>
              <Input
                value={vcardData.organization}
                onChange={(e) => setVcardData({ ...vcardData, organization: e.target.value })}
                placeholder="Company Name"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Website</Label>
              <Input
                value={vcardData.website}
                onChange={(e) => setVcardData({ ...vcardData, website: e.target.value })}
                placeholder="https://example.com"
                className="bg-background border-border"
              />
            </div>
          </>
        )}
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
        <Sparkles className="h-4 w-4 mr-2" />
        {isGenerating ? "Generating..." : "Generate QR Code"}
      </Button>
    </div>
  )
}
