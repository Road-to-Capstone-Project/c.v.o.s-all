import { getBaseURL } from "@lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import NextTopLoader from "nextjs-toploader"
import "styles/globals.css"
import AuthContext from "./context/AuthContext"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <AuthContext>
      <html lang="en" data-mode="light" className={GeistSans.variable}>
        <body>
          <NextTopLoader showSpinner={false} />
          <main className="relative">{props.children}</main>
          <Toaster className="z-[99999]" position="bottom-left" />
          <Analytics />
        </body>
      </html>
    </AuthContext>
  )
}
