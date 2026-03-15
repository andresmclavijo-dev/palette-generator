import { BRAND_VIOLET as ACCENT } from '../../lib/tokens'

export default function ProBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white leading-none"
      style={{ backgroundColor: ACCENT }}
    >
      PRO
    </span>
  )
}
