"use client";

import { motion } from "framer-motion";
import { MicrophoneStatus, OmnaMode, modeLabels } from "@/lib/types";

type ModeSelectorProps = {
  mode: OmnaMode;
  microphoneStatus: MicrophoneStatus;
  micLevel: number;
  onSelect: (mode: Exclude<OmnaMode, "idle">) => void;
};

const modes: Array<Exclude<OmnaMode, "idle">> = ["voice", "breath", "listen"];

export function ModeSelector({
  mode,
  microphoneStatus,
  micLevel,
  onSelect,
}: ModeSelectorProps) {
  const micUnavailable =
    mode === "voice" &&
    (microphoneStatus === "denied" || microphoneStatus === "unavailable");
  const showVoicePrivacy = mode === "voice" && !micUnavailable;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="omna-mode-selector"
    >
      <div className="omna-mode-orbits" aria-label="Режим участия">
        {modes.map((nextMode) => {
          const active = mode === nextMode;

          return (
            <button
              key={nextMode}
              type="button"
              onClick={() => onSelect(nextMode)}
              className={[
                "omna-mode-orb",
                active ? "omna-mode-orb-active" : "",
              ].join(" ")}
              aria-pressed={active}
            >
              <span className="omna-mode-text">{modeLabels[nextMode]}</span>
            </button>
          );
        })}
      </div>

      {micUnavailable ? (
        <div className="omna-soft-message">
          <p>Микрофон недоступен. Можно перейти в дыхание.</p>
          <button type="button" onClick={() => onSelect("breath")}>
            Дышать
          </button>
        </div>
      ) : null}

      {showVoicePrivacy ? (
        <>
          <VoiceCalibration micLevel={micLevel} microphoneStatus={microphoneStatus} />
          <div className="omna-privacy-note">
            Аудио не записывается. Используется только уровень громкости.
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

function VoiceCalibration({
  micLevel,
  microphoneStatus,
}: {
  micLevel: number;
  microphoneStatus: MicrophoneStatus;
}) {
  const level = Math.min(1, Math.max(0, micLevel / 0.32));
  const label =
    microphoneStatus === "requesting"
      ? "Ждём микрофон"
      : micLevel < 0.045
        ? "Звучи чуть сильнее"
        : micLevel > 0.28
          ? "Чуть тише"
          : "Хорошо";

  return (
    <div className="omna-voice-calibration" aria-label="Калибровка голоса">
      <div className="omna-voice-calibration-row">
        <span>Твой звук</span>
        <strong>{label}</strong>
      </div>
      <div className="omna-voice-meter">
        <div className="omna-voice-meter-good" />
        <div
          className="omna-voice-meter-fill"
          style={{ transform: `scaleX(${level})` }}
        />
      </div>
    </div>
  );
}
