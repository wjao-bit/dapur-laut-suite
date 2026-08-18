/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as aiKeys from "../aiKeys.js";
import type * as aiOcr from "../aiOcr.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as business from "../business.js";
import type * as crons from "../crons.js";
import type * as gudang from "../gudang.js";
import type * as http from "../http.js";
import type * as katalog from "../katalog.js";
import type * as lib from "../lib.js";
import type * as monitor from "../monitor.js";
import type * as notif from "../notif.js";
import type * as payment from "../payment.js";
import type * as piutang from "../piutang.js";
import type * as queries from "../queries.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  aiKeys: typeof aiKeys;
  aiOcr: typeof aiOcr;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  business: typeof business;
  crons: typeof crons;
  gudang: typeof gudang;
  http: typeof http;
  katalog: typeof katalog;
  lib: typeof lib;
  monitor: typeof monitor;
  notif: typeof notif;
  payment: typeof payment;
  piutang: typeof piutang;
  queries: typeof queries;
  seed: typeof seed;
  users: typeof users;
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
