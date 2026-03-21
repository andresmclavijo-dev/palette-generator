import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const GRAYS = ['#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#1F2937']

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Page Not Found — Paletta'
    return () => { document.title = 'Paletta — Free Color Palette Generator' }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Grayscale palette illustration */}
      <div className="flex gap-1.5 mb-8">
        {GRAYS.map((c, i) => (
          <div
            key={i}
            className="w-14 h-16 rounded-card"
            style={{ backgroundColor: c }}
            aria-hidden="true"
          />
        ))}
      </div>

      <h1 className="text-[48px] font-extrabold text-foreground tracking-tight mb-2">404</h1>
      <p className="text-[17px] font-semibold text-foreground mb-1">Color not found</p>
      <p className="text-[15px] text-muted-foreground mb-8">
        This page doesn't exist. Let's get you back to creating.
      </p>

      <Button size="lg" className="w-full max-w-[280px]" onClick={() => navigate('/')}>
        Generate a palette →
      </Button>
    </div>
  )
}
