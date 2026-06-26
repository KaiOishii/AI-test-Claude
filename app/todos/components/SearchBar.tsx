'use client'

interface Props {
  value: string
  onChange: (v: string) => void
  dark: boolean
}

export default function SearchBar({ value, onChange, dark }: Props) {
  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="タスクを検索..."
        className={`w-full bg-transparent border-b pb-1.5 text-xs outline-none transition-colors ${
          dark
            ? 'border-[#333] text-[#eee] placeholder-[#555] focus:border-[#666]'
            : 'border-[#e0e0e0] text-[#111] placeholder-[#bbb] focus:border-[#aaa]'
        }`}
      />
      {value && (
        <button onClick={() => onChange('')} className={`absolute right-0 top-0 text-xs ${dark ? 'text-[#555]' : 'text-[#bbb]'} hover:opacity-50`}>
          ×
        </button>
      )}
    </div>
  )
}
