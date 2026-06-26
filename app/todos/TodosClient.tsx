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
import QuestLog from './components/QuestLog'

interface Props {
  user: User
  initialTodos: Todo[]
  initialCategories: Category[]
}

type Filter = 'all' | 'today' | 'overdue' | 'pending' | 'completed'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'すべて' },
  { key: 'today',     label: '今日' },
  { key: 'overdue',   label: '期限切れ' },
  { key: 'pending',   label: '未完了' },
  { key: 'completed', label: '完了済み' },
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

  function openAdd() {
    setEditingTodo(null)
    setSubtaskParentId(null)
    setShowForm(true)
  }

  function openEdit(todo: Todo) {
    setEditingTodo(todo)
    setSubtaskParentId(null)
    setShowForm(true)
  }

  function openAddSubtask(parentId: string) {
    setEditingTodo(null)
    setSubtaskParentId(parentId)
    setShowForm(true)
  }

  async function saveTodo(data: Partial<Todo>) {
    if (editingTodo) {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const updated = await res.json() as Todo
      const cat = categories.find(c => c.id === updated.category_id)
      if (updated.parent_id) {
        setTodos(prev => prev.map(t => t.id === updated.parent_id
          ? { ...t, subtasks: (t.subtasks ?? []).map(s => s.id === updated.id ? { ...updated, category_name: cat?.name } : s) }
          : t
        ))
      } else {
        setTodos(prev => prev.map(t => t.id === updated.id ? { ...updated, category_name: cat?.name, subtasks: t.subtasks } : t))
      }
    } else {
      const body = { ...data, parent_id: subtaskParentId }
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const created = await res.json() as Todo
      const cat = categories.find(c => c.id === created.category_id)
      const withCat = { ...created, category_name: cat?.name }
      if (subtaskParentId) {
        setTodos(prev => prev.map(t => t.id === subtaskParentId
          ? { ...t, subtasks: [...(t.subtasks ?? []), withCat] }
          : t
        ))
      } else {
        setTodos(prev => [{ ...withCat, subtasks: [] }, ...prev])
      }
    }
    setShowForm(false)
  }

  async function toggleTodo(id: string, completed: boolean) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
    const updated = await res.json() as Todo
    // Check if a new recurring todo was created
    const freshRes = await fetch('/api/todos')
    const fresh = await freshRes.json() as Todo[]
    setTodos(fresh)
    void updated
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    setTodos(prev => prev
      .filter(t => t.id !== id)
      .map(t => ({ ...t, subtasks: (t.subtasks ?? []).filter(s => s.id !== id) }))
    )
  }

  async function reorderTodo(id: string, direction: 'up' | 'down') {
    const idx = filtered.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === filtered.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const swapId = filtered[swapIdx].id
    // Swap sort_order
    const a = todos.find(t => t.id === id)!
    const b = todos.find(t => t.id === swapId)!
    await Promise.all([
      fetch(`/api/todos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`/api/todos/${swapId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ])
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, sort_order: b.sort_order } :
      t.id === swapId ? { ...t, sort_order: a.sort_order } : t
    ))
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName }),
    })
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

  // styles
  const bg   = dark ? 'bg-gray-900' : 'bg-white'
  const fg   = dark ? 'text-gray-100' : 'text-black'
  const bdr  = dark ? 'border-gray-700' : 'border-black'
  const muted = dark ? 'text-gray-400' : 'text-gray-500'
  const hover = dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
  const sidebarActive = dark ? 'bg-gray-700 text-white' : 'bg-black text-white'

  function sidebarBtn(active: boolean) {
    return `w-full text-left px-2 py-1.5 text-sm transition-colors ${active ? sidebarActive : hover}`
  }

  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.due_date)).length

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${fg}`}>
      <NotificationManager todos={todos} />
      <QuestLog />

      {/* Header */}
      <header className={`border-b ${bdr} px-6 py-4 flex items-center justify-between shrink-0`}>
        <h1 className="text-lg font-semibold tracking-tight">ToDo</h1>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${muted}`}>{user.name}</span>
          <button
            onClick={toggleDark}
            className={`text-sm ${muted} hover:text-current transition-colors`}
            title={dark ? 'ライトモード' : 'ダークモード'}
          >
            {dark ? '☀' : '☾'}
          </button>
          <button onClick={logout} className={`text-sm ${muted} hover:text-current transition-colors`}>ログアウト</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-52 border-r ${bdr} p-4 flex flex-col gap-6 shrink-0 overflow-y-auto`}>
          {/* View */}
          <div>
            <p className={`text-xs ${muted} uppercase tracking-widest mb-2`}>表示</p>
            <nav className="space-y-1">
              <button onClick={() => { setView('list'); setCalendarDate(null) }} className={sidebarBtn(view === 'list' && !calendarDate)}>リスト</button>
              <button onClick={() => setView('calendar')} className={sidebarBtn(view === 'calendar')}>カレンダー</button>
            </nav>
          </div>

          {/* Filters */}
          <div>
            <p className={`text-xs ${muted} uppercase tracking-widest mb-2`}>フィルター</p>
            <nav className="space-y-1">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => { setFilter(f.key); setSelectedCategory(null); setCalendarDate(null); setView('list') }}
                  className={sidebarBtn(filter === f.key && !selectedCategory && !calendarDate && view === 'list')}>
                  {f.label}
                  {f.key === 'overdue' && overdueCount > 0 && (
                    <span className="ml-1 text-xs text-red-500">({overdueCount})</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs ${muted} uppercase tracking-widest`}>カテゴリ</p>
              <button onClick={() => setShowCatForm(v => !v)} className={`text-xs ${muted} hover:text-current`}>+</button>
            </div>
            {showCatForm && (
              <form onSubmit={addCategory} className="mb-2 flex gap-1">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="名前" required
                  className={`flex-1 border px-2 py-1 text-xs outline-none ${dark ? 'bg-gray-800 border-gray-600 text-white' : 'border-black'}`} />
                <button type="submit" className="bg-black dark:bg-white dark:text-black text-white px-2 py-1 text-xs">追加</button>
              </form>
            )}
            <nav className="space-y-1">
              {categories.map(c => (
                <div key={c.id} className="flex items-center group">
                  <button onClick={() => { setSelectedCategory(c.id); setFilter('all'); setCalendarDate(null); setView('list') }}
                    className={sidebarBtn(selectedCategory === c.id)}>
                    {c.name}
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className={`opacity-0 group-hover:opacity-100 px-1 ${muted} hover:text-current text-xs transition-opacity`}>×</button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">
          {view === 'calendar' ? (
            <CalendarView
              todos={todos}
              dark={dark}
              onSelectDay={date => { setCalendarDate(date); setView('list') }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {calendarDate ? calendarDate :
                   selectedCategory ? categories.find(c => c.id === selectedCategory)?.name :
                   FILTERS.find(f => f.key === filter)?.label}
                  <span className={`ml-2 text-sm font-normal ${muted}`}>{filtered.length}</span>
                </h2>
                <div className="flex gap-2">
                  {calendarDate && (
                    <button onClick={() => setCalendarDate(null)} className={`border px-3 py-1.5 text-sm ${bdr} hover:opacity-70`}>× 日付クリア</button>
                  )}
                  <button onClick={openAdd} className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 text-sm hover:opacity-80 transition-opacity">+ 追加</button>
                </div>
              </div>

              <SearchBar value={search} onChange={setSearch} dark={dark} />

              {filtered.length === 0 ? (
                <p className={`${muted} text-sm py-8 text-center`}>ToDoがありません</p>
              ) : (
                <ul className="">
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
