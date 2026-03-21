import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePro } from '@/hooks/usePro'
import { createPortalSession } from '@/lib/stripe'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'

export function MobileProfile() {
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const { isPro } = usePro()
  const [proOpen, setProOpen] = useState(false)

  const handleManageSubscription = async () => {
    if (!user?.email) { showToast('Contact support'); return }
    try {
      const url = await createPortalSession(user.email)
      window.location.href = url
    } catch {
      showToast('Contact support')
    }
  }

  // Signed out
  if (!isSignedIn) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* App icon */}
          <div
            className="flex items-center justify-center rounded-3xl mb-6"
            style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #A78BFA 100%)',
            }}
          >
            <span className="text-white text-[32px] font-extrabold">P</span>
          </div>

          <h2 className="text-xl font-extrabold text-foreground mb-1">Welcome to Paletta</h2>
          <p className="text-[15px] text-foreground/60 text-center leading-relaxed mb-6 max-w-[280px]">
            Sign in to save palettes, sync across devices, and unlock Pro features.
          </p>

          <Button
            onClick={async () => {
              analytics.track('sign_in_clicked', { source: 'mobile_profile' })
              const { error } = await signInWithGoogle()
              if (error) showToast('Sign-in failed')
            }}
            className="h-[52px] rounded-[14px] px-8 text-[15px] font-bold shadow-lg w-full max-w-[280px]"
            style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.3)' }}
          >
            Continue with Google
          </Button>

          <button
            onClick={() => { analytics.track('pro_modal_opened', { source: 'mobile_profile' }); setProOpen(true) }}
            className="mt-4 text-[13px] font-medium text-primary transition-colors"
          >
            See what's in Pro →
          </button>
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 pb-6">
          <Link to="/privacy" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Terms</Link>
          <Link to="/cookies" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Cookies</Link>
        </div>

        <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} />
      </div>
    )
  }

  // Signed in
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-4 pt-6">
        {/* User info */}
        <div className="flex items-center gap-3.5 mb-6">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-xl"
              style={{ width: 56, height: 56 }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="text-[16px] font-bold text-foreground">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-[13px] text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        {/* Pro status */}
        {isPro ? (
          <div className="bg-surface rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="pro" className="text-[10px] font-bold px-2">✦ PRO</Badge>
              <span className="text-[13px] font-medium text-foreground">Active subscription</span>
            </div>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="w-full h-10 rounded-button text-[13px]"
            >
              Manage subscription
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => { analytics.track('pro_modal_opened', { source: 'mobile_profile' }); setProOpen(true) }}
            className="w-full h-12 rounded-xl text-[15px] font-bold shadow-lg mb-4"
            style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.25)' }}
          >
            Upgrade to Pro
          </Button>
        )}

        {/* Sign out */}
        <button
          onClick={async () => {
            await signOut()
            showToast('Signed out')
          }}
          className="w-full text-center py-3 text-[14px] font-medium text-destructive transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Legal links */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <Link to="/privacy" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Privacy</Link>
        <Link to="/terms" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Terms</Link>
        <Link to="/cookies" className="text-[11px] text-muted hover:text-muted-foreground transition-colors">Cookies</Link>
      </div>

      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  )
}
