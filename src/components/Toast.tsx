import { useToastStore } from '../stores/toastStore'

export function Toast() {
  const message = useToastStore((s) => s.message)
  if (!message) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#1a1a2e] text-white text-sm px-4 py-2 rounded-lg pointer-events-none animate-fade-in"
    >
      {message}
    </div>
  )
}
