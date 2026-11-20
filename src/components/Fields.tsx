import type { ChangeEvent, ReactNode } from 'react'

interface FieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}

export function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
  const numeric = type === 'number'
  return (
    <label className="f">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={numeric ? 'decimal' : undefined}
        min={numeric ? 0 : undefined}
        step={numeric ? 'any' : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </label>
  )
}

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}

export function SelectField({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="f">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="f">
      {label && <span>{label}</span>}
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sec">
      <h3 className="s">{title}</h3>
      {children}
    </div>
  )
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid2">{children}</div>
}
