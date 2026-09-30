import { useTheme } from '../../context/ThemeContext.jsx'
import IconButton from './IconButton.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton
      icon={dark ? 'sun' : 'moon'}
      label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={toggleTheme}
    />
  )
}
