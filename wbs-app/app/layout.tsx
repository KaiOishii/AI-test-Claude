import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WBS管理',
  description: 'プロジェクト・タスク・工数・進捗を管理するWBSアプリ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WBS管理',
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
      <body>{children}</body>
    </html>
  )
}
