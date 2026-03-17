export default function AppFooter() {
  return (
    <footer
      className="flex-none hidden sm:flex items-center justify-between"
      style={{
        height: 32,
        background: '#FFFFFF',
        padding: '0 20px',
      }}
    >
      {/* Legal links */}
      <nav className="flex items-center" style={{ gap: 12 }} aria-label="Legal">
        <a
          href="/privacy"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Privacy Policy
        </a>
        <a
          href="/terms"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Terms of Service
        </a>
        <a
          href="mailto:hello@usepaletta.io"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#666666' }}
        >
          Contact
        </a>
      </nav>

      {/* Attribution */}
      <a
        href="https://andresclavijo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-normal no-underline transition-colors hover:underline"
        style={{ color: '#bbbbbb' }}
      >
        Made by Andres Clavijo
      </a>
    </footer>
  )
}
