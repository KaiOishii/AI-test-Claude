'use client'
import Link from 'next/link'
import type { User, Project, Task } from '@/lib/types'
import { TASK_STATUS_LABEL } from '@/lib/types'

interface Props {
  user: User
  projects: Project[]
  todayTasks: Task[]
  overdueTasks: Task[]
  today: string
}

function fmtDate(d: string | null) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

export default function DashboardClient({ user, projects, todayTasks, overdueTasks, today }: Props) {
  const muted = 'text-[#aaa]'

  return (
    <div className="px-12 py-10 max-w-3xl">
      <div className="mb-12">
        <p className={`text-xs ${muted}`}>{user.name}</p>
      </div>

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <section className="mb-10">
          <p className={`text-xs ${muted} mb-4`}>today</p>
          <ul className="space-y-2">
            {todayTasks.map(t => (
              <li key={t.id} className="flex items-center gap-4">
                <span className={`text-xs ${muted} shrink-0 w-16`}>{TASK_STATUS_LABEL[t.status]}</span>
                <span className="text-sm flex-1">{t.title}</span>
                <span className={`text-xs ${muted} shrink-0`}>{t.project_name}</span>
                {t.due_date && t.due_date < today && (
                  <span className="text-xs text-[#c0392b] shrink-0">overdue</span>
                )}
              </li>
            ))}
          </ul>
          <Link href="/today" className={`text-xs ${muted} hover:opacity-50 mt-3 inline-block transition-opacity`}>all →</Link>
        </section>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section className="mb-10">
          <p className="text-xs text-[#c0392b] mb-4">overdue {overdueTasks.length}</p>
          <ul className="space-y-2">
            {overdueTasks.map(t => (
              <li key={t.id} className="flex items-center gap-4">
                <span className={`text-xs ${muted} shrink-0 w-16`}>{fmtDate(t.due_date)}</span>
                <span className="text-sm flex-1">{t.title}</span>
                <Link href={`/projects/${t.project_id}`} className={`text-xs ${muted} hover:opacity-50 shrink-0 transition-opacity`}>{t.project_name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-xs ${muted}`}>projects</p>
          <Link href="/projects" className={`text-xs ${muted} hover:opacity-50 transition-opacity`}>all →</Link>
        </div>
        {projects.length === 0 ? (
          <Link href="/projects" className={`text-xs ${muted} hover:opacity-50 transition-opacity`}>+ new project</Link>
        ) : (
          <ul className="space-y-3">
            {projects.map(p => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex items-center gap-4 group">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm group-hover:opacity-60 transition-opacity">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 bg-[#e5e5e5] h-px">
                      <div className="bg-[#111] h-px transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={`text-xs ${muted} w-8 text-right`}>{p.progress}%</span>
                  </div>
                  {p.due_date && <span className={`text-xs ${muted} shrink-0`}>{fmtDate(p.due_date)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
