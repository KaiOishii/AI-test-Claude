import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import type { User, Project } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import ProjectsClient from './ProjectsClient'

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(session.userId) as User
  const projects = db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(session.userId) as Project[]

  return (
    <AppShell user={user}>
      <ProjectsClient user={user} initialProjects={projects} />
    </AppShell>
  )
}
