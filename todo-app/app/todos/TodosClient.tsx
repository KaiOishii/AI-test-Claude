'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { User, Todo, Category } from '@/lib/types'

interface Props {
  user: User
  initialTodos: (Todo & { category_name?: string })[]
  initialCategories: Category[]
}

type Filter = 'all' | 'today' | 'pending' | 'completed'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  const today = new Date().toISOString().slice(0, 10)
  return dateStr === today
}

export default function TodosClient({ user, initialTodos, initialCategories }: Props) {
  const router = useRouter()
  const [todos, setTodos] = useState(initialTodos)
  const [categories, setCategories] = useState(initialCategories)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<(Todo & { category_name?: string }) | null>(null)

  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [newCatName, setNewCatName] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)

  const filtered = useMemo(() => {
    let result = todos
    if (selectedCategory) result = result.filter(t => t.category_id === selectedCategory)
    if (filter === 'today') result = result.filter(t => isToday(t.due_date))
    if (filter === 'pending') result = result.filter(t => !t.completed)
    if (filter === 'completed') result = result.filter(t => t.completed)
    return result
  }, [todos, filter, selectedCategory])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function openAdd() {
    setEditingTodo(null)
    setTitle(''); setMemo(''); setCategoryId(''); setDueDate('')
    setShowForm(true)
  }

  function openEdit(todo: Todo & { category_name?: string }) {
    setEditingTodo(todo)
    setTitle(todo.title)
    setMemo(todo.memo || '')
    setCategoryId(todo.category_id || '')
    setDueDate(todo.due_date || '')
    setShowForm(true)
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault()
    const body = { title, memo: memo || null, category_id: categoryId || null, due_date: dueDate || null }
    if (editingTodo) {
      const res = await fetch(`/api/todos/${editingTodo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const updated = await res.json()
      const cat = categories.find(c => c.id === updated.category_id)
      setTodos(prev => prev.map(t => t.id === updated.id ? { ...updated, completed: !!updated.completed, category_name: cat?.name } : t))
    } else {
      const res = await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const created = await res.json()
      const cat = categories.find(c => c.id === created.category_id)
      setTodos(prev => [{ ...created, completed: !!created.completed, category_name: cat?.name }, ...prev])
    }
    setShowForm(false)
  }

  async function toggleTodo(id: string, completed: boolean) {
    const res = await fetch(`/api/todos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !!updated.completed } : t))
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
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

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'today', label: '今日' },
    { key: 'pending', label: '未完了' },
    { key: 'completed', label: '完了済み' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-black px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">ToDo</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-black transition-colors">ログアウト</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r border-black p-4 flex flex-col gap-6 shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">表示</p>
            <nav className="space-y-1">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => { setFilter(f.key); setSelectedCategory(null) }}
                  className={`w-full text-left px-2 py-1.5 text-sm transition-colors ${filter === f.key && !selectedCategory ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                  {f.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest">カテゴリ</p>
              <button onClick={() => setShowCatForm(v => !v)} className="text-xs text-gray-500 hover:text-black">+</button>
            </div>
            {showCatForm && (
              <form onSubmit={addCategory} className="mb-2 flex gap-1">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="名前" required
                  className="flex-1 border border-black px-2 py-1 text-xs outline-none" />
                <button type="submit" className="bg-black text-white px-2 py-1 text-xs">追加</button>
              </form>
            )}
            <nav className="space-y-1">
              {categories.map(c => (
                <div key={c.id} className="flex items-center group">
                  <button onClick={() => { setSelectedCategory(c.id); setFilter('all') }}
                    className={`flex-1 text-left px-2 py-1.5 text-sm transition-colors ${selectedCategory === c.id ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                    {c.name}
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="opacity-0 group-hover:opacity-100 px-1 text-gray-400 hover:text-black text-xs transition-opacity">×</button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : FILTERS.find(f => f.key === filter)?.label}
              <span className="ml-2 text-sm font-normal text-gray-400">{filtered.length}</span>
            </h2>
            <button onClick={openAdd} className="bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors">+ 追加</button>
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">ToDoがありません</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map(todo => (
                <li key={todo.id} className="flex items-start gap-3 py-3 group">
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mt-0.5 shrink-0">
                    <span className={`block w-4 h-4 border ${todo.completed ? 'bg-black border-black' : 'border-black'} transition-colors`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.title}</p>
                    {todo.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{todo.memo}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {todo.category_name && (
                        <span className="text-xs border border-gray-300 px-1.5 py-0.5">{todo.category_name}</span>
                      )}
                      {todo.due_date && (
                        <span className={`text-xs ${isToday(todo.due_date) ? 'font-medium' : 'text-gray-400'}`}>{formatDate(todo.due_date)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(todo)} className="text-xs text-gray-400 hover:text-black">編集</button>
                    <button onClick={() => deleteTodo(todo.id)} className="text-xs text-gray-400 hover:text-black">削除</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-black w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">{editingTodo ? 'ToDoを編集' : 'ToDoを追加'}</h3>
            <form onSubmit={saveTodo} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">タイトル <span className="text-gray-400">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="block text-sm mb-1">メモ</label>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2}
                  className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black resize-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm mb-1">カテゴリ</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full border border-black px-3 py-2 text-sm outline-none bg-white">
                    <option value="">なし</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">日付</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors">
                  {editingTodo ? '保存' : '追加'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-black py-2 text-sm hover:bg-gray-50 transition-colors">
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
