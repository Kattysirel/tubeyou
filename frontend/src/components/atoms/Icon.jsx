const PATHS = {
  menu: 'M3 6h18M3 12h18M3 18h18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5.2-5.2',
  home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  flame: 'M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4v4.5l3 2',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-3.5 3.6-6 8-6s8 2.5 8 6',
  videoPlus: 'M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm13 4 4-2.5v9L17 14M9.5 9v6M6.5 12h6',
  library: 'M4 5h16M4 10h16M4 15h9m5 0v6m-3-3h6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  edit: 'M4 20h4L19 9l-4-4L4 16zm9-13 4 4',
  trash: 'M5 7h14M10 4h4m-7 3 1 13h8l1-13M10 11v6m4-6v6',
  play: 'M8 5v14l11-7z',
  comment: 'M4 5h16v11H9l-5 4z',
  close: 'M6 6l12 12M18 6 6 18',
  upload: 'M12 16V5m0 0-4 4m4-4 4 4M5 19h14',
  grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
  list: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  logout: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-4 4-4-4-4m4 4H9',
  image: 'M4 5h16v14H4zm0 11 5-5 4 4 3-3 4 4M9 9.5h.01',
  film: 'M4 4h16v16H4zm4 0v16m8-16v16M4 9h4m8 0h4M4 15h4m8 0h4',
  send: 'M4 12 20 4l-4 16-4-6z',
  check: 'M5 12.5 10 17 19 7',
  chevronDown: 'M6 9l6 6 6-6',
  alert: 'M12 4 3 20h18zm0 6v5m0 3h.01',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  mail: 'M4 6h16v12H4zm0 1 8 6 8-6',
}

export default function Icon({ name, size = 24, className = '', fill = false, strokeWidth = 1.8 }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
