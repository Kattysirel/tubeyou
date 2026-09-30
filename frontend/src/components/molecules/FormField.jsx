import { useId } from 'react'
import Input from '../atoms/Input.jsx'

export default function FormField({ label, hint, error, as, ...props }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      <Input id={id} as={as} aria-invalid={!!error} {...props} />
      {error ? (
        <p className="text-xs text-brand">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}
