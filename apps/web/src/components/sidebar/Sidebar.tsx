import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarProvider'
import { SidebarContent } from './SidebarContent'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { isOpen, isMobile, closeSidebar } = useSidebar()

  if (isMobile) {
    return null
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 md:hidden cursor-default"
          onClick={closeSidebar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeSidebar()
            }
          }}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 transform border-r bg-background transition-transform duration-300 ease-in-out shadow-lg',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}