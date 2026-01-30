import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"
import { createEvent } from "./events"

const tireSpecValidator = v.object({
  width: v.number(),
  aspectRatio: v.number(),
  rimDiameter: v.number(),
  loadIndex: v.optional(v.union(v.string(), v.number())),
  speedRating: v.optional(v.string()),
  brand: v.optional(v.string()),
})

const tiresValidator = v.object({
  summer: v.optional(v.object({
    front: v.optional(tireSpecValidator),
    rear: v.optional(tireSpecValidator),
  })),
  winter: v.optional(v.object({
    front: v.optional(tireSpecValidator),
    rear: v.optional(tireSpecValidator),
  })),
  notes: v.optional(v.string()),
})

export const listByCustomer = query({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    // Check permissions for CLIENTE role
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId || currentUser.customerId !== args.customerId) {
        throw new Error("Non autorizzato")
      }
      
      // Check if customer has vehicle viewing permission
      const customer = await ctx.db.get(args.customerId)
      if (!customer || !customer.sharing.clientPermissions.canViewVehicles) {
        throw new Error("Non autorizzato")
      }
    }

    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect()

    return vehicles.map(vehicle => ({
      _id: vehicle._id,
      customerId: vehicle.customerId,
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      km: vehicle.km,
      tires: vehicle.tires,
      registrationDocFileId: vehicle.registrationDocFileId,
      registrationDocMeta: vehicle.registrationDocMeta,
      createdAt: vehicle._creationTime,
    }))
  },
})

export const get = query({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      return null
    }

    // Check permissions for CLIENTE role
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId || currentUser.customerId !== vehicle.customerId) {
        throw new Error("Non autorizzato")
      }
      
      // Check if customer has vehicle viewing permission
      const customer = await ctx.db.get(vehicle.customerId)
      if (!customer || !customer.sharing.clientPermissions.canViewVehicles) {
        throw new Error("Non autorizzato")
      }
    }

    return {
      _id: vehicle._id,
      customerId: vehicle.customerId,
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      km: vehicle.km,
      tires: vehicle.tires,
      registrationDocFileId: vehicle.registrationDocFileId,
      registrationDocMeta: vehicle.registrationDocMeta,
      createdAt: vehicle._creationTime,
    }
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    customerId: v.id("customers"),
    plate: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    vin: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    km: v.optional(v.number()),
    tires: v.optional(tiresValidator),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    // Validate plate - must be unique and normalized
    const normalizedPlate = args.plate.toUpperCase().replace(/\s/g, "").trim()
    if (normalizedPlate.length === 0) {
      throw new Error("Targa è obbligatoria")
    }

    // Check if plate already exists
    const existingVehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_plate", (q) => q.eq("plate", normalizedPlate))
      .first()

    if (existingVehicle) {
      throw new Error("Targa già presente")
    }

    // Verify customer exists
    const customer = await ctx.db.get(args.customerId)
    if (!customer) {
      throw new Error("Cliente non trovato")
    }

    const vehicleId = await ctx.db.insert("vehicles", {
      customerId: args.customerId,
      plate: normalizedPlate,
      make: args.make,
      model: args.model,
      year: args.year,
      vin: args.vin,
      fuelType: args.fuelType,
      km: args.km,
      tires: args.tires || { summer: undefined, winter: undefined, notes: undefined },
    })

    // Create event
    await createEvent(ctx, {
      type: "VEHICLE_CREATED",
      entityType: "vehicle",
      entityId: vehicleId,
      payload: {
        plate: normalizedPlate,
        customerId: args.customerId,
      },
      actorUserId: currentUser._id,
    })

    return vehicleId
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
    plate: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    vin: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    km: v.optional(v.number()),
    tires: v.optional(tiresValidator),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throw new Error("Veicolo non trovato")
    }

    const patch: any = {}

    // Validate plate if provided
    if (args.plate !== undefined) {
      const normalizedPlate = args.plate.toUpperCase().replace(/\s/g, "").trim()
      if (normalizedPlate.length === 0) {
        throw new Error("Targa non può essere vuota")
      }

      // Check if plate already exists (excluding current vehicle)
      const existingVehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_plate", (q) => q.eq("plate", normalizedPlate))
        .first()

      if (existingVehicle && existingVehicle._id !== args.vehicleId) {
        throw new Error("Targa già presente")
      }

      patch.plate = normalizedPlate
    }

    if (args.make !== undefined) patch.make = args.make
    if (args.model !== undefined) patch.model = args.model
    if (args.year !== undefined) patch.year = args.year
    if (args.vin !== undefined) patch.vin = args.vin
    if (args.fuelType !== undefined) patch.fuelType = args.fuelType
    if (args.km !== undefined) patch.km = args.km
    if (args.tires !== undefined) patch.tires = args.tires

    await ctx.db.patch(args.vehicleId, patch)

    // Create event
    await createEvent(ctx, {
      type: "VEHICLE_UPDATED",
      entityType: "vehicle",
      entityId: args.vehicleId,
      payload: patch,
      actorUserId: currentUser._id,
    })

    return args.vehicleId
  },
})

export const uploadRegistrationDoc = mutation({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
    fileId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throw new Error("Veicolo non trovato")
    }

    // Delete old file if exists
    if (vehicle.registrationDocFileId) {
      await ctx.storage.delete(vehicle.registrationDocFileId)
    }

    await ctx.db.patch(args.vehicleId, {
      registrationDocFileId: args.fileId,
      registrationDocMeta: {
        filename: args.filename,
        contentType: args.contentType,
        uploadedAt: Date.now(),
      },
    })

    // Create event
    await createEvent(ctx, {
      type: "VEHICLE_DOC_UPLOADED",
      entityType: "vehicle",
      entityId: args.vehicleId,
      payload: {
        filename: args.filename,
      },
      actorUserId: currentUser._id,
    })

    return args.vehicleId
  },
})

export const getRegistrationDocUrl = query({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser) {
      throw new Error("Non autorizzato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      return null
    }

    // Check permissions for CLIENTE role
    if (currentUser.role === "CLIENTE") {
      if (!currentUser.customerId || currentUser.customerId !== vehicle.customerId) {
        throw new Error("Non autorizzato")
      }
      
      // Check if customer has document viewing permission
      const customer = await ctx.db.get(vehicle.customerId)
      if (!customer || !customer.sharing.clientPermissions.canViewDocuments) {
        throw new Error("Non autorizzato")
      }
    }

    if (!vehicle.registrationDocFileId) {
      return null
    }

    const url = await ctx.storage.getUrl(vehicle.registrationDocFileId)
    return url
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

export const remove = mutation({
  args: {
    token: v.string(),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role === "CLIENTE") {
      throw new Error("Non autorizzato")
    }

    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throw new Error("Veicolo non trovato")
    }

    // Check if vehicle has part requests
    const partRequests = await ctx.db
      .query("partRequests")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect()

    if (partRequests.length > 0) {
      throw new Error("Impossibile eliminare: il veicolo ha richieste ricambi associate")
    }

    // Delete registration doc if exists
    if (vehicle.registrationDocFileId) {
      await ctx.storage.delete(vehicle.registrationDocFileId)
    }

    await ctx.db.delete(args.vehicleId)

    // Create event
    await createEvent(ctx, {
      type: "VEHICLE_DELETED",
      entityType: "vehicle",
      entityId: args.vehicleId,
      payload: { plate: vehicle.plate },
      actorUserId: currentUser._id,
    })

    return { success: true }
  },
})
