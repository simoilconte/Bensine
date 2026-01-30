import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { Doc } from "./_generated/dataModel"

// Helper function to get user from token (for internal use)
export async function getUserFromToken(
  ctx: QueryCtx | MutationCtx, 
  token: string | null | undefined
): Promise<Doc<"appUsers"> | null> {
  if (!token) return null

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first()

  if (!session) return null
  if (session.expiresAt < Date.now()) return null

  return await ctx.db.get(session.userId)
}

export const getCurrentUser = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null

    const user = await getUserFromToken(ctx, args.token)
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

export const adminSetUserRole = mutation({
  args: {
    token: v.string(),
    userId: v.id("appUsers"),
    role: v.union(v.literal("ADMIN"), v.literal("BENZINE"), v.literal("CLIENTE")),
    customerId: v.optional(v.id("customers")),
    privileges: v.optional(v.record(v.string(), v.boolean())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    if (args.role === "CLIENTE" && !args.customerId) {
      throw new Error("Cliente deve essere collegato a un customer")
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      customerId: args.customerId,
      privileges: args.privileges,
    })

    return { success: true }
  },
})

export const adminLinkClientToCustomer = mutation({
  args: {
    token: v.string(),
    userId: v.id("appUsers"),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const user = await ctx.db.get(args.userId)
    if (!user || user.role !== "CLIENTE") {
      throw new Error("Utente non trovato o non è un cliente")
    }

    await ctx.db.patch(args.userId, {
      customerId: args.customerId,
    })

    return { success: true }
  },
})

export const adminListUsers = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const users = await ctx.db.query("appUsers").collect()
    
    // Get customer names for linked users
    const usersWithCustomers = await Promise.all(
      users.map(async (user) => {
        let customerName = null
        if (user.customerId) {
          const customer = await ctx.db.get(user.customerId)
          customerName = customer?.displayName
        }
        return {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customerId,
          customerName,
          privileges: user.privileges,
          createdAt: user._creationTime,
        }
      })
    )

    return usersWithCustomers
  },
})
