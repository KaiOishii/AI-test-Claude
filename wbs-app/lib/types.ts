export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: '未着手', in_progress: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止',
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '低', medium: '中', high: '高', urgent: '緊急',
}

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  start_date: string | null
  due_date: string | null
  status: ProjectStatus
  progress: number
  created_at: string
  updated_at: string
  task_count?: number
  completed_task_count?: number
  total_estimated_hours?: number
  total_actual_hours?: number
}

export interface Task {
  id: string
  user_id: string
  project_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  start_date: string | null
  due_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  progress: number
  status: TaskStatus
  priority: TaskPriority
  sort_order: number
  is_todo_visible: boolean
  todo_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  project_name?: string
  children?: Task[]
}

export type RawTask = Omit<Task, 'is_todo_visible'> & { is_todo_visible: number }
export function normalizeTask({ is_todo_visible, ...rest }: RawTask): Task {
  return { ...rest, is_todo_visible: !!is_todo_visible }
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  user_name?: string
  body: string
  created_at: string
}
