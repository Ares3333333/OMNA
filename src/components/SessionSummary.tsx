"use client";

import { motion } from "framer-motion";
import { formatPeople, formatSessionDurationWords } from "@/lib/format";

type SessionSummaryProps = {
  seconds: number;
  globalUsers: number;
  shareFeedback: string;
  onReturn: () => void;
  onInvite: () => void;
};

export function SessionSummary({
  seconds,
  globalUsers,
  shareFeedback,
  onReturn,
  onInvite,
}: SessionSummaryProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="mmatrix-summary"
      aria-label="Итог сессии"
    >
      <SessionTrace seconds={seconds} />
      <p className="mmatrix-summary-main">
        Ты поддерживал Omna {formatSessionDurationWords(seconds)}.
      </p>
      <p>За это время общий звук стал сильнее.</p>
      <p>Твоя волна осталась в Omna.</p>
      <p>Сейчас Omna держат {formatPeople(globalUsers)} человек.</p>

      <div className="mt-3 flex w-full items-center justify-center gap-2 sm:mt-4">
        <button
          type="button"
          onClick={onReturn}
          className="mmatrix-summary-button mmatrix-summary-button-primary"
        >
          Вернуться
        </button>
        <button
          type="button"
          onClick={onInvite}
          className="mmatrix-summary-button"
        >
          Позвать человека
        </button>
      </div>

      {shareFeedback ? (
        <div className="mt-2 text-[11px] text-cyan-100/52">{shareFeedback}</div>
      ) : null}
    </motion.div>
  );
}

function SessionTrace({ seconds }: { seconds: number }) {
  const phase = (seconds % 17) * 0.12;

  return (
    <svg className="omna-session-trace" viewBox="0 0 320 64" aria-hidden="true">
      <path
        d={`M8 ${34 + Math.sin(phase) * 2} C 62 10, 88 56, 136 32 S 220 18, 312 38`}
        fill="none"
        stroke="rgba(113, 219, 255, 0.64)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d={`M24 40 C 80 26, 108 42, 150 38 S 230 26, 296 30`}
        fill="none"
        stroke="rgba(39, 139, 255, 0.42)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="160" cy="32" r="3.2" fill="rgba(121, 237, 255, 0.78)" />
    </svg>
  );
}
