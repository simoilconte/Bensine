import { mutation } from "./_generated/server"

// Simple hash function (same as in auth.ts)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("appUsers").collect()
    if (existingUsers.length > 0) {
      return { message: "Database già popolato", seeded: false }
    }

    // Create users
    const adminId = await ctx.db.insert("appUsers", {
      identitySubject: "user:admin@bensine.it",
      email: "admin@bensine.it",
      name: "Mario Rossi (Admin)",
      role: "ADMIN",
      passwordHash: simpleHash("admin123"),
    })

    const bensine1Id = await ctx.db.insert("appUsers", {
      identitySubject: "user:luca@bensine.it",
      email: "luca@bensine.it",
      name: "Luca Bianchi",
      role: "BENZINE",
      passwordHash: simpleHash("bensine123"),
    })

    const bensine2Id = await ctx.db.insert("appUsers", {
      identitySubject: "user:giulia@bensine.it",
      email: "giulia@bensine.it",
      name: "Giulia Verdi",
      role: "BENZINE",
      passwordHash: simpleHash("bensine123"),
    })

    // Create customers
    const customer1Id = await ctx.db.insert("customers", {
      type: "PRIVATO",
      displayName: "Giuseppe Ferrari",
      privateFields: { firstName: "Giuseppe", lastName: "Ferrari" },
      contacts: { phone: "+39 333 1234567", email: "giuseppe.ferrari@email.it", address: "Via Roma 123, Milano" },
      notes: "Cliente storico, preferisce essere contattato via telefono",
      sharing: { sharedWithClientUserIds: [], clientPermissions: { canViewVehicles: true, canViewParts: true, canViewDocuments: false } },
    })

    const customer2Id = await ctx.db.insert("customers", {
      type: "AZIENDA",
      displayName: "Trasporti Veloci SRL",
      companyFields: { ragioneSociale: "Trasporti Veloci SRL", piva: "IT12345678901", referenteNome: "Marco Neri" },
      contacts: { phone: "+39 02 9876543", email: "info@trasportiveloci.it", address: "Via Industriale 45, Monza" },
      notes: "Flotta di 5 veicoli, contratto manutenzione annuale",
      sharing: { sharedWithClientUserIds: [], clientPermissions: { canViewVehicles: true, canViewParts: true, canViewDocuments: true } },
    })

    const customer3Id = await ctx.db.insert("customers", {
      type: "PRIVATO",
      displayName: "Anna Colombo",
      privateFields: { firstName: "Anna", lastName: "Colombo" },
      contacts: { phone: "+39 347 9876543", email: "anna.colombo@gmail.com" },
      sharing: { sharedWithClientUserIds: [], clientPermissions: { canViewVehicles: false, canViewParts: false, canViewDocuments: false } },
    })

    // Create client user linked to customer1
    const clientUserId = await ctx.db.insert("appUsers", {
      identitySubject: "user:cliente@bensine.it",
      email: "cliente@bensine.it",
      name: "Giuseppe Ferrari (Cliente)",
      role: "CLIENTE",
      customerId: customer1Id,
      passwordHash: simpleHash("cliente123"),
    })

    // Update customer1 sharing to include client user
    await ctx.db.patch(customer1Id, {
      sharing: {
        sharedWithClientUserIds: [clientUserId],
        clientPermissions: { canViewVehicles: true, canViewParts: true, canViewDocuments: false },
      },
    })

    // Create vehicles
    const vehicle1Id = await ctx.db.insert("vehicles", {
      customerId: customer1Id,
      plate: "AB123CD",
      make: "Fiat",
      model: "Panda",
      year: 2019,
      fuelType: "Benzina",
      km: 45000,
      tires: {
        summer: {
          front: { width: 175, aspectRatio: 65, rimDiameter: 14, brand: "Michelin" },
          rear: { width: 175, aspectRatio: 65, rimDiameter: 14, brand: "Michelin" },
        },
        winter: {
          front: { width: 175, aspectRatio: 65, rimDiameter: 14, brand: "Pirelli" },
          rear: { width: 175, aspectRatio: 65, rimDiameter: 14, brand: "Pirelli" },
        },
      },
    })

    const vehicle2Id = await ctx.db.insert("vehicles", {
      customerId: customer2Id,
      plate: "EF456GH",
      make: "Iveco",
      model: "Daily",
      year: 2021,
      fuelType: "Diesel",
      km: 120000,
      tires: {
        summer: {
          front: { width: 225, aspectRatio: 70, rimDiameter: 16, loadIndex: "112", speedRating: "R" },
          rear: { width: 225, aspectRatio: 70, rimDiameter: 16, loadIndex: "112", speedRating: "R" },
        },
      },
    })

    const vehicle3Id = await ctx.db.insert("vehicles", {
      customerId: customer2Id,
      plate: "IJ789KL",
      make: "Fiat",
      model: "Ducato",
      year: 2020,
      fuelType: "Diesel",
      km: 95000,
      tires: {},
    })

    const vehicle4Id = await ctx.db.insert("vehicles", {
      customerId: customer3Id,
      plate: "MN012OP",
      make: "Volkswagen",
      model: "Golf",
      year: 2022,
      fuelType: "Ibrido",
      km: 15000,
      tires: {
        summer: {
          front: { width: 205, aspectRatio: 55, rimDiameter: 16, brand: "Continental" },
          rear: { width: 205, aspectRatio: 55, rimDiameter: 16, brand: "Continental" },
        },
      },
    })

    // Create parts
    const part1Id = await ctx.db.insert("parts", {
      name: "Filtro olio",
      sku: "FO-001",
      oemCode: "1234567890",
      supplier: "Bosch",
      unitCost: 8.50,
      unitPrice: 15.00,
      stockQty: 25,
      minStockQty: 10,
      location: "Scaffale A1",
    })

    const part2Id = await ctx.db.insert("parts", {
      name: "Filtro aria",
      sku: "FA-002",
      oemCode: "0987654321",
      supplier: "Mann",
      unitCost: 12.00,
      unitPrice: 22.00,
      stockQty: 18,
      minStockQty: 8,
      location: "Scaffale A2",
    })

    const part3Id = await ctx.db.insert("parts", {
      name: "Pastiglie freno anteriori",
      sku: "PF-003",
      supplier: "Brembo",
      unitCost: 35.00,
      unitPrice: 65.00,
      stockQty: 8,
      minStockQty: 5,
      location: "Scaffale B1",
    })

    const part4Id = await ctx.db.insert("parts", {
      name: "Dischi freno anteriori",
      sku: "DF-004",
      supplier: "Brembo",
      unitCost: 55.00,
      unitPrice: 95.00,
      stockQty: 4,
      minStockQty: 4,
      location: "Scaffale B2",
      notes: "Scorta minima raggiunta",
    })

    await ctx.db.insert("parts", {
      name: "Olio motore 5W30 (1L)",
      sku: "OM-005",
      supplier: "Castrol",
      unitCost: 8.00,
      unitPrice: 14.00,
      stockQty: 50,
      minStockQty: 20,
      location: "Scaffale C1",
    })

    await ctx.db.insert("parts", {
      name: "Candele accensione",
      sku: "CA-006",
      oemCode: "NGK-BKR6E",
      supplier: "NGK",
      unitCost: 4.50,
      unitPrice: 9.00,
      stockQty: 32,
      minStockQty: 16,
      location: "Scaffale A3",
    })

    const part7Id = await ctx.db.insert("parts", {
      name: "Cinghia distribuzione",
      sku: "CD-007",
      supplier: "Gates",
      unitCost: 45.00,
      unitPrice: 85.00,
      stockQty: 3,
      minStockQty: 2,
      location: "Scaffale D1",
    })

    const part8Id = await ctx.db.insert("parts", {
      name: "Pompa acqua",
      sku: "PA-008",
      supplier: "SKF",
      unitCost: 65.00,
      unitPrice: 120.00,
      stockQty: 2,
      minStockQty: 2,
      location: "Scaffale D2",
    })

    await ctx.db.insert("parts", {
      name: "Ammortizzatore anteriore",
      sku: "AM-009",
      supplier: "Monroe",
      unitCost: 75.00,
      unitPrice: 140.00,
      stockQty: 6,
      minStockQty: 4,
      location: "Scaffale E1",
    })

    const part10Id = await ctx.db.insert("parts", {
      name: "Batteria 60Ah",
      sku: "BA-010",
      supplier: "Varta",
      unitCost: 70.00,
      unitPrice: 120.00,
      stockQty: 5,
      minStockQty: 3,
      location: "Scaffale F1",
    })

    // Create part requests
    await ctx.db.insert("partRequests", {
      customerId: customer1Id,
      vehicleId: vehicle1Id,
      requestedItems: [
        { partId: part1Id, qty: 1, unitPriceSnapshot: 15.00, unitCostSnapshot: 8.50 },
        { partId: part2Id, qty: 1, unitPriceSnapshot: 22.00, unitCostSnapshot: 12.00 },
      ],
      status: "CONSEGNATO",
      notes: "Tagliando annuale",
      timeline: [
        { status: "DA_ORDINARE", at: Date.now() - 7 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
        { status: "ORDINATO", at: Date.now() - 5 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
        { status: "ARRIVATO", at: Date.now() - 2 * 24 * 60 * 60 * 1000, byUserId: bensine2Id },
        { status: "CONSEGNATO", at: Date.now() - 1 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
      ],
    })

    await ctx.db.insert("partRequests", {
      customerId: customer2Id,
      vehicleId: vehicle2Id,
      requestedItems: [
        { partId: part3Id, qty: 2, unitPriceSnapshot: 65.00, unitCostSnapshot: 35.00 },
        { partId: part4Id, qty: 2, unitPriceSnapshot: 95.00, unitCostSnapshot: 55.00 },
      ],
      status: "ARRIVATO",
      supplier: "Brembo Italia",
      notes: "Urgente - veicolo fermo",
      timeline: [
        { status: "DA_ORDINARE", at: Date.now() - 3 * 24 * 60 * 60 * 1000, byUserId: bensine2Id },
        { status: "ORDINATO", at: Date.now() - 2 * 24 * 60 * 60 * 1000, byUserId: bensine2Id },
        { status: "ARRIVATO", at: Date.now() - 4 * 60 * 60 * 1000, byUserId: bensine1Id },
      ],
    })

    await ctx.db.insert("partRequests", {
      customerId: customer2Id,
      vehicleId: vehicle3Id,
      requestedItems: [
        { partId: part7Id, qty: 1, unitPriceSnapshot: 85.00, unitCostSnapshot: 45.00 },
        { partId: part8Id, qty: 1, unitPriceSnapshot: 120.00, unitCostSnapshot: 65.00 },
      ],
      status: "ORDINATO",
      supplier: "Ricambi Express",
      notes: "Kit distribuzione completo",
      timeline: [
        { status: "DA_ORDINARE", at: Date.now() - 2 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
        { status: "ORDINATO", at: Date.now() - 1 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
      ],
    })

    await ctx.db.insert("partRequests", {
      customerId: customer3Id,
      vehicleId: vehicle4Id,
      requestedItems: [
        { freeTextName: "Specchietto retrovisore destro", qty: 1 },
      ],
      status: "DA_ORDINARE",
      notes: "Specchietto rotto in parcheggio",
      timeline: [
        { status: "DA_ORDINARE", at: Date.now() - 1 * 24 * 60 * 60 * 1000, byUserId: bensine2Id },
      ],
    })

    await ctx.db.insert("partRequests", {
      customerId: customer1Id,
      vehicleId: vehicle1Id,
      requestedItems: [
        { partId: part10Id, qty: 1, unitPriceSnapshot: 120.00, unitCostSnapshot: 70.00 },
      ],
      status: "ANNULLATO",
      notes: "Cliente ha deciso di aspettare",
      timeline: [
        { status: "DA_ORDINARE", at: Date.now() - 10 * 24 * 60 * 60 * 1000, byUserId: bensine1Id },
        { status: "ANNULLATO", at: Date.now() - 8 * 24 * 60 * 60 * 1000, byUserId: adminId },
      ],
    })

    return {
      message: "Database popolato con successo!",
      seeded: true,
      data: {
        users: 4,
        customers: 3,
        vehicles: 4,
        parts: 10,
        partRequests: 5,
      },
    }
  },
})
