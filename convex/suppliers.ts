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

    let suppliers
    if (args.includeInactive) {
      suppliers = await ctx.db.query("suppliers").collect()
    } else {
      suppliers = await ctx.db
        .query("suppliers")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect()
    }

    return suppliers.map(s => ({
      _id: s._id,
      companyName: s.companyName,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      notes: s.notes,
      isActive: s.isActive,
    }))
  },
})

export const get = query({
  args: {
    token: v.string(),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const supplier = await ctx.db.get(args.supplierId)
    if (!supplier) {
      return null
    }

    // Get parts history for this supplier
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .collect()

    const partsHistory = parts.map(p => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      oemCode: p.oemCode,
      partPrice: p.partPrice,
      laborPrice: p.laborPrice,
      stockQty: p.stockQty,
      createdAt: p._creationTime,
    }))

    return {
      _id: supplier._id,
      companyName: supplier.companyName,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes,
      isActive: supplier.isActive,
      partsHistory,
    }
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    companyName: v.string(),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    if (!args.companyName || args.companyName.trim().length === 0) {
      throw new Error("Il nome del fornitore è obbligatorio")
    }

    const supplierId = await ctx.db.insert("suppliers", {
      companyName: args.companyName.trim(),
      contactName: args.contactName,
      phone: args.phone,
      email: args.email,
      address: args.address,
      notes: args.notes,
      isActive: true,
    })

    await createEvent(ctx, {
      type: "SUPPLIER_CREATED",
      entityType: "customer",
      entityId: supplierId,
      payload: { companyName: args.companyName },
      actorUserId: currentUser._id,
    })

    return supplierId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    supplierId: v.id("suppliers"),
    companyName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const supplier = await ctx.db.get(args.supplierId)
    if (!supplier) {
      throw new Error("Fornitore non trovato")
    }

    const patch: Record<string, unknown> = {}
    if (args.companyName !== undefined) {
      if (args.companyName.trim().length === 0) {
        throw new Error("Il nome del fornitore non può essere vuoto")
      }
      patch.companyName = args.companyName.trim()
    }
    if (args.contactName !== undefined) patch.contactName = args.contactName
    if (args.phone !== undefined) patch.phone = args.phone
    if (args.email !== undefined) patch.email = args.email
    if (args.address !== undefined) patch.address = args.address
    if (args.notes !== undefined) patch.notes = args.notes
    if (args.isActive !== undefined) patch.isActive = args.isActive

    await ctx.db.patch(args.supplierId, patch)

    await createEvent(ctx, {
      type: "SUPPLIER_UPDATED",
      entityType: "customer",
      entityId: args.supplierId,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.supplierId
  },
})

export const remove = mutation({
  args: {
    token: v.string(),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const supplier = await ctx.db.get(args.supplierId)
    if (!supplier) {
      throw new Error("Fornitore non trovato")
    }

    // Check if supplier is used in any parts
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .collect()

    if (parts.length > 0) {
      // Soft delete - just mark as inactive
      await ctx.db.patch(args.supplierId, { isActive: false })
      
      await createEvent(ctx, {
        type: "SUPPLIER_DEACTIVATED",
        entityType: "customer",
        entityId: args.supplierId,
        payload: { companyName: supplier.companyName },
        actorUserId: currentUser._id,
      })
      
      return { deactivated: true }
    }

    await ctx.db.delete(args.supplierId)

    await createEvent(ctx, {
      type: "SUPPLIER_DELETED",
      entityType: "customer",
      entityId: args.supplierId,
      payload: { companyName: supplier.companyName },
      actorUserId: currentUser._id,
    })

    return { deleted: true }
  },
})
