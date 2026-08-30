/**
 * Keep-Alive Function
 *
 * Minimal internal mutation that touches the database every 12 hours
 * to prevent Convex free tier from auto-pausing the deployment.
 *
 * This function:
 * 1. Reads or creates a "keep-alive" row in appSettings
 * 2. Updates its timestamp
 * 3. Does almost nothing else — minimal bandwidth usage
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const keepAlive = internalMutation({
  args: {},
  handler: async (ctx) => {
    const KEY = "keep-alive-last-run";

    // Try to read existing row
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();

    const now = Date.now();

    if (existing) {
      // Update timestamp
      await ctx.db.patch(existing._id, {
        value: String(now),
      });
    } else {
      // Create new row
      await ctx.db.insert("appSettings", {
        key: KEY,
        value: String(now),
      });
    }

    // That's it — minimal database touch to keep deployment alive
    return { success: true, timestamp: now };
  },
});
