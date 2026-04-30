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
  isRitualLive: boolean;
};

type EngineVoice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
  baseFrequency: number;
  weight: number;
  drift: number;
  detuneDepth: number;
  breathRate: number;
  phase: number;
  ritualOnly: boolean;
};

type Engine = {
  context: AudioContext;
  master: GainNode;
  choirBus: GainNode;
  highpass: BiquadFilterNode;
  body: BiquadFilterNode;
  nasal: BiquadFilterNode;
  mouth: BiquadFilterNode;
  filter: BiquadFilterNode;
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

    const { context, master, choirBus, highpass, body, nasal, mouth, filter, voices } = engine;
    const { isJoined, isMuted, mode, globalForce, micLevel, breathValue, isRitualLive } =
      inputRef.current;
    const now = context.currentTime;
    const force = clamp(globalForce / 100, 0, 1);
    const ritualPresence = isRitualLive ? 1 : 0;
    const collectiveBreath = 0.94 + Math.sin(now * 0.155) * 0.045 + Math.sin(now * 0.047) * 0.026;
    const breathSwell = mode === "breath" ? 0.82 + breathValue * 0.26 : collectiveBreath;
    const voiceBloom = mode === "voice" ? micLevel * 0.095 : 0;
    const modeBase =
      mode === "voice" ? 0.052 : mode === "breath" ? 0.047 : mode === "listen" ? 0.039 : 0.016;
    const targetGain =
      isJoined && !isMuted
        ? modeBase * (0.72 + force * 0.24 + voiceBloom + ritualPresence * 0.12) * breathSwell
        : 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(clamp(targetGain, 0, 0.074), now, 0.95);
    choirBus.gain.setTargetAtTime(
      0.72 + force * 0.16 + ritualPresence * 0.22 + (mode === "voice" ? micLevel * 0.12 : 0),
      now,
      1.4,
    );
    highpass.frequency.setTargetAtTime(mode === "listen" ? 76 : 70 + force * 7, now, 1.5);
    body.frequency.setTargetAtTime(128 + Math.sin(now * 0.041) * 8, now, 1.8);
    body.gain.setTargetAtTime(2.6 + force * 0.5 + ritualPresence * 0.9, now, 1.8);
    nasal.frequency.setTargetAtTime(265 + Math.sin(now * 0.033) * 18 + micLevel * 18, now, 1.6);
    nasal.gain.setTargetAtTime(
      (mode === "voice" ? 6.2 + micLevel * 1.8 : 5.4 + force * 0.6) + ritualPresence * 0.7,
      now,
      1.4,
    );
    mouth.frequency.setTargetAtTime(720 + Math.sin(now * 0.026) * 54, now, 1.9);
    mouth.gain.setTargetAtTime(mode === "listen" ? 1.35 : 1.8 + force * 0.35, now, 1.7);
    filter.frequency.setTargetAtTime(
      980 + force * 180 + micLevel * 110 + (mode === "breath" ? breathValue * 95 : 0),
      now,
      1.6,
    );
    filter.Q.setTargetAtTime(mode === "listen" ? 0.5 : 0.62, now, 1.4);

    const shimmer = Math.sin(now * 0.031) * 0.18 + Math.sin(now * 0.011) * 0.28;
    voices.forEach((voice, index) => {
      const humanBreath = 0.78 + Math.sin(now * voice.breathRate + voice.phase) * 0.18;
      const nearCrowd = 0.96 + Math.sin(now * (voice.drift * 0.43) + index * 1.7) * 0.035;
      const voicePresence = voice.ritualOnly ? ritualPresence : 1;
      const wave = Math.sin(now * voice.drift + voice.phase) * voice.detuneDepth;
      const voiceLift = mode === "voice" ? micLevel * voice.detuneDepth * 0.16 : 0;
      voice.oscillator.frequency.setTargetAtTime(
        voice.baseFrequency + wave + shimmer + voiceLift,
        now,
        1.35,
      );
      voice.gain.gain.setTargetAtTime(
        voice.weight *
          voicePresence *
          humanBreath *
          nearCrowd *
          (0.9 + force * 0.13 + breathValue * 0.035),
        now,
        1.25,
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
    const choirBus = context.createGain();
    const highpass = context.createBiquadFilter();
    const body = context.createBiquadFilter();
    const nasal = context.createBiquadFilter();
    const mouth = context.createBiquadFilter();
    const filter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    master.gain.value = 0;
    choirBus.gain.value = 0.68;
    highpass.type = "highpass";
    highpass.frequency.value = 72;
    highpass.Q.value = 0.48;
    body.type = "peaking";
    body.frequency.value = 128;
    body.Q.value = 0.78;
    body.gain.value = 2.6;
    nasal.type = "peaking";
    nasal.frequency.value = 265;
    nasal.Q.value = 1.35;
    nasal.gain.value = 5.4;
    mouth.type = "peaking";
    mouth.frequency.value = 720;
    mouth.Q.value = 0.75;
    mouth.gain.value = 1.7;
    filter.type = "lowpass";
    filter.frequency.value = 980;
    filter.Q.value = 0.55;
    compressor.threshold.value = -25;
    compressor.knee.value = 32;
    compressor.ratio.value = 1.65;
    compressor.attack.value = 0.12;
    compressor.release.value = 1.1;

    choirBus.connect(highpass);
    highpass.connect(body);
    body.connect(nasal);
    nasal.connect(mouth);
    mouth.connect(filter);
    filter.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    const choirRoots = [86.2, 92.7, 96.1, 101.4, 108.2, 114.4, 121.6, 128.1, 136.2];
    const voiceSpec = choirRoots.flatMap((root, rootIndex) => {
      const octaveWeight = rootIndex < 3 ? 0.028 : rootIndex < 7 ? 0.024 : 0.018;

      return [
        {
          baseFrequency: root,
          weight: octaveWeight,
          drift: 0.014 + rootIndex * 0.0017,
          detuneDepth: 0.18 + rootIndex * 0.012,
          ritualOnly: false,
          type: "sine" as OscillatorType,
        },
        {
          baseFrequency: root * 2.01,
          weight: octaveWeight * 0.42,
          drift: 0.011 + rootIndex * 0.0013,
          detuneDepth: 0.12 + rootIndex * 0.007,
          ritualOnly: false,
          type: rootIndex % 3 === 0 ? ("triangle" as OscillatorType) : ("sine" as OscillatorType),
        },
      ];
    });
    const ritualVoiceSpec = [64.6, 72.4, 81.1, 154.2, 172.4, 216.3].map((root, index) => ({
      baseFrequency: root,
      weight: index < 3 ? 0.016 : 0.009,
      drift: 0.008 + index * 0.001,
      detuneDepth: 0.09 + index * 0.006,
      ritualOnly: true,
      type: "sine" as OscillatorType,
    }));
    const allVoiceSpec = [...voiceSpec, ...ritualVoiceSpec];

    const voices = allVoiceSpec.map((voice, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const spread = ((index % 9) - 4) / 7.5;

      oscillator.type = voice.type;
      oscillator.frequency.value = voice.baseFrequency + Math.sin(index * 12.9898) * 0.9;
      oscillator.detune.value = Math.sin(index * 78.233) * 7.5;
      gain.gain.value = 0;
      panner.pan.value = spread;
      oscillator.connect(gain);
      gain.connect(panner);
      panner.connect(choirBus);
      oscillator.start();

      return {
        oscillator,
        gain,
        panner,
        baseFrequency: voice.baseFrequency,
        weight: voice.weight,
        drift: voice.drift,
        detuneDepth: voice.detuneDepth,
        breathRate: 0.12 + (index % 7) * 0.013,
        phase: index * 1.913,
        ritualOnly: voice.ritualOnly,
      };
    });

    engineRef.current = {
      context,
      master,
      choirBus,
      highpass,
      body,
      nasal,
      mouth,
      filter,
      voices,
    };
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
