import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { 
  Truck, Plus, Phone, Mail, MapPin, ChevronRight, 
  Edit, Trash2, Package, ArrowLeft
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@convex/_generated/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@convex/_generated/dataModel"

interface Supplier {
  _id: string
  companyName: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive: boolean
}

interface Part {
  _id: string
  name: string
  sku?: string
  oemCode?: string
  partPrice?: number
  laborPrice?: number
  stockQty: number
  createdAt: number
}

export function SuppliersPage() {
  const navigate = useNavigate()
  const { token, canEdit } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("active")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  const suppliers = useQuery(api.suppliers.list, token ? { 
    token,
    includeInactive: true 
  } : "skip")

  const createSupplier = useMutation(api.suppliers.create)
  const updateSupplier = useMutation(api.suppliers.update)
  const removeSupplier = useMutation(api.suppliers.remove)

  const activeSuppliers = suppliers?.filter((s: Supplier) => s.isActive) || []
  const inactiveSuppliers = suppliers?.filter((s: Supplier) => !s.isActive) || []

  const resetForm = () => {
    setCompanyName("")
    setContactName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setNotes("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !companyName.trim()) return

    setIsSubmitting(true)
    try {
      await createSupplier({
        token,
        companyName: companyName.trim(),
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
      })

      toast({
        title: "Fornitore aggiunto",
        description: `"${companyName}" aggiunto con successo`,
      })
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante la creazione"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedSupplier) return

    setIsSubmitting(true)
    try {
      await updateSupplier({
        token,
        supplierId: selectedSupplier._id as Id<"suppliers">,
        companyName: companyName.trim(),
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
      })

      toast({
        title: "Fornitore aggiornato",
        description: `"${companyName}" aggiornato con successo`,
      })
      setIsEditDialogOpen(false)
      setSelectedSupplier(null)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante l'aggiornamento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !selectedSupplier) return

    setIsSubmitting(true)
    try {
      const result = await removeSupplier({
        token,
        supplierId: selectedSupplier._id as Id<"suppliers">,
      })

      if ('deactivated' in result) {
        toast({
          title: "Disattivato",
          description: `"${selectedSupplier.companyName}" è in uso ed è stato disattivato`,
        })
      } else {
        toast({
          title: "Eliminato",
          description: `"${selectedSupplier.companyName}" eliminato`,
        })
      }
      setIsDeleteDialogOpen(false)
      setSelectedSupplier(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante l'eliminazione"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setCompanyName(supplier.companyName)
    setContactName(supplier.contactName || "")
    setPhone(supplier.phone || "")
    setEmail(supplier.email || "")
    setAddress(supplier.address || "")
    setNotes(supplier.notes || "")
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/profilo")} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Profilo
      </Button>

      {/* Header */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                Fornitori
              </h1>
              <p className="text-gray-500">
                Gestione anagrafica fornitori
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      {canEdit && (
        <Button 
          onClick={() => {
            resetForm()
            setIsAddDialogOpen(true)
          }} 
          className="w-full h-11"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Fornitore
        </Button>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Attivi ({activeSuppliers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex-1">
            Inattivi ({inactiveSuppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2">
          {activeSuppliers.map((supplier: Supplier) => (
            <SupplierCard
              key={supplier._id}
              supplier={supplier}
              onEdit={() => openEditDialog(supplier)}
              onDelete={() => {
                setSelectedSupplier(supplier)
                setIsDeleteDialogOpen(true)
              }}
              canEdit={canEdit}
              token={token}
            />
          ))}
          {activeSuppliers.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun fornitore attivo
                </h3>
                <p className="text-gray-600">
                  Aggiungi il tuo primo fornitore
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-2">
          {inactiveSuppliers.map((supplier: Supplier) => (
            <SupplierCard
              key={supplier._id}
              supplier={supplier}
              onEdit={() => openEditDialog(supplier)}
              onDelete={() => {
                setSelectedSupplier(supplier)
                setIsDeleteDialogOpen(true)
              }}
              canEdit={canEdit}
              token={token}
            />
          ))}
          {inactiveSuppliers.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Nessun fornitore inattivo</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Fornitore</DialogTitle>
            <DialogDescription>
              Inserisci i dati del fornitore
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome Azienda *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ricambi Auto Srl"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Nome Referente</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Mario Rossi"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
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
                  placeholder="email@esempio.com"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Roma 123, Milano"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                className="h-11"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Fornitore</DialogTitle>
            <DialogDescription>
              Modifica i dati del fornitore
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCompanyName">Nome Azienda *</Label>
              <Input
                id="editCompanyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ricambi Auto Srl"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editContactName">Nome Referente</Label>
              <Input
                id="editContactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Mario Rossi"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editPhone">Telefono</Label>
                <Input
                  id="editPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@esempio.com"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress">Indirizzo</Label>
              <Input
                id="editAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Roma 123, Milano"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Note</Label>
              <Input
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                className="h-11"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedSupplier(null)
                  resetForm()
                }}
                className="h-11"
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-11">
                {isSubmitting ? "Salvataggio..." : "Aggiorna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sei sicuro?</DialogTitle>
            <DialogDescription>
              {selectedSupplier?.isActive 
                ? `Se "${selectedSupplier?.companyName}" è in uso verrà disattivato, altrimenti eliminato.`
                : `"${selectedSupplier?.companyName}" sarà eliminato definitivamente.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedSupplier(null)
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleDelete}
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? "..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Supplier Card Component
function SupplierCard({ 
  supplier, 
  onEdit, 
  onDelete,
  canEdit,
  token
}: { 
  supplier: Supplier
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
  token: string | null
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const supplierDetails = useQuery(
    api.suppliers.get,
    token && isExpanded ? { token, supplierId: supplier._id as Id<"suppliers"> } : "skip"
  )

  return (
    <Card className={`rounded-2xl overflow-hidden ${!supplier.isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{supplier.companyName}</p>
                {supplier.contactName && (
                  <p className="text-sm text-gray-500">{supplier.contactName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!supplier.isActive && (
                <Badge variant="secondary">Inattivo</Badge>
              )}
              <ChevronRight 
                className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t bg-gray-50 p-4 space-y-4">
            {/* Contact Info */}
            <div className="space-y-2">
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                    {supplier.phone}
                  </a>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>

            {/* Parts History */}
            {supplierDetails && supplierDetails.partsHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Storico Ricambi ({supplierDetails.partsHistory.length})
                </h4>
                <div className="space-y-2">
                  {supplierDetails.partsHistory.map((part: Part) => (
                    <div 
                      key={part._id}
                      className="bg-white p-3 rounded-xl border text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-gray-500">
                            {part.sku && `SKU: ${part.sku}`}
                            {part.oemCode && ` • OEM: ${part.oemCode}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {part.partPrice !== undefined && (
                            <p className="font-medium">€ {part.partPrice.toFixed(2)}</p>
                          )}
                          {part.laborPrice !== undefined && (
                            <p className="text-xs text-gray-500">
                              M/O: € {part.laborPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Elimina
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
