import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import type { User, Project, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(session.userId) as User
  const today = new Date().toISOString().slice(0, 10)

  const projects = db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.user_id = ? AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.updated_at DESC LIMIT 5
  `).all(session.userId) as Project[]

  const todayTasks = (db.prepare(`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ? AND t.status != 'completed' AND t.status != 'cancelled'
      AND (t.todo_date = ? OR t.due_date = ?)
    ORDER BY t.priority DESC, t.due_date ASC LIMIT 20
  `).all(session.userId, today, today) as RawTask[]).map(normalizeTask)

  const overdueTasks = (db.prepare(`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ? AND t.status NOT IN ('completed', 'cancelled')
      AND t.due_date < ? AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC LIMIT 10
  `).all(session.userId, today) as RawTask[]).map(normalizeTask)

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
