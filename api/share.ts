import type { VercelRequest, VercelResponse } from '@vercel/node'

const BOT_UA = /Twitterbot|Slackbot|facebookexternalhit|LinkedInBot|Discordbot|WhatsApp|TelegramBot|Googlebot|bingbot|Pinterestbot|redditbot/i

const BASE_URL = 'https://www.usepaletta.io'

function parseColors(param: string | undefined | null): string | null {
  if (!param) return null
  const parts = param.split('-')
  if (parts.length < 3 || parts.length > 8) return null
  if (!parts.every(p => /^[0-9a-fA-F]{6}$/.test(p))) return null
  return parts.map(p => p.toUpperCase()).join('-')
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = (req.query.p as string) || ''
  const colors = parseColors(raw)
  const spaUrl = colors ? `${BASE_URL}/?p=${colors}` : BASE_URL
  const ua = req.headers['user-agent'] || ''

  // Non-bot: redirect to SPA immediately
  if (!BOT_UA.test(ua)) {
    res.writeHead(302, { Location: spaUrl })
    res.end()
    return
  }

  // Bot: serve HTML with OG meta tags
  const ogImage = colors
    ? `${BASE_URL}/api/og?p=${colors}`
    : `${BASE_URL}/api/og`

  const hexList = colors
    ? colors.split('-').map(h => `#${h}`).join(', ')
    : 'Custom color palette'

  const title = 'Paletta — Color Palette'
  const description = colors
    ? `Color palette: ${hexList}`
    : 'Create beautiful color palettes with Paletta'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${spaUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Paletta" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${ogImage}" />
<link rel="canonical" href="${spaUrl}" />
<meta http-equiv="refresh" content="0;url=${spaUrl}" />
</head>
<body><p>Redirecting to <a href="${spaUrl}">Paletta</a>...</p></body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400')
  res.status(200).send(html)
}
