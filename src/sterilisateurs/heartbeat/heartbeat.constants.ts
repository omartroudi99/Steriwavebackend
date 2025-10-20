export const THRESHOLD_MS = 60_000;   // 1 min (test)
export const DRIFT_MS = 0;            // 0 pour valider la bascule
export const FRESH_MS = THRESHOLD_MS + DRIFT_MS;
export const FUTURE_SKEW_MS = 30_000; // clamp si timestamp device > now + 30s
