/**
 * Convex Health Checker
 *
 * Monitors Convex backend availability. When Convex is down, paused,
 * or rate-limited, the app automatically falls back to Supabase.
 */

type HealthStatus = "healthy" | "degraded" | "down";

interface HealthState {
  status: HealthStatus;
  lastCheck: number;
  consecutiveFailures: number;
  lastError: string | null;
}

const STORAGE_KEY = "dl-convex-health";
const FAILURE_THRESHOLD = 3; // After 3 consecutive failures → mark as down
const RECOVERY_CHECK_INTERVAL = 30_000; // Re-check Convex every 30s when down
const HEALTHY_CHECK_INTERVAL = 120_000; // Re-check every 2min when healthy

let state: HealthState = {
  status: "healthy",
  lastCheck: 0,
  consecutiveFailures: 0,
  lastError: null,
};

let listeners: Set<() => void> = new Set();
let recoveryTimer: ReturnType<typeof setInterval> | null = null;

/** Load persisted state from localStorage */
function loadState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<HealthState>;
      state = { ...state, ...saved };
    }
  } catch {
    /* ignore */
  }
}

/** Save state to localStorage */
function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Notify all listeners of status change */
function notify(): void {
  saveState();
  listeners.forEach((fn) => fn());
}

/**
 * Ping Convex to check if it's reachable.
 * Uses a lightweight query that should exist on any deployment.
 */
export async function checkConvexHealth(convexUrl?: string): Promise<boolean> {
  const url =
    convexUrl ||
    (import.meta as any).env?.VITE_CONVEX_URL ||
    "https://capable-boar-593.convex.cloud";

  try {
    const response = await fetch(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "admin:getSession",
        args: { token: "health-check-ping" },
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    // Any HTTP response (even errors) means Convex is reachable
    // Only network failures / timeouts mean it's truly down
    if (response.ok || response.status === 400 || response.status === 500) {
      return true;
    }
    return false;
  } catch (err) {
    // Network error, timeout, etc.
    console.warn("[ConvexHealth] Check failed:", (err as Error).message);
    return false;
  }
}

/**
 * Report a Convex failure (called when a query/mutation fails)
 */
export function reportFailure(error?: string): void {
  state.consecutiveFailures++;
  state.lastError = error || "Unknown error";
  state.lastCheck = Date.now();

  if (state.consecutiveFailures >= FAILURE_THRESHOLD && state.status !== "down") {
    console.warn(
      `[ConvexHealth] Convex marked as DOWN after ${state.consecutiveFailures} failures`,
    );
    state.status = "down";
    startRecoveryCheck();
  } else if (state.consecutiveFailures >= 1 && state.status === "healthy") {
    state.status = "degraded";
  }

  notify();
}

/**
 * Report a Convex success (called when a query/mutation succeeds)
 */
export function reportSuccess(): void {
  if (state.consecutiveFailures > 0 || state.status !== "healthy") {
    console.log("[ConvexHealth] Convex recovered → healthy");
  }
  state.consecutiveFailures = 0;
  state.status = "healthy";
  state.lastError = null;
  state.lastCheck = Date.now();
  notify();
}

/**
 * Get current health status
 */
export function getHealthStatus(): HealthStatus {
  return state.status;
}

/**
 * Check if Convex is usable (healthy or just slightly degraded)
 */
export function isConvexUsable(): boolean {
  return state.status !== "down";
}

/**
 * Subscribe to health status changes
 */
export function onHealthChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Start periodic recovery checks when Convex is down
 */
function startRecoveryCheck(): void {
  if (recoveryTimer) return;

  recoveryTimer = setInterval(async () => {
    const isAlive = await checkConvexHealth();
    if (isAlive) {
      console.log("[ConvexHealth] Convex is back online!");
      reportSuccess();
      stopRecoveryCheck();
    }
  }, RECOVERY_CHECK_INTERVAL);
}

function stopRecoveryCheck(): void {
  if (recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = null;
  }
}

// Load persisted state on module init
loadState();

// If we were down, start recovery checks
if (state.status === "down") {
  startRecoveryCheck();
}
