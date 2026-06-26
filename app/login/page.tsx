'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-8 text-center tracking-tight">ログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-center border border-black px-4 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'ログイン'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="text-black underline underline-offset-2">新規登録</Link>
        </p>
      </div>
    </div>
  )
}
