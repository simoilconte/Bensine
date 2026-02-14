import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"
import { createEvent } from "./events"

export const list = query({
  args: {
    token: v.string(),
    searchText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    let parts

    if (args.searchText && args.searchText.trim().length > 0) {
      parts = await ctx.db
        .query("parts")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.searchText!)
        )
        .collect()
    } else {
      parts = await ctx.db.query("parts").collect()
    }

    // Get supplier names
    const partsWithSuppliers = await Promise.all(
      parts.map(async (part) => {
        let supplierName = null
        if (part.supplierId) {
          const supplier = await ctx.db.get(part.supplierId)
          supplierName = supplier?.companyName || null
        }

        return {
          _id: part._id,
          name: part.name,
          sku: part.sku,
          oemCode: part.oemCode,
          supplierId: part.supplierId,
          supplierName,
          unitCost: part.unitCost,
          unitPrice: part.unitPrice,
          partPrice: part.partPrice,
          laborPrice: part.laborPrice,
          stockQty: part.stockQty,
          minStockQty: part.minStockQty,
          location: part.location,
          notes: part.notes,
          vehicleId: part.vehicleId,
          isLowStock: part.minStockQty !== undefined && part.stockQty <= part.minStockQty,
          createdAt: part._creationTime,
        }
      })
    )

    return partsWithSuppliers
  },
})

export const listByVehicle = query({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    // Check permissions for CLIENTE role
    if (currentUser.role === "CLIENTE") {
      const vehicle = await ctx.db.get(args.vehicleId)
      if (!vehicle || vehicle.customerId !== currentUser.customerId) {
        throw new Error("Non autorizzato")
      }
    }

    const parts = await ctx.db
      .query("parts")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect()

    // Get supplier names
    const partsWithSuppliers = await Promise.all(
      parts.map(async (part) => {
        let supplierName = null
        if (part.supplierId) {
          const supplier = await ctx.db.get(part.supplierId)
          supplierName = supplier?.companyName || null
        }

        return {
          _id: part._id,
          name: part.name,
          sku: part.sku,
          oemCode: part.oemCode,
          supplierId: part.supplierId,
          supplierName,
          unitCost: part.unitCost,
          unitPrice: part.unitPrice,
          partPrice: part.partPrice,
          laborPrice: part.laborPrice,
          stockQty: part.stockQty,
          minStockQty: part.minStockQty,
          location: part.location,
          notes: part.notes,
          vehicleId: part.vehicleId,
          isLowStock: part.minStockQty !== undefined && part.stockQty <= part.minStockQty,
          createdAt: part._creationTime,
        }
      })
    )

    return partsWithSuppliers
  },
})

export const get = query({
  args: {
    token: v.string(),
    partId: v.id("parts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const part = await ctx.db.get(args.partId)
    if (!part) {
      return null
    }

    let supplierName = null
    if (part.supplierId) {
      const supplier = await ctx.db.get(part.supplierId)
      supplierName = supplier?.companyName || null
    }

    return {
      _id: part._id,
      name: part.name,
      sku: part.sku,
      oemCode: part.oemCode,
      supplierId: part.supplierId,
      supplierName,
      unitCost: part.unitCost,
      unitPrice: part.unitPrice,
      partPrice: part.partPrice,
      laborPrice: part.laborPrice,
      stockQty: part.stockQty,
      minStockQty: part.minStockQty,
      location: part.location,
      notes: part.notes,
      vehicleId: part.vehicleId,
      isLowStock: part.minStockQty !== undefined && part.stockQty <= part.minStockQty,
      createdAt: part._creationTime,
    }
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    sku: v.optional(v.string()),
    oemCode: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    unitCost: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    partPrice: v.optional(v.number()),
    laborPrice: v.optional(v.number()),
    stockQty: v.number(),
    minStockQty: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    // Validate name
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Nome ricambio è obbligatorio")
    }

    // Validate stock quantity
    if (args.stockQty < 0) {
      throw new Error("Quantità stock non può essere negativa")
    }

    const partId = await ctx.db.insert("parts", {
      name: args.name.trim(),
      sku: args.sku,
      oemCode: args.oemCode,
      supplierId: args.supplierId,
      unitCost: args.unitCost,
      unitPrice: args.unitPrice,
      partPrice: args.partPrice,
      laborPrice: args.laborPrice,
      stockQty: args.stockQty,
      minStockQty: args.minStockQty,
      location: args.location,
      notes: args.notes,
      vehicleId: args.vehicleId,
    })

    // Create event
    await createEvent(ctx, {
      type: "PART_CREATED",
      entityType: "part",
      entityId: partId,
      payload: {
        name: args.name,
        stockQty: args.stockQty,
      },
      actorUserId: currentUser._id,
    })

    return partId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    partId: v.id("parts"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    oemCode: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    unitCost: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    partPrice: v.optional(v.number()),
    laborPrice: v.optional(v.number()),
    stockQty: v.optional(v.number()),
    minStockQty: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const part = await ctx.db.get(args.partId)
    if (!part) {
      throw new Error("Ricambio non trovato")
    }

    // Validate name if provided
    if (args.name !== undefined && args.name.trim().length === 0) {
      throw new Error("Nome ricambio non può essere vuoto")
    }

    // Validate stock quantity if provided
    if (args.stockQty !== undefined && args.stockQty < 0) {
      throw new Error("Quantità stock non può essere negativa")
    }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name.trim()
    if (args.sku !== undefined) patch.sku = args.sku
    if (args.oemCode !== undefined) patch.oemCode = args.oemCode
    if (args.supplierId !== undefined) patch.supplierId = args.supplierId
    if (args.unitCost !== undefined) patch.unitCost = args.unitCost
    if (args.unitPrice !== undefined) patch.unitPrice = args.unitPrice
    if (args.partPrice !== undefined) patch.partPrice = args.partPrice
    if (args.laborPrice !== undefined) patch.laborPrice = args.laborPrice
    if (args.stockQty !== undefined) patch.stockQty = args.stockQty
    if (args.minStockQty !== undefined) patch.minStockQty = args.minStockQty
    if (args.location !== undefined) patch.location = args.location
    if (args.notes !== undefined) patch.notes = args.notes
    if (args.vehicleId !== undefined) patch.vehicleId = args.vehicleId

    await ctx.db.patch(args.partId, patch)

    // Create event
    await createEvent(ctx, {
      type: "PART_UPDATED",
      entityType: "part",
      entityId: args.partId,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.partId
  },
})

export const adjustStock = mutation({
  args: {
    token: v.string(),
    partId: v.id("parts"),
    deltaQty: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const part = await ctx.db.get(args.partId)
    if (!part) {
      throw new Error("Ricambio non trovato")
    }

    const newStockQty = part.stockQty + args.deltaQty
    if (newStockQty < 0) {
      throw new Error("Quantità stock non può essere negativa")
    }

    await ctx.db.patch(args.partId, {
      stockQty: newStockQty,
    })

    // Create event
    await createEvent(ctx, {
      type: "PART_STOCK_ADJUSTED",
      entityType: "part",
      entityId: args.partId,
      payload: {
        oldQty: part.stockQty,
        newQty: newStockQty,
        delta: args.deltaQty,
        reason: args.reason,
      },
      actorUserId: currentUser._id,
    })

    return {
      partId: args.partId,
      oldStockQty: part.stockQty,
      newStockQty,
    }
  },
})

export const remove = mutation({
  args: {
    token: v.string(),
    partId: v.id("parts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const part = await ctx.db.get(args.partId)
    if (!part) {
      throw new Error("Ricambio non trovato")
    }

    // Check if part is used in any part requests
    const partRequests = await ctx.db.query("partRequests").collect()
    const isUsed = partRequests.some(pr => 
      pr.requestedItems.some(item => item.partId === args.partId)
    )

    if (isUsed) {
      throw new Error("Impossibile eliminare: il ricambio è usato in richieste esistenti")
    }

    await ctx.db.delete(args.partId)

    // Create event
    await createEvent(ctx, {
      type: "PART_DELETED",
      entityType: "part",
      entityId: args.partId,
      payload: { name: part.name },
      actorUserId: currentUser._id,
    })

    return { success: true }
  },
})
