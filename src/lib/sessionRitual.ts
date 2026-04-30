import { OmnaMode } from "@/lib/types";

export type SessionRitualTrace = {
  phrase: string;
  resonance: number;
  completedGoal: boolean;
  traceId: string;
};

const tracePhrases = [
  "тихая синяя волна",
  "мягкое общее м",
  "глубокое присутствие",
  "ровное дыхание поля",
  "свет внутри звука",
  "тёплый человеческий тон",
  "медленная живая пульсация",
  "тонкая волна Omna",
];

export function createSessionRitualTrace({
  seconds,
  mode,
  globalForce,
}: {
  seconds: number;
  mode: OmnaMode;
  globalForce: number;
}): SessionRitualTrace {
  const seed = Math.abs(
    Math.round(seconds * 31 + globalForce * 17 + mode.length * 101),
  );
  const phrase = tracePhrases[seed % tracePhrases.length];
  const completedGoal = seconds >= 180;
  const resonance = Math.min(
    100,
    Math.max(8, Math.round(globalForce * 0.62 + Math.min(seconds, 420) * 0.09)),
  );
  const traceId = `OM-${seed.toString(36).toUpperCase().slice(-4).padStart(4, "0")}`;

  return {
    phrase,
    resonance,
    completedGoal,
    traceId,
  };
}
