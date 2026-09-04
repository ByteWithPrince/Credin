/**
 * Typed API Client for CreditIn FastAPI backend.
 * Features automatic Windows IPv6/IPv4 failover and deterministic seeded safety nets for offline presentation reliability.
 */

import {
  Persona,
  FinancialState,
  ComponentScores,
  ScenarioResult,
  OptimizerResult,
  ParsedIntent,
} from "./types";
import {
  getSeededScore,
  getSeededPersonaState,
  getSeededOptimizerResults,
  getCachedDemoResult,
} from "./demoCache";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    display_name: "Rohit Sharma",
    tagline: "Software Engineer with Credit Card Debt",
    overall_score: 66,
    band: "Fair",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    display_name: "Priya Nair",
    tagline: "First-time borrower with thin credit file",
    overall_score: 66,
    band: "Fair",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    display_name: "Arjun Mehta",
    tagline: "Senior Executive with multiple loans",
    overall_score: 97,
    band: "Strong",
  },
];

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function doFetch(baseUrl: string, url: string, options: RequestInit, signal: AbortSignal) {
  return await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal,
  });
}

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res: Response;
    try {
      res = await doFetch(API_BASE, url, options, controller.signal);
    } catch (primaryErr: any) {
      // Automatic IPv6 -> IPv127 fallback on Windows when localhost is unreachable
      if (API_BASE.includes("localhost")) {
        const altBase = API_BASE.replace("localhost", "127.0.0.1");
        try {
          res = await doFetch(altBase, url, options, controller.signal);
        } catch {
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {}
      throw new ApiError(res.status, errorMsg);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new ApiError(408, "Request timed out after 8 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getPersonas(): Promise<Persona[]> {
  try {
    return await fetchWithTimeout<Persona[]>("/api/personas");
  } catch (err) {
    console.warn("Live personas fetch failed; using default persona list.", err);
    return DEFAULT_PERSONAS;
  }
}

export async function getPersonaState(
  id: string
): Promise<{ state: FinancialState; scores: ComponentScores }> {
  try {
    return await fetchWithTimeout<{ state: FinancialState; scores: ComponentScores }>(
      `/api/personas/${id}/state`
    );
  } catch (err) {
    console.warn("Live persona state fetch failed; using deterministic seeded state.", err);
    const fallback = getSeededPersonaState(id);
    if (fallback) return fallback;
    throw err;
  }
}

export async function getUserScore(
  userId: string
): Promise<{
  user_id: string;
  display_name: string;
  overall: number;
  band: string;
  components: Record<string, { score: number; weight: number; raw: string; reading: string }>;
}> {
  try {
    return await fetchWithTimeout(`/api/users/${userId}/score`);
  } catch (err) {
    console.warn("Live score fetch failed; using deterministic seeded score.", err);
    const fallback = getSeededScore(userId);
    if (fallback) return fallback;
    throw err;
  }
}

export async function parseQuery(
  userId: string,
  query: string
): Promise<ParsedIntent | null> {
  return fetchWithTimeout<ParsedIntent | null>("/api/parse", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, query }),
  });
}

export async function simulate(body: any): Promise<ScenarioResult> {
  try {
    return await fetchWithTimeout<ScenarioResult>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    const cached = getCachedDemoResult(body.user_id || "", body.query || "");
    if (cached) {
      console.warn("Live simulation failed; using cached canonical demo result.", err);
      return cached;
    }
    throw err;
  }
}

export async function optimize(body: {
  user_id: string;
  monthly_budget: string | number;
  strategy?: string;
}): Promise<OptimizerResult | OptimizerResult[]> {
  try {
    return await fetchWithTimeout<OptimizerResult | OptimizerResult[]>("/api/optimize", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("Live optimizer failed; using deterministic seeded optimizer result.", err);
    const fallback = getSeededOptimizerResults(body.user_id, body.strategy);
    if (fallback) return fallback;
    throw err;
  }
}

export async function getImprovementPlan(userId: string): Promise<any> {
  try {
    return await fetchWithTimeout<any>("/api/improve/plan", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  } catch (err) {
    console.warn("Live improvement plan fetch failed; using seeded fallback.", err);
    const { getSeededImprovementPlan } = await import("./demoCache");
    return getSeededImprovementPlan(userId);
  }
}

export async function pingHealth(): Promise<{ status: string; db: boolean; llm_configured: boolean }> {
  return fetchWithTimeout<{ status: string; db: boolean; llm_configured: boolean }>("/api/health");
}

