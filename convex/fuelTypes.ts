import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"
import { createEvent } from "./events"

export const list = query({
  args: {
    token: v.string(),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    let fuelTypes
    if (args.includeInactive) {
      fuelTypes = await ctx.db
        .query("fuelTypes")
        .withIndex("by_order", (q) => q)
        .collect()
    } else {
      fuelTypes = await ctx.db
        .query("fuelTypes")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("asc")
        .collect()
    }

    return fuelTypes.map(ft => ({
      _id: ft._id,
      name: ft.name,
      order: ft.order,
      isActive: ft.isActive,
    }))
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Solo gli admin possono gestire i tipi di alimentazione")
    }

    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Il nome è obbligatorio")
    }

    // Calculate next order if not provided
    let order = args.order
    if (order === undefined) {
      const allTypes = await ctx.db.query("fuelTypes").collect()
      order = allTypes.length
    }

    const fuelTypeId = await ctx.db.insert("fuelTypes", {
      name: args.name.trim(),
      order,
      isActive: true,
    })

    await createEvent(ctx, {
      type: "FUEL_TYPE_CREATED",
      entityType: "fuelType",
      entityId: fuelTypeId,
      payload: { name: args.name, order },
      actorUserId: currentUser._id,
    })

    return fuelTypeId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    fuelTypeId: v.id("fuelTypes"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Solo gli admin possono gestire i tipi di alimentazione")
    }

    const fuelType = await ctx.db.get(args.fuelTypeId)
    if (!fuelType) {
      throw new Error("Tipo di alimentazione non trovato")
    }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) {
      if (args.name.trim().length === 0) {
        throw new Error("Il nome non può essere vuoto")
      }
      patch.name = args.name.trim()
    }
    if (args.order !== undefined) patch.order = args.order
    if (args.isActive !== undefined) patch.isActive = args.isActive

    await ctx.db.patch(args.fuelTypeId, patch)

    await createEvent(ctx, {
      type: "FUEL_TYPE_UPDATED",
      entityType: "fuelType",
      entityId: args.fuelTypeId,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.fuelTypeId
  },
})

export const remove = mutation({
  args: {
    token: v.string(),
    fuelTypeId: v.id("fuelTypes"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Solo gli admin possono gestire i tipi di alimentazione")
    }

    const fuelType = await ctx.db.get(args.fuelTypeId)
    if (!fuelType) {
      throw new Error("Tipo di alimentazione non trovato")
    }

    // Check if fuel type is used in any vehicles
    const vehicles = await ctx.db.query("vehicles").collect()
    const isUsed = vehicles.some(v => v.fuelType === fuelType.name)

    if (isUsed) {
      // Soft delete - just mark as inactive
      await ctx.db.patch(args.fuelTypeId, { isActive: false })
      
      await createEvent(ctx, {
        type: "FUEL_TYPE_DEACTIVATED",
        entityType: "fuelType",
        entityId: args.fuelTypeId,
        payload: { name: fuelType.name },
        actorUserId: currentUser._id,
      })
      
      return { deactivated: true }
    }

    await ctx.db.delete(args.fuelTypeId)

    await createEvent(ctx, {
      type: "FUEL_TYPE_DELETED",
      entityType: "fuelType",
      entityId: args.fuelTypeId,
      payload: { name: fuelType.name },
      actorUserId: currentUser._id,
    })

    return { deleted: true }
  },
})
