"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/format";
import { AudioProfile, OmnaMode } from "@/lib/types";

type AudioInput = {
  isJoined: boolean;
  isMuted: boolean;
  mode: OmnaMode;
  globalForce: number;
  micLevel: number;
  breathValue: number;
  isRitualLive: boolean;
  audioProfile: AudioProfile;
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
    const { isJoined, isMuted, mode, globalForce, micLevel, breathValue, isRitualLive, audioProfile } =
      inputRef.current;
    const now = context.currentTime;
    const force = clamp(globalForce / 100, 0, 1);
    const ritualPresence = isRitualLive ? 1 : 0;
    const collectiveBreath = 0.94 + Math.sin(now * 0.155) * 0.045 + Math.sin(now * 0.047) * 0.026;
    const breathSwell = mode === "breath" ? 0.82 + breathValue * 0.26 : collectiveBreath;
    const voiceBloom = mode === "voice" ? micLevel * 0.095 : 0;
    const profileGain =
      audioProfile === "choir" ? 1.08 : audioProfile === "deep" ? 0.94 : 1;
    const profilePitch =
      audioProfile === "choir" ? 1.025 : audioProfile === "deep" ? 0.94 : 1;
    const modeBase =
      mode === "voice" ? 0.049 : mode === "breath" ? 0.044 : mode === "listen" ? 0.037 : 0.014;
    const targetGain =
      isJoined && !isMuted
        ? modeBase *
          profileGain *
          (0.72 + force * 0.24 + voiceBloom + ritualPresence * 0.12) *
          breathSwell
        : 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(clamp(targetGain, 0, 0.074), now, 0.95);
    choirBus.gain.setTargetAtTime(
      0.72 + force * 0.16 + ritualPresence * 0.22 + (mode === "voice" ? micLevel * 0.12 : 0),
      now,
      1.4,
    );
    highpass.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 92 : mode === "listen" ? 106 : 102) + force * 6,
      now,
      1.5,
    );
    body.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 152 : 172) + Math.sin(now * 0.041) * 9,
      now,
      1.8,
    );
    body.gain.setTargetAtTime(
      (audioProfile === "deep" ? 2.7 : 2.15) + force * 0.42 + ritualPresence * 0.58,
      now,
      1.8,
    );
    nasal.frequency.setTargetAtTime(335 + Math.sin(now * 0.033) * 22 + micLevel * 16, now, 1.6);
    nasal.gain.setTargetAtTime(
      (mode === "voice" ? 5.2 + micLevel * 1.35 : 4.35 + force * 0.5) +
        ritualPresence * 0.55,
      now,
      1.4,
    );
    mouth.frequency.setTargetAtTime(910 + Math.sin(now * 0.026) * 62, now, 1.9);
    mouth.gain.setTargetAtTime(mode === "listen" ? 1.05 : 1.48 + force * 0.28, now, 1.7);
    filter.frequency.setTargetAtTime(
      1340 + force * 240 + micLevel * 120 + (mode === "breath" ? breathValue * 90 : 0),
      now,
      1.6,
    );
    filter.Q.setTargetAtTime(mode === "listen" ? 0.45 : 0.56, now, 1.4);

    const shimmer = Math.sin(now * 0.031) * 0.18 + Math.sin(now * 0.011) * 0.28;
    voices.forEach((voice, index) => {
      const humanBreath = 0.78 + Math.sin(now * voice.breathRate + voice.phase) * 0.18;
      const nearCrowd = 0.96 + Math.sin(now * (voice.drift * 0.43) + index * 1.7) * 0.035;
      const voicePresence = voice.ritualOnly ? ritualPresence : 1;
      const wave = Math.sin(now * voice.drift + voice.phase) * voice.detuneDepth;
      const voiceLift = mode === "voice" ? micLevel * voice.detuneDepth * 0.16 : 0;
      voice.oscillator.frequency.setTargetAtTime(
        voice.baseFrequency * profilePitch + wave + shimmer + voiceLift,
        now,
        1.35,
      );
      voice.gain.gain.setTargetAtTime(
        voice.weight *
          voicePresence *
          humanBreath *
          nearCrowd *
          (0.9 + force * 0.13 + breathValue * 0.035) *
          (voice.ritualOnly && audioProfile !== "choir" ? 0.72 : 1),
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
    highpass.frequency.value = 104;
    highpass.Q.value = 0.48;
    body.type = "peaking";
    body.frequency.value = 172;
    body.Q.value = 0.78;
    body.gain.value = 2.15;
    nasal.type = "peaking";
    nasal.frequency.value = 335;
    nasal.Q.value = 1.35;
    nasal.gain.value = 4.35;
    mouth.type = "peaking";
    mouth.frequency.value = 910;
    mouth.Q.value = 0.75;
    mouth.gain.value = 1.48;
    filter.type = "lowpass";
    filter.frequency.value = 1340;
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

    const choirRoots = [
      123.5,
      130.8,
      138.6,
      146.8,
      155.6,
      164.8,
      174.6,
      185,
      196,
      207.7,
    ];
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
    const ritualVoiceSpec = [110, 123.5, 146.8, 196, 246.9, 293.7, 329.6].map((root, index) => ({
      baseFrequency: root,
      weight: index < 3 ? 0.012 : 0.007,
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
