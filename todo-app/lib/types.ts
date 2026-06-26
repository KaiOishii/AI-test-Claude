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

export interface Todo {
  id: string
  title: string
  memo: string | null
  completed: boolean
  user_id: string
  category_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  category?: Category
}
