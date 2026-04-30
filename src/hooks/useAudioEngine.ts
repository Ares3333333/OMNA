"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/format";
import { OmnaMode } from "@/lib/types";

type AudioInput = {
  isJoined: boolean;
  isMuted: boolean;
  mode: OmnaMode;
  globalForce: number;
  micLevel: number;
  breathValue: number;
};

type EngineVoice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  baseFrequency: number;
  weight: number;
  drift: number;
  detuneDepth: number;
};

type Engine = {
  context: AudioContext;
  master: GainNode;
  highpass: BiquadFilterNode;
  filter: BiquadFilterNode;
  presence: BiquadFilterNode;
  voices: EngineVoice[];
};

type WebkitAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function useAudioEngine(input: AudioInput) {
  const [isReady, setIsReady] = useState(false);
  const engineRef = useRef<Engine | null>(null);
  const frameRef = useRef(0);
  const inputRef = useRef(input);
  const animateRef = useRef<() => void>(() => {});

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const animate = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    const { context, master, highpass, filter, presence, voices } = engine;
    const { isJoined, isMuted, mode, globalForce, micLevel, breathValue } =
      inputRef.current;
    const now = context.currentTime;
    const force = clamp(globalForce / 100, 0, 1);
    const breathSwell = mode === "breath" ? 0.9 + breathValue * 0.14 : 1;
    const voiceBloom = mode === "voice" ? micLevel * 0.06 : 0;
    const modeBase =
      mode === "voice" ? 0.043 : mode === "breath" ? 0.039 : mode === "listen" ? 0.034 : 0.014;
    const targetGain =
      isJoined && !isMuted ? modeBase * (0.7 + force * 0.22 + voiceBloom) * breathSwell : 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(clamp(targetGain, 0, 0.058), now, 0.95);
    highpass.frequency.setTargetAtTime(78 + force * 8, now, 1.5);
    filter.frequency.setTargetAtTime(760 + force * 260 + micLevel * 70, now, 1.6);
    filter.Q.setTargetAtTime(mode === "listen" ? 0.32 : 0.38, now, 1.4);
    presence.frequency.setTargetAtTime(245 + Math.sin(now * 0.035) * 18, now, 1.8);

    const shimmer = Math.sin(now * 0.048) * 0.62 + Math.sin(now * 0.013) * 0.85;
    voices.forEach((voice, index) => {
      const wave = Math.sin(now * voice.drift + index) * voice.detuneDepth;
      const voiceLift = mode === "voice" ? micLevel * voice.detuneDepth * 0.22 : 0;
      voice.oscillator.frequency.setTargetAtTime(
        voice.baseFrequency + wave + shimmer + voiceLift,
        now,
        1.25,
      );
      voice.gain.gain.setTargetAtTime(
        voice.weight * (0.86 + force * 0.1 + breathValue * 0.03),
        now,
        1.1,
      );
    });

    frameRef.current = requestAnimationFrame(() => animateRef.current());
  }, []);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const start = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.context.resume();
      setIsReady(true);
      return true;
    }

    const AudioContextClass =
      window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    const context = new AudioContextClass();
    const master = context.createGain();
    const highpass = context.createBiquadFilter();
    const filter = context.createBiquadFilter();
    const presence = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    master.gain.value = 0;
    highpass.type = "highpass";
    highpass.frequency.value = 78;
    highpass.Q.value = 0.62;
    filter.type = "lowpass";
    filter.frequency.value = 840;
    filter.Q.value = 0.34;
    presence.type = "peaking";
    presence.frequency.value = 250;
    presence.Q.value = 0.55;
    presence.gain.value = 1.6;
    compressor.threshold.value = -28;
    compressor.knee.value = 30;
    compressor.ratio.value = 1.45;
    compressor.attack.value = 0.09;
    compressor.release.value = 0.9;

    highpass.connect(filter);
    filter.connect(presence);
    presence.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    const voiceSpec = [
      { baseFrequency: 96.08, weight: 0.18, drift: 0.026, detuneDepth: 0.42, type: "sine" },
      { baseFrequency: 144.12, weight: 0.14, drift: 0.021, detuneDepth: 0.36, type: "sine" },
      { baseFrequency: 192.16, weight: 0.052, drift: 0.016, detuneDepth: 0.28, type: "triangle" },
    ] satisfies Array<{
      baseFrequency: number;
      weight: number;
      drift: number;
      detuneDepth: number;
      type: OscillatorType;
    }>;

    const voices = voiceSpec.map((voice, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = voice.type;
      oscillator.frequency.value = voice.baseFrequency + index * 0.4;
      oscillator.detune.value = index % 2 === 0 ? -1.4 : 1.6;
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(highpass);
      oscillator.start();

      return {
        oscillator,
        gain,
        baseFrequency: voice.baseFrequency,
        weight: voice.weight,
        drift: voice.drift,
        detuneDepth: voice.detuneDepth,
      };
    });

    engineRef.current = { context, master, highpass, filter, presence, voices };
    await context.resume();
    setIsReady(true);
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => animateRef.current());
    return true;
  }, []);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      setIsReady(false);
      return;
    }

    const { context, master, voices } = engine;
    const now = context.currentTime;
    cancelAnimationFrame(frameRef.current);
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, 0.55);

    window.setTimeout(() => {
      voices.forEach((voice) => {
        try {
          voice.oscillator.stop();
        } catch {
          // Oscillators can only be stopped once.
        }
      });
      void context.close();
      engineRef.current = null;
      setIsReady(false);
    }, 1400);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      engineRef.current?.voices.forEach((voice) => {
        try {
          voice.oscillator.stop();
        } catch {
          // Ignore unmount double-stop.
        }
      });
      void engineRef.current?.context.close();
      engineRef.current = null;
    };
  }, []);

  return { start, stop, isAudioReady: isReady };
}
