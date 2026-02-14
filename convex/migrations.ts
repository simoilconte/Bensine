import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Migration to convert supplier string to supplierId reference
export const migrateSupplierToSupplierId = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      suppliersCreated: 0,
      partsUpdated: 0,
      errors: [] as string[],
    }

    try {
      // Get all parts that have a supplier string field
      const parts = await ctx.db.query("parts").collect()
      
      // Create a map to track unique suppliers
      const supplierMap = new Map<string, string>() // supplierName -> supplierId
      
      // First, check if we already have suppliers
      const existingSuppliers = await ctx.db.query("suppliers").collect()
      for (const supplier of existingSuppliers) {
        supplierMap.set(supplier.companyName.toLowerCase(), supplier._id)
      }

      // Process each part
      for (const part of parts) {
        // Check if part has old 'supplier' field (string) and not 'supplierId'
        const partWithSupplier = part as unknown as { supplier?: string; supplierId?: string }
        
        if (partWithSupplier.supplier && !partWithSupplier.supplierId) {
          const supplierName = partWithSupplier.supplier
          
          // Get or create supplier
          let supplierId = supplierMap.get(supplierName.toLowerCase())
          
          if (!supplierId) {
            // Create new supplier
            try {
              supplierId = await ctx.db.insert("suppliers", {
                companyName: supplierName,
                isActive: true,
              })
              supplierMap.set(supplierName.toLowerCase(), supplierId)
              results.suppliersCreated++
            } catch (e) {
              results.errors.push(`Failed to create supplier ${supplierName}: ${e}`)
              continue
            }
          }
          
          // Update part with supplierId and remove old supplier field
          try {
            await ctx.db.patch(part._id, {
              supplierId: supplierId as import("./_generated/dataModel").Id<"suppliers">,
            })
            
            // Note: We can't actually delete the field, but it will be ignored
            results.partsUpdated++
          } catch (e) {
            results.errors.push(`Failed to update part ${part._id}: ${e}`)
          }
        }
      }

      return {
        success: true,
        message: `Migration completed: ${results.suppliersCreated} suppliers created, ${results.partsUpdated} parts updated`,
        results,
      }
    } catch (error) {
      return {
        success: false,
        message: `Migration failed: ${error}`,
        results,
      }
    }
  },
})

// Migration to clean up old supplier field from parts (run after the above migration)
export const cleanupOldSupplierField = mutation({
  args: {},
  handler: async (ctx) => {
    // Note: In Convex, we cannot delete fields from existing documents
    // The old 'supplier' field will simply be ignored by the schema validator
    // This migration is a placeholder for documentation purposes
    
    return {
      success: true,
      message: "Note: Old 'supplier' field cannot be deleted from existing documents in Convex. The field will be ignored by the schema validator.",
    }
  },
})
