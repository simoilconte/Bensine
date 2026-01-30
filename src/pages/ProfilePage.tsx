import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { User, Shield, Users, Settings, LogOut, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { api } from "@convex/_generated/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@convex/_generated/dataModel"

interface AppUser {
  _id: string
  email?: string
  name?: string
  role: string
  customerId?: string
  customerName?: string | null
  privileges?: Record<string, boolean>
  createdAt: number
}

interface Customer {
  _id: string
  displayName: string
  type: string
}

export function ProfilePage() {
  const { user, token, signOut, isAdmin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const users = useQuery(api.users.adminListUsers, isAdmin && token ? { token } : "skip")
  const customers = useQuery(api.customers.list, token ? { token } : "skip")
  const setUserRole = useMutation(api.users.adminSetUserRole)

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

  const handleRoleChange = async () => {
    if (!token || !selectedUser || !newRole) return

    setIsSubmitting(true)
    try {
      await setUserRole({
        token,
        userId: selectedUser._id as Id<"appUsers">,
        role: newRole as "ADMIN" | "BENZINE" | "CLIENTE",
        customerId: newRole === "CLIENTE" ? selectedUser.customerId : undefined,
      })

      toast({
        title: "Ruolo aggiornato",
        description: `${selectedUser.name || selectedUser.email} è ora ${getRoleLabel(newRole)}`,
      })
      setIsUserDialogOpen(false)
      setSelectedUser(null)
      setNewRole("")
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Amministratore"
      case "BENZINE": return "Dipendente"
      case "CLIENTE": return "Cliente"
      default: return role
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      "ADMIN": "default",
      "BENZINE": "secondary",
      "CLIENTE": "outline",
    }
    return <Badge variant={variants[role] || "outline"}>{getRoleLabel(role)}</Badge>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {user.name || user.email}
              </h1>
              <p className="text-gray-500">{user.email}</p>
              <div className="mt-2">
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permessi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.role === "ADMIN" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Accesso completo al sistema
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Gestione utenti e ruoli
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Configurazione condivisioni cliente
              </div>
            </>
          )}
          {user.role === "BENZINE" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Gestione clienti e veicoli
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                Gestione ricambi e richieste
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">✗</span>
                Gestione utenti e ruoli
              </div>
            </>
          )}
          {user.role === "CLIENTE" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-500">👁</span>
                Visualizzazione dati propri (solo lettura)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">✗</span>
                Modifica dati
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin: User Management */}
      {isAdmin && users && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestione Utenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((u: AppUser) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedUser(u)
                  setNewRole(u.role)
                  setIsUserDialogOpen(true)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{u.name || u.email}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(u.role)}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Versione</span>
              <span>1.0.0 MVP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span>Convex</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Esci
      </Button>

      {/* User Role Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifica Ruolo</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Amministratore</SelectItem>
                  <SelectItem value="BENZINE">Dipendente</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRole === "CLIENTE" && (
              <div className="space-y-2">
                <Label>Cliente collegato</Label>
                <Select 
                  value={selectedUser?.customerId || ""} 
                  onValueChange={(v) => setSelectedUser({ ...selectedUser, customerId: v })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c: Customer) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Il cliente potrà vedere solo i dati del cliente selezionato
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsUserDialogOpen(false)}
                className="h-11"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleRoleChange} 
                disabled={isSubmitting || !newRole}
                className="h-11"
              >
                {isSubmitting ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
