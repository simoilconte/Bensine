import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { Search, Plus, User, Users, Building2, Phone, Car, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { api } from "@convex/_generated/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/PageHeader"

export function CustomersPage() {
  const [searchText, setSearchText] = useState("")
  const [selectedType, setSelectedType] = useState<"PRIVATO" | "AZIENDA" | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formType, setFormType] = useState<"PRIVATO" | "AZIENDA">("PRIVATO")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [ragioneSociale, setRagioneSociale] = useState("")
  const [piva, setPiva] = useState("")
  const [referenteNome, setReferenteNome] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  const { token, canEdit } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const customers = useQuery(api.customers.list, token ? {
    token,
    searchText: searchText || undefined,
    type: selectedType === "all" ? undefined : selectedType,
  } : "skip")

  const createCustomer = useMutation(api.customers.create)

  // Listen for FAB click
  useEffect(() => {
    const handleFabClick = (e: CustomEvent) => {
      if (e.detail.path === "/clienti" && canEdit) {
        setIsDialogOpen(true)
      }
    }
    window.addEventListener("fab-click", handleFabClick as EventListener)
    return () => window.removeEventListener("fab-click", handleFabClick as EventListener)
  }, [canEdit])

  const resetForm = () => {
    setFormType("PRIVATO")
    setFirstName("")
    setLastName("")
    setRagioneSociale("")
    setPiva("")
    setReferenteNome("")
    setPhone("")
    setEmail("")
    setAddress("")
    setNotes("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsSubmitting(true)
    try {
      const displayName = formType === "PRIVATO" 
        ? `${firstName} ${lastName}`.trim()
        : ragioneSociale

      await createCustomer({
        token,
        type: formType,
        displayName,
        privateFields: formType === "PRIVATO" ? { firstName, lastName } : undefined,
        companyFields: formType === "AZIENDA" ? { 
          ragioneSociale, 
          piva, 
          referenteNome: referenteNome || undefined 
        } : undefined,
        contacts: {
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
        },
        notes: notes || undefined,
      })

      toast({
        title: "Cliente creato",
        description: `${displayName} è stato aggiunto con successo`,
      })
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (customers === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento clienti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader 
        icon={Users} 
        title="Clienti" 
        subtitle="Gestisci i tuoi clienti e le loro informazioni"
      />

      {canEdit && (
        <button onClick={() => setIsDialogOpen(true)} className="brand-btn-primary w-full hidden md:flex items-center justify-center">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Cliente
        </button>
      )}

      {/* Search and Filters */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca cliente..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="brand-input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                className={selectedType === "all" ? "brand-btn-primary px-4" : "brand-btn-outline px-4"}
                onClick={() => setSelectedType("all")}
              >
                Tutti
              </button>
              <button
                className={selectedType === "PRIVATO" ? "brand-btn-primary px-4" : "brand-btn-outline px-4"}
                onClick={() => setSelectedType("PRIVATO")}
              >
                <User className="h-4 w-4" />
              </button>
              <button
                className={selectedType === "AZIENDA" ? "brand-btn-primary px-4" : "brand-btn-outline px-4"}
                onClick={() => setSelectedType("AZIENDA")}
              >
                <Building2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <button onClick={() => setIsDialogOpen(true)} className="brand-btn-primary w-full md:hidden">
          <Plus className="mr-2 h-4 w-4 inline" />
          Nuovo Cliente
        </button>
      )}

      {/* Customers List */}
      <div className="space-y-3">
        {customers?.map((customer) => (
          <Card
            key={customer._id}
            className="brand-card cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
            onClick={() => navigate(`/clienti/${customer._id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    customer.type === "PRIVATO" ? "bg-blue-100" : "bg-purple-100"
                  }`}>
                    {customer.type === "PRIVATO" ? (
                      <User className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {customer.displayName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {customer.contacts?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.contacts.phone}
                        </span>
                      )}
                      {customer.vehicleCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {customer.vehicleCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers?.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun cliente trovato
            </h3>
            <p className="text-gray-600">
              {searchText || selectedType !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Inizia aggiungendo il tuo primo cliente"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Cliente</DialogTitle>
            <DialogDescription>
              Inserisci i dati del nuovo cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo cliente</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as "PRIVATO" | "AZIENDA")}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATO">Privato</SelectItem>
                  <SelectItem value="AZIENDA">Azienda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formType === "PRIVATO" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ragioneSociale">Ragione Sociale *</Label>
                  <Input
                    id="ragioneSociale"
                    value={ragioneSociale}
                    onChange={(e) => setRagioneSociale(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="piva">Partita IVA *</Label>
                    <Input
                      id="piva"
                      value={piva}
                      onChange={(e) => setPiva(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referenteNome">Referente</Label>
                    <Input
                      id="referenteNome"
                      value={referenteNome}
                      onChange={(e) => setReferenteNome(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11"
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-11">
                {isSubmitting ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
