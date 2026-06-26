'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), name: fd.get('name') }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">WBS管理</h1>
        <p className="text-sm text-gray-500 mb-8">新規登録</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">名前</label>
            <input name="name" type="text" required
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input name="password" type="password" required minLength={6}
              className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 text-sm hover:opacity-80 disabled:opacity-50 transition-opacity">
            {loading ? '...' : '登録する'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="underline text-black">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
