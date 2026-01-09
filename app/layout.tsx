import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ruRU } from '@clerk/localizations'
import './globals.css'

export const metadata: Metadata = {
  title: 'intask — Управление задачами нового уровня',
  description: 'Современная платформа для управления задачами и проектами. Простота, эффективность, результат.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider localization={ruRU}>
      <html lang="ru">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
