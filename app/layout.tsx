import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AppearanceFromPreferences } from "@/components/providers/appearance-from-preferences"
import { Toaster } from "sonner"
import { APP_COMPANY_NAME, APP_DISPLAY_NAME, OCTAVERTEX_MARKETING_URL } from "@/lib/brand"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata = {
  title: `${APP_DISPLAY_NAME} — OctaVertex Media`,
  description:
    `Project management for OctaVertex Media: internal delivery and client-visible status updates. ${OCTAVERTEX_MARKETING_URL}`,
  keywords:
    "OctaVertex, project management, client portal, kanban, OctaVertex Media",
  applicationName: "Vertex PM",
  appleWebApp: {
    title: "Vertex PM",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://kanban.vertexcrm.in"
  ),
  openGraph: {
    title: APP_DISPLAY_NAME,
    description: `Delivery and client project tracking for ${APP_COMPANY_NAME} engineering teams`,
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://kanban.vertexcrm.in",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppearanceFromPreferences />
            {children}
          </AuthProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              style: {
                borderRadius: "12px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}