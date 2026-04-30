"use client";

import { useEffect, useState } from "react";
import { BreathState } from "@/lib/types";
import { easeInOutSine } from "@/lib/format";

const phases = [
  { phase: "inhale", label: "Вдох", duration: 4 },
  { phase: "holdIn", label: "Пауза", duration: 2 },
  { phase: "exhale", label: "Выдох", duration: 6 },
  { phase: "holdOut", label: "Пауза", duration: 2 },
] as const;

const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

const restingBreath: BreathState = {
  phase: "inhale",
  label: "Вдох",
  phaseProgress: 0,
  cycleProgress: 0,
  breathValue: 0.35,
};

export function useBreathCycle(active: boolean): BreathState {
  const [state, setState] = useState<BreathState>(restingBreath);

  useEffect(() => {
    if (!active) {
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = () => {
      const elapsed = ((performance.now() - startedAt) / 1000) % totalDuration;
      let cursor = 0;

      for (const item of phases) {
        const phaseStart = cursor;
        const phaseEnd = cursor + item.duration;

        if (elapsed >= phaseStart && elapsed < phaseEnd) {
          const phaseProgress = (elapsed - phaseStart) / item.duration;
          let breathValue = 0;

          if (item.phase === "inhale") {
            breathValue = easeInOutSine(phaseProgress);
          } else if (item.phase === "holdIn") {
            breathValue = 1;
          } else if (item.phase === "exhale") {
            breathValue = 1 - easeInOutSine(phaseProgress);
          }

          setState({
            phase: item.phase,
            label: item.label,
            phaseProgress,
            cycleProgress: elapsed / totalDuration,
            breathValue,
          });
          break;
        }

        cursor = phaseEnd;
      }

      frame = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(frame);
      setState(restingBreath);
    };
  }, [active]);

  return state;
}
