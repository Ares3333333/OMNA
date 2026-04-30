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
      audioProfile === "choir" ? 1.34 : audioProfile === "deep" ? 1.12 : 1.2;
    const profilePitch =
      audioProfile === "choir" ? 1.035 : audioProfile === "deep" ? 0.96 : 1;
    const modeBase =
      mode === "voice" ? 0.086 : mode === "breath" ? 0.078 : mode === "listen" ? 0.068 : 0.024;
    const targetGain =
      isJoined && !isMuted
        ? modeBase *
          profileGain *
          (0.72 + force * 0.24 + voiceBloom + ritualPresence * 0.12) *
          breathSwell
        : 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(clamp(targetGain, 0, 0.158), now, 0.8);
    choirBus.gain.setTargetAtTime(
      0.92 + force * 0.18 + ritualPresence * 0.24 + (mode === "voice" ? micLevel * 0.12 : 0),
      now,
      1.4,
    );
    highpass.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 132 : mode === "listen" ? 152 : 146) + force * 8,
      now,
      1.5,
    );
    body.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 205 : 232) + Math.sin(now * 0.041) * 11,
      now,
      1.8,
    );
    body.gain.setTargetAtTime(
      (audioProfile === "deep" ? 2.15 : 1.85) + force * 0.34 + ritualPresence * 0.42,
      now,
      1.8,
    );
    nasal.frequency.setTargetAtTime(435 + Math.sin(now * 0.033) * 26 + micLevel * 18, now, 1.6);
    nasal.gain.setTargetAtTime(
      (mode === "voice" ? 6.25 + micLevel * 1.5 : 5.25 + force * 0.58) +
        ritualPresence * 0.55,
      now,
      1.4,
    );
    mouth.frequency.setTargetAtTime(1120 + Math.sin(now * 0.026) * 78, now, 1.9);
    mouth.gain.setTargetAtTime(mode === "listen" ? 1.42 : 1.95 + force * 0.34, now, 1.7);
    filter.frequency.setTargetAtTime(
      1780 + force * 280 + micLevel * 160 + (mode === "breath" ? breathValue * 120 : 0),
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
    choirBus.gain.value = 0.92;
    highpass.type = "highpass";
    highpass.frequency.value = 146;
    highpass.Q.value = 0.48;
    body.type = "peaking";
    body.frequency.value = 232;
    body.Q.value = 0.78;
    body.gain.value = 1.85;
    nasal.type = "peaking";
    nasal.frequency.value = 435;
    nasal.Q.value = 1.35;
    nasal.gain.value = 5.25;
    mouth.type = "peaking";
    mouth.frequency.value = 1120;
    mouth.Q.value = 0.75;
    mouth.gain.value = 1.95;
    filter.type = "lowpass";
    filter.frequency.value = 1780;
    filter.Q.value = 0.55;
    compressor.threshold.value = -20;
    compressor.knee.value = 28;
    compressor.ratio.value = 2.2;
    compressor.attack.value = 0.08;
    compressor.release.value = 0.82;

    choirBus.connect(highpass);
    highpass.connect(body);
    body.connect(nasal);
    nasal.connect(mouth);
    mouth.connect(filter);
    filter.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    const choirRoots = [
      174.6,
      185,
      196,
      207.7,
      220,
      233.1,
      246.9,
      261.6,
      277.2,
      293.7,
    ];
    const voiceSpec = choirRoots.flatMap((root, rootIndex) => {
      const octaveWeight = rootIndex < 3 ? 0.036 : rootIndex < 7 ? 0.032 : 0.026;

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
          weight: octaveWeight * 0.48,
          drift: 0.011 + rootIndex * 0.0013,
          detuneDepth: 0.12 + rootIndex * 0.007,
          ritualOnly: false,
          type: rootIndex % 3 === 0 ? ("triangle" as OscillatorType) : ("sine" as OscillatorType),
        },
      ];
    });
    const ritualVoiceSpec = [164.8, 196, 220, 246.9, 293.7, 329.6, 392].map((root, index) => ({
      baseFrequency: root,
      weight: index < 3 ? 0.018 : 0.011,
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
