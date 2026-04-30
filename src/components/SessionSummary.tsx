"use client";

import { motion } from "framer-motion";
import {
  formatPeople,
  formatSessionDurationWords,
  formatSessionSeconds,
} from "@/lib/format";
import { SessionRitualTrace } from "@/lib/sessionRitual";

type SessionSummaryProps = {
  seconds: number;
  globalUsers: number;
  trace: SessionRitualTrace;
  shareFeedback: string;
  supportFeedback: string;
  installFeedback: string;
  canInstall: boolean;
  onReturn: () => void;
  onInvite: () => void;
  onSupport: () => void;
  onInstall: () => void;
};

export function SessionSummary({
  seconds,
  globalUsers,
  trace,
  shareFeedback,
  supportFeedback,
  installFeedback,
  canInstall,
  onReturn,
  onInvite,
  onSupport,
  onInstall,
}: SessionSummaryProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="mmatrix-summary"
      aria-label="Итог сессии"
    >
      <SessionTrace seconds={seconds} />
      <div className="omna-share-card" aria-label="Карточка сессии">
        <span>Я держал Omna</span>
        <strong>{formatSessionSeconds(seconds)}</strong>
        <small>{trace.phrase}</small>
      </div>
      <div className="omna-ritual-trace">
        <span>След {trace.traceId}</span>
        <strong>{trace.resonance}% резонанса</strong>
        <small>
          {trace.completedGoal
            ? "трёхминутный ритуал завершён"
            : "волна осталась в общем звуке"}
        </small>
      </div>
      <p className="mmatrix-summary-main">
        Ты поддерживал Omna {formatSessionDurationWords(seconds)}.
      </p>
      <p>За это время общий звук стал сильнее.</p>
      <p>Твоя волна осталась в Omna.</p>
      <p>Сейчас Omna держат {formatPeople(globalUsers)} человек.</p>

      <div className="mmatrix-summary-actions mt-3 flex w-full items-center justify-center gap-2 sm:mt-4">
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
        <button
          type="button"
          onClick={onSupport}
          className="mmatrix-summary-button mmatrix-summary-button-quiet"
        >
          Поддержать Omna
        </button>
        {canInstall ? (
          <button
            type="button"
            onClick={onInstall}
            className="mmatrix-summary-button mmatrix-summary-button-install"
          >
            Добавить на экран
          </button>
        ) : null}
      </div>

      {shareFeedback ? (
        <div className="mt-2 text-[11px] text-cyan-100/52">{shareFeedback}</div>
      ) : null}
      {supportFeedback ? (
        <div className="mt-2 text-[11px] text-cyan-100/52">{supportFeedback}</div>
      ) : null}
      {installFeedback ? (
        <div className="mt-2 text-[11px] text-cyan-100/52">{installFeedback}</div>
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
