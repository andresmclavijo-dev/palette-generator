import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    // Always derive email from authenticated user — never trust client-sent customerId
    const email = user.email
    if (!email) {
      return res.status(400).json({ error: 'No email on authenticated user' })
    }

    // Look up Stripe customer by verified email only
    const existing = await stripe.customers.list({ email, limit: 1 })
    const stripeCustomerId = existing.data[0]?.id

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: 'https://www.usepaletta.io',
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[API_ERROR]', {
      route: '/api/create-portal-session',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
      timestamp: new Date().toISOString(),
    })
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
