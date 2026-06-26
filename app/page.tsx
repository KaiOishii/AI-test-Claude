import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-xs text-[#999] mb-16 tracking-widest uppercase">task manager</p>
      <nav className="flex gap-16">
        <Link href="/todos" className="text-sm hover:opacity-50 transition-opacity">
          todo
        </Link>
        <Link href="/dashboard" className="text-sm hover:opacity-50 transition-opacity">
          wbs
        </Link>
      </nav>
    </div>
  )
}
