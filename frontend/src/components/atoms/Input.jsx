export default function Input({ as: Tag = 'input', className = '', ...props }) {
  return (
    <Tag
      className={`w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 ${className}`}
      {...props}
    />
  )
}
