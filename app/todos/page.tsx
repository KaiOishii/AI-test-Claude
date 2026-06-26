import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { User, Todo, Category } from '@/lib/types'
import TodosClient from './TodosClient'

export default async function TodosPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const users = await sql`SELECT id, email, name FROM users WHERE id = ${session.userId}`
  const user = users[0] as unknown as User

  const rows = await sql`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${session.userId} AND t.parent_id IS NULL
    ORDER BY t.sort_order ASC, t.created_at DESC
  ` as unknown as Todo[]

  const subtaskRows = await sql`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${session.userId} AND t.parent_id IS NOT NULL
    ORDER BY t.sort_order ASC, t.created_at ASC
  ` as unknown as Todo[]

  const todos = rows.map(t => ({
    ...t,
    completed: !!t.completed,
    subtasks: subtaskRows
      .filter(s => s.parent_id === t.id)
      .map(s => ({ ...s, completed: !!s.completed })),
  }))

  const categories = await sql`SELECT * FROM categories WHERE user_id = ${session.userId} ORDER BY name` as unknown as Category[]

  return <TodosClient user={user} initialTodos={todos} initialCategories={categories} />
}
