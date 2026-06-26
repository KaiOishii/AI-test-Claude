import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import { User, Todo, Category } from '@/lib/types'
import TodosClient from './TodosClient'

export default async function TodosPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(session.userId) as User
  const todos = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(session.userId) as (Todo & { category_name?: string })[]
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name').all(session.userId) as Category[]

  return <TodosClient user={user} initialTodos={todos} initialCategories={categories} />
}
