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
      <div />

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
