"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BreathGuide } from "@/components/BreathGuide";
import { LivingSphere } from "@/components/LivingSphere";
import { ModeSelector } from "@/components/ModeSelector";
import { SessionControls } from "@/components/SessionControls";
import { SessionSummary } from "@/components/SessionSummary";
import { StatsPanel } from "@/components/StatsPanel";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useBreathCycle } from "@/hooks/useBreathCycle";
import { useEveningRitual } from "@/hooks/useEveningRitual";
import { useGlobalRitualState } from "@/hooks/useGlobalRitualState";
import { useMicrophoneLevel } from "@/hooks/useMicrophoneLevel";
import {
  formatRitualLife,
  formatSessionDurationWords,
} from "@/lib/format";
import { OmnaMode } from "@/lib/types";

const initialLifeSeconds = 18 * 60 * 60 + 24 * 60;

type SessionResult = {
  seconds: number;
  users: number;
};

export function MainPage() {
  const [mode, setMode] = useState<OmnaMode>("idle");
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [personalSeconds, setPersonalSeconds] = useState(0);
  const [lifeSeconds, setLifeSeconds] = useState(initialLifeSeconds);
  const [lastSession, setLastSession] = useState<SessionResult | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const eveningRitual = useEveningRitual();

  const breath = useBreathCycle(isJoined && mode === "breath");
  const { micLevel, microphoneStatus } = useMicrophoneLevel(
    isJoined && mode === "voice",
  );
  const { globalUsers, globalForce, globalMinutes } = useGlobalRitualState({
    isJoined,
    mode,
    micLevel,
    breathValue: breath.breathValue,
  });
  const audioEngine = useAudioEngine({
    isJoined,
    isMuted,
    mode,
    globalForce,
    micLevel,
    breathValue: breath.breathValue,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLifeSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isJoined) {
      return;
    }

    const interval = window.setInterval(() => {
      setPersonalSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isJoined]);

  const status = useMemo(() => {
    if (
      mode === "voice" &&
      (microphoneStatus === "denied" || microphoneStatus === "unavailable")
    ) {
      return "Микрофон недоступен";
    }

    if (lastSession && !isJoined) {
      return `Ты поддерживал Omna ${formatSessionDurationWords(lastSession.seconds)}.`;
    }

    if (!isJoined) {
      return "Сейчас звук держат другие. Ты можешь войти.";
    }

    if (mode === "voice") {
      return "Твой голос усиливает Omna.";
    }

    if (mode === "breath") {
      return "Твоё дыхание держит ритм.";
    }

    if (mode === "listen") {
      return "Ты присутствуешь в общем поле.";
    }

    return "Ты внутри общего звучания.";
  }, [isJoined, lastSession, microphoneStatus, mode]);

  const soundLabel =
    isJoined && !isMuted && audioEngine.isAudioReady
      ? "Звук включён"
      : "Звук выключен";

  const join = () => {
    setIsJoined(true);
    setMode("idle");
    setPersonalSeconds(0);
    setLastSession(null);
    setShareFeedback("");
    void audioEngine.start();
  };

  const selectMode = (nextMode: Exclude<OmnaMode, "idle">) => {
    setIsJoined(true);
    setLastSession(null);
    setMode(nextMode);
    void audioEngine.start();
  };

  const disconnect = () => {
    setLastSession({
      seconds: personalSeconds,
      users: Math.round(globalUsers),
    });
    setMode("idle");
    setIsJoined(false);
    setPersonalSeconds(0);
    setShareFeedback("");
    audioEngine.stop();
  };

  const toggleMute = () => {
    setIsMuted((muted) => !muted);
    if (isJoined) {
      void audioEngine.start();
    }
  };

  const invite = async () => {
    const url = window.location.href;
    const text = `Я сейчас в Omna — живом звуке, который держат люди. Подключись: ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Omna",
          text,
          url,
        });
        setShareFeedback("Приглашение открыто.");
        return;
      }

      await navigator.clipboard.writeText(text);
      setShareFeedback("Текст приглашения скопирован.");
    } catch {
      setShareFeedback("Не получилось поделиться автоматически.");
    }
  };

  const introTitle = lastSession
    ? "Спасибо за звучание."
    : isJoined
      ? "Живой звук, который держат люди"
      : "Omna — это живой звук, который держат люди.";

  const introText = lastSession
    ? "Ты можешь вернуться в поле или позвать того, кто сейчас нужен этому звуку."
    : isJoined
      ? "Выбери способ участия: звучать, дышать или слушать."
      : "Ты можешь звучать, дышать или просто присутствовать. Пока люди подключаются — Omna живёт.";

  const statsPersonalSeconds = isJoined
    ? personalSeconds
    : lastSession?.seconds ?? personalSeconds;

  return (
    <main className="relative h-svh max-h-svh w-full overflow-hidden bg-black text-white">
      <div className="mmatrix-frame relative h-full w-full overflow-hidden">
        <header className="absolute inset-x-0 top-0 z-20 flex h-[clamp(4.2rem,9vh,6.5rem)] items-center justify-between px-[clamp(1.35rem,4.5vw,4.5rem)] pt-[env(safe-area-inset-top)]">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="text-[clamp(1.35rem,2.45vw,2.25rem)] font-light tracking-[0.16em] text-white/94"
          >
            Omna
          </motion.div>

          <motion.button
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={toggleMute}
            className="inline-flex h-[clamp(3rem,6.1svh,4.25rem)] w-[clamp(3rem,6.1svh,4.25rem)] items-center justify-center rounded-[clamp(0.95rem,2svh,1.35rem)] border border-white/16 bg-white/[0.032] text-cyan-50/82 shadow-[inset_0_0_26px_rgba(255,255,255,0.035),0_0_34px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-cyan-100/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100/70"
            aria-label={soundLabel}
            title={soundLabel}
          >
            {isMuted || !isJoined ? (
              <VolumeX aria-hidden="true" size={27} strokeWidth={1.9} />
            ) : (
              <Volume2 aria-hidden="true" size={27} strokeWidth={1.9} />
            )}
          </motion.button>
        </header>

        <section
          className="mmatrix-stage"
          data-joined={isJoined ? "true" : "false"}
          data-session={lastSession && !isJoined ? "summary" : isJoined ? "joined" : "intro"}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mmatrix-sphere-slot"
          >
            <div className="mmatrix-sphere">
              <LivingSphere
                mode={mode}
                isJoined={isJoined}
                micLevel={micLevel}
                breathValue={breath.breathValue}
                globalForce={globalForce}
                globalUsers={globalUsers}
              />
            </div>
          </motion.div>

          <motion.div
            key={status}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mmatrix-status flex items-center justify-center gap-3 text-center text-[clamp(0.76rem,1.16vw,1rem)] font-medium text-cyan-50/58"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2b9cff] shadow-[0_0_18px_rgba(43,156,255,0.9)]" />
            <span>{status}</span>
          </motion.div>

          <div className="mmatrix-life-line">
            Omna живёт уже {formatRitualLife(lifeSeconds)}
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="mmatrix-copy"
          >
            <h1 className="display-title mmatrix-title text-[#edf6ff] drop-shadow-[0_0_24px_rgba(178,225,255,0.14)]">
              {introTitle}
            </h1>
            <p className="mmatrix-subtitle mx-auto max-w-[46rem] text-pretty text-slate-200/52">
              {introText}
            </p>
          </motion.div>

          <div className="mmatrix-actions">
            {lastSession && !isJoined ? (
              <SessionSummary
                seconds={lastSession.seconds}
                globalUsers={lastSession.users}
                shareFeedback={shareFeedback}
                onReturn={join}
                onInvite={invite}
              />
            ) : (
              <>
                <SessionControls
                  isJoined={isJoined}
                  onJoin={join}
                  onDisconnect={disconnect}
                />

                <AnimatePresence mode="popLayout">
                  {isJoined ? (
                    <ModeSelector
                      key="modes"
                      mode={mode}
                      microphoneStatus={microphoneStatus}
                      onSelect={selectMode}
                    />
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {isJoined && mode === "breath" ? (
                    <BreathGuide key="breath" breath={breath} />
                  ) : null}
                </AnimatePresence>
              </>
            )}

            <div
              className={[
                "mmatrix-ritual-note",
                eveningRitual.isLive ? "mmatrix-ritual-note-live" : "",
              ].join(" ")}
            >
              <span>{eveningRitual.label}</span>
              <span>{eveningRitual.detail}</span>
            </div>
          </div>

          <div className="mmatrix-stats-slot">
            <StatsPanel
              globalUsers={globalUsers}
              globalForce={globalForce}
              globalMinutes={globalMinutes}
              personalSeconds={statsPersonalSeconds}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
