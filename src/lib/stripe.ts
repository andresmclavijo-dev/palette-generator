import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID as string
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID as string

const PAYMENT_LINK_MONTHLY = `https://buy.stripe.com/test_28E3cvem8b9L4uS9qF0VO00`
const PAYMENT_LINK_YEARLY = `https://buy.stripe.com/test_dRm28rb9WelX0eCcCR0VO01`

export function getCheckoutUrl(plan: 'monthly' | 'yearly', userId?: string): string {
  const base = plan === 'monthly' ? PAYMENT_LINK_MONTHLY : PAYMENT_LINK_YEARLY
  if (userId) return `${base}?client_reference_id=${encodeURIComponent(userId)}`
  return base
}

export { MONTHLY_PRICE_ID, YEARLY_PRICE_ID }
