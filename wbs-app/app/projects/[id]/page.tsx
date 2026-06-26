import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import type { User, Project, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(session.userId) as User
  const project = db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.id = ? AND p.user_id = ?
    GROUP BY p.id
  `).get(id, session.userId) as Project | undefined

  if (!project) notFound()

  const tasks = (db.prepare(`
    SELECT * FROM tasks WHERE project_id = ? AND user_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).all(id, session.userId) as RawTask[]).map(normalizeTask)

  return (
    <AppShell user={user}>
      <ProjectDetailClient user={user} initialProject={project} initialTasks={tasks} />
    </AppShell>
  )
}
