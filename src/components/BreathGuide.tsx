"use client";

import { motion } from "framer-motion";
import { BreathState } from "@/lib/types";

type BreathGuideProps = {
  breath: BreathState;
};

export function BreathGuide({ breath }: BreathGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mx-auto mt-2.5 w-full max-w-[340px] sm:mt-3"
    >
      <div className="flex items-center justify-between text-[11px] text-cyan-100/56">
        <span className="uppercase">{breath.label}</span>
        <span>{Math.round(breath.cycleProgress * 100)}%</span>
      </div>
      <div
        className="mt-2 h-[3px] overflow-hidden rounded-full bg-cyan-100/10"
        role="progressbar"
        aria-label={breath.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(breath.cycleProgress * 100)}
      >
        <motion.div
          className="h-full rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(99,232,255,0.72)]"
          animate={{ width: `${breath.cycleProgress * 100}%` }}
          transition={{ duration: 0.18, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
