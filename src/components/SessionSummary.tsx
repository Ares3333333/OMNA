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
      <p className="mmatrix-summary-main">
        Ты поддерживал Omna {formatSessionDurationWords(seconds)}.
      </p>
      <p>За это время общий звук стал сильнее.</p>
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
