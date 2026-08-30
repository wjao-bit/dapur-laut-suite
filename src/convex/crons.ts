import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// ============================================================================
// Auto-Backup: Convex → Supabase (daily at 3 AM)
// Backs up critical tables to Supabase as disaster recovery
// ============================================================================
crons.cron(
  "auto-backup-to-supabase",
  "0 3 * * *",
  api.autoBackup.runBackup,
);

export default crons;
