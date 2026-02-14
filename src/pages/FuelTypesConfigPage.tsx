import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { 
  Fuel, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

interface FuelType {
  _id: string
  name: string
  order: number
  isActive: boolean
}

export function FuelTypesConfigPage() {
  const { token, isAdmin } = useAuth()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null)
  const [newFuelTypeName, setNewFuelTypeName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fuelTypes = useQuery(api.fuelTypes.list, token ? { 
    token,
    includeInactive: true 
  } : "skip")
  
  const createFuelType = useMutation(api.fuelTypes.create)
  const updateFuelType = useMutation(api.fuelTypes.update)
  const removeFuelType = useMutation(api.fuelTypes.remove)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newFuelTypeName.trim()) return

    setIsSubmitting(true)
    try {
      await createFuelType({
        token,
        name: newFuelTypeName.trim(),
      })

      toast({
        title: "Tipo aggiunto",
        description: `"${newFuelTypeName}" aggiunto con successo`,
      })
      setIsAddDialogOpen(false)
      setNewFuelTypeName("")
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

  const handleMoveUp = async (fuelType: FuelType, index: number) => {
    if (!token || index === 0) return
    
    const prevFuelType = fuelTypes?.[index - 1]
    if (!prevFuelType) return

    try {
      // Swap orders
      await updateFuelType({
        token,
        fuelTypeId: fuelType._id as Id<"fuelTypes">,
        order: prevFuelType.order,
      })
      await updateFuelType({
        token,
        fuelTypeId: prevFuelType._id as Id<"fuelTypes">,
        order: fuelType.order,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante lo spostamento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleMoveDown = async (fuelType: FuelType, index: number) => {
    if (!token || !fuelTypes || index >= fuelTypes.length - 1) return
    
    const nextFuelType = fuelTypes[index + 1]
    if (!nextFuelType) return

    try {
      // Swap orders
      await updateFuelType({
        token,
        fuelTypeId: fuelType._id as Id<"fuelTypes">,
        order: nextFuelType.order,
      })
      await updateFuelType({
        token,
        fuelTypeId: nextFuelType._id as Id<"fuelTypes">,
        order: fuelType.order,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante lo spostamento"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (fuelType: FuelType) => {
    if (!token) return

    try {
      await updateFuelType({
        token,
        fuelTypeId: fuelType._id as Id<"fuelTypes">,
        isActive: !fuelType.isActive,
      })

      toast({
        title: fuelType.isActive ? "Disattivato" : "Attivato",
        description: `"${fuelType.name}" ${fuelType.isActive ? "disattivato" : "attivato"}`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Errore"
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!token || !selectedFuelType) return

    setIsSubmitting(true)
    try {
      const result = await removeFuelType({
        token,
        fuelTypeId: selectedFuelType._id as Id<"fuelTypes">,
      })

      if ('deactivated' in result) {
        toast({
          title: "Disattivato",
          description: `"${selectedFuelType.name}" è in uso ed è stato disattivato`,
        })
      } else {
        toast({
          title: "Eliminato",
          description: `"${selectedFuelType.name}" eliminato`,
        })
      }
      setIsDeleteDialogOpen(false)
      setSelectedFuelType(null)
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

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Accesso negato
        </h2>
        <p className="text-gray-600">
          Solo gli amministratori possono gestire i tipi di alimentazione
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Fuel className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                Tipi di Alimentazione
              </h1>
              <p className="text-gray-500">
                Configura i tipi di alimentazione disponibili per i veicoli
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      <Button 
        onClick={() => setIsAddDialogOpen(true)} 
        className="w-full h-11"
      >
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi Tipo
      </Button>

      {/* Fuel Types List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">
            Tipi Configurati {fuelTypes && `(${fuelTypes.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fuelTypes?.map((fuelType: FuelType, index: number) => (
            <div
              key={fuelType._id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                fuelType.isActive ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-6">
                  {index + 1}
                </span>
                <div>
                  <p className={`font-medium ${!fuelType.isActive && 'text-gray-400'}`}>
                    {fuelType.name}
                  </p>
                  {!fuelType.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Disattivato
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Move Up */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(fuelType, index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                
                {/* Move Down */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(fuelType, index)}
                  disabled={index === (fuelTypes?.length || 0) - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                
                {/* Toggle Active */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(fuelType)}
                  className="h-8 w-8 p-0"
                  title={fuelType.isActive ? "Disattiva" : "Attiva"}
                >
                  <RefreshCw className={`h-4 w-4 ${!fuelType.isActive && 'text-gray-400'}`} />
                </Button>
                
                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFuelType(fuelType)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {fuelTypes?.length === 0 && (
            <div className="text-center py-8">
              <Fuel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun tipo configurato
              </h3>
              <p className="text-gray-600">
                Aggiungi il primo tipo di alimentazione
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Tipo di Alimentazione</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo tipo di alimentazione per i veicoli
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fuelTypeName">Nome *</Label>
              <Input
                id="fuelTypeName"
                value={newFuelTypeName}
                onChange={(e) => setNewFuelTypeName(e.target.value)}
                placeholder="Benzina, Diesel, Elettrico, Ibrido..."
                required
                className="h-11"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setNewFuelTypeName("")
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

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sei sicuro?</DialogTitle>
            <DialogDescription>
              {selectedFuelType?.isActive 
                ? `Se "${selectedFuelType?.name}" è in uso verrà disattivato, altrimenti eliminato.`
                : `"${selectedFuelType?.name}" sarà eliminato definitivamente.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedFuelType(null)
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
