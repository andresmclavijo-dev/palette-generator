import { useState } from 'react'
import { MobileStudio } from './MobileStudio'
import { MobileLibrary } from './MobileLibrary'
import { MobileProfile } from './MobileProfile'
import { MobileTabBar } from './MobileTabBar'
import CookieConsent from '@/components/CookieConsent'

export type MobileTab = 'studio' | 'library' | 'profile'

export function MobileShell() {
  const [tab, setTab] = useState<MobileTab>('studio')

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <CookieConsent />
      <div className="flex-1 overflow-hidden">
        {tab === 'studio' && <MobileStudio onNavigate={setTab} />}
        {tab === 'library' && <MobileLibrary onNavigate={setTab} />}
        {tab === 'profile' && <MobileProfile />}
      </div>
      <MobileTabBar activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
