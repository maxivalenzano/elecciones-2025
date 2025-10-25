import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Elecciones Siete Palmas 2025",
  description: "Sistema de gestión electoral para Siete Palmas - 26 de octubre de 2025",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Suspense>
          <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</main>
        </Suspense>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
