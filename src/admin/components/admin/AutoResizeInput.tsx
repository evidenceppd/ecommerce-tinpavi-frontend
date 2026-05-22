import { useEffect, useRef } from 'react'

type AutoResizeInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> & {
  list?: string
}

export function AutoResizeInput({ value, className, onChange, ...props }: AutoResizeInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent newlines in single-row mode (treat Enter as focus-out)
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
    props.onKeyDown?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Strip any newlines that might be pasted in
    const cleaned = e.target.value.replace(/[\r\n]/g, ' ')
    if (cleaned !== e.target.value) {
      e.target.value = cleaned
    }
    onChange?.(e)
  }

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={`resize-none overflow-hidden ${className ?? ''}`}
      {...props}
    />
  )
}
