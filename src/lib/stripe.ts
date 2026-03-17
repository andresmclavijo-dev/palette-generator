import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID as string
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID as string

export { MONTHLY_PRICE_ID, YEARLY_PRICE_ID }

/**
 * Create a Stripe Checkout session via our API and return the URL.
 */
export async function createCheckoutSession(
  plan: 'monthly' | 'yearly',
  userId?: string,
  userEmail?: string,
): Promise<string> {
  const priceId = plan === 'monthly' ? MONTHLY_PRICE_ID : YEARLY_PRICE_ID

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userId, userEmail }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || 'Failed to create checkout session')
  }

  const { url } = await res.json()
  return url
}

/**
 * Create a Stripe Customer Portal session and return the URL.
 */
export async function createPortalSession(email: string): Promise<string> {
  const res = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || 'Failed to create portal session')
  }

  const { url } = await res.json()
  return url
}
