'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Task } from '@/lib/types'

/**
 * クエストログ（ゲーム風タスク表示）
 * 画面左上に固定表示。今日やるべきタスクを「クエスト」として並べ、
 * 完了するとチェックアニメ＋進捗バーが進む。全部終わると達成演出。
 * デザインは白黒シンプルに統一。
 */

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function bumpStreak(): number {
  if (typeof window === 'undefined') return 0
  const today = todayStr()
  const raw = localStorage.getItem('wbs_quest_streak')
  let data = { date: '', count: 0 }
  if (raw) { try { data = JSON.parse(raw) } catch {} }

  if (data.date === today) return data.count
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const count = data.date === yesterday ? data.count + 1 : 1
  localStorage.setItem('wbs_quest_streak', JSON.stringify({ date: today, count }))
  return count
}

function readStreak(): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem('wbs_quest_streak')
  if (!raw) return 0
  try {
    const data = JSON.parse(raw)
    const today = todayStr()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    return data.date === today || data.date === yesterday ? data.count : 0
  } catch { return 0 }
}

export default function QuestLog() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [streak, setStreak] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [justDone, setJustDone] = useState<string | null>(null)

  const today = todayStr()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?today=${today}`)
      if (!res.ok) return
      const data = await res.json() as Task[]
      setTasks(data)
      setLoaded(true)
    } catch {}
  }, [today])

  useEffect(() => {
    setOpen(localStorage.getItem('wbs_quest_open') === 'true')
    setStreak(readStreak())
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  function toggleOpen() {
    setOpen(v => {
      localStorage.setItem('wbs_quest_open', String(!v))
      return !v
    })
  }

  const active = tasks.filter(t => t.status !== 'cancelled')
  const pending = active.filter(t => t.status !== 'completed')
  const doneToday = active.filter(t => t.status === 'completed' && (t.completed_at ?? t.updated_at ?? '').slice(0, 10) === today)
  const total = pending.length + doneToday.length
  const done = doneToday.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  async function complete(id: string) {
    setJustDone(id)
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', progress: 100 }),
      })
      const newStreak = bumpStreak()
      setStreak(newStreak)
      await load()
      const remaining = pending.filter(t => t.id !== id).length
      if (remaining === 0 && total > 0) {
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 2600)
      }
    } finally {
      setTimeout(() => setJustDone(null), 400)
    }
  }

  if (!loaded) return null

  // 折りたたみ時はコンパクトなピル表示（サイドバーを邪魔しない）
  if (!open) {
    return (
      <div className="fixed top-3 left-3 z-[60] select-none">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 bg-black text-white px-3 py-1.5 border border-black text-[11px] font-semibold tracking-wide hover:opacity-90"
          title="クエストログを開く"
        >
          <span aria-hidden>⚔</span>
          <span>クエスト</span>
          <span className="tabular-nums">{done}/{total}</span>
          {streak > 0 && <span className="font-normal">🔥{streak}</span>}
          <span aria-hidden>▸</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed top-3 left-3 z-[60] w-60 max-w-[78vw] select-none">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 bg-black text-white px-3 py-2 border border-black"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <span aria-hidden>⚔</span> 今日のクエスト
        </span>
        <span className="flex items-center gap-2 text-[10px]">
          {streak > 0 && <span title="連続達成日数">🔥{streak}日</span>}
          <span className="tabular-nums">{done}/{total}</span>
          <span aria-hidden>▾</span>
        </span>
      </button>

      <div className="quest-pop bg-white border border-black border-t-0 shadow-sm">
        <div className="px-3 pt-2.5">
          <div className="h-1.5 bg-gray-100 border border-gray-200">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ul className="px-2 py-2 space-y-0.5 max-h-[46vh] overflow-y-auto">
          {pending.length === 0 ? (
            <li className="px-1 py-3 text-center">
              {total > 0 ? (
                <span className="quest-clear inline-block text-xs font-semibold">🎉 全クエスト達成！</span>
              ) : (
                <span className="text-xs text-gray-400">今日のクエストはありません</span>
              )}
            </li>
          ) : (
            pending.slice(0, 8).map(t => {
              const overdue = !!t.due_date && t.due_date < today
              const isToday = t.due_date === today
              return (
                <li key={t.id} className="flex items-center gap-2 px-1 py-1 group">
                  <button
                    onClick={() => complete(t.id)}
                    aria-label="クエスト達成"
                    className={`shrink-0 w-4 h-4 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors ${justDone === t.id ? 'quest-check bg-black text-white' : ''}`}
                  >
                    {justDone === t.id ? '✓' : ''}
                  </button>
                  <span className="flex-1 text-xs truncate" title={t.project_name ? `${t.project_name} / ${t.title}` : t.title}>
                    {t.title}
                  </span>
                  {overdue && <span className="shrink-0 text-[9px] text-black border border-black px-1">期限切</span>}
                  {isToday && !overdue && <span className="shrink-0 text-[9px] text-white bg-black px-1">今日</span>}
                </li>
              )
            })
          )}
          {pending.length > 8 && (
            <li className="px-1 pt-1 text-[10px] text-gray-400 text-center">ほか {pending.length - 8} 件</li>
          )}
        </ul>
      </div>

      {celebrate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="quest-clear bg-white border-2 border-black px-8 py-6 text-center shadow-lg">
            <p className="text-3xl">🏆</p>
            <p className="mt-2 text-sm font-bold tracking-wide">本日のクエスト全クリア！</p>
            {streak > 1 && <p className="mt-1 text-xs text-gray-500">🔥 {streak}日連続達成中</p>}
          </div>
        </div>
      )}
    </div>
  )
}
