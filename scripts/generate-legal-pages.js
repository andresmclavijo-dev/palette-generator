import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const legalDir = resolve(__dirname, '..', 'legal-html')
const pagesDir = resolve(__dirname, '..', 'src', 'pages')

const pages = [
  {
    htmlFile: 'privacy-policy.html',
    component: 'PrivacyPolicy',
    outputFile: 'PrivacyPolicy.tsx',
    title: 'Privacy Policy',
  },
  {
    htmlFile: 'cookie-policy.html',
    component: 'CookiePolicy',
    outputFile: 'CookiePolicy.tsx',
    title: 'Cookie Policy',
  },
  {
    htmlFile: 'terms-of-service.html',
    component: 'TermsOfService',
    outputFile: 'TermsOfService.tsx',
    title: 'Terms of Service',
  },
]

for (const page of pages) {
  const html = readFileSync(resolve(legalDir, page.htmlFile), 'utf-8')
  // Escape backticks and ${} for template literal safety
  const escaped = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  const tsx = `import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const CONTENT = \`${escaped}\`

export default function ${page.component}() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>
        <nav style={{ marginBottom: 24 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6C47FF',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Paletta
          </Link>
        </nav>
        <div
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: CONTENT }}
        />
      </div>
    </div>
  )
}
`

  writeFileSync(resolve(pagesDir, page.outputFile), tsx)
  console.log(`✓ ${page.outputFile}`)
}

console.log('Done — legal page components generated.')
