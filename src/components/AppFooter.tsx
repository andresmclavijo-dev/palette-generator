import { Link } from 'react-router-dom'

export default function AppFooter() {
  return (
    <footer
      className="flex-none hidden sm:flex items-center justify-between bg-card"
      style={{
        height: 32,
        padding: '0 20px',
      }}
    >
      <nav className="flex items-center gap-3" aria-label="Legal">
        <Link
          to="/privacy-policy"
          className="text-[10px] font-normal no-underline transition-colors hover:underline text-muted"
        >
          Privacy Policy
        </Link>
        <span className="text-[10px] text-border" aria-hidden="true">&middot;</span>
        <Link
          to="/cookie-policy"
          className="text-[10px] font-normal no-underline transition-colors hover:underline text-muted"
        >
          Cookie Policy
        </Link>
        <span className="text-[10px] text-border" aria-hidden="true">&middot;</span>
        <Link
          to="/terms-of-service"
          className="text-[10px] font-normal no-underline transition-colors hover:underline text-muted"
        >
          Terms of Service
        </Link>
        <span className="text-[10px] text-border" aria-hidden="true">&middot;</span>
        <a
          href="mailto:hello@usepaletta.io"
          className="text-[10px] font-normal no-underline transition-colors hover:underline text-muted"
        >
          Contact
        </a>
      </nav>

      {/* Attribution */}
      <a
        href="https://andresclavijo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-normal no-underline transition-colors hover:underline text-muted"
      >
        Made by Andres Clavijo
      </a>
    </footer>
  )
}
