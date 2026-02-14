import { useState } from "react"
import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { 
  User, Building2, Phone, Mail, MapPin, Car, ArrowLeft, 
  Plus, Edit, FileText, ChevronRight, Package
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { Id } from "@convex/_generated/dataModel"

interface Vehicle {
  _id: string
  customerId: string
  plate: string
  make?: string
  model?: string
  year?: number
  fuelType?: string
  km?: number
  tires: Record<string, unknown>
  registrationDocFileId?: string
  registrationDocMeta?: {
    filename: string
    contentType: string
    uploadedAt: number
  }
  createdAt: number
}

interface Part {
  _id: string
  name: string
  sku?: string
  oemCode?: string
  supplierId?: string
  supplierName?: string | null
  unitCost?: number
  unitPrice?: number
  partPrice?: number
  laborPrice?: number
  stockQty: number
  minStockQty?: number
  location?: string
  notes?: string
  vehicleId?: string
  isLowStock: boolean
  createdAt: number
}



export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, canEdit } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("info")
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vehicle form state
  const [plate, setPlate] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [km, setKm] = useState("")

  // Part form state
  const [partName, setPartName] = useState("")
  const [partSku, setPartSku] = useState("")
  const [partOemCode, setPartOemCode] = useState("")
  const [partSupplierId, setPartSupplierId] = useState("")
  const [partStockQty, setPartStockQty] = useState("1")
  const [partPrice, setPartPrice] = useState("")
  const [laborPrice, setLaborPrice] = useState("")
  const [partNotes, setPartNotes] = useState("")

  const customer = useQuery(api.customers.get, token && id ? {
    token,
    customerId: id as Id<"customers">,
  } : "skip")

  const vehicles = useQuery(api.vehicles.listByCustomer, token && id ? {
    token,
    customerId: id as Id<"customers">,
  } : "skip")

  const fuelTypes = useQuery(api.fuelTypes.list, token ? { token } : "skip")
  const suppliers = useQuery(api.suppliers.list, token ? { token } : "skip")

  const createVehicle = useMutation(api.vehicles.create)
  const createPart = useMutation(api.parts.create)

  const toggleVehicleExpand = (vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles)
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId)
    } else {
      newExpanded.add(vehicleId)
    }
    setExpandedVehicles(newExpanded)
  }

  const handleOpenPartDialog = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setIsPartDialogOpen(true)
  }

  const resetPartForm = () => {
    setPartName("")
    setPartSku("")
    setPartOemCode("")
    setPartSupplierId("")
    setPartStockQty("1")
    setPartPrice("")
    setLaborPrice("")
    setPartNotes("")
    setSelectedVehicleId(null)
  }

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedVehicleId) return

    setIsSubmitting(true)
    try {
      await createPart({
        token,
        name: partName,
        sku: partSku || undefined,
        oemCode: partOemCode || undefined,
        supplierId: partSupplierId ? (partSupplierId as Id<"suppliers">) : undefined,
        stockQty: parseInt(partStockQty) || 1,
        partPrice: partPrice ? parseFloat(partPrice) : undefined,
        laborPrice: laborPrice ? parseFloat(laborPrice) : undefined,
        notes: partNotes || undefined,
        vehicleId: selectedVehicleId as Id<"vehicles">,
      })

      toast({
        title: "Ricambio aggiunto",
        description: `${partName} aggiunto con successo`,
      })
      setIsPartDialogOpen(false)
      resetPartForm()
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

  const resetVehicleForm = () => {
    setPlate("")
    setMake("")
    setModel("")
    setYear("")
    setFuelType("")
    setKm("")
  }

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !id) return

    setIsSubmitting(true)
    try {
      await createVehicle({
        token,
        customerId: id as Id<"customers">,
        plate,
        make: make || undefined,
        model: model || undefined,
        year: year ? parseInt(year) : undefined,
        fuelType: fuelType || undefined,
        km: km ? parseInt(km) : undefined,
      })

      toast({
        title: "Veicolo aggiunto",
        description: `Targa ${plate.toUpperCase()} aggiunta con successo`,
      })
      setIsVehicleDialogOpen(false)
      resetVehicleForm()
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



  if (customer === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento cliente...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Cliente non trovato
        </h2>
        <p className="text-gray-600 mb-4">
          Il cliente che stai cercando non esiste o non è accessibile.
        </p>
        <Button onClick={() => navigate("/clienti")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna ai clienti
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/clienti")} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Clienti
      </Button>

      {/* Customer Header */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                customer.type === "PRIVATO" ? "bg-blue-100" : "bg-purple-100"
              }`}>
                {customer.type === "PRIVATO" ? (
                  <User className="h-6 w-6 text-blue-600" />
                ) : (
                  <Building2 className="h-6 w-6 text-purple-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{customer.displayName}</h1>
                <p className="text-sm text-gray-500">
                  {customer.type === "PRIVATO" ? "Cliente Privato" : "Cliente Azienda"}
                </p>
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Quick contacts */}
          <div className="flex flex-wrap gap-2 mt-4">
            {customer.contacts?.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${customer.contacts.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Chiama
                </a>
              </Button>
            )}
            {customer.contacts?.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${customer.contacts.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
          <TabsTrigger value="veicoli" className="flex-1">
            Veicoli {vehicles && `(${vehicles.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Contatti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.contacts?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{customer.contacts.phone}</span>
                </div>
              )}
              {customer.contacts?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{customer.contacts.email}</span>
                </div>
              )}
              {customer.contacts?.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{customer.contacts.address}</span>
                </div>
              )}
              {!customer.contacts?.phone && !customer.contacts?.email && !customer.contacts?.address && (
                <p className="text-gray-500 text-sm">Nessun contatto registrato</p>
              )}
            </CardContent>
          </Card>

          {customer.type === "AZIENDA" && customer.companyFields && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Dati Azienda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Ragione Sociale</span>
                  <p className="font-medium">{customer.companyFields.ragioneSociale}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Partita IVA</span>
                  <p className="font-medium">{customer.companyFields.piva}</p>
                </div>
                {customer.companyFields.referenteNome && (
                  <div>
                    <span className="text-sm text-gray-500">Referente</span>
                    <p className="font-medium">{customer.companyFields.referenteNome}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {customer.notes && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Documenti */}
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit && (
                <DocumentUpload customerId={id as Id<"customers">} />
              )}
              
              {(customer as { documents?: Array<{ fileId: string; fileName: string; uploadedAt: number; fileType: string }> }).documents && (customer as { documents?: Array<{ fileId: string; fileName: string; uploadedAt: number; fileType: string }> }).documents!.length > 0 ? (
                <div className="space-y-2">
                  {(customer as { documents?: Array<{ fileId: string; fileName: string; uploadedAt: number; fileType: string }> }).documents!.map((doc) => (
                    <DocumentItem 
                      key={doc.fileId} 
                      document={doc} 
                      customerId={id as Id<"customers">}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nessun documento caricato</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Veicoli Tab */}
        <TabsContent value="veicoli" className="space-y-4">
          {canEdit && (
            <Button onClick={() => setIsVehicleDialogOpen(true)} className="w-full h-11">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Veicolo
            </Button>
          )}

          {vehicles?.map((vehicle: Vehicle) => (
            <VehicleCard 
              key={vehicle._id} 
              vehicle={vehicle}
              isExpanded={expandedVehicles.has(vehicle._id)}
              onToggleExpand={() => toggleVehicleExpand(vehicle._id)}
              onAddPart={() => handleOpenPartDialog(vehicle._id)}
              canEdit={canEdit}
              token={token}
            />
          ))}

          {vehicles?.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun veicolo
                </h3>
                <p className="text-gray-600">
                  Aggiungi il primo veicolo per questo cliente
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* New Vehicle Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Veicolo</DialogTitle>
            <DialogDescription>
              Aggiungi un veicolo per {customer.displayName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVehicle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Targa *</Label>
              <Input
                id="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="AB123CD"
                required
                className="h-11 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="make">Marca</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Fiat"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modello</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Panda"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">Anno</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2020"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km">Chilometri</Label>
                <Input
                  id="km"
                  type="number"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="50000"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType">Alimentazione</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleziona alimentazione" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes?.map((ft) => (
                    <SelectItem key={ft._id} value={ft.name}>
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleDialogOpen(false)}
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

      {/* New Part Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Ricambio</DialogTitle>
            <DialogDescription>
              Aggiungi un ricambio al veicolo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Nome ricambio *</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="Filtro olio, Pastiglie freno..."
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partSku">Codice SKU</Label>
                <Input
                  id="partSku"
                  value={partSku}
                  onChange={(e) => setPartSku(e.target.value)}
                  placeholder="SKU123"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partOemCode">Codice OEM</Label>
                <Input
                  id="partOemCode"
                  value={partOemCode}
                  onChange={(e) => setPartOemCode(e.target.value)}
                  placeholder="OEM456"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partSupplier">Fornitore</Label>
              <Select value={partSupplierId} onValueChange={setPartSupplierId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleziona fornitore" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.filter((s: { isActive: boolean }) => s.isActive).map((supplier: { _id: string; companyName: string }) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partStockQty">Quantità *</Label>
                <Input
                  id="partStockQty"
                  type="number"
                  value={partStockQty}
                  onChange={(e) => setPartStockQty(e.target.value)}
                  placeholder="1"
                  min="1"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partPrice">Prezzo Ricambio (€)</Label>
                <Input
                  id="partPrice"
                  type="number"
                  step="0.01"
                  value={partPrice}
                  onChange={(e) => setPartPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="laborPrice">Prezzo Manodopera (€)</Label>
                <Input
                  id="laborPrice"
                  type="number"
                  step="0.01"
                  value={laborPrice}
                  onChange={(e) => setLaborPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partNotes">Note</Label>
                <Input
                  id="partNotes"
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  placeholder="Note aggiuntive..."
                  className="h-11"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPartDialogOpen(false)
                  resetPartForm()
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
    </div>
  )
}


// Vehicle Card Component with Parts
function VehicleCard({ 
  vehicle, 
  isExpanded, 
  onToggleExpand, 
  onAddPart,
  canEdit,
  token
}: { 
  vehicle: Vehicle
  isExpanded: boolean
  onToggleExpand: () => void
  onAddPart: () => void
  canEdit: boolean
  token: string | null
}) {
  const parts = useQuery(api.parts.listByVehicle, token ? {
    token,
    vehicleId: vehicle._id as Id<"vehicles">,
  } : "skip")

  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggleExpand}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-lg tracking-wider">{vehicle.plate}</p>
                <p className="text-sm text-gray-500">
                  {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Dettagli non specificati"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {parts && parts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {parts.length} ricambi
                </Badge>
              )}
              <ChevronRight 
                className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </div>
          </div>
          {vehicle.km && (
            <p className="text-sm text-gray-500 mt-2">
              {vehicle.km.toLocaleString()} km
            </p>
          )}
        </div>

        {isExpanded && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Ricambi associati
              </h4>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddPart()
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi
                </Button>
              )}
            </div>

            {parts && parts.length > 0 ? (
              <div className="space-y-2">
                {parts.map((part: Part) => (
                  <div 
                    key={part._id} 
                    className="bg-white p-3 rounded-xl border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{part.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {part.sku && <span>SKU: {part.sku}</span>}
                          {part.oemCode && <span>OEM: {part.oemCode}</span>}
                          <span>Qta: {part.stockQty}</span>
                          {part.supplierName && (
                            <span className="text-blue-600">• {part.supplierName}</span>
                          )}
                        </div>
                      </div>
                      {part.isLowStock && (
                        <Badge variant="destructive" className="text-xs ml-2">
                          Scorta bassa
                        </Badge>
                      )}
                    </div>
                    {/* Prezzi */}
                    <div className="flex items-center justify-between pt-2 border-t text-sm">
                      <div className="flex gap-4">
                        {part.partPrice !== undefined && (
                          <span className="text-gray-600">
                            Ricambio: <span className="font-medium">€ {part.partPrice.toFixed(2)}</span>
                          </span>
                        )}
                        {part.laborPrice !== undefined && (
                          <span className="text-gray-600">
                            M/O: <span className="font-medium">€ {part.laborPrice.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                      {(part.partPrice !== undefined || part.laborPrice !== undefined) && (
                        <span className="font-bold text-brand-orange">
                          Tot: € {((part.partPrice || 0) + (part.laborPrice || 0)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Totale complessivo */}
                {(() => {
                  const totalPartPrice = parts.reduce((sum, p) => sum + (p.partPrice || 0), 0)
                  const totalLaborPrice = parts.reduce((sum, p) => sum + (p.laborPrice || 0), 0)
                  const grandTotal = totalPartPrice + totalLaborPrice
                  if (grandTotal > 0) {
                    return (
                      <div className="bg-brand-orange/10 p-3 rounded-xl border border-brand-orange/30 mt-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Totale ricambi:</span>
                          <span>€ {totalPartPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Totale manodopera:</span>
                          <span>€ {totalLaborPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-brand-orange pt-2 border-t border-brand-orange/20 mt-2">
                          <span>TOTALE:</span>
                          <span>€ {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Nessun ricambio associato a questo veicolo
              </p>
            )}

            {/* Registration Document Section */}
            <div className="mt-4 pt-4 border-t">
              <VehicleRegistrationDoc 
                vehicle={vehicle} 
                canEdit={canEdit} 
                token={token}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Vehicle Registration Document Component
function VehicleRegistrationDoc({ 
  vehicle, 
  canEdit, 
  token 
}: { 
  vehicle: Vehicle
  canEdit: boolean
  token: string | null
}) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl)
  const uploadRegistrationDoc = useMutation(api.vehicles.uploadRegistrationDoc)
  const registrationDocUrl = useQuery(
    api.vehicles.getRegistrationDocUrl, 
    token && vehicle.registrationDocFileId ? { token, vehicleId: vehicle._id as Id<"vehicles"> } : "skip"
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato non valido",
        description: "Sono accettati solo PDF, JPEG e PNG",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "La dimensione massima è 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ token })
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      
      const { storageId } = await result.json()
      
      // Save document reference
      await uploadRegistrationDoc({
        token,
        vehicleId: vehicle._id as Id<"vehicles">,
        fileId: storageId,
        filename: file.name,
        contentType: file.type,
      })
      
      toast({
        title: "Libretto caricato",
        description: `${file.name} caricato con successo`,
      })
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossibile caricare il documento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const isPdf = vehicle.registrationDocMeta?.contentType === 'application/pdf'
  const isImage = vehicle.registrationDocMeta?.contentType?.startsWith('image/')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Libretto di circolazione
        </h4>
        {canEdit && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id={`registration-doc-upload-${vehicle._id}`}
            />
            <label htmlFor={`registration-doc-upload-${vehicle._id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {isUploading ? "Caricamento..." : (vehicle.registrationDocFileId ? "Sostituisci" : "Carica")}
              </Button>
            </label>
          </div>
        )}
      </div>

      {vehicle.registrationDocFileId ? (
        <div className="bg-white p-3 rounded-xl border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                {isPdf ? (
                  <FileText className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {vehicle.registrationDocMeta?.filename || "Libretto"}
                </p>
                <p className="text-xs text-gray-500">
                  {isPdf ? "PDF" : isImage ? "Immagine" : "Documento"}
                  {vehicle.registrationDocMeta?.uploadedAt && 
                    ` • ${new Date(vehicle.registrationDocMeta.uploadedAt).toLocaleDateString("it-IT")}`
                  }
                </p>
              </div>
            </div>
            {registrationDocUrl && (
              <a
                href={registrationDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-orange hover:text-brand-orangeDark text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Apri
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-xl border border-dashed">
          Nessun libretto caricato
        </p>
      )}
      
      {canEdit && (
        <p className="text-xs text-gray-500 text-center">
          PDF, JPEG, PNG • Max 10MB • Da smartphone puoi scattare una foto o scegliere dalla galleria
        </p>
      )}
    </div>
  )
}

// Document Upload Component
function DocumentUpload({ customerId }: { customerId: Id<"customers"> }) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const generateUploadUrl = useMutation(api.customers.generateUploadUrl)
  const addDocument = useMutation(api.customers.addDocument)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setIsUploading(true)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ token })
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      
      const { storageId } = await result.json()
      
      // Save document reference
      await addDocument({
        token,
        customerId,
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
      })
      
      toast({
        title: "Documento caricato",
        description: `${file.name} caricato con successo`,
      })
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossibile caricare il documento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        id="document-upload"
      />
      <label htmlFor="document-upload">
        <button
          type="button"
          className="brand-btn-outline w-full"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="mr-2 h-4 w-4 inline" />
          {isUploading ? "Caricamento..." : "Carica Documento"}
        </button>
      </label>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Foto o PDF • Max 10MB • Da smartphone si apre la fotocamera
      </p>
    </div>
  )
}

// Document Item Component
function DocumentItem({ 
  document, 
  customerId, 
  canEdit 
}: { 
  document: { fileId: string; fileName: string; uploadedAt: number; fileType: string }
  customerId: Id<"customers">
  canEdit: boolean 
}) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const getDocumentUrl = useQuery(api.customers.getDocumentUrl, token ? {
    token,
    fileId: document.fileId as Id<"_storage">,
  } : "skip")
  
  const removeDocument = useMutation(api.customers.removeDocument)

  const handleDelete = async () => {
    if (!token || !confirm("Eliminare questo documento?")) return
    
    setIsDeleting(true)
    try {
      await removeDocument({
        token,
        customerId,
        fileId: document.fileId as Id<"_storage">,
      })
      
      toast({
        title: "Documento eliminato",
        description: "Il documento è stato rimosso",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Impossibile eliminare il documento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // const isImage = document.fileType.startsWith("image/")
  // const isPdf = document.fileType === "application/pdf"

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white hover:bg-gray-50 transition-colors">
      <div className="h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
        <FileText className="h-5 w-5 text-brand-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{document.fileName}</p>
        <p className="text-xs text-gray-500">
          {new Date(document.uploadedAt).toLocaleDateString("it-IT")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {getDocumentUrl && (
          <a
            href={getDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:text-brand-orangeDark text-sm font-medium"
          >
            Apri
          </a>
        )}
        {canEdit && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            {isDeleting ? "..." : "Elimina"}
          </button>
        )}
      </div>
    </div>
  )
}
