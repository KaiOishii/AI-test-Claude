'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Todo, Category } from '@/lib/types'
import { useDarkMode } from './hooks/useDarkMode'
import SearchBar from './components/SearchBar'
import TodoForm from './components/TodoForm'
import TodoItem from './components/TodoItem'
import CalendarView from './components/CalendarView'
import NotificationManager from './components/NotificationManager'

interface Props {
  user: User
  initialTodos: Todo[]
  initialCategories: Category[]
}

type Filter = 'all' | 'today' | 'overdue' | 'pending' | 'completed'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'all' },
  { key: 'today',     label: 'today' },
  { key: 'overdue',   label: 'overdue' },
  { key: 'pending',   label: 'pending' },
  { key: 'completed', label: 'done' },
]

function today() { return new Date().toISOString().slice(0, 10) }
function isOverdue(d: string | null) { return !!d && d < today() }
function isToday(d: string | null)   { return d === today() }

export default function TodosClient({ user, initialTodos, initialCategories }: Props) {
  const router = useRouter()
  const { dark, toggle: toggleDark } = useDarkMode()

  const [todos, setTodos] = useState(initialTodos)
  const [categories, setCategories] = useState(initialCategories)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [calendarDate, setCalendarDate] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null)

  const [newCatName, setNewCatName] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)

  const filtered = useMemo(() => {
    let r = todos
    if (selectedCategory) r = r.filter(t => t.category_id === selectedCategory)
    if (filter === 'today')     r = r.filter(t => isToday(t.due_date))
    if (filter === 'overdue')   r = r.filter(t => !t.completed && isOverdue(t.due_date))
    if (filter === 'pending')   r = r.filter(t => !t.completed)
    if (filter === 'completed') r = r.filter(t => t.completed)
    if (calendarDate)           r = r.filter(t => t.due_date === calendarDate)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(t => t.title.toLowerCase().includes(q) || (t.memo ?? '').toLowerCase().includes(q))
    }
    return r
  }, [todos, filter, selectedCategory, search, calendarDate])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function openAdd() { setEditingTodo(null); setSubtaskParentId(null); setShowForm(true) }
  function openEdit(todo: Todo) { setEditingTodo(todo); setSubtaskParentId(null); setShowForm(true) }
  function openAddSubtask(parentId: string) { setEditingTodo(null); setSubtaskParentId(parentId); setShowForm(true) }

  async function saveTodo(data: Partial<Todo>) {
    if (editingTodo) {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const updated = await res.json() as Todo
      const cat = categories.find(c => c.id === updated.category_id)
      if (updated.parent_id) {
        setTodos(prev => prev.map(t => t.id === updated.parent_id
          ? { ...t, subtasks: (t.subtasks ?? []).map(s => s.id === updated.id ? { ...updated, category_name: cat?.name } : s) } : t))
      } else {
        setTodos(prev => prev.map(t => t.id === updated.id ? { ...updated, category_name: cat?.name, subtasks: t.subtasks } : t))
      }
    } else {
      const res = await fetch('/api/todos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, parent_id: subtaskParentId }),
      })
      const created = await res.json() as Todo
      const cat = categories.find(c => c.id === created.category_id)
      const withCat = { ...created, category_name: cat?.name }
      if (subtaskParentId) {
        setTodos(prev => prev.map(t => t.id === subtaskParentId ? { ...t, subtasks: [...(t.subtasks ?? []), withCat] } : t))
      } else {
        setTodos(prev => [{ ...withCat, subtasks: [] }, ...prev])
      }
    }
    setShowForm(false)
  }

  async function toggleTodo(id: string, completed: boolean) {
    await fetch(`/api/todos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) })
    const fresh = await fetch('/api/todos').then(r => r.json()) as Todo[]
    setTodos(fresh)
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id).map(t => ({ ...t, subtasks: (t.subtasks ?? []).filter(s => s.id !== id) })))
  }

  async function reorderTodo(id: string, direction: 'up' | 'down') {
    const idx = filtered.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === filtered.length - 1) return
    const swapId = filtered[direction === 'up' ? idx - 1 : idx + 1].id
    const a = todos.find(t => t.id === id)!
    const b = todos.find(t => t.id === swapId)!
    await Promise.all([
      fetch(`/api/todos/${id}`,     { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`/api/todos/${swapId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ])
    setTodos(prev => prev.map(t => t.id === id ? { ...t, sort_order: b.sort_order } : t.id === swapId ? { ...t, sort_order: a.sort_order } : t))
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName }) })
    const cat = await res.json()
    setCategories(prev => [...prev, cat])
    setNewCatName('')
    setShowCatForm(false)
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    setCategories(prev => prev.filter(c => c.id !== id))
    setTodos(prev => prev.map(t => t.category_id === id ? { ...t, category_id: null, category_name: undefined } : t))
  }

  const bg   = dark ? 'bg-[#0f0f0f] text-[#eee]' : 'bg-[#f5f5f4] text-[#111]'
  const muted = dark ? 'text-[#555]' : 'text-[#aaa]'

  function navBtn(active: boolean) {
    return `block text-xs py-0.5 transition-opacity ${active ? 'opacity-100' : `${muted} hover:opacity-60`}`
  }

  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.due_date)).length

  return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      <NotificationManager todos={todos} />

      {/* Header */}
      <header className="px-10 pt-8 pb-6 flex items-center justify-between shrink-0">
        <span className="text-xs tracking-widest uppercase text-[#999]">todo</span>
        <div className={`flex items-center gap-6 text-xs ${muted}`}>
          <span>{user.name}</span>
          <button onClick={toggleDark} title={dark ? 'ライトモード' : 'ダークモード'} className="hover:opacity-50 transition-opacity">{dark ? '○' : '●'}</button>
          <button onClick={logout} className="hover:opacity-50 transition-opacity">ログアウト</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-36 px-10 py-2 flex flex-col gap-8 shrink-0 overflow-y-auto">
          {/* View */}
          <nav className="space-y-1">
            <button onClick={() => { setView('list'); setCalendarDate(null) }} className={navBtn(view === 'list' && !calendarDate)}>list</button>
            <button onClick={() => setView('calendar')} className={navBtn(view === 'calendar')}>calendar</button>
          </nav>

          {/* Filters */}
          <nav className="space-y-1">
            {FILTERS.map(f => (
              <button key={f.key}
                onClick={() => { setFilter(f.key); setSelectedCategory(null); setCalendarDate(null); setView('list') }}
                className={navBtn(filter === f.key && !selectedCategory && !calendarDate && view === 'list')}>
                {f.label}
                {f.key === 'overdue' && overdueCount > 0 && <span className="ml-1 text-[#c0392b]">({overdueCount})</span>}
              </button>
            ))}
          </nav>

          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs ${muted}`}>tags</span>
              <button onClick={() => setShowCatForm(v => !v)} className={`text-xs ${muted} hover:opacity-50`}>+</button>
            </div>
            {showCatForm && (
              <form onSubmit={addCategory} className="mb-2 flex gap-1">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="name" required
                  className={`flex-1 bg-transparent border-b pb-0.5 text-xs outline-none ${dark ? 'border-[#333] text-[#eee]' : 'border-[#e0e0e0] text-[#111]'}`} />
                <button type="submit" className={`text-xs ${muted} hover:opacity-50`}>↵</button>
              </form>
            )}
            <nav className="space-y-1">
              {categories.map(c => (
                <div key={c.id} className="flex items-center group/cat">
                  <button
                    onClick={() => { setSelectedCategory(c.id); setFilter('all'); setCalendarDate(null); setView('list') }}
                    className={navBtn(selectedCategory === c.id)}>
                    {c.name}
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className={`opacity-0 group-hover/cat:opacity-100 ml-1 text-xs ${muted} hover:opacity-50 transition-opacity`}>×</button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-8 py-2 overflow-y-auto">
          {view === 'calendar' ? (
            <CalendarView todos={todos} dark={dark} onSelectDay={date => { setCalendarDate(date); setView('list') }} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs ${muted}`}>
                  {calendarDate ?? (selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : FILTERS.find(f => f.key === filter)?.label)}
                  {' '}{filtered.length}
                </span>
                <div className="flex gap-4">
                  {calendarDate && (
                    <button onClick={() => setCalendarDate(null)} className={`text-xs ${muted} hover:opacity-50`}>clear date</button>
                  )}
                  <button onClick={openAdd} className={`text-xs hover:opacity-50 transition-opacity`}>+ add</button>
                </div>
              </div>

              <SearchBar value={search} onChange={setSearch} dark={dark} />

              {filtered.length === 0 ? (
                <p className={`${muted} text-xs py-12 text-center`}>—</p>
              ) : (
                <ul className="divide-y divide-transparent">
                  {filtered.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      categories={categories}
                      dark={dark}
                      onToggle={toggleTodo}
                      onEdit={openEdit}
                      onDelete={deleteTodo}
                      onAddSubtask={openAddSubtask}
                      onReorder={reorderTodo}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>

      {showForm && (
        <TodoForm
          editing={editingTodo}
          categories={categories}
          dark={dark}
          onSave={saveTodo}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
