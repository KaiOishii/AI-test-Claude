'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@/lib/types'

interface Props {
  user: User
  children: React.ReactNode
}

const NAV = [
  { href: '/dashboard', label: 'ホーム',       icon: '⊞' },
  { href: '/projects',  label: 'プロジェクト', icon: '□' },
  { href: '/today',     label: '今日のタスク', icon: '◈' },
]

export default function AppShell({ user, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-gray-900">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="font-semibold">WBS管理</span>
        <button onClick={() => setMenuOpen(v => !v)} className="text-gray-500 text-xl">☰</button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-56 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0
      `}>
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-semibold text-base">WBS管理</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user.name}</p>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
            return (
              <Link key={n.href} href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="w-4 text-center">{n.icon}</span>
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={logout} className="text-sm text-gray-400 hover:text-black transition-colors">
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  )
}
