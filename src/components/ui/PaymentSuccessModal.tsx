import { supabase } from '../../lib/supabase'
import { BRAND_BLUE } from '../../lib/tokens'

interface PaymentSuccessModalProps {
  open: boolean
  onClose: () => void
}

export default function PaymentSuccessModal({ open, onClose }: PaymentSuccessModalProps) {
  if (!open) return null

  const handleGoogleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        className="relative max-w-sm w-[90vw] bg-card rounded-card shadow-xl overflow-hidden p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 id="payment-success-title" className="text-2xl font-extrabold text-foreground">You're now a Pro!</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in with Google to access all Pro features</p>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light my-5" />

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-3 w-full h-11 rounded-button text-primary-foreground text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Use the same email you used at checkout
        </p>
      </div>
    </div>
  )
}
