// Tiny, dependency-free flag helpers. The actual demo dataset lives in
// `demo.ts`, which is only ever dynamically imported in dev so it is dropped
// from production builds entirely.

const DEMO_KEY = "demoMode";

/** Demo mode is a local development affordance and never ships to production. */
export function isDemoEnabled(): boolean {
  return import.meta.env.DEV;
}

export function isDemoActive(): boolean {
  return isDemoEnabled() && localStorage.getItem(DEMO_KEY) === "1";
}

export function setDemoActive(active: boolean): void {
  if (active) {
    localStorage.setItem(DEMO_KEY, "1");
  } else {
    localStorage.removeItem(DEMO_KEY);
  }
}
