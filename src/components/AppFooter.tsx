export default function AppFooter() {
  return (
    <footer
      className="flex-none flex items-center justify-between px-5"
      style={{
        height: 36,
        background: '#FAFAF8',
        borderTop: '0.5px solid #efefef',
      }}
    >
      {/* Legal links */}
      <nav className="flex items-center gap-3" aria-label="Legal">
        <a
          href="/privacy"
          className="text-[8px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Privacy Policy
        </a>
        <a
          href="/terms"
          className="text-[8px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Terms of Service
        </a>
        <a
          href="mailto:hello@usepaletta.io"
          className="text-[8px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Contact
        </a>
      </nav>

      {/* Attribution — hidden on very small screens */}
      <a
        href="https://andresclavijo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:block text-[8px] font-normal no-underline transition-colors hover:underline"
        style={{ color: '#666666' }}
      >
        Made by Andres Clavijo
      </a>
    </footer>
  )
}
