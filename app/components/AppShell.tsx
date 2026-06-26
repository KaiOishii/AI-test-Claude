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
  { href: '/dashboard', label: 'home' },
  { href: '/projects',  label: 'projects' },
  { href: '/today',     label: 'today' },
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f5f4] text-[#111]">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4">
        <span className="text-xs tracking-widest uppercase text-[#999]">wbs</span>
        <button onClick={() => setMenuOpen(v => !v)} className="text-xs text-[#aaa]">menu</button>
      </header>

      {menuOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/10" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-40 bg-[#f5f5f4] flex flex-col px-8 py-8
        transform transition-transform duration-200
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0
      `}>
        <p className="text-xs tracking-widest uppercase text-[#999] mb-8">wbs</p>

        <nav className="flex-1 space-y-1.5">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
            return (
              <Link key={n.href} href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-xs transition-opacity py-0.5 ${active ? 'opacity-100' : 'text-[#aaa] hover:opacity-60'}`}>
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2">
          <p className="text-xs text-[#bbb]">{user.name}</p>
          <button onClick={logout} className="text-xs text-[#bbb] hover:opacity-50 transition-opacity">
            out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  )
}
