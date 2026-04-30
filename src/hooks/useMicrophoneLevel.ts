"use client";

import { useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/format";
import { MicrophoneStatus } from "@/lib/types";

type WebkitAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function useMicrophoneLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const smoothedLevel = useRef(0);

  useEffect(() => {
    if (!active) {
      smoothedLevel.current = 0;
      return;
    }

    let frame = 0;
    let cancelled = false;
    let context: AudioContext | null = null;
    let stream: MediaStream | null = null;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }

      const AudioContextClass =
        window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

      if (!AudioContextClass) {
        setStatus("unavailable");
        return;
      }

      try {
        setStatus("requesting");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          video: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        context = new AudioContextClass();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.88;
        source.connect(analyser);

        const samples = new Float32Array(analyser.fftSize);
        setStatus("granted");

        const measure = () => {
          analyser.getFloatTimeDomainData(samples);

          let sum = 0;
          for (let index = 0; index < samples.length; index += 1) {
            sum += samples[index] * samples[index];
          }

          const rms = Math.sqrt(sum / samples.length);
          const normalized = clamp((rms - 0.012) * 5.8, 0, 1);
          smoothedLevel.current = lerpLevel(smoothedLevel.current, normalized, 0.18);
          setLevel(smoothedLevel.current);
          frame = requestAnimationFrame(measure);
        };

        measure();
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setStatus(
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "denied"
            : "unavailable",
        );
        setLevel(0);
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
      setLevel(0);
      setStatus("idle");
      smoothedLevel.current = 0;
    };
  }, [active]);

  return { micLevel: level, microphoneStatus: status };
}

function lerpLevel(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}
