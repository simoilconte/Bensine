import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"
import { createEvent, createEventWithNotification } from "./events"

export const list = query({
  args: {
    token: v.string(),
    status: v.optional(v.union(
      v.literal("DA_ORDINARE"),
      v.literal("ORDINATO"),
      v.literal("ARRIVATO"),
      v.literal("CONSEGNATO"),
      v.literal("ANNULLATO")
    )),
    customerId: v.optional(v.id("customers")),
    searchText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    let partRequests = await ctx.db.query("partRequests").collect()

    // CLIENTE can only see their own requests
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId) return []
      const customer = await ctx.db.get(currentUser.customerId)
      if (!customer || !customer.sharing.clientPermissions.canViewParts) {
        throw new Error("Non autorizzato")
      }
      partRequests = partRequests.filter(pr => pr.customerId === currentUser.customerId)
    }

    // Filter by status
    if (args.status) {
      partRequests = partRequests.filter(pr => pr.status === args.status)
    }

    // Filter by customer (only for non-CLIENTE users)
    if (args.customerId && currentUser.role !== "CLIENTE") {
      partRequests = partRequests.filter(pr => pr.customerId === args.customerId)
    }

    // Enrich with customer and vehicle info
    const enrichedRequests = await Promise.all(
      partRequests.map(async (request) => {
        const customer = await ctx.db.get(request.customerId)
        const vehicle = await ctx.db.get(request.vehicleId)
        
        // Search filter
        if (args.searchText) {
          const searchLower = args.searchText.toLowerCase()
          const customerMatch = customer?.displayName.toLowerCase().includes(searchLower)
          const plateMatch = vehicle?.plate.toLowerCase().includes(searchLower)
          if (!customerMatch && !plateMatch) return null
        }

        const itemsWithNames = await Promise.all(
          request.requestedItems.map(async (item) => {
            if (item.partId) {
              const part = await ctx.db.get(item.partId)
              return { ...item, partName: part?.name || "Ricambio non trovato" }
            }
            return { ...item, partName: item.freeTextName || "Ricambio personalizzato" }
          })
        )
        
        const makeModel = vehicle ? ((vehicle.make || "") + " " + (vehicle.model || "")).trim() : ""
        
        return {
          _id: request._id,
          customerId: request.customerId,
          vehicleId: request.vehicleId,
          customerName: customer?.displayName || "Sconosciuto",
          vehiclePlate: vehicle?.plate || "Sconosciuto",
          vehicleMakeModel: makeModel,
          requestedItems: itemsWithNames,
          status: request.status,
          supplier: request.supplier,
          notes: request.notes,
          timeline: request.timeline,
          createdAt: request._creationTime,
        }
      })
    )

    return enrichedRequests.filter(r => r !== null)
  },
})

export const get = query({
  args: {
    token: v.string(),
    id: v.id("partRequests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const partRequest = await ctx.db.get(args.id)
    if (!partRequest) return null

    // CLIENTE can only see their own requests
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId || currentUser.customerId !== partRequest.customerId) {
        throw new Error("Non autorizzato")
      }
      const customer = await ctx.db.get(partRequest.customerId)
      if (!customer || !customer.sharing.clientPermissions.canViewParts) {
        throw new Error("Non autorizzato")
      }
    }

    const customer = await ctx.db.get(partRequest.customerId)
    const vehicle = await ctx.db.get(partRequest.vehicleId)
    
    const enrichedItems = await Promise.all(
      partRequest.requestedItems.map(async (item) => {
        if (item.partId) {
          const part = await ctx.db.get(item.partId)
          return { ...item, partName: part?.name || "Ricambio non trovato" }
        }
        return { ...item, partName: item.freeTextName || "Ricambio personalizzato" }
      })
    )

    const timelineWithUsers = await Promise.all(
      partRequest.timeline.map(async (entry) => {
        const user = await ctx.db.get(entry.byUserId)
        return { ...entry, userName: user?.name || user?.email || "Utente sconosciuto" }
      })
    )

    const makeModel = vehicle ? ((vehicle.make || "") + " " + (vehicle.model || "")).trim() : ""

    return {
      _id: partRequest._id,
      customerId: partRequest.customerId,
      vehicleId: partRequest.vehicleId,
      customerName: customer?.displayName || "Sconosciuto",
      customerEmail: customer?.contacts?.email,
      customerPhone: customer?.contacts?.phone,
      vehiclePlate: vehicle?.plate || "Sconosciuto",
      vehicleMakeModel: makeModel,
      requestedItems: enrichedItems,
      status: partRequest.status,
      supplier: partRequest.supplier,
      notes: partRequest.notes,
      timeline: timelineWithUsers,
      createdAt: partRequest._creationTime,
    }
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    vehicleId: v.id("vehicles"),
    requestedItems: v.array(v.object({
      partId: v.optional(v.id("parts")),
      freeTextName: v.optional(v.string()),
      qty: v.number(),
      unitPriceSnapshot: v.optional(v.number()),
      unitCostSnapshot: v.optional(v.number()),
    })),
    supplier: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    if (args.requestedItems.length === 0) {
      throw new Error("Almeno un ricambio deve essere richiesto")
    }

    for (const item of args.requestedItems) {
      if (item.qty <= 0) {
        throw new Error("Quantità deve essere maggiore di zero")
      }
      if (!item.partId && !item.freeTextName) {
        throw new Error("Ogni ricambio deve avere un partId o freeTextName")
      }
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throw new Error("Veicolo non trovato")
    }
    if (vehicle.customerId !== args.customerId) {
      throw new Error("Il veicolo non appartiene al cliente selezionato")
    }

    const partRequestId = await ctx.db.insert("partRequests", {
      customerId: args.customerId,
      vehicleId: args.vehicleId,
      requestedItems: args.requestedItems,
      status: "DA_ORDINARE",
      supplier: args.supplier,
      notes: args.notes,
      timeline: [{
        status: "DA_ORDINARE",
        at: Date.now(),
        byUserId: currentUser._id,
      }],
    })

    await createEventWithNotification(ctx, {
      type: "PART_REQUEST_CREATED",
      entityType: "partRequest",
      entityId: partRequestId,
      payload: {
        customerId: args.customerId,
        vehicleId: args.vehicleId,
        itemCount: args.requestedItems.length,
      },
      actorUserId: currentUser._id,
      customerId: args.customerId,
      notificationData: {
        channel: "EMAIL",
        to: customer.contacts?.email || "",
        templateKey: "PART_REQUEST_CREATED",
        data: {
          status: "DA_ORDINARE",
          requestId: partRequestId,
          customerName: customer.displayName,
          vehiclePlate: vehicle.plate,
        },
      },
    })

    return partRequestId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("partRequests"),
    requestedItems: v.optional(v.array(v.object({
      partId: v.optional(v.id("parts")),
      freeTextName: v.optional(v.string()),
      qty: v.number(),
      unitPriceSnapshot: v.optional(v.number()),
      unitCostSnapshot: v.optional(v.number()),
    }))),
    supplier: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const partRequest = await ctx.db.get(args.id)
    if (!partRequest) {
      throw new Error("Richiesta non trovata")
    }

    if (args.requestedItems) {
      if (args.requestedItems.length === 0) {
        throw new Error("Almeno un ricambio deve essere richiesto")
      }
      for (const item of args.requestedItems) {
        if (item.qty <= 0) {
          throw new Error("Quantità deve essere maggiore di zero")
        }
        if (!item.partId && !item.freeTextName) {
          throw new Error("Ogni ricambio deve avere un partId o freeTextName")
        }
      }
    }

    const patch: Record<string, unknown> = {}
    if (args.requestedItems !== undefined) patch.requestedItems = args.requestedItems
    if (args.supplier !== undefined) patch.supplier = args.supplier
    if (args.notes !== undefined) patch.notes = args.notes

    await ctx.db.patch(args.id, patch)

    await createEvent(ctx, {
      type: "PART_REQUEST_UPDATED",
      entityType: "partRequest",
      entityId: args.id,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.id
  },
})

export const setStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("partRequests"),
    newStatus: v.union(
      v.literal("DA_ORDINARE"),
      v.literal("ORDINATO"),
      v.literal("ARRIVATO"),
      v.literal("CONSEGNATO"),
      v.literal("ANNULLATO")
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const partRequest = await ctx.db.get(args.id)
    if (!partRequest) {
      throw new Error("Richiesta non trovata")
    }

    const newTimeline = [
      ...partRequest.timeline,
      {
        status: args.newStatus,
        at: Date.now(),
        byUserId: currentUser._id,
      },
    ]

    await ctx.db.patch(args.id, {
      status: args.newStatus,
      timeline: newTimeline,
    })

    const customer = await ctx.db.get(partRequest.customerId)
    const vehicle = await ctx.db.get(partRequest.vehicleId)

    await createEventWithNotification(ctx, {
      type: "PART_REQUEST_STATUS_CHANGED",
      entityType: "partRequest",
      entityId: args.id,
      payload: {
        oldStatus: partRequest.status,
        newStatus: args.newStatus,
      },
      actorUserId: currentUser._id,
      customerId: partRequest.customerId,
      notificationData: {
        channel: "EMAIL",
        to: customer?.contacts?.email || "",
        templateKey: "PART_REQUEST_STATUS",
        data: {
          oldStatus: partRequest.status,
          newStatus: args.newStatus,
          requestId: args.id,
          customerName: customer?.displayName,
          vehiclePlate: vehicle?.plate,
        },
      },
    })

    return args.id
  },
})

export const remove = mutation({
  args: {
    token: v.string(),
    id: v.id("partRequests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const partRequest = await ctx.db.get(args.id)
    if (!partRequest) {
      throw new Error("Richiesta non trovata")
    }

    await ctx.db.delete(args.id)

    await createEvent(ctx, {
      type: "PART_REQUEST_DELETED",
      entityType: "partRequest",
      entityId: args.id,
      payload: { status: partRequest.status },
      actorUserId: currentUser._id,
    })

    return { success: true }
  },
})
