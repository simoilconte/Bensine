import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"
import { createEvent } from "./events"
import { Doc } from "./_generated/dataModel"

export const list = query({
  args: {
    token: v.string(),
    searchText: v.optional(v.string()),
    type: v.optional(v.union(v.literal("PRIVATO"), v.literal("AZIENDA"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    let customers: Doc<"customers">[]

    if (currentUser.role === "CLIENTE") {
      // CLIENTE can only see their own customer record
      if (!currentUser.customerId) {
        return []
      }
      const customer = await ctx.db.get(currentUser.customerId)
      customers = customer ? [customer] : []
    } else {
      // ADMIN and BENZINE can see all customers
      if (args.searchText && args.searchText.trim().length > 0) {
        // Use search index for text search
        const searchResults = await ctx.db
          .query("customers")
          .withSearchIndex("search_displayName", (q) =>
            q.search("displayName", args.searchText!)
          )
          .collect()
        customers = searchResults
      } else {
        customers = await ctx.db.query("customers").collect()
      }

      // Filter by type if specified
      if (args.type) {
        customers = customers.filter((c) => c.type === args.type)
      }
    }

    // Get vehicle count for each customer
    const customersWithVehicleCount = await Promise.all(
      customers.map(async (customer) => {
        const vehicles = await ctx.db
          .query("vehicles")
          .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
          .collect()

        return {
          _id: customer._id,
          type: customer.type,
          displayName: customer.displayName,
          privateFields: customer.privateFields,
          companyFields: customer.companyFields,
          contacts: customer.contacts,
          notes: customer.notes,
          sharing: customer.sharing,
          vehicleCount: vehicles.length,
          createdAt: customer._creationTime,
        }
      })
    )

    return customersWithVehicleCount
  },
})

export const get = query({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      return null
    }

    // Check permissions for CLIENTE role
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId || currentUser.customerId !== args.customerId) {
        throw new Error("Non autorizzato")
      }
    }

    // Get vehicle count
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect()

    return {
      _id: customer._id,
      type: customer.type,
      displayName: customer.displayName,
      privateFields: customer.privateFields,
      companyFields: customer.companyFields,
      contacts: customer.contacts,
      notes: customer.notes,
      sharing: customer.sharing,
      vehicleCount: vehicles.length,
      createdAt: customer._creationTime,
    }
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    type: v.union(v.literal("PRIVATO"), v.literal("AZIENDA")),
    displayName: v.string(),
    privateFields: v.optional(v.object({
      firstName: v.string(),
      lastName: v.string(),
    })),
    companyFields: v.optional(v.object({
      ragioneSociale: v.string(),
      piva: v.string(),
      referenteNome: v.optional(v.string()),
    })),
    contacts: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    // Validate displayName
    if (!args.displayName || args.displayName.trim().length === 0) {
      throw new Error("Nome visualizzato è obbligatorio")
    }

    const customerId = await ctx.db.insert("customers", {
      type: args.type,
      displayName: args.displayName.trim(),
      privateFields: args.privateFields,
      companyFields: args.companyFields,
      contacts: args.contacts,
      notes: args.notes,
      sharing: {
        sharedWithClientUserIds: [],
        clientPermissions: {
          canViewVehicles: false,
          canViewParts: false,
          canViewDocuments: false,
        },
      },
    })

    // Create event
    await createEvent(ctx, {
      type: "CUSTOMER_CREATED",
      entityType: "customer",
      entityId: customerId,
      payload: {
        displayName: args.displayName,
        type: args.type,
      },
      actorUserId: currentUser._id,
    })

    return customerId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    displayName: v.optional(v.string()),
    privateFields: v.optional(v.object({
      firstName: v.string(),
      lastName: v.string(),
    })),
    companyFields: v.optional(v.object({
      ragioneSociale: v.string(),
      piva: v.string(),
      referenteNome: v.optional(v.string()),
    })),
    contacts: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    // Validate displayName if provided
    if (args.displayName !== undefined && args.displayName.trim().length === 0) {
      throw new Error("Nome visualizzato non può essere vuoto")
    }

    const patch: Partial<Doc<"customers">> = {}
    if (args.displayName !== undefined) patch.displayName = args.displayName.trim()
    if (args.privateFields !== undefined) patch.privateFields = args.privateFields
    if (args.companyFields !== undefined) patch.companyFields = args.companyFields
    if (args.contacts !== undefined) patch.contacts = args.contacts
    if (args.notes !== undefined) patch.notes = args.notes

    await ctx.db.patch(args.customerId, patch)

    // Create event
    await createEvent(ctx, {
      type: "CUSTOMER_UPDATED",
      entityType: "customer",
      entityId: args.customerId,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.customerId
  },
})

export const setSharing = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    sharedWithClientUserIds: v.array(v.id("appUsers")),
    clientPermissions: v.object({
      canViewVehicles: v.boolean(),
      canViewParts: v.boolean(),
      canViewDocuments: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    // Validate that all shared users are CLIENTE role
    for (const userId of args.sharedWithClientUserIds) {
      const user = await ctx.db.get(userId)
      if (!user || user.role !== "CLIENTE") {
        throw new Error(`Utente ${userId} non è un cliente`)
      }
    }

    await ctx.db.patch(args.customerId, {
      sharing: {
        sharedWithClientUserIds: args.sharedWithClientUserIds,
        clientPermissions: args.clientPermissions,
      },
    })

    return args.customerId
  },
})

export const remove = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    // Check if customer has vehicles
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect()

    if (vehicles.length > 0) {
      throw new Error("Impossibile eliminare: il cliente ha veicoli associati")
    }

    // Check if customer has part requests
    const partRequests = await ctx.db
      .query("partRequests")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect()

    if (partRequests.length > 0) {
      throw new Error("Impossibile eliminare: il cliente ha richieste ricambi associate")
    }

    await ctx.db.delete(args.customerId)

    // Create event
    await createEvent(ctx, {
      type: "CUSTOMER_DELETED",
      entityType: "customer",
      entityId: args.customerId,
      payload: { displayName: customer.displayName },
      actorUserId: currentUser._id,
    })

    return { success: true }
  },
})


export const generateUploadUrl = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }
    return await ctx.storage.generateUploadUrl()
  },
})

export const addDocument = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    const newDocument = {
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedAt: Date.now(),
      uploadedBy: currentUser._id,
    }

    const documents = customer.documents || []
    documents.push(newDocument)

    await ctx.db.patch(args.customerId, { documents })

    await createEvent(ctx, {
      type: "CUSTOMER_DOCUMENT_ADDED",
      entityType: "customer",
      entityId: args.customerId,
      payload: { fileName: args.fileName },
      actorUserId: currentUser._id,
    })

    return newDocument
  },
})

export const removeDocument = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    const documents = (customer.documents || []).filter(
      (doc) => doc.fileId !== args.fileId
    )

    await ctx.db.patch(args.customerId, { documents })

    await ctx.storage.delete(args.fileId)

    await createEvent(ctx, {
      type: "CUSTOMER_DOCUMENT_REMOVED",
      entityType: "customer",
      entityId: args.customerId,
      payload: { fileId: args.fileId },
      actorUserId: currentUser._id,
    })

    return { success: true }
  },
})

export const getDocumentUrl = query({
  args: {
    token: v.string(),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }
    return await ctx.storage.getUrl(args.fileId)
  },
})
