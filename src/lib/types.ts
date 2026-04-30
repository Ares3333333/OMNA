export type OmnaMode = "idle" | "voice" | "breath" | "listen";

export type MicrophoneStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export type BreathPhaseKey = "inhale" | "holdIn" | "exhale" | "holdOut";

export type BreathState = {
  phase: BreathPhaseKey;
  label: string;
  phaseProgress: number;
  cycleProgress: number;
  breathValue: number;
};

export const modeLabels: Record<Exclude<OmnaMode, "idle">, string> = {
  voice: "Звучать",
  breath: "Дышать",
  listen: "Слушать",
};
