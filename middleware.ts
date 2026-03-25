// Vercel Edge Middleware (no Next.js dependency — standard Web APIs only)
export const config = {
  matcher: '/',
}

export default function middleware(request: Request) {
  const url = new URL(request.url)

  // Support both ?p=AA-BB-CC (app format) and ?colors=AA,BB,CC (legacy/manual)
  let palette = url.searchParams.get('p')
  if (!palette) {
    const colors = url.searchParams.get('colors')
    if (colors) {
      // Convert comma-separated to dash-separated (canonical format)
      palette = colors.replace(/,/g, '-')
    }
  }
  if (!palette) return

  const ua = request.headers.get('user-agent') || ''
  const isBot =
    /facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot|WhatsApp|TelegramBot/i.test(ua)
  if (!isBot) return

  const canonicalUrl = `https://www.usepaletta.io/?p=${palette}`
  const ogImageUrl = `https://www.usepaletta.io/api/og?p=${palette}`
  const colorList = palette.replace(/-/g, ', #')
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Paletta — Color Palette</title>
  <meta property="og:title" content="Paletta — Color Palette" />
  <meta property="og:description" content="Color palette: #${colorList} — Generated with Paletta" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Paletta — Color Palette" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body></body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
