import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserCircle, LogOut, User, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/BrandMark"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { user, token, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isChangingRole, setIsChangingRole] = useState(false)
  const setUserRole = useMutation(api.users.adminSetUserRole)
  
  const isDev = import.meta.env?.DEV || false

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Disconnesso",
        description: "A presto!",
      })
      navigate("/login")
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la disconnessione",
        variant: "destructive",
      })
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin"
      case "BENZINE": return "Dipendente"
      case "CLIENTE": return "Cliente"
      default: return role
    }
  }

  const handleDevRoleChange = async (newRole: "ADMIN" | "BENZINE" | "CLIENTE") => {
    if (!token || !user) return
    
    setIsChangingRole(true)
    try {
      await setUserRole({
        token,
        userId: user._id as any,
        role: newRole,
      })
      toast({
        title: "Ruolo cambiato",
        description: `Ora sei ${getRoleLabel(newRole)}`,
      })
      // Ricarica la pagina per aggiornare i permessi
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile cambiare ruolo",
        variant: "destructive",
      })
    } finally {
      setIsChangingRole(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Bensine" 
            className="h-10 w-10 rounded-full ring-2 ring-brand-orange/30 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <BrandMark size="sm" className="hidden" />
          <div>
            <span className="brand-section-title text-xl">
              {isDesktop ? "Bensine CRM" : title}
            </span>
            {isDesktop && (
              <p className="text-xs text-slate-500">Gestione Officina</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-orange-600" />
                </div>
                {isDesktop && (
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.name || user?.email}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(user?.role || "")}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user?.role || "")}</p>
              </div>
              <DropdownMenuSeparator />
              
              {isDev && (
                <>
                  <DropdownMenuLabel className="text-xs text-orange-600 flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    DEV: Cambia Ruolo
                  </DropdownMenuLabel>
                  <div className="px-2 py-2">
                    <Select
                      value={user?.role}
                      onValueChange={(value) => handleDevRoleChange(value as any)}
                      disabled={isChangingRole}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="BENZINE">Dipendente</SelectItem>
                        <SelectItem value="CLIENTE">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => navigate("/profilo")}>
                <User className="mr-2 h-4 w-4" />
                Profilo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="brand-accent-line" />
    </header>
  )
}
