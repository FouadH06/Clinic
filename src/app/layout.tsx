import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teissir – Dental Clinic Inventory',
  description: 'Fast POS-style dental clinic inventory management. Track stock, log usage, and get low-stock alerts in real time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
