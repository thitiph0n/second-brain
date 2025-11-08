import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isMobile: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
  resetSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Initialize from localStorage on server-side safe way
    if (typeof window === 'undefined') return false

    const isMobile = window.innerWidth < 768
    if (isMobile) return false

    const savedState = localStorage.getItem('sidebar-open')
    return savedState !== null ? JSON.parse(savedState) : false
  })
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize mobile state
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768
      setIsMobile(newIsMobile)

      // Only load from localStorage on desktop and if not initialized
      if (!newIsMobile && !isInitialized) {
        const savedState = localStorage.getItem('sidebar-open')
        if (savedState !== null) {
          setIsOpen(JSON.parse(savedState))
        }
        setIsInitialized(true)
      } else if (newIsMobile) {
        // Always close on mobile
        setIsOpen(false)
        setIsInitialized(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isInitialized])

  useEffect(() => {
    // Only save to localStorage after initialization
    if (isInitialized && !isMobile) {
      localStorage.setItem('sidebar-open', JSON.stringify(isOpen))
    }
  }, [isOpen, isMobile, isInitialized])

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    // Force save to localStorage immediately
    if (!isMobile) {
      localStorage.setItem('sidebar-open', JSON.stringify(newState))
    }
  }

  const closeSidebar = () => setIsOpen(false)
  const openSidebar = () => setIsOpen(true)
  const resetSidebar = () => {
    setIsOpen(true)
    localStorage.removeItem('sidebar-open')
  }

  const value = {
    isOpen,
    isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    resetSidebar,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}