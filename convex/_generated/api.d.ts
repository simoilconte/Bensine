/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as customers from "../customers.js";
import type * as events from "../events.js";
import type * as fuelTypes from "../fuelTypes.js";
import type * as migrations from "../migrations.js";
import type * as notificationOutbox from "../notificationOutbox.js";
import type * as partRequests from "../partRequests.js";
import type * as parts from "../parts.js";
import type * as seed from "../seed.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  customers: typeof customers;
  events: typeof events;
  fuelTypes: typeof fuelTypes;
  migrations: typeof migrations;
  notificationOutbox: typeof notificationOutbox;
  partRequests: typeof partRequests;
  parts: typeof parts;
  seed: typeof seed;
  suppliers: typeof suppliers;
  users: typeof users;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
