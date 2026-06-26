import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import type { User, Project } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import ProjectsClient from './ProjectsClient'

function numAggregates(p: Record<string, unknown>): Project {
  return {
    ...p,
    task_count: Number(p.task_count ?? 0),
    completed_task_count: Number(p.completed_task_count ?? 0),
    total_estimated_hours: Number(p.total_estimated_hours ?? 0),
    total_actual_hours: Number(p.total_actual_hours ?? 0),
  } as Project
}

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

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
    WHERE p.user_id = ${session.userId}
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `
  const projects = projectRows.map(numAggregates)

  return (
    <AppShell user={user}>
      <ProjectsClient user={user} initialProjects={projects} />
    </AppShell>
  )
}
