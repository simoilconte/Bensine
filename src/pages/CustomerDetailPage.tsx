import { useState } from "react"
import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { 
  User, Building2, Phone, Mail, MapPin, Car, ArrowLeft, 
  Plus, Edit, FileText, ChevronRight
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
  tires: any
  registrationDocFileId?: string
  registrationDocMeta?: any
  createdAt: number
}

interface PartRequest {
  _id: string
  customerId: string
  vehicleId: string
  customerName: string
  vehiclePlate: string
  vehicleMakeModel: string
  requestedItems: Array<{
    partId?: string
    freeTextName?: string
    qty: number
    partName: string
  }>
  status: string
  supplier?: string
  notes?: string
  timeline: any[]
  createdAt: number
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, canEdit } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("info")
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vehicle form state
  const [plate, setPlate] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [km, setKm] = useState("")

  const customer = useQuery(api.customers.get, token && id ? {
    token,
    customerId: id as Id<"customers">,
  } : "skip")

  const vehicles = useQuery(api.vehicles.listByCustomer, token && id ? {
    token,
    customerId: id as Id<"customers">,
  } : "skip")

  const partRequests = useQuery(api.partRequests.list, token && id ? {
    token,
    customerId: id as Id<"customers">,
  } : "skip")

  const createVehicle = useMutation(api.vehicles.create)

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "daOrdinare" | "ordinato" | "arrivato" | "consegnato" | "annullato"> = {
      "DA_ORDINARE": "daOrdinare",
      "ORDINATO": "ordinato",
      "ARRIVATO": "arrivato",
      "CONSEGNATO": "consegnato",
      "ANNULLATO": "annullato",
    }
    const labels: Record<string, string> = {
      "DA_ORDINARE": "Da ordinare",
      "ORDINATO": "Ordinato",
      "ARRIVATO": "Arrivato",
      "CONSEGNATO": "Consegnato",
      "ANNULLATO": "Annullato",
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
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
          <TabsTrigger value="ricambi" className="flex-1">
            Ricambi {partRequests && `(${partRequests.length})`}
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
              
              {(customer as any).documents && (customer as any).documents.length > 0 ? (
                <div className="space-y-2">
                  {(customer as any).documents.map((doc: any) => (
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
            <Card key={vehicle._id} className="rounded-2xl">
              <CardContent className="p-4">
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
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                {vehicle.km && (
                  <p className="text-sm text-gray-500 mt-2">
                    {vehicle.km.toLocaleString()} km
                  </p>
                )}
              </CardContent>
            </Card>
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

        {/* Ricambi Tab */}
        <TabsContent value="ricambi" className="space-y-4">
          {partRequests?.map((request: PartRequest) => (
            <Card key={request._id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{request.vehiclePlate}</p>
                    <p className="text-sm text-gray-500">
                      {request.requestedItems.length} ricambi
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="text-sm text-gray-600">
                  {request.requestedItems.slice(0, 2).map((item: PartRequest["requestedItems"][0], i: number) => (
                    <p key={i}>• {item.partName} x{item.qty}</p>
                  ))}
                  {request.requestedItems.length > 2 && (
                    <p className="text-gray-400">
                      +{request.requestedItems.length - 2} altri
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {partRequests?.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna richiesta
                </h3>
                <p className="text-gray-600">
                  Non ci sono richieste ricambi per questo cliente
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
              <Input
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                placeholder="Benzina, Diesel, GPL..."
                className="h-11"
              />
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
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il documento",
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
  document: any
  customerId: Id<"customers">
  canEdit: boolean 
}) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const getDocumentUrl = useQuery(api.customers.getDocumentUrl, token ? {
    token,
    fileId: document.fileId,
  } : "skip")
  
  const removeDocument = useMutation(api.customers.removeDocument)

  const handleDelete = async () => {
    if (!token || !confirm("Eliminare questo documento?")) return
    
    setIsDeleting(true)
    try {
      await removeDocument({
        token,
        customerId,
        fileId: document.fileId,
      })
      
      toast({
        title: "Documento eliminato",
        description: "Il documento è stato rimosso",
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il documento",
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
