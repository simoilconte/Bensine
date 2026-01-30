import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserFromToken } from "./users"

export const listPending = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const notifications = await ctx.db
      .query("notificationOutbox")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect()

    return notifications.map(notification => ({
      _id: notification._id,
      channel: notification.channel,
      to: notification.to,
      templateKey: notification.templateKey,
      data: notification.data,
      status: notification.status,
      retryCount: notification.retryCount,
      lastError: notification.lastError,
      createdAt: notification._creationTime,
    }))
  },
})

export const markAsSent = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notificationOutbox"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    await ctx.db.patch(args.notificationId, {
      status: "SENT",
    })

    return args.notificationId
  },
})

export const markAsFailed = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notificationOutbox"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notifica non trovata")
    }

    const newRetryCount = notification.retryCount + 1
    const maxRetries = 3

    await ctx.db.patch(args.notificationId, {
      status: newRetryCount >= maxRetries ? "FAILED" : "PENDING",
      retryCount: newRetryCount,
      lastError: args.error,
    })

    return args.notificationId
  },
})

export const retryFailed = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notificationOutbox"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserFromToken(ctx, args.token)
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Non autorizzato")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notifica non trovata")
    }

    if (notification.status !== "FAILED") {
      throw new Error("Notifica non è in stato FAILED")
    }

    await ctx.db.patch(args.notificationId, {
      status: "PENDING",
      retryCount: 0,
      lastError: undefined,
    })

    return args.notificationId
  },
})