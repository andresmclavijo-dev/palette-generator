/**
 * Show a brief toast notification.
 * @param message  — text to display
 * @param colorHex — optional hex color to show as an inline dot (e.g. "#6C47FF")
 */
export function showToast(message: string, colorHex?: string) {
  // Remove any existing toast
  const existing = document.getElementById('paletta-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'paletta-toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: hsl(var(--foreground));
    color: hsl(var(--card));
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  `

  if (colorHex) {
    const dot = document.createElement('span')
    dot.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.3);
      background: ${colorHex};
    `
    dot.setAttribute('aria-hidden', 'true')
    toast.appendChild(dot)
  }

  const text = document.createElement('span')
  text.textContent = message
  toast.appendChild(text)

  document.body.appendChild(toast)

  // Trigger fade-in
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
  })

  // Auto-remove after 2s
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 200)
  }, 2000)
}
