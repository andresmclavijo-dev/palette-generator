import { BRAND_VIOLET as ACCENT } from '../../lib/tokens'

export default function ProBadge() {
  return (
    <span
      className="inline-flex items-center justify-center px-2 rounded-xl text-[10px] font-bold uppercase text-white leading-none"
      style={{ backgroundColor: ACCENT, height: '14px' }}
    >
      PRO
    </span>
  )
}
