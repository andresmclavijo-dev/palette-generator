import { create } from 'zustand'

interface ProState {
  isPro: boolean
  loading: boolean
  showPaymentModal: boolean
  fetched: boolean
  setIsPro: (v: boolean) => void
  setLoading: (v: boolean) => void
  setShowPaymentModal: (v: boolean) => void
  setFetched: (v: boolean) => void
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  loading: true,
  showPaymentModal: false,
  fetched: false,
  setIsPro: (isPro) => set({ isPro }),
  setLoading: (loading) => set({ loading }),
  setShowPaymentModal: (showPaymentModal) => set({ showPaymentModal }),
  setFetched: (fetched) => set({ fetched }),
}))
