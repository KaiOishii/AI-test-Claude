import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">タスク管理</h1>
      <p className="text-sm text-gray-400 mb-10">使いたいアプリを選んでください</p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/todos"
          className="flex-1 border border-black px-6 py-8 text-center hover:bg-black hover:text-white transition-colors group"
        >
          <div className="text-3xl mb-3">☑</div>
          <div className="font-semibold text-lg mb-1">ToDo リスト</div>
          <div className="text-xs text-gray-400 group-hover:text-gray-300">
            日々のタスクをシンプルに管理
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 border border-black px-6 py-8 text-center hover:bg-black hover:text-white transition-colors group"
        >
          <div className="text-3xl mb-3">□</div>
          <div className="font-semibold text-lg mb-1">WBS 管理</div>
          <div className="text-xs text-gray-400 group-hover:text-gray-300">
            プロジェクト・工数・進捗を管理
          </div>
        </Link>
      </div>
    </div>
  )
}
