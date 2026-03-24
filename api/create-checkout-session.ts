import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { priceId, userId, userEmail } = req.body as {
      priceId: string
      userId?: string
      userEmail?: string
    }

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' })
    }

    // Look up existing Stripe customer by email, or create new one
    let customerId: string | undefined
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 })
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const customer = await stripe.customers.create({ email: userEmail })
        customerId = customer.id
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: userId ? { supabase_user_id: userId } : undefined,
      client_reference_id: userId || undefined,
      success_url: 'https://www.usepaletta.io/?checkout=success',
      cancel_url: 'https://www.usepaletta.io/?checkout=cancelled',
      allow_promotion_codes: true,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[API_ERROR]', {
      route: '/api/create-checkout-session',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
      timestamp: new Date().toISOString(),
    })
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
