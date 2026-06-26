'use client'

interface Props {
  value: string
  onChange: (v: string) => void
  dark: boolean
}

export default function SearchBar({ value, onChange, dark }: Props) {
  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="タスクを検索..."
        className={`w-full border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 ${
          dark
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-400'
            : 'bg-white border-black text-black placeholder-gray-400 focus:ring-black'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-current text-sm"
        >
          ✕
        </button>
      )}
    </div>
  )
}
