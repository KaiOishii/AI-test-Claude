import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import type { User, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'
import AppShell from '@/app/components/AppShell'
import TodayClient from './TodayClient'

export default async function TodayPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const users = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${session.userId}`
  const user = users[0] as unknown as User
  const today = new Date().toISOString().slice(0, 10)

  const taskRows = await sql`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ${session.userId}
      AND t.status NOT IN ('cancelled')
      AND (t.is_todo_visible = true OR t.due_date = ${today})
    ORDER BY t.status = 'completed' ASC, t.priority DESC, t.due_date ASC
  `
  const tasks = taskRows.map(r => normalizeTask(r as unknown as RawTask))

  return (
    <AppShell user={user}>
      <TodayClient user={user} initialTasks={tasks} today={today} />
    </AppShell>
  )
}
