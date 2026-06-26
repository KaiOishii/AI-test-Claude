'use client'
import Link from 'next/link'
import type { User, Project, Task } from '@/lib/types'
import { PROJECT_STATUS_LABEL, TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from '@/lib/types'

interface Props {
  user: User
  projects: Project[]
  todayTasks: Task[]
  overdueTasks: Task[]
  today: string
}

function fmtDate(d: string | null) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

export default function DashboardClient({ user, projects, todayTasks, overdueTasks, today }: Props) {
  const [y, m, d] = today.split('-')
  const todayLabel = `${y}年${m}月${d}日`

  return (
    <div className="px-5 md:px-8 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">ホーム</h1>
        <p className="text-sm text-gray-400 mt-0.5">{todayLabel} · {user.name}</p>
      </div>

      {/* Today's tasks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">今日のタスク</h2>
          <Link href="/today" className="text-xs text-gray-400 hover:text-black underline">すべて見る</Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200">
            今日のタスクはありません
          </p>
        ) : (
          <div className="border border-gray-200 divide-y divide-gray-100">
            {todayTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-xs border px-1.5 py-0.5 shrink-0 ${
                  t.status === 'in_progress' ? 'border-blue-400 text-blue-500' : 'border-gray-300 text-gray-400'
                }`}>{TASK_STATUS_LABEL[t.status]}</span>
                <span className="flex-1 text-sm truncate">{t.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{t.project_name}</span>
                {t.due_date && t.due_date < today && (
                  <span className="text-xs text-red-500 shrink-0">⚠ 期限切れ</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            期限切れ <span className="text-red-500">({overdueTasks.length})</span>
          </h2>
          <div className="border border-red-100 divide-y divide-red-50">
            {overdueTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-red-50/30">
                <span className="text-xs text-red-400 shrink-0 font-medium">{fmtDate(t.due_date)}</span>
                <span className="flex-1 text-sm truncate">{t.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{t.project_name}</span>
                <Link href={`/projects/${t.project_id}`}
                  className="text-xs text-gray-400 hover:text-black underline shrink-0">詳細</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">進行中のプロジェクト</h2>
          <Link href="/projects" className="text-xs text-gray-400 hover:text-black underline">すべて見る</Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 mb-3">プロジェクトがありません</p>
            <Link href="/projects" className="text-sm underline">プロジェクトを作成する</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="block border border-gray-200 p-4 hover:border-black transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium truncate">{p.name}</h3>
                  <span className="text-xs text-gray-400 shrink-0">{PROJECT_STATUS_LABEL[p.status]}</span>
                </div>
                {p.due_date && (
                  <p className="text-xs text-gray-400 mb-2">{fmtDate(p.due_date)} 締切</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 h-1">
                    <div className="bg-black h-1 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{p.progress}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {p.completed_task_count ?? 0}/{p.task_count ?? 0} タスク完了
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
