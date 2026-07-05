// Inline SVG icon set (feather-style strokes) replacing the emoji logos.
// All icons inherit colour from the surrounding text via currentColor.

function Svg({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconHouse = p => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></Svg>
)

export const IconSave = p => (
  <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></Svg>
)

export const IconShare = p => (
  <Svg {...p}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></Svg>
)

export const IconEdit = p => (
  <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
)

export const IconBolt = p => (
  <Svg {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Svg>
)

export const IconChart = p => (
  <Svg {...p}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></Svg>
)

export const IconBulb = p => (
  <Svg {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3v1h6v-1c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" /></Svg>
)

export const IconChevronRight = p => (
  <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
)

// Improvement icons

export const IconLayers = p => (
  <Svg {...p}><path d="m12 2 10 5-10 5L2 7l10-5z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></Svg>
)

export const IconWall = p => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9.3h18" /><path d="M3 14.6h18" /><path d="M9 4v5.3" /><path d="M15 9.3v5.3" /><path d="M9 14.6V20" /></Svg>
)

export const IconWindow = p => (
  <Svg {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M12 3v18" /><path d="M4 12h16" /></Svg>
)

export const IconFloor = p => (
  <Svg {...p}><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /><path d="M7 12v6" /><path d="M12 6v6" /><path d="M17 12v6" /></Svg>
)

export const IconWind = p => (
  <Svg {...p}><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /><path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2" /></Svg>
)

export const IconSliders = p => (
  <Svg {...p}><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></Svg>
)

export const IconFlame = p => (
  <Svg {...p}><path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.8-5-3.5-7C13.8 6.5 13 4.5 13 2c-3 2-8 6.5-8 13.5C5 19.2 7.6 22 12 22z" /><path d="M12 22c-2 0-3.5-1.4-3.5-3.5 0-1.8 1.2-3 2.5-4.5 1 1 3.5 2.3 3.5 4.5 0 2.1-1.5 3.5-2.5 3.5z" /></Svg>
)

export const IconFan = p => (
  <Svg {...p}><circle cx="12" cy="12" r="2" /><path d="M12 10c0-4 1.5-6 4-6 2 0 3 1.5 3 3s-1.5 3-5 3" /><path d="M10 12c-4 0-6 1.5-6 4 0 2 1.5 3 3 3s3-1.5 3-5" /><path d="M14 12c4 0 6-1.5 6-4M14 14c2 2 2 6-1 7-2 .7-4-.5-4-2.5" /></Svg>
)

export const IconSun = p => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></Svg>
)

export const IconDroplet = p => (
  <Svg {...p}><path d="M12 2.7 6.6 8.1a7.6 7.6 0 1 0 10.8 0L12 2.7z" /></Svg>
)

// Icon for an improvement, matched on its title.
const IMP_ICONS = [
  { test: /loft/i, Icon: IconLayers },
  { test: /wall/i, Icon: IconWall },
  { test: /glazing/i, Icon: IconWindow },
  { test: /floor/i, Icon: IconFloor },
  { test: /draught/i, Icon: IconWind },
  { test: /controls/i, Icon: IconSliders },
  { test: /boiler/i, Icon: IconFlame },
  { test: /heat pump/i, Icon: IconFan },
  { test: /solar pv/i, Icon: IconSun },
  { test: /solar thermal/i, Icon: IconDroplet },
  { test: /led/i, Icon: IconBulb },
]

export function ImprovementIcon({ title, ...rest }) {
  const hit = IMP_ICONS.find(i => i.test.test(title))
  const Icon = hit ? hit.Icon : IconBolt
  return <Icon {...rest} />
}
