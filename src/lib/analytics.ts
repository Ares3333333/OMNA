"use client";

type AnalyticsValue = string | number | boolean | null;

type OmnaAnalyticsEvent = {
  type: string;
  at: string;
  payload?: Record<string, AnalyticsValue>;
};

const analyticsKey = "omna.analytics.v1";
const maxEvents = 160;

export function trackOmnaEvent(
  type: string,
  payload?: Record<string, AnalyticsValue>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const event: OmnaAnalyticsEvent = {
    type,
    at: new Date().toISOString(),
    payload,
  };

  try {
    const current = readEvents();
    const next = [...current, event].slice(-maxEvents);
    window.localStorage.setItem(analyticsKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("omna:analytics", { detail: event }));
  } catch {
    // Local analytics must never block the ritual experience.
  }
}

export function readOmnaEvents(): OmnaAnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  return readEvents();
}

function readEvents() {
  try {
    const raw = window.localStorage.getItem(analyticsKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OmnaAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}
