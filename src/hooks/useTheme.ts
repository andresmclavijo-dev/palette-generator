import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'paletta-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    // Migrate legacy "system" preference to "light"
    if (!stored || stored === 'system') return 'light'
    return stored
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, resolved: resolve(theme), setTheme }
}
