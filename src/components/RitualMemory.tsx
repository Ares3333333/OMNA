"use client";

import { formatSessionSeconds } from "@/lib/format";
import { StoredSession, summarizeOmnaSessions } from "@/lib/sessionHistory";

type RitualMemoryProps = {
  sessions: StoredSession[];
};

export function RitualMemory({ sessions }: RitualMemoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="omna-memory omna-memory-empty">
        <span>Первый след появится после сессии.</span>
      </div>
    );
  }

  const summary = summarizeOmnaSessions(sessions);
  const last = sessions[0];

  return (
    <div className="omna-memory" aria-label="Твой след Omna">
      <div className="omna-memory-grid">
        <div>
          <strong>{summary.count}</strong>
          <span>сессий</span>
        </div>
        <div>
          <strong>{formatSessionSeconds(summary.totalSeconds)}</strong>
          <span>в звуке</span>
        </div>
        <div>
          <strong>{summary.streak}</strong>
          <span>дней подряд</span>
        </div>
      </div>
      <p>Последний след: {last.trace.phrase}</p>
    </div>
  );
}
