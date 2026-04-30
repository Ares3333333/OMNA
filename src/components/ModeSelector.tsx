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
      className="mx-auto mt-2 flex w-full max-w-[370px] flex-col items-center gap-2"
    >
      <div className="grid w-full grid-cols-3 gap-1.5 rounded-[15px] border border-cyan-100/10 bg-white/[0.026] p-1.5 shadow-[0_18px_70px_rgba(0,30,90,0.14)] backdrop-blur-xl">
        {modes.map((nextMode) => {
          const active = mode === nextMode;

          return (
            <button
              key={nextMode}
              type="button"
              onClick={() => onSelect(nextMode)}
              className={[
                "relative min-h-8 rounded-[11px] px-2 text-[12px] font-medium transition sm:min-h-9 sm:text-[13px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/70",
                active
                  ? "bg-cyan-100/92 text-[#03111f] shadow-[0_0_22px_rgba(94,226,255,0.24)]"
                  : "text-cyan-50/70 hover:bg-cyan-100/8 hover:text-cyan-50",
              ].join(" ")}
              aria-pressed={active}
            >
              {modeLabels[nextMode]}
            </button>
          );
        })}
      </div>

      {micUnavailable ? (
        <div className="w-full rounded-[14px] border border-cyan-100/12 bg-[#061222]/62 px-3 py-2 text-center text-[12px] leading-4 text-cyan-50/68 backdrop-blur-xl">
          <p>Микрофон недоступен. Ты можешь подключиться через дыхание.</p>
          <button
            type="button"
            onClick={() => onSelect("breath")}
            className="mt-1 text-[12px] font-semibold text-cyan-100 underline decoration-cyan-100/30 underline-offset-4"
          >
            Перейти в режим Дышать
          </button>
        </div>
      ) : null}

      {showVoicePrivacy ? (
        <>
          <VoiceCalibration micLevel={micLevel} microphoneStatus={microphoneStatus} />
          <div className="omna-privacy-note">
            Аудио не записывается и не отправляется. Используется только уровень громкости.
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
