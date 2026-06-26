import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ToDo App',
  description: 'シンプルで使いやすいToDoリストアプリ',
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
