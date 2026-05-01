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
        whileTap={{ scale: 0.965 }}
        onClick={onJoin}
        className="omna-primary-orb"
      >
        <span className="omna-orb-core" />
        <span className="omna-orb-ring" />
        <svg
          className="omna-orb-wave"
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
        <span className="omna-orb-label">{joinLabel}</span>
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
      className="omna-disconnect-orb"
    >
      Выйти
    </motion.button>
  );
}
