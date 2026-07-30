/* Traits fonctionnels uniquement — chevrons, croix, plus, coche. Le DS interdit
 * l'icône décorative : aucun de ces glyphes n'apparaît sans rôle d'action. */

type IconProps = { className?: string; size?: number }

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  }
}

export function ChevronLeft({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function ChevronRight({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function ChevronDown({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  )
}

export function Plus({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function Close({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function Check({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  )
}

export function Warning({ className, size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path d="M12 8v5M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
