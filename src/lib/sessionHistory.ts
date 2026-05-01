"use client";

import { SessionRitualTrace } from "@/lib/sessionRitual";
import { OmnaMode } from "@/lib/types";

export type StoredSession = {
  id: string;
  at: string;
  seconds: number;
  mode: OmnaMode;
  users: number;
  force: number;
  trace: SessionRitualTrace;
};

const historyKey = "omna.sessions.v1";
const maxSessions = 42;

export function saveOmnaSession(session: Omit<StoredSession, "id" | "at">) {
  if (typeof window === "undefined") {
    return [];
  }

  const nextSession: StoredSession = {
    ...session,
    id: `${Date.now().toString(36)}-${session.trace.traceId}`,
    at: new Date().toISOString(),
  };

  const next = [nextSession, ...readOmnaSessions()].slice(0, maxSessions);
  window.localStorage.setItem(historyKey, JSON.stringify(next));
  return next;
}

export function readOmnaSessions(): StoredSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(historyKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    return [];
  }
}

export function summarizeOmnaSessions(sessions: StoredSession[]) {
  const totalSeconds = sessions.reduce((sum, session) => sum + session.seconds, 0);
  const completed = sessions.filter((session) => session.trace.completedGoal).length;
  const streak = calculateDailyStreak(sessions);

  return {
    totalSeconds,
    completed,
    streak,
    count: sessions.length,
  };
}

function calculateDailyStreak(sessions: StoredSession[]) {
  const days = new Set(
    sessions.map((session) => new Date(session.at).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
