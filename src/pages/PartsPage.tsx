import * as React from "react"
import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { 
  Package, Search, AlertTriangle, Plus, Minus,
  Warehouse, FileText, Car
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { PageHeader } from "@/components/PageHeader"
import { getPartRequestBadgeClass, getPartRequestLabel } from "@/lib/statusStyles"

type PartRequestStatus = "DA_ORDINARE" | "ORDINATO" | "ARRIVATO" | "CONSEGNATO" | "ANNULLATO"

interface Part {
  _id: string
  name: string
  sku?: string
  oemCode?: string
  supplier?: string
  unitCost?: number
  unitPrice?: number
  stockQty: number
  minStockQty?: number
  location?: string
  notes?: string
  isLowStock: boolean
  createdAt: number
}

interface PartRequestItem {
  partId?: string
  freeTextName?: string
  qty: number
  partName: string
}

interface PartRequest {
  _id: string
  customerId: string
  vehicleId: string
  customerName: string
  vehiclePlate: string
  vehicleMakeModel: string
  requestedItems: PartRequestItem[]
  status: string
  supplier?: string
  notes?: string
  timeline: any[]
  createdAt: number
}

export function PartsPage() {
  const [activeTab, setActiveTab] = useState<"magazzino" | "richieste">("magazzino")
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<PartRequestStatus | "all">("all")
  
  // Dialog states
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Part form state
  const [partName, setPartName] = useState("")
  const [partSku, setPartSku] = useState("")
  const [partOemCode, setPartOemCode] = useState("")
  const [partSupplier, setPartSupplier] = useState("")
  const [partUnitCost, setPartUnitCost] = useState("")
  const [partUnitPrice, setPartUnitPrice] = useState("")
  const [partStockQty, setPartStockQty] = useState("")
  const [partMinStockQty, setPartMinStockQty] = useState("")
  const [partLocation, setPartLocation] = useState("")
  const [partNotes, setPartNotes] = useState("")

  // Stock adjustment state
  const [stockDelta, setStockDelta] = useState(0)
  const [stockReason, setStockReason] = useState("")

  const { token, canEdit } = useAuth()
  const { toast } = useToast()

  const parts = useQuery(api.parts.list, token ? {
    token,
    searchText: searchText || undefined,
  } : "skip")

  const partRequests = useQuery(api.partRequests.list, token ? {
    token,
    status: statusFilter === "all" ? undefined : statusFilter,
    searchText: searchText || undefined,
  } : "skip")

  const createPart = useMutation(api.parts.create)
  const adjustStock = useMutation(api.parts.adjustStock)
  const setRequestStatus = useMutation(api.partRequests.setStatus)

  // Listen for FAB click
  useEffect(() => {
    const handleFabClick = (e: CustomEvent) => {
      if (e.detail.path === "/ricambi" && canEdit) {
        if (activeTab === "magazzino") {
          setIsPartDialogOpen(true)
        } else {
          setIsRequestDialogOpen(true)
        }
      }
    }
    window.addEventListener("fab-click", handleFabClick as EventListener)
    return () => window.removeEventListener("fab-click", handleFabClick as EventListener)
  }, [canEdit, activeTab])

  const resetPartForm = () => {
    setPartName("")
    setPartSku("")
    setPartOemCode("")
    setPartSupplier("")
    setPartUnitCost("")
    setPartUnitPrice("")
    setPartStockQty("")
    setPartMinStockQty("")
    setPartLocation("")
    setPartNotes("")
  }

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsSubmitting(true)
    try {
      await createPart({
        token,
        name: partName,
        sku: partSku || undefined,
        oemCode: partOemCode || undefined,
        supplier: partSupplier || undefined,
        unitCost: partUnitCost ? parseFloat(partUnitCost) : undefined,
        unitPrice: partUnitPrice ? parseFloat(partUnitPrice) : undefined,
        stockQty: parseInt(partStockQty) || 0,
        minStockQty: partMinStockQty ? parseInt(partMinStockQty) : undefined,
        location: partLocation || undefined,
        notes: partNotes || undefined,
      })

      toast({
        title: "Ricambio creato",
        description: `${partName} aggiunto al magazzino`,
      })
      setIsPartDialogOpen(false)
      resetPartForm()
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

  const handleAdjustStock = async () => {
    if (!token || !selectedPart || stockDelta === 0) return

    setIsSubmitting(true)
    try {
      await adjustStock({
        token,
        partId: selectedPart._id,
        deltaQty: stockDelta,
        reason: stockReason || undefined,
      })

      toast({
        title: "Stock aggiornato",
        description: `${selectedPart.name}: ${stockDelta > 0 ? "+" : ""}${stockDelta}`,
      })
      setIsStockDialogOpen(false)
      setSelectedPart(null)
      setStockDelta(0)
      setStockReason("")
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

  const handleStatusChange = async (requestId: Id<"partRequests">, newStatus: PartRequestStatus) => {
    if (!token) return

    try {
      await setRequestStatus({
        token,
        id: requestId,
        newStatus,
      })

      toast({
        title: "Stato aggiornato",
        description: `Richiesta aggiornata a "${getStatusLabel(newStatus)}"`,
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "daOrdinare" | "ordinato" | "arrivato" | "consegnato" | "annullato"> = {
      "DA_ORDINARE": "daOrdinare",
      "ORDINATO": "ordinato",
      "ARRIVATO": "arrivato",
      "CONSEGNATO": "consegnato",
      "ANNULLATO": "annullato",
    }
    return <Badge variant={variants[status]}>{getStatusLabel(status)}</Badge>
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "DA_ORDINARE": "Da ordinare",
      "ORDINATO": "Ordinato",
      "ARRIVATO": "Arrivato",
      "CONSEGNATO": "Consegnato",
      "ANNULLATO": "Annullato",
    }
    return labels[status] || status
  }

  const getNextStatus = (current: string): PartRequestStatus | null => {
    const flow: Record<string, PartRequestStatus> = {
      "DA_ORDINARE": "ORDINATO",
      "ORDINATO": "ARRIVATO",
      "ARRIVATO": "CONSEGNATO",
    }
    return flow[current] || null
  }

  return (
    <div className="space-y-4">
      <PageHeader 
        icon={Package} 
        title="Ricambi" 
        subtitle="Gestisci magazzino e richieste ricambi"
      />

      {canEdit && (
        <button 
          onClick={() => activeTab === "magazzino" ? setIsPartDialogOpen(true) : setIsRequestDialogOpen(true)} 
          className="brand-btn-primary w-full hidden md:flex items-center justify-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "magazzino" ? "Nuovo Ricambio" : "Nuova Richiesta"}
        </button>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "magazzino" | "richieste")}>
        <TabsList className="w-full">
          <TabsTrigger value="magazzino" className="flex-1">
            <Warehouse className="mr-2 h-4 w-4" />
            Magazzino
          </TabsTrigger>
          <TabsTrigger value="richieste" className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Richieste
          </TabsTrigger>
        </TabsList>

        {/* Magazzino Tab */}
        <TabsContent value="magazzino" className="space-y-4">
          {canEdit && (
            <button 
              onClick={() => setIsPartDialogOpen(true)} 
              className="brand-btn-primary w-full md:hidden"
            >
              <Plus className="mr-2 h-4 w-4 inline" />
              Nuovo Ricambio
            </button>
          )}

          <Card className="brand-card">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cerca ricambio..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </CardContent>
          </Card>

          {parts?.map((part: Part) => (
            <Card key={part._id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{part.name}</h3>
                      {part.isLowStock && (
                        <Badge variant="warning" className="text-xs">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Scorta bassa
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {part.sku && <span>SKU: {part.sku}</span>}
                      {part.supplier && <span className="ml-3">• {part.supplier}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-lg font-semibold">
                        {part.stockQty} pz
                      </span>
                      {part.unitPrice && (
                        <span className="text-sm text-gray-600">
                          €{part.unitPrice.toFixed(2)}
                        </span>
                      )}
                      {part.location && (
                        <span className="text-xs text-gray-400">
                          📍 {part.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPart(part)
                        setIsStockDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {parts?.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun ricambio trovato
                </h3>
                <p className="text-gray-600">
                  {searchText ? "Prova a modificare la ricerca" : "Aggiungi il primo ricambio al magazzino"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Richieste Tab */}
        <TabsContent value="richieste" className="space-y-4">
          {canEdit && (
            <button 
              onClick={() => setIsRequestDialogOpen(true)} 
              className="brand-btn-primary w-full md:hidden"
            >
              <Plus className="mr-2 h-4 w-4 inline" />
              Nuova Richiesta
            </button>
          )}

          <Card className="brand-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca per targa o cliente..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="h-11 w-full sm:w-40">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="DA_ORDINARE">Da ordinare</SelectItem>
                    <SelectItem value="ORDINATO">Ordinato</SelectItem>
                    <SelectItem value="ARRIVATO">Arrivato</SelectItem>
                    <SelectItem value="CONSEGNATO">Consegnato</SelectItem>
                    <SelectItem value="ANNULLATO">Annullato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {partRequests?.map((request: PartRequest) => (
            <Card key={request._id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="font-bold tracking-wider">{request.vehiclePlate}</span>
                    </div>
                    <p className="text-sm text-gray-500">{request.customerName}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  {request.requestedItems.map((item: PartRequestItem, i: number) => (
                    <p key={i}>• {item.partName} x{item.qty}</p>
                  ))}
                </div>

                {canEdit && request.status !== "CONSEGNATO" && request.status !== "ANNULLATO" && (
                  <div className="flex gap-2 pt-2 border-t">
                    {getNextStatus(request.status) && (
                      <Button
                        size="sm"
                        className="flex-1 h-10"
                        onClick={() => handleStatusChange(request._id as Id<"partRequests">, getNextStatus(request.status)!)}
                      >
                        → {getStatusLabel(getNextStatus(request.status)!)}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 text-red-600 hover:text-red-700"
                      onClick={() => handleStatusChange(request._id as Id<"partRequests">, "ANNULLATO")}
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {partRequests?.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna richiesta trovata
                </h3>
                <p className="text-gray-600">
                  {searchText || statusFilter !== "all" 
                    ? "Prova a modificare i filtri" 
                    : "Non ci sono richieste ricambi"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Part Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Ricambio</DialogTitle>
            <DialogDescription>
              Aggiungi un ricambio al magazzino
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Nome *</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partSku">SKU</Label>
                <Input
                  id="partSku"
                  value={partSku}
                  onChange={(e) => setPartSku(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partOemCode">Codice OEM</Label>
                <Input
                  id="partOemCode"
                  value={partOemCode}
                  onChange={(e) => setPartOemCode(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partSupplier">Fornitore</Label>
              <Input
                id="partSupplier"
                value={partSupplier}
                onChange={(e) => setPartSupplier(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partUnitCost">Costo (€)</Label>
                <Input
                  id="partUnitCost"
                  type="number"
                  step="0.01"
                  value={partUnitCost}
                  onChange={(e) => setPartUnitCost(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partUnitPrice">Prezzo (€)</Label>
                <Input
                  id="partUnitPrice"
                  type="number"
                  step="0.01"
                  value={partUnitPrice}
                  onChange={(e) => setPartUnitPrice(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partStockQty">Quantità *</Label>
                <Input
                  id="partStockQty"
                  type="number"
                  value={partStockQty}
                  onChange={(e) => setPartStockQty(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partMinStockQty">Scorta minima</Label>
                <Input
                  id="partMinStockQty"
                  type="number"
                  value={partMinStockQty}
                  onChange={(e) => setPartMinStockQty(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partLocation">Posizione</Label>
              <Input
                id="partLocation"
                value={partLocation}
                onChange={(e) => setPartLocation(e.target.value)}
                placeholder="es. Scaffale A1"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNotes">Note</Label>
              <Textarea
                id="partNotes"
                value={partNotes}
                onChange={(e) => setPartNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPartDialogOpen(false)}
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

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifica Stock</DialogTitle>
            <DialogDescription>
              {selectedPart?.name} - Attuale: {selectedPart?.stockQty} pz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setStockDelta(d => d - 1)}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <span className="text-3xl font-bold w-20 text-center">
                {stockDelta > 0 ? "+" : ""}{stockDelta}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setStockDelta(d => d + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500">
              Nuovo totale: {(selectedPart?.stockQty || 0) + stockDelta} pz
            </p>

            <div className="space-y-2">
              <Label htmlFor="stockReason">Motivo (opzionale)</Label>
              <Input
                id="stockReason"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder="es. Vendita, Reso, Inventario..."
                className="h-11"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStockDialogOpen(false)
                  setStockDelta(0)
                  setStockReason("")
                }}
                className="h-11"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleAdjustStock} 
                disabled={isSubmitting || stockDelta === 0}
                className="h-11"
              >
                {isSubmitting ? "Salvataggio..." : "Conferma"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog - Placeholder */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Ricambi</DialogTitle>
            <DialogDescription>
              Per creare una nuova richiesta, vai al dettaglio cliente e seleziona un veicolo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsRequestDialogOpen(false)}>
              Ho capito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
