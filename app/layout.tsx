import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'タスク管理',
  description: 'ToDo リストと WBS 管理を一つにまとめたアプリ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'タスク管理',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-black antialiased">
        {children}
      </body>
    </html>
  )
}
