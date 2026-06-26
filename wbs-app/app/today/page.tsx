import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import type { User, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import TodayClient from './TodayClient'

export default async function TodayPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(session.userId) as User
  const today = new Date().toISOString().slice(0, 10)

  const tasks = (db.prepare(`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ?
      AND t.status NOT IN ('cancelled')
      AND (t.is_todo_visible = 1 OR t.due_date = ?)
    ORDER BY t.status = 'completed' ASC, t.priority DESC, t.due_date ASC
  `).all(session.userId, today) as RawTask[]).map(normalizeTask)

  return (
    <AppShell user={user}>
      <TodayClient user={user} initialTasks={tasks} today={today} />
    </AppShell>
  )
}
