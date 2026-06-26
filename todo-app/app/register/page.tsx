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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-8 text-center tracking-tight">新規登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-center border border-black px-4 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm mb-1">お名前</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="山田 太郎"
            />
          </div>
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
              minLength={8}
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="8文字以上"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'アカウントを作成'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-black underline underline-offset-2">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
