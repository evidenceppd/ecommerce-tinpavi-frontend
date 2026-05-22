import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

type DateTimePickerProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseValue(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDatetimeLocal(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplay(value: string) {
  const date = parseValue(value)
  if (!date) return 'dd/mm/aaaa --:--'
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function DateTimePicker({ value, onChange, required }: DateTimePickerProps) {
  const selectedDate = parseValue(value)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(selectedDate ?? new Date())
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target) || document.getElementById('datetime-picker-portal')?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const days = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const start = new Date(firstDay)
    start.setDate(firstDay.getDate() - firstDay.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [viewDate])

  const hour = selectedDate?.getHours() ?? 0
  const minute = selectedDate?.getMinutes() ?? 0

  function openPopover() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPopoverStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom + 8,
        width: Math.max(336, rect.width),
        zIndex: 100000,
      })
    }
    setOpen((current) => !current)
  }

  function updateDate(nextDate: Date, nextHour = hour, nextMinute = minute) {
    const next = new Date(nextDate)
    next.setHours(nextHour, nextMinute, 0, 0)
    onChange(toDatetimeLocal(next))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={openPopover}
        className={`flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm outline-none transition-colors ${
          open ? 'border-[#f5c518] ring-2 ring-[#f5c518]/20' : 'border-slate-200 hover:border-slate-300'
        } bg-white text-slate-950`}
        aria-required={required}
      >
        <span>{formatDisplay(value)}</span>
        <CalendarDays size={16} className="text-slate-500" />
      </button>

      {open && createPortal(
        <div id="datetime-picker-portal" style={popoverStyle} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100">
              <ChevronLeft size={17} />
            </button>
            <p className="text-sm font-black text-slate-950">{months[viewDate.getMonth()]} de {viewDate.getFullYear()}</p>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100">
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
            {weekdays.map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}
            {days.map((day) => {
              const selected = selectedDate && day.toDateString() === selectedDate.toDateString()
              const muted = day.getMonth() !== viewDate.getMonth()
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => updateDate(day)}
                  className={`h-9 rounded-lg text-sm font-bold transition-colors ${selected ? 'bg-[#f5c518] text-slate-950' : muted ? 'text-slate-300 hover:bg-slate-50' : 'text-slate-700 hover:bg-[#f5c518]/15'}`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <Clock size={16} className="text-slate-400" />
            <select value={hour} onChange={(event) => updateDate(selectedDate ?? viewDate, Number(event.target.value), minute)} className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold outline-none focus:border-[#f5c518]">
              {Array.from({ length: 24 }, (_, item) => <option key={item} value={item}>{pad(item)}</option>)}
            </select>
            <span className="font-bold text-slate-400">:</span>
            <select value={minute} onChange={(event) => updateDate(selectedDate ?? viewDate, hour, Number(event.target.value))} className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold outline-none focus:border-[#f5c518]">
              {Array.from({ length: 60 }, (_, item) => <option key={item} value={item}>{pad(item)}</option>)}
            </select>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
