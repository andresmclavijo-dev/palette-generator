export function showToast(message: string) {
  // Remove any existing toast
  const existing = document.getElementById('paletta-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'paletta-toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: hsl(var(--foreground));
    color: hsl(var(--card));
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Auto-remove after 1200ms
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 1200);
}
