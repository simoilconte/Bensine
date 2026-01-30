import * as React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"

interface User {
  _id: string
  email?: string
  name?: string
  role: "ADMIN" | "BENZINE" | "CLIENTE"
  customerId?: string
  privileges?: Record<string, boolean>
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isBenzine: boolean
  isCliente: boolean
  canEdit: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = "bensine_auth_token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  })

  const user = useQuery(api.users.getCurrentUser, token ? { token } : "skip")
  const signInMutation = useMutation(api.auth.signIn)
  const signUpMutation = useMutation(api.auth.signUp)
  const signOutMutation = useMutation(api.auth.signOut)

  const isLoading = token !== null && user === undefined

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInMutation({ email, password })
    localStorage.setItem(TOKEN_KEY, result.token)
    setToken(result.token)
  }, [signInMutation])

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const result = await signUpMutation({ email, password, name })
    localStorage.setItem(TOKEN_KEY, result.token)
    setToken(result.token)
  }, [signUpMutation])

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await signOutMutation({ token })
      } catch (e) {
        // Ignore errors on sign out
      }
    }
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [token, signOutMutation])

  // Clear token if user is null (invalid session)
  useEffect(() => {
    if (token && user === null) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
    }
  }, [token, user])

  const value: AuthContextType = {
    user: user ?? null,
    token,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === "ADMIN",
    isBenzine: user?.role === "BENZINE",
    isCliente: user?.role === "CLIENTE",
    canEdit: user?.role === "ADMIN" || user?.role === "BENZINE",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
