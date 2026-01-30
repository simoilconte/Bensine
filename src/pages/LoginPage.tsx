import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "convex/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/BrandMark"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@convex/_generated/api"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const seedDatabase = useMutation(api.seed.seedDatabase)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isRegisterMode) {
        await signUp(email, password, name)
        toast({
          title: "Registrazione completata",
          description: "Account creato con successo!",
        })
      } else {
        await signIn(email, password)
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto in Bensine CRM!",
        })
      }
      navigate("/clienti")
    } catch (error: any) {
      toast({
        title: isRegisterMode ? "Errore di registrazione" : "Errore di accesso",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const result = await seedDatabase()
      if (result.seeded) {
        toast({
          title: "Database popolato",
          description: `Creati ${result.data?.users} utenti, ${result.data?.customers} clienti, ${result.data?.vehicles} veicoli, ${result.data?.parts} ricambi, ${result.data?.partRequests} richieste`,
        })
      } else {
        toast({
          title: "Database già popolato",
          description: "I dati demo sono già presenti",
        })
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il popolamento",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const fillDemoCredentials = (role: "admin" | "bensine" | "cliente") => {
    const credentials = {
      admin: { email: "admin@bensine.it", password: "admin123" },
      bensine: { email: "luca@bensine.it", password: "bensine123" },
      cliente: { email: "cliente@bensine.it", password: "cliente123" },
    }
    setEmail(credentials[role].email)
    setPassword(credentials[role].password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center brand-bg px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Hero Logo */}
        <div className="text-center">
          <img 
            src="/scritta.png" 
            alt="Bensine CRM" 
            className="mx-auto w-[min(360px,80%)] drop-shadow-md mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <p className="text-sm text-slate-600 italic">
            Gestione clienti e ricambi, senza caos.
          </p>
        </div>

        <Card className="brand-card-tint">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BrandMark size="lg" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              {isRegisterMode ? "Registrati" : "Benvenuto"}
            </CardTitle>
            <CardDescription>
              {isRegisterMode 
                ? "Crea il tuo account per iniziare" 
                : "Accedi al tuo account"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Il tuo nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegisterMode}
                  className="brand-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="la.tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="brand-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="brand-input"
              />
            </div>
            <button
              type="submit"
              className="brand-btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading 
                ? (isRegisterMode ? "Registrazione..." : "Accesso in corso...") 
                : (isRegisterMode ? "Registrati" : "Accedi")}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode)
                  setName("")
                }}
                className="text-sm text-orange-600 hover:text-orange-700 underline"
              >
                {isRegisterMode 
                  ? "Hai già un account? Accedi" 
                  : "Non hai un account? Registrati"}
              </button>
            </div>
          </form>
          
          {!isRegisterMode && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Utenti demo (clicca per compilare):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials("admin")}
                    className="text-xs"
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials("bensine")}
                    className="text-xs"
                  >
                    Dipendente
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials("cliente")}
                    className="text-xs"
                  >
                    Cliente
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  type="button"
                  className="brand-btn-outline w-full"
                  onClick={handleSeed}
                  disabled={isSeeding}
                >
                  {isSeeding ? "Popolamento in corso..." : "🌱 Popola Database Demo"}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Crea utenti, clienti, veicoli e ricambi di esempio
                </p>
              </div>
            </div>
          )}
          
          {/* Mascotte chip */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-brand-orange/20 text-xs text-slate-600">
              <img 
                src="/logo.png" 
                alt="Bensine" 
                className="h-5 w-5 rounded-full object-cover"
              />
              <span>Powered by L Bensinè</span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
