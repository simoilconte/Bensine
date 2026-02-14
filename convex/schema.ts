import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// TireSpec validator for reuse
const tireSpecValidator = v.object({
  width: v.number(),
  aspectRatio: v.number(),
  rimDiameter: v.number(),
  loadIndex: v.optional(v.union(v.string(), v.number())),
  speedRating: v.optional(v.string()),
  brand: v.optional(v.string()),
})

export default defineSchema({
  appUsers: defineTable({
    identitySubject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.union(v.literal("ADMIN"), v.literal("BENZINE"), v.literal("CLIENTE")),
    customerId: v.optional(v.id("customers")),
    privileges: v.optional(v.record(v.string(), v.boolean())),
    passwordHash: v.optional(v.string()), // For simple auth
  })
    .index("by_identity", ["identitySubject"])
    .index("by_customer", ["customerId"])
    .index("by_email", ["email"]),

  customers: defineTable({
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
    documents: v.optional(v.array(v.object({
      fileId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      uploadedAt: v.number(),
      uploadedBy: v.id("appUsers"),
    }))),
    sharing: v.object({
      sharedWithClientUserIds: v.array(v.id("appUsers")),
      clientPermissions: v.object({
        canViewVehicles: v.boolean(),
        canViewParts: v.boolean(),
        canViewDocuments: v.boolean(),
      }),
    }),
  })
    .index("by_displayName", ["displayName"])
    .searchIndex("search_displayName", {
      searchField: "displayName",
    }),

  vehicles: defineTable({
    customerId: v.id("customers"),
    plate: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    vin: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    km: v.optional(v.number()),
    tires: v.object({
      summer: v.optional(v.object({
        front: v.optional(tireSpecValidator),
        rear: v.optional(tireSpecValidator),
      })),
      winter: v.optional(v.object({
        front: v.optional(tireSpecValidator),
        rear: v.optional(tireSpecValidator),
      })),
      notes: v.optional(v.string()),
    }),
    registrationDocFileId: v.optional(v.id("_storage")),
    registrationDocMeta: v.optional(v.object({
      filename: v.string(),
      contentType: v.string(),
      uploadedAt: v.number(),
    })),
  })
    .index("by_plate", ["plate"])
    .index("by_customer", ["customerId"]),

  suppliers: defineTable({
    companyName: v.string(),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_companyName", ["companyName"])
    .searchIndex("search_companyName", {
      searchField: "companyName",
    }),

  parts: defineTable({
    name: v.string(),
    sku: v.optional(v.string()),
    oemCode: v.optional(v.string()),
    supplier: v.optional(v.string()), // Deprecated: kept for migration compatibility
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
  })
    .index("by_name", ["name"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_supplier", ["supplierId"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  partRequests: defineTable({
    customerId: v.id("customers"),
    vehicleId: v.id("vehicles"),
    requestedItems: v.array(v.object({
      partId: v.optional(v.id("parts")),
      freeTextName: v.optional(v.string()),
      qty: v.number(),
      unitPriceSnapshot: v.optional(v.number()),
      unitCostSnapshot: v.optional(v.number()),
    })),
    status: v.union(
      v.literal("DA_ORDINARE"),
      v.literal("ORDINATO"),
      v.literal("ARRIVATO"),
      v.literal("CONSEGNATO"),
      v.literal("ANNULLATO")
    ),
    supplier: v.optional(v.string()),
    notes: v.optional(v.string()),
    timeline: v.array(v.object({
      status: v.string(),
      at: v.number(),
      byUserId: v.id("appUsers"),
    })),
  })
    .index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    .index("by_vehicle", ["vehicleId"]),

  events: defineTable({
    type: v.string(),
    entityType: v.union(
      v.literal("customer"), 
      v.literal("vehicle"), 
      v.literal("part"), 
      v.literal("partRequest"),
      v.literal("fuelType"),
      v.literal("supplier")
    ),
    entityId: v.string(),
    payload: v.any(),
    actorUserId: v.id("appUsers"),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_type", ["type"]),

  fuelTypes: defineTable({
    name: v.string(),
    order: v.number(),
    isActive: v.boolean(),
  })
    .index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  notificationOutbox: defineTable({
    channel: v.union(
      v.literal("EMAIL"), 
      v.literal("SMS"), 
      v.literal("WHATSAPP"), 
      v.literal("PUSH")
    ),
    to: v.string(),
    templateKey: v.string(),
    data: v.any(),
    status: v.union(
      v.literal("PENDING"), 
      v.literal("SENT"), 
      v.literal("FAILED")
    ),
    retryCount: v.number(),
    lastError: v.optional(v.string()),
  })
    .index("by_status", ["status"]),

  // Session table for simple auth
  sessions: defineTable({
    token: v.string(),
    userId: v.id("appUsers"),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
})
