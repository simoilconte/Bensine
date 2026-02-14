import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Simple hash function for demo purposes
// In production, use proper bcrypt or similar
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2) + 
         Date.now().toString(36)
}

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    
    // Find user by email
    const user = await ctx.db
      .query("appUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first()

    if (!user) {
      throw new Error("Utente non trovato")
    }

    // Verify password
    const passwordHash = simpleHash(args.password)
    if (user.passwordHash !== passwordHash) {
      throw new Error("Password non valida")
    }

    // Create session
    const token = generateToken()
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days

    await ctx.db.insert("sessions", {
      token,
      userId: user._id,
      expiresAt,
    })

    return {
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  },
})

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("ADMIN"), v.literal("BENZINE"), v.literal("CLIENTE"))),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("appUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first()

    if (existingUser) {
      throw new Error("Utente già esistente")
    }

    // Create user
    const passwordHash = simpleHash(args.password)
    const userId = await ctx.db.insert("appUsers", {
      identitySubject: `user:${email}`,
      email,
      name: args.name,
      role: args.role || "BENZINE",
      passwordHash,
    })

    // Create session
    const token = generateToken()
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000)

    await ctx.db.insert("sessions", {
      token,
      userId,
      expiresAt,
    })

    await ctx.db.get(userId) // Verify user exists

    return {
      token,
      user: {
        _id: userId,
        email,
        name: args.name,
        role: args.role || "BENZINE",
      },
    }
  },
})

export const signOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()

    if (session) {
      await ctx.db.delete(session._id)
    }

    return { success: true }
  },
})

export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()

    if (!session) return null
    if (session.expiresAt < Date.now()) return null

    const user = await ctx.db.get(session.userId)
    if (!user) return null

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId,
      privileges: user.privileges,
    }
  },
})

// Helper to get current user from session token
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCurrentUserFromToken(ctx: { db: any }, token: string | null) {
  if (!token) return null

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: { eq: (field: string, value: string) => unknown }) => q.eq("token", token))
    .first()

  if (!session) return null
  if (session.expiresAt < Date.now()) return null

  return await ctx.db.get(session.userId)
}
