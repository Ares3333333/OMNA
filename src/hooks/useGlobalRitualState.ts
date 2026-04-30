"use client";

import { useSimulatedGlobalState } from "@/hooks/useSimulatedGlobalState";
import { OmnaMode } from "@/lib/types";

type GlobalRitualInput = {
  isJoined: boolean;
  mode: OmnaMode;
  micLevel: number;
  breathValue: number;
};

export type GlobalRitualState = {
  globalUsers: number;
  globalForce: number;
  globalMinutes: number;
  source: "simulated" | "realtime";
};

export function useGlobalRitualState(input: GlobalRitualInput): GlobalRitualState {
  const simulated = useSimulatedGlobalState(input);

  // Future Supabase/Firebase integration point:
  // - presence online users -> globalUsers
  // - aggregate amplitude/breath/session events -> globalForce
  // - persisted ritual counter -> globalMinutes
  // - invite/share events can be emitted from MainPage.invite()
  return {
    ...simulated,
    source: "simulated",
  };
}
