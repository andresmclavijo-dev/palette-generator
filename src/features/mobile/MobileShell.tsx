import { useState } from 'react'
import { MobileStudio } from './MobileStudio'
import { MobilePreview } from './MobilePreview'
import { MobileLibrary } from './MobileLibrary'
import { MobileProfile } from './MobileProfile'
import { MobileTabBar } from './MobileTabBar'
import CookieConsent from '@/components/CookieConsent'
import { OnboardingTour } from '@/components/OnboardingTour'
import { usePro } from '@/hooks/usePro'

export type MobileTab = 'studio' | 'preview' | 'library' | 'profile'

export function MobileShell() {
  const [tab, setTab] = useState<MobileTab>('studio')
  const { isPro } = usePro()

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <CookieConsent compact />
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'studio' && <MobileStudio onNavigate={setTab} />}
        {tab === 'preview' && <MobilePreview />}
        {tab === 'library' && <MobileLibrary onNavigate={setTab} />}
        {tab === 'profile' && <MobileProfile />}
      </div>
      <MobileTabBar activeTab={tab} onTabChange={setTab} />
      <OnboardingTour isPro={isPro} />
    </div>
  )
}
