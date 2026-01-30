import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Users, Package, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    {
      href: "/clienti",
      icon: Users,
      label: "Clienti",
      active: location.pathname.startsWith("/clienti"),
    },
    {
      href: "/ricambi",
      icon: Package,
      label: "Ricambi",
      active: location.pathname === "/ricambi",
    },
    {
      href: "/profilo",
      icon: User,
      label: "Profilo",
      active: location.pathname === "/profilo",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-t shadow-brand pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all min-w-[72px] relative",
                item.active 
                  ? "text-brand-greenDark" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {item.active && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-orange rounded-full" />
              )}
              <Icon className={cn("h-6 w-6", item.active && "text-brand-greenDark")} />
              <span className={cn(
                "text-xs mt-1 font-medium",
                item.active ? "text-brand-greenDark" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
