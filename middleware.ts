import { NextRequest, NextResponse } from 'next/server'

export const config = { matcher: '/' }

export default function middleware(req: NextRequest) {
  const palette = req.nextUrl.searchParams.get('p')
  if (!palette) return NextResponse.next()

  // Only intercept for known social bot user agents
  const ua = req.headers.get('user-agent') || ''
  const isBot =
    /facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot|WhatsApp|TelegramBot/i.test(ua)
  if (!isBot) return NextResponse.next()

  // Serve minimal HTML with dynamic OG tags pointing to the palette's OG image
  const ogImageUrl = `https://www.usepaletta.io/api/og?p=${encodeURIComponent(palette)}`
  const pageUrl = `https://www.usepaletta.io/?p=${encodeURIComponent(palette)}`
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Paletta — Color Palette</title>
  <meta property="og:title" content="Paletta — Color Palette" />
  <meta property="og:description" content="AI-powered color palette generator with accessibility built in" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Paletta — Color Palette" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body></body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
