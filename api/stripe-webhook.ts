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

async function upgradeByUserId(userId: string, sessionId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('id', userId)

  if (error) {
    console.error('Supabase update by userId failed:', error)
    return false
  }
  console.log(`User ${userId} upgraded to Pro via session ${sessionId}`)
  return true
}

async function upgradeByEmail(email: string, sessionId: string) {
  // Try to find existing profile by email
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', existing.id)

    if (error) {
      console.error('Supabase update by email failed:', error)
      return false
    }
    console.log(`User ${existing.id} (${email}) upgraded to Pro via session ${sessionId}`)
    return true
  }

  // No existing profile — create one
  const { error } = await supabase
    .from('profiles')
    .insert({ email, is_pro: true })

  if (error) {
    console.error('Supabase insert for new email failed:', error)
    return false
  }
  console.log(`New profile created for ${email} as Pro via session ${sessionId}`)
  return true
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
    console.error('[API_ERROR]', {
      route: '/api/stripe-webhook',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
      context: 'signature_verification',
      timestamp: new Date().toISOString(),
    })
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(400).json({ error: `Webhook Error: ${message}` })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      const email = session.customer_details?.email

      // Signed-in user: match by Supabase user ID
      if (userId) {
        const ok = await upgradeByUserId(userId, session.id)
        if (!ok) return res.status(500).json({ error: 'Failed to update profile' })
        return res.status(200).json({ received: true })
      }

      // Signed-out user: match by email from Stripe checkout
      if (email) {
        const ok = await upgradeByEmail(email, session.id)
        if (!ok) return res.status(500).json({ error: 'Failed to update profile' })
        return res.status(200).json({ received: true })
      }

      console.error('No client_reference_id or email on checkout session', session.id)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const isActive = ['active', 'trialing'].includes(subscription.status)

      // Look up customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) break

      const email = customer.email
      if (!email) {
        console.error('No email on Stripe customer', customerId)
        break
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ is_pro: isActive })
          .eq('id', profile.id)

        console.log(`Subscription ${subscription.id} updated → is_pro=${isActive} for ${email}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) break

      const email = customer.email
      if (!email) {
        console.error('No email on Stripe customer', customerId)
        break
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ is_pro: false })
          .eq('id', profile.id)

        console.log(`Subscription ${subscription.id} cancelled → is_pro=false for ${email}`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) break

      console.error(`Payment failed for customer ${customerId} (${customer.email}), invoice ${invoice.id}`)
      // Note: Don't immediately revoke Pro — Stripe retries failed payments.
      // Revocation happens via subscription.deleted after all retries fail.
      break
    }
  }

  return res.status(200).json({ received: true })
}
