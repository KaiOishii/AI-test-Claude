export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  user_id: string
  created_at: string
}

export type Priority = 'none' | 'low' | 'medium' | 'high'
export type Recurring = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Todo {
  id: string
  title: string
  memo: string | null
  completed: boolean
  user_id: string
  category_id: string | null
  due_date: string | null
  priority: Priority
  recurring: Recurring
  sort_order: number
  parent_id: string | null
  created_at: string
  updated_at: string
  category_name?: string
  subtasks?: Todo[]
}
