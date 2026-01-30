import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Users, Package, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/BrandMark"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { TopBar } from "@/components/layout/TopBar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/lib/auth-context"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { canEdit } = useAuth()

  const getPageTitle = () => {
    if (location.pathname === "/clienti") return "Clienti"
    if (location.pathname.startsWith("/clienti/")) return "Dettaglio Cliente"
    if (location.pathname === "/ricambi") return "Ricambi"
    if (location.pathname === "/profilo") return "Profilo"
    return "Bensine CRM"
  }

  const showFab = canEdit && (
    location.pathname === "/clienti" || 
    location.pathname === "/ricambi"
  )

  const handleFabClick = () => {
    // FAB opens a dialog/sheet for new customer or new part request
    // This will be handled by the page components
    const event = new CustomEvent("fab-click", { detail: { path: location.pathname } })
    window.dispatchEvent(event)
  }

  return (
    <div className="min-h-screen brand-bg">
      <TopBar title={getPageTitle()} />

      <div className="flex">
        {/* Desktop Sidebar */}
        {isDesktop && (
          <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white shadow-brand hidden md:block">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-8">
                <img 
                  src="/logo.png" 
                  alt="Bensine" 
                  className="h-12 w-12 rounded-full ring-2 ring-brand-orange/30 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <BrandMark size="md" className="hidden" />
                <div>
                  <span className="brand-section-title text-xl">Bensine</span>
                  <p className="text-xs text-slate-500">CRM Officina</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Button
                  variant={location.pathname.startsWith("/clienti") ? "default" : "ghost"}
                  className="w-full justify-start h-11"
                  onClick={() => navigate("/clienti")}
                >
                  <Users className="mr-3 h-5 w-5" />
                  Clienti
                </Button>
                
                <Button
                  variant={location.pathname === "/ricambi" ? "default" : "ghost"}
                  className="w-full justify-start h-11"
                  onClick={() => navigate("/ricambi")}
                >
                  <Package className="mr-3 h-5 w-5" />
                  Ricambi
                </Button>
                
                <Button
                  variant={location.pathname === "/profilo" ? "default" : "ghost"}
                  className="w-full justify-start h-11"
                  onClick={() => navigate("/profilo")}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profilo
                </Button>
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-6">
          <div className="brand-container">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isDesktop && <BottomNavigation />}

      {/* Mobile FAB */}
      {!isDesktop && showFab && (
        <div className="fixed bottom-24 right-4 z-40">
          <button
            className="brand-btn-primary h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
            onClick={handleFabClick}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  )
}
