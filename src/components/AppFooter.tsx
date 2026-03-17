import { Link } from 'react-router-dom'

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
      <nav className="flex items-center gap-3" aria-label="Legal">
        <Link
          to="/privacy-policy"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#bbbbbb' }}
        >
          Privacy Policy
        </Link>
        <span className="text-[10px]" style={{ color: '#d4d4d4' }} aria-hidden="true">&middot;</span>
        <Link
          to="/cookie-policy"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#bbbbbb' }}
        >
          Cookie Policy
        </Link>
        <span className="text-[10px]" style={{ color: '#d4d4d4' }} aria-hidden="true">&middot;</span>
        <Link
          to="/terms-of-service"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#bbbbbb' }}
        >
          Terms of Service
        </Link>
        <span className="text-[10px]" style={{ color: '#d4d4d4' }} aria-hidden="true">&middot;</span>
        <a
          href="mailto:hello@usepaletta.io"
          className="text-[10px] font-normal no-underline transition-colors hover:underline"
          style={{ color: '#bbbbbb' }}
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
