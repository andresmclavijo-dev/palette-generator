import { useToastStore } from '../stores/toastStore'

export default function Toast() {
  const message = useToastStore((s) => s.message)
  if (!message) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a2e',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'toastFadeIn 0.2s ease',
      }}
    >
      {message}
    </div>
  )
}
