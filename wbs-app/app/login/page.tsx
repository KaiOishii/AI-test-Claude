'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? 'ログインに失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">WBS管理</h1>
        <p className="text-sm text-gray-500 mb-8">ログイン</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 text-sm hover:opacity-80 disabled:opacity-50 transition-opacity">
            {loading ? '...' : 'ログイン'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="underline text-black">新規登録</Link>
        </p>
      </div>
    </div>
  )
}
