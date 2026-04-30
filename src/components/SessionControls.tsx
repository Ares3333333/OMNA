"use client";

import { motion } from "framer-motion";

type SessionControlsProps = {
  isJoined: boolean;
  onJoin: () => void;
  onDisconnect: () => void;
  joinLabel?: string;
};

export function SessionControls({
  isJoined,
  onJoin,
  onDisconnect,
  joinLabel = "Войти в Omna",
}: SessionControlsProps) {
  if (!isJoined) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={onJoin}
        className="group relative h-[clamp(3.05rem,6.35svh,4.45rem)] w-full max-w-[clamp(19rem,31vw,28rem)] overflow-hidden rounded-[clamp(0.9rem,1.9svh,1.3rem)] border border-[#78a9ff]/58 bg-[#031735]/56 px-8 text-[clamp(1rem,1.54vw,1.46rem)] font-medium text-slate-100 shadow-[0_0_34px_rgba(32,127,255,0.13),inset_0_0_30px_rgba(53,168,255,0.13)] backdrop-blur-xl transition hover:border-cyan-100/88 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(77,181,255,0.28),transparent_58%)] opacity-80" />
        <svg
          className="pointer-events-none absolute inset-x-0 top-1/2 h-14 w-full -translate-y-1/2 opacity-34 transition group-hover:opacity-58"
          viewBox="0 0 520 90"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 52 C 58 12 97 83 155 48 S 251 25 321 48 425 73 520 34"
            fill="none"
            stroke="rgba(65,210,255,0.42)"
            strokeWidth="2"
          />
          <path
            d="M0 57 C 69 41 99 57 160 55 S 270 38 335 54 441 51 520 60"
            fill="none"
            stroke="rgba(17,102,255,0.52)"
            strokeWidth="1"
          />
        </svg>
        <span className="relative">{joinLabel}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      initial={false}
      animate={{ opacity: 1 }}
      whileTap={{ scale: 0.985 }}
      onClick={onDisconnect}
      className="min-h-9 rounded-full border border-cyan-100/18 bg-white/[0.018] px-5 text-[12px] font-medium text-cyan-50/64 backdrop-blur-xl transition hover:border-cyan-100/38 hover:text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100/70"
    >
      Отключиться
    </motion.button>
  );
}
