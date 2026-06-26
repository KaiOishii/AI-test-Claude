import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import type { User, Project, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import DashboardClient from './DashboardClient'

function numAggregates(p: Record<string, unknown>): Project {
  return {
    ...p,
    task_count: Number(p.task_count ?? 0),
    completed_task_count: Number(p.completed_task_count ?? 0),
    total_estimated_hours: Number(p.total_estimated_hours ?? 0),
    total_actual_hours: Number(p.total_actual_hours ?? 0),
  } as Project
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const users = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${session.userId}`
  const user = users[0] as unknown as User
  const today = new Date().toISOString().slice(0, 10)

  const projectRows = await sql`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.user_id = ${session.userId} AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.updated_at DESC LIMIT 5
  `
  const projects = projectRows.map(numAggregates)

  const todayRows = await sql`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ${session.userId} AND t.status != 'completed' AND t.status != 'cancelled'
      AND (t.todo_date = ${today} OR t.due_date = ${today})
    ORDER BY t.priority DESC, t.due_date ASC LIMIT 20
  `
  const todayTasks = todayRows.map(r => normalizeTask(r as unknown as RawTask))

  const overdueRows = await sql`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ${session.userId} AND t.status NOT IN ('completed', 'cancelled')
      AND t.due_date < ${today} AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC LIMIT 10
  `
  const overdueTasks = overdueRows.map(r => normalizeTask(r as unknown as RawTask))

  return (
    <AppShell user={user}>
      <DashboardClient
        user={user}
        projects={projects}
        todayTasks={todayTasks}
        overdueTasks={overdueTasks}
        today={today}
      />
    </AppShell>
  )
}
