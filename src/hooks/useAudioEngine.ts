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
      audioProfile === "choir" ? 1.08 : audioProfile === "deep" ? 1 : 0.96;
    const profilePitch =
      audioProfile === "choir" ? 1 : audioProfile === "deep" ? 0.92 : 1;
    const modeBase =
      mode === "voice" ? 0.074 : mode === "breath" ? 0.067 : mode === "listen" ? 0.058 : 0.018;
    const targetGain =
      isJoined && !isMuted
        ? modeBase *
          profileGain *
          (0.72 + force * 0.24 + voiceBloom + ritualPresence * 0.12) *
          breathSwell
        : 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(clamp(targetGain, 0, 0.13), now, 1.1);
    choirBus.gain.setTargetAtTime(
      0.82 + force * 0.12 + ritualPresence * 0.14 + (mode === "voice" ? micLevel * 0.08 : 0),
      now,
      1.4,
    );
    highpass.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 112 : mode === "listen" ? 128 : 122) + force * 5,
      now,
      1.5,
    );
    body.frequency.setTargetAtTime(
      (audioProfile === "deep" ? 174 : 196) + Math.sin(now * 0.035) * 4,
      now,
      1.8,
    );
    body.gain.setTargetAtTime(
      (audioProfile === "deep" ? 1.6 : 1.35) + force * 0.22 + ritualPresence * 0.24,
      now,
      1.8,
    );
    nasal.frequency.setTargetAtTime(286 + Math.sin(now * 0.021) * 8 + micLevel * 7, now, 1.8);
    nasal.gain.setTargetAtTime(
      (mode === "voice" ? 2.35 + micLevel * 0.7 : 1.85 + force * 0.22) +
        ritualPresence * 0.18,
      now,
      1.8,
    );
    mouth.frequency.setTargetAtTime(780 + Math.sin(now * 0.018) * 26, now, 2.1);
    mouth.gain.setTargetAtTime(mode === "listen" ? 0.72 : 1.05 + force * 0.18, now, 1.9);
    filter.frequency.setTargetAtTime(
      1180 + force * 160 + micLevel * 90 + (mode === "breath" ? breathValue * 70 : 0),
      now,
      1.6,
    );
    filter.Q.setTargetAtTime(mode === "listen" ? 0.42 : 0.48, now, 1.4);

    const shimmer = Math.sin(now * 0.021) * 0.045 + Math.sin(now * 0.008) * 0.06;
    voices.forEach((voice, index) => {
      const humanBreath = 0.78 + Math.sin(now * voice.breathRate + voice.phase) * 0.18;
      const nearCrowd = 0.96 + Math.sin(now * (voice.drift * 0.43) + index * 1.7) * 0.035;
      const voicePresence = voice.ritualOnly ? ritualPresence : 1;
      const wave = Math.sin(now * voice.drift + voice.phase) * voice.detuneDepth;
      const voiceLift = mode === "voice" ? micLevel * voice.detuneDepth * 0.045 : 0;
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
    choirBus.gain.value = 0.82;
    highpass.type = "highpass";
    highpass.frequency.value = 122;
    highpass.Q.value = 0.48;
    body.type = "peaking";
    body.frequency.value = 196;
    body.Q.value = 0.62;
    body.gain.value = 1.35;
    nasal.type = "peaking";
    nasal.frequency.value = 286;
    nasal.Q.value = 0.82;
    nasal.gain.value = 1.85;
    mouth.type = "peaking";
    mouth.frequency.value = 780;
    mouth.Q.value = 0.58;
    mouth.gain.value = 1.05;
    filter.type = "lowpass";
    filter.frequency.value = 1180;
    filter.Q.value = 0.46;
    compressor.threshold.value = -22;
    compressor.knee.value = 34;
    compressor.ratio.value = 1.9;
    compressor.attack.value = 0.14;
    compressor.release.value = 1.25;

    choirBus.connect(highpass);
    highpass.connect(body);
    body.connect(nasal);
    nasal.connect(mouth);
    mouth.connect(filter);
    filter.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    const voiceSpec = [
      { baseFrequency: 195.7, weight: 0.052, drift: 0.009, detuneDepth: 0.055, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 196, weight: 0.058, drift: 0.008, detuneDepth: 0.045, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 196.35, weight: 0.046, drift: 0.01, detuneDepth: 0.05, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 293.66, weight: 0.026, drift: 0.007, detuneDepth: 0.038, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 294.08, weight: 0.018, drift: 0.006, detuneDepth: 0.034, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 392, weight: 0.02, drift: 0.005, detuneDepth: 0.026, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 393.1, weight: 0.012, drift: 0.004, detuneDepth: 0.022, ritualOnly: false, type: "triangle" as OscillatorType },
      { baseFrequency: 247, weight: 0.012, drift: 0.006, detuneDepth: 0.026, ritualOnly: false, type: "sine" as OscillatorType },
      { baseFrequency: 784, weight: 0.005, drift: 0.003, detuneDepth: 0.018, ritualOnly: false, type: "sine" as OscillatorType },
    ];
    const ritualVoiceSpec = [
      { baseFrequency: 196, weight: 0.014, drift: 0.005, detuneDepth: 0.026, ritualOnly: true, type: "sine" as OscillatorType },
      { baseFrequency: 293.66, weight: 0.011, drift: 0.004, detuneDepth: 0.022, ritualOnly: true, type: "sine" as OscillatorType },
      { baseFrequency: 392, weight: 0.009, drift: 0.003, detuneDepth: 0.018, ritualOnly: true, type: "sine" as OscillatorType },
    ];
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
