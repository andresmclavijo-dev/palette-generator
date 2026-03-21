import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePro } from '@/hooks/usePro'
import { usePaletteStore } from '@/store/paletteStore'
import { createPortalSession } from '@/lib/stripe'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'

export function MobileProfile() {
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const { isPro } = usePro()
  const { swatches } = usePaletteStore()
  const [proOpen, setProOpen] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { count } = await supabase
          .from('saved_palettes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setSavedCount(count ?? 0)
      } catch { /* silent */ }
    })()
  }, [user])

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
            size="lg"
            onClick={async () => {
              analytics.track('sign_in_clicked', { source: 'mobile_profile' })
              const { error } = await signInWithGoogle()
              if (error) showToast('Sign-in failed')
            }}
            className="w-full max-w-[280px] shadow-lg"
            style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.3)' }}
          >
            Continue with Google
          </Button>

          <Button
            variant="link"
            onClick={() => { analytics.track('pro_modal_opened', { source: 'mobile_profile' }); setProOpen(true) }}
            className="mt-4 text-[13px]"
          >
            See what's in Pro →
          </Button>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-2 mt-6 px-4 pb-6">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Legal</span>
          {[
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Cookie Policy', href: '/cookie-policy' },
            { label: 'Terms of Service', href: '/terms-of-service' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="mailto:hello@usepaletta.io"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </a>
          <p className="text-[11px] text-muted mt-3">
            Made by <a href="https://andresclavijo.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Andres Clavijo</a>
          </p>
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
              size="default"
              onClick={handleManageSubscription}
              className="w-full text-[13px]"
            >
              Manage subscription
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={() => { analytics.track('pro_modal_opened', { source: 'mobile_profile' }); setProOpen(true) }}
            className="w-full mb-4"
            style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.25)' }}
          >
            Upgrade to Pro
          </Button>
        )}

        {/* Quick stats */}
        <div className="bg-card border border-border/30 rounded-2xl p-4 mb-3">
          <div className="text-[13px] font-semibold text-foreground mb-2">Quick stats</div>
          <div className="flex justify-between">
            <div className="text-center flex-1">
              <div className="text-[20px] font-bold text-foreground">{savedCount}</div>
              <div className="text-[11px] text-muted-foreground">Saved</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[20px] font-bold text-foreground">{swatches.length}</div>
              <div className="text-[11px] text-muted-foreground">Colors</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[20px] font-bold text-primary">{isPro ? 'Pro' : 'Free'}</div>
              <div className="text-[11px] text-muted-foreground">Plan</div>
            </div>
          </div>
        </div>

        {/* Desktop features note */}
        <div className="bg-surface rounded-2xl p-4 mb-3 border border-border/20">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Some features like Shade Scales and Image Extraction are optimized for desktop. Visit usepaletta.io on your computer for the full experience.
          </p>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="default"
          onClick={async () => {
            await signOut()
            showToast('Signed out')
          }}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
        >
          Sign Out
        </Button>
      </div>

      {/* Legal */}
      <div className="flex flex-col gap-2 mt-6 px-4 pb-6">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Legal</span>
        {[
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Cookie Policy', href: '/cookie-policy' },
          { label: 'Terms of Service', href: '/terms-of-service' },
        ].map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
        <a
          href="mailto:hello@usepaletta.io"
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Contact
        </a>
        <p className="text-[11px] text-muted mt-3">
          Made by <a href="https://andresclavijo.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Andres Clavijo</a>
        </p>
      </div>

      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  )
}
