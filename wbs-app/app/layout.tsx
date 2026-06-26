import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WBS管理',
  description: 'プロジェクト・タスク・工数・進捗を管理するWBSアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
