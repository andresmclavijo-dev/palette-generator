import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' })

  let event: Stripe.Event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return res.status(400).json({ error: `Webhook Error: ${message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id

    if (!userId) {
      console.error('No client_reference_id on checkout session', session.id)
      return res.status(200).json({ received: true, warning: 'no client_reference_id' })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId)

    if (error) {
      console.error('Supabase update failed:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    console.log(`User ${userId} upgraded to Pro via session ${session.id}`)
  }

  return res.status(200).json({ received: true })
}
