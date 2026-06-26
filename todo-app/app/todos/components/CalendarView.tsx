'use client'
import { useState } from 'react'
import type { Todo } from '@/lib/types'

interface Props {
  todos: Todo[]
  dark: boolean
  onSelectDay: (date: string) => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-yellow-500',
  low:    'bg-blue-500',
  none:   'bg-gray-400',
}

export default function CalendarView({ todos, dark, onSelectDay }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.toISOString().slice(0, 10)

  const todosByDate: Record<string, Todo[]> = {}
  for (const t of todos) {
    if (!t.due_date) continue
    const d = t.due_date.slice(0, 10)
    ;(todosByDate[d] ??= []).push(t)
  }

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const border = dark ? 'border-gray-700' : 'border-gray-200'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="px-3 py-1 text-sm hover:opacity-60">‹</button>
        <h3 className="font-semibold">{year}年 {MONTHS[month]}</h3>
        <button onClick={next} className="px-3 py-1 text-sm hover:opacity-60">›</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className={`grid grid-cols-7 border-t border-l ${border}`}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} className={`border-b border-r h-16 ${border}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTodos = todosByDate[dateStr] || []
          const isToday = dateStr === today
          const dow = (firstDow + day - 1) % 7
          return (
            <div
              key={i}
              onClick={() => onSelectDay(dateStr)}
              className={`border-b border-r h-16 p-1 cursor-pointer hover:opacity-80 ${border} ${
                isToday ? (dark ? 'bg-gray-700' : 'bg-gray-100') : ''
              }`}
            >
              <span className={`text-xs font-medium block mb-1 ${
                dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : ''
              } ${isToday ? 'font-bold' : ''}`}>{day}</span>
              <div className="flex flex-wrap gap-0.5">
                {dayTodos.slice(0, 3).map(t => (
                  <span key={t.id} className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority ?? 'none']} ${t.completed ? 'opacity-40' : ''}`} title={t.title} />
                ))}
                {dayTodos.length > 3 && <span className="text-gray-400 text-xs">+{dayTodos.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />高</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />中</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />低</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />なし</span>
      </div>
    </div>
  )
}
