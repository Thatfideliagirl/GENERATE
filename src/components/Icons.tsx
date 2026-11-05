/** Small line icons for the app. One stroke weight, drawn on a 24 pixel grid. */
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </svg>
)
export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const PenIcon = () => (
  <svg {...base}>
    <path d="M4 20c3.5 0 4.5-3 7-3s2 2.5 4 2.5S18 18 20 16" />
    <path d="m14.5 4.5 3 3L9 16l-3.6.6L6 13z" />
  </svg>
)
export const UserIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.6 4-5.2 7.5-5.2s6.3 1.6 7.5 5.2" />
  </svg>
)
export const InvoiceIcon = () => (
  <svg {...base}>
    <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
    <path d="M15 3.5V7h3.5M9 11h6M9 14.5h6M9 18h3.5" />
  </svg>
)
export const ReceiptIcon = () => (
  <svg {...base}>
    <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" />
    <path d="m9.5 10.5 1.8 1.8 3.4-3.6M9 15.5h6" />
  </svg>
)
export const ContractIcon = () => (
  <svg {...base}>
    <path d="M6 3.5h12v17H6z" />
    <path d="M9 8h6M9 11.5h6M9 16.5c1-1.2 1.6-1.2 2.2 0s1.4 1.2 2.6-.4" />
  </svg>
)
export const BackIcon = () => (
  <svg {...base}>
    <path d="M15 5 8 12l7 7" />
  </svg>
)
export const WhatsAppIcon = () => (
  <svg {...base}>
    <path d="M4.5 19.5 5.6 16A7.6 7.6 0 1 1 8.4 18.6z" />
    <path d="M9.4 9.2c.2 2.5 2.4 4.9 5.3 5.4l1-1.2-1.6-.9-.8.7c-1-.4-1.9-1.3-2.4-2.4l.7-.8-.8-1.6z" />
  </svg>
)
export const ShieldIcon = () => (
  <svg {...base}>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" />
  </svg>
)
export const FolderIcon = () => (
  <svg {...base}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v8.3a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </svg>
)
export const PeopleIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="8.5" r="3.3" />
    <path d="M3 19.5c.9-3.2 3.2-4.8 6-4.8s5.1 1.6 6 4.8" />
    <path d="M15.5 5.6a3.2 3.2 0 0 1 0 6.1M17.6 14.9c1.7.6 2.9 2 3.4 4.6" />
  </svg>
)
export const GlobeIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z" />
  </svg>
)
export const EditIcon = () => (
  <svg {...base}>
    <path d="m14.5 5 4.5 4.5L9 19.5H4.5V15z" />
    <path d="m12.5 7 4.5 4.5" />
  </svg>
)
export const DownloadIcon = () => (
  <svg {...base}>
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
  </svg>
)
export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </svg>
)
export const TrashIcon = () => (
  <svg {...base}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
  </svg>
)
export const SunIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
)
export const MoonIcon = () => (
  <svg {...base}>
    <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
  </svg>
)
export const SignOutIcon = () => (
  <svg {...base}>
    <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" />
    <path d="M10.5 12h9m0 0-3.5-3.5M19.5 12 16 15.5" />
  </svg>
)
