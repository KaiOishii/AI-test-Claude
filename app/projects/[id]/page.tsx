import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import type { User, Project, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const users = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${session.userId}`
  const user = users[0] as unknown as User

  const projectRows = await sql`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.id = ${id} AND p.user_id = ${session.userId}
    GROUP BY p.id
  `
  const projectRow = projectRows[0]
  if (!projectRow) notFound()

  const project = {
    ...projectRow,
    task_count: Number(projectRow.task_count ?? 0),
    completed_task_count: Number(projectRow.completed_task_count ?? 0),
    total_estimated_hours: Number(projectRow.total_estimated_hours ?? 0),
    total_actual_hours: Number(projectRow.total_actual_hours ?? 0),
  } as Project

  const taskRows = await sql`
    SELECT * FROM tasks WHERE project_id = ${id} AND user_id = ${session.userId}
    ORDER BY sort_order ASC, created_at ASC
  `
  const tasks = taskRows.map(r => normalizeTask(r as unknown as RawTask))

  return (
    <AppShell user={user}>
      <ProjectDetailClient user={user} initialProject={project} initialTasks={tasks} />
    </AppShell>
  )
}
