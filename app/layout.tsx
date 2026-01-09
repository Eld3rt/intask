import type { Metadata } from 'next'
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
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  )
}
