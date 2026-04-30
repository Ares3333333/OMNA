"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, lerp } from "@/lib/format";
import { OmnaMode } from "@/lib/types";

type SimulationInput = {
  isJoined: boolean;
  mode: OmnaMode;
  micLevel: number;
  breathValue: number;
  isRitualLive: boolean;
};

export type SimulatedGlobalState = {
  globalUsers: number;
  globalForce: number;
  globalMinutes: number;
};

const initialState: SimulatedGlobalState = {
  globalUsers: 286,
  globalForce: 46,
  globalMinutes: 1_126_440,
};

export function useSimulatedGlobalState(input: SimulationInput) {
  const [state, setState] = useState<SimulatedGlobalState>(initialState);
  const inputRef = useRef(input);
  const valuesRef = useRef(initialState);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let lastCommit = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;

      const seconds = now / 1000;
      const { isJoined, mode, micLevel, breathValue, isRitualLive } = inputRef.current;
      const waveA = Math.sin(seconds / 22);
      const waveB = Math.sin(seconds / 51 + 1.8);
      const waveC = Math.sin(seconds / 9.4 + 4.2);

      const joinedUserLift = isJoined ? 8 : 0;
      const ritualUserLift = isRitualLive ? 118 : 0;
      const targetUsers = clamp(
        386 + waveA * 212 + waveB * 96 + waveC * 24 + joinedUserLift + ritualUserLift,
        30,
        800,
      );

      const modeLift =
        mode === "voice"
          ? 8 + micLevel * 18
          : mode === "breath"
            ? 7 + breathValue * 9
            : mode === "listen"
              ? 3
              : 0;

      const targetForce = clamp(
        52 +
          Math.sin(seconds / 17 + 0.7) * 18 +
          Math.sin(seconds / 43) * 9 +
          ((targetUsers - 360) / 440) * 12 +
          modeLift +
          (isRitualLive ? 8 : 0),
        20,
        95,
      );

      const smoothing = 1 - Math.exp(-dt * 0.5);
      const nextUsers = lerp(valuesRef.current.globalUsers, targetUsers, smoothing);
      const nextForce = lerp(valuesRef.current.globalForce, targetForce, smoothing * 0.86);
      const nextMinutes =
        valuesRef.current.globalMinutes + (Math.max(1, nextUsers) * dt) / 60;

      valuesRef.current = {
        globalUsers: nextUsers,
        globalForce: nextForce,
        globalMinutes: nextMinutes,
      };

      if (now - lastCommit > 120) {
        setState(valuesRef.current);
        lastCommit = now;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  return state;
}
