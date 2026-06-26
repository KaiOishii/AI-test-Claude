'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/todos')
      router.refresh()
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8">
      <div className="w-full max-w-xs">
        <p className="text-xs text-[#999] tracking-widest uppercase mb-12 text-center">task manager</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-xs text-[#999] text-center">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="name"
            className="w-full bg-transparent border-b border-[#e0e0e0] dark:border-[#333] pb-2 text-sm outline-none focus:border-[#111] dark:focus:border-[#eee] transition-colors placeholder:text-[#ccc] dark:placeholder:text-[#444]"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="email"
            className="w-full bg-transparent border-b border-[#e0e0e0] dark:border-[#333] pb-2 text-sm outline-none focus:border-[#111] dark:focus:border-[#eee] transition-colors placeholder:text-[#ccc] dark:placeholder:text-[#444]"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="password (8+ chars)"
            className="w-full bg-transparent border-b border-[#e0e0e0] dark:border-[#333] pb-2 text-sm outline-none focus:border-[#111] dark:focus:border-[#eee] transition-colors placeholder:text-[#ccc] dark:placeholder:text-[#444]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors disabled:opacity-30 py-2"
          >
            {loading ? '...' : 'create account'}
          </button>
        </form>
        <p className="mt-12 text-center text-xs text-[#bbb]">
          <Link href="/login" className="hover:text-[#111] dark:hover:text-[#eee] transition-colors">sign in</Link>
        </p>
      </div>
    </div>
  )
}
