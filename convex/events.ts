import { Id } from "./_generated/dataModel"
import { MutationCtx } from "./_generated/server"

export const createEvent = async (
  ctx: MutationCtx,
  args: {
    type: string
    entityType: "customer" | "vehicle" | "part" | "partRequest"
    entityId: Id<"customers"> | Id<"vehicles"> | Id<"parts"> | Id<"partRequests">
    payload: any
    actorUserId: Id<"appUsers">
  }
) => {
  await ctx.db.insert("events", {
    type: args.type,
    entityType: args.entityType,
    entityId: args.entityId as string,
    payload: args.payload,
    actorUserId: args.actorUserId,
  })
}

export const createEventWithNotification = async (
  ctx: MutationCtx,
  args: {
    type: string
    entityType: "customer" | "vehicle" | "part" | "partRequest"
    entityId: Id<"customers"> | Id<"vehicles"> | Id<"parts"> | Id<"partRequests">
    payload: any
    actorUserId: Id<"appUsers">
    customerId?: Id<"customers">
    notificationData?: {
      channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH"
      to: string
      templateKey: string
      data: any
    }
  }
) => {
  // Create event
  await createEvent(ctx, {
    type: args.type,
    entityType: args.entityType,
    entityId: args.entityId,
    payload: args.payload,
    actorUserId: args.actorUserId,
  })

  // Create notification if customer is shared and has permissions
  if (args.customerId && args.notificationData) {
    const customer = await ctx.db.get(args.customerId)
    if (customer && customer.sharing.sharedWithClientUserIds.length > 0) {
      // Check if any of the shared users have the required permissions
      const hasPermission = customer.sharing.clientPermissions.canViewParts || 
                           customer.sharing.clientPermissions.canViewVehicles ||
                           customer.sharing.clientPermissions.canViewDocuments

      if (hasPermission) {
        // Get customer email for notification
        const toEmail = customer.contacts?.email || args.notificationData.to
        
        await ctx.db.insert("notificationOutbox", {
          channel: args.notificationData.channel,
          to: toEmail,
          templateKey: args.notificationData.templateKey,
          data: args.notificationData.data,
          status: "PENDING",
          retryCount: 0,
        })
      }
    }
  }
}
