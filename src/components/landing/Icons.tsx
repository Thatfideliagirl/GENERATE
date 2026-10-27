const base = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const

export const PersonIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c.8-4 3.4-6 7-6s6.2 2 7 6" />
  </svg>
)
export const ShopIcon = () => (
  <svg {...base}>
    <path d="M4 10h16l-1.2-5H5.2L4 10Z" />
    <path d="M5 10v9h14v-9" />
    <path d="M10 19v-5h4v5" />
  </svg>
)
export const BarsIcon = () => (
  <svg {...base}>
    <rect x="4" y="12" width="4" height="7" rx=".6" />
    <rect x="10" y="7" width="4" height="12" rx=".6" />
    <rect x="16" y="4" width="4" height="15" rx=".6" />
  </svg>
)
export const PeopleIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19c.6-3.2 2.7-4.8 5.5-4.8s4.9 1.6 5.5 4.8" />
    <circle cx="17" cy="9.6" r="2.4" />
    <path d="M15.8 14.4c2.6-.2 4.2 1.2 4.7 4" />
  </svg>
)
