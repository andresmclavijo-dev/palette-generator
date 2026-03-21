// Vercel Edge Middleware (no Next.js dependency — standard Web APIs only)
export const config = {
  matcher: '/',
}

export default function middleware(request: Request) {
  const url = new URL(request.url)
  const palette = url.searchParams.get('p')
  if (!palette) return

  const ua = request.headers.get('user-agent') || ''
  const isBot =
    /facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot|WhatsApp|TelegramBot/i.test(ua)
  if (!isBot) return

  const ogImageUrl = `https://www.usepaletta.io/api/og?p=${palette}`
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Paletta — Color Palette</title>
  <meta property="og:title" content="Paletta — Color Palette" />
  <meta property="og:description" content="AI-powered color palette generator with accessibility built in" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=https://www.usepaletta.io/?p=${palette}" />
</head>
<body></body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
