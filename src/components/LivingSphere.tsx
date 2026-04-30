"use client";

import { useEffect, useRef } from "react";
import { clamp, lerp } from "@/lib/format";
import { OmnaMode } from "@/lib/types";

type LivingSphereProps = {
  mode: OmnaMode;
  isJoined: boolean;
  micLevel: number;
  breathValue: number;
  globalForce: number;
  globalUsers: number;
  isRitualLive: boolean;
  eventSeed: number;
};

type Particle = {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  alpha: number;
  drift: number;
};

type NodeSeed = {
  angle: number;
  radius: number;
  size: number;
  alpha: number;
  pulse: number;
};

type CausticSeed = {
  angle: number;
  radius: number;
  length: number;
  alpha: number;
  drift: number;
};

const particles = createParticles(360);
const nodes = createNodes(58);
const caustics = createCaustics(42);

export function LivingSphere(props: LivingSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !context) {
      return;
    }

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let smoothedVoice = 0;
    let lastEventSeed = propsRef.current.eventSeed;
    let eventStartedAt = -99;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (timeMs: number) => {
      const time = timeMs / 1000;
      const {
        mode,
        isJoined,
        micLevel,
        breathValue,
        globalForce,
        globalUsers,
        isRitualLive,
        eventSeed,
      } = propsRef.current;

      context.clearRect(0, 0, width, height);
      if (eventSeed !== lastEventSeed) {
        lastEventSeed = eventSeed;
        eventStartedAt = time;
      }

      const centerX = width / 2;
      const centerY = height * 0.52;
      const minSide = Math.min(width, height);
      const force = clamp(globalForce / 100, 0, 1);
      const userDensity = clamp(globalUsers / 800, 0.04, 1);
      const ritualLift = isRitualLive ? 1 : 0;
      const eventProgress = clamp((time - eventStartedAt) / 3.8, 0, 1);
      const eventEnergy = eventProgress < 1 ? Math.sin(eventProgress * Math.PI) : 0;
      const slowBreath = 0.5 + Math.sin(time * 0.54) * 0.5;
      const breath = mode === "breath" ? breathValue : slowBreath;
      const targetVoice = mode === "voice" ? micLevel : 0;
      smoothedVoice = lerp(smoothedVoice, targetVoice, 0.065);
      const voiceEnergy = smoothedVoice;
      const listenCalm = mode === "listen" ? 0.9 : 1;
      const joinedLift = isJoined ? 0.014 : 0;
      const radius =
        minSide *
        (0.405 +
          force * 0.024 +
          breath * 0.018 +
          voiceEnergy * 0.03 +
          joinedLift +
          ritualLift * 0.018 +
          eventEnergy * 0.012) *
        listenCalm;
      const brightness = clamp(
        0.72 + force * 0.38 + voiceEnergy * 0.46 + ritualLift * 0.16 + eventEnergy * 0.18,
        0.58,
        1.58,
      );

      drawDottedRibbons(context, width, height, time, force + ritualLift * 0.14);
      drawAmbientField(context, centerX, centerY, radius, force, time, ritualLift);
      drawOuterParticles(context, centerX, centerY, radius, time, userDensity, brightness);
      drawOrbitalThreads(context, centerX, centerY, radius, time, force, voiceEnergy);
      drawResonanceRings(context, centerX, centerY, radius, time, force, voiceEnergy, mode);
      drawDeepHalo(context, centerX, centerY, radius, time, force, voiceEnergy);
      drawLivingCore(
        context,
        centerX,
        centerY,
        radius,
        time,
        force,
        breath,
        voiceEnergy,
        brightness,
      );
      drawMicroEventBurst(context, centerX, centerY, radius, time, eventEnergy, lastEventSeed);
      applyCanvasSoftMask(context, width, height);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      role="img"
      aria-label="Живой синий шар Omna"
    />
  );
}

function applyCanvasSoftMask(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.save();
  context.globalCompositeOperation = "destination-in";

  const verticalFade = context.createLinearGradient(0, 0, 0, height);
  verticalFade.addColorStop(0, "rgba(0, 0, 0, 0)");
  verticalFade.addColorStop(0.11, "rgba(0, 0, 0, 1)");
  verticalFade.addColorStop(0.86, "rgba(0, 0, 0, 1)");
  verticalFade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, width, height);

  const horizontalFade = context.createLinearGradient(0, 0, width, 0);
  horizontalFade.addColorStop(0, "rgba(0, 0, 0, 0)");
  horizontalFade.addColorStop(0.08, "rgba(0, 0, 0, 1)");
  horizontalFade.addColorStop(0.92, "rgba(0, 0, 0, 1)");
  horizontalFade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, width, height);

  context.restore();
}

function drawDottedRibbons(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  force: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let ribbon = 0; ribbon < 4; ribbon += 1) {
    const top = height * (0.17 + ribbon * 0.036);
    const bottom = height * (0.75 + ribbon * 0.034);

    drawDottedWave(context, width, top, time, ribbon, force, 1);
    drawDottedWave(context, width, bottom, time * 0.88, ribbon + 7, force, -1);
  }

  context.restore();
}

function drawDottedWave(
  context: CanvasRenderingContext2D,
  width: number,
  y: number,
  time: number,
  seed: number,
  force: number,
  direction: 1 | -1,
) {
  const count = 72;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const x = t * width;
    const wave =
      Math.sin(t * Math.PI * 2.6 + time * 0.18 + seed) * 22 +
      Math.sin(t * Math.PI * 7.2 - time * 0.11 + seed) * 7;
    const centerFade = Math.pow(Math.sin(t * Math.PI), 1.9);
    const alpha = (0.015 + force * 0.018) * centerFade;
    const size = 0.8 + Math.sin(index * 1.71 + seed) * 0.35;

    context.fillStyle = `rgba(42, 151, 255, ${alpha})`;
    context.beginPath();
    context.arc(x, y + wave * direction, size, 0, Math.PI * 2);
    context.fill();
  }
}

function drawAmbientField(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  force: number,
  time: number,
  ritualLift: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  const field = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.22,
    centerX,
    centerY,
    radius * (3.25 + force * 0.42),
  );
  field.addColorStop(0, `rgba(41, 153, 255, ${0.16 + force * 0.16 + ritualLift * 0.08})`);
  field.addColorStop(0.26, `rgba(12, 62, 170, ${0.14 + force * 0.09 + ritualLift * 0.05})`);
  field.addColorStop(0.58, "rgba(2, 22, 61, 0.1)");
  field.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = field;
  context.beginPath();
  context.arc(centerX, centerY, radius * 3.35, 0, Math.PI * 2);
  context.fill();

  for (let index = 0; index < 22; index += 1) {
    const progress = index / 21;
    const ringRadius = radius * (1.02 + progress * 1.46);
    context.strokeStyle = `rgba(64, 149, 255, ${0.045 * (1 - progress) + force * 0.012})`;
    context.lineWidth = 0.7;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      ringRadius,
      ringRadius * (0.72 + Math.sin(time * 0.07 + index) * 0.025),
      time * 0.024 + index * 0.052,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  if (ritualLift > 0) {
    for (let index = 0; index < 18; index += 1) {
      const progress = index / 17;
      const ringRadius = radius * (1.28 + progress * 2.15);
      context.strokeStyle = `rgba(107, 220, 255, ${0.038 * (1 - progress)})`;
      context.lineWidth = 0.55;
      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        ringRadius,
        ringRadius * (0.52 + Math.sin(time * 0.04 + index) * 0.028),
        -time * 0.015 + index * 0.17,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }
  }

  context.restore();
}

function drawOuterParticles(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  userDensity: number,
  brightness: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  particles.forEach((particle, index) => {
    const orbit = particle.angle + time * particle.speed;
    const drift = Math.sin(time * particle.drift + index) * radius * 0.1;
    const distance = radius * particle.distance + drift;
    const x = centerX + Math.cos(orbit) * distance;
    const y = centerY + Math.sin(orbit * 0.86 + particle.drift) * distance * 0.76;
    const pulse = 0.55 + Math.sin(time * 0.7 + index * 1.9) * 0.45;
    const alpha = particle.alpha * (0.25 + userDensity * 0.75) * (0.45 + pulse * 0.55);

    context.fillStyle = `rgba(38, 152, 255, ${alpha * brightness})`;
    context.beginPath();
    context.arc(x, y, particle.size * (0.75 + pulse * 0.65), 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}

function drawOrbitalThreads(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let layer = 0; layer < 24; layer += 1) {
    const t = layer / 23;
    const phase = layer * 0.61;
    const speed = 0.032 + t * 0.018 + voiceEnergy * 0.035;
    const baseRadius = radius * (0.98 + t * 0.34);

    context.beginPath();

    for (let step = 0; step <= 240; step += 1) {
      const p = step / 240;
      const theta = p * Math.PI * 2;
      const wobble =
        Math.sin(theta * 3 + time * 0.27 + phase) * radius * (0.018 + t * 0.018) +
        Math.cos(theta * 7 - time * 0.13 + phase) * radius * 0.01;
      const orbit = theta + time * speed + phase * 0.08;
      const x = centerX + Math.cos(orbit) * (baseRadius + wobble);
      const y =
        centerY +
        Math.sin(orbit * (0.93 + Math.sin(phase) * 0.02)) *
          (baseRadius * (0.72 + Math.cos(phase) * 0.035) + wobble * 0.45);

      if (step === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    const alpha = (0.025 + force * 0.022 + voiceEnergy * 0.035) * (1 - t * 0.56);
    context.strokeStyle =
      layer % 5 === 0
        ? `rgba(157, 229, 255, ${alpha * 1.85})`
        : `rgba(29, 126, 255, ${alpha})`;
    context.lineWidth = layer % 5 === 0 ? 0.92 : 0.48;
    context.stroke();
  }

  context.restore();
}

function drawResonanceRings(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
  mode: OmnaMode,
) {
  context.save();
  context.globalCompositeOperation = "screen";
  const ringPower = mode === "voice" ? 0.44 + voiceEnergy * 0.95 : 0.26 + force * 0.3;

  for (let index = 0; index < 7; index += 1) {
    const progress = (time * (0.035 + voiceEnergy * 0.06) + index * 0.15) % 1;
    const ringRadius = radius * (1.12 + progress * (1.38 + force * 0.4));
    const alpha = (1 - progress) * ringPower * (0.16 - index * 0.012);

    context.strokeStyle = `rgba(67, 184, 255, ${alpha})`;
    context.lineWidth = 0.8 + force * 1 + voiceEnergy * 2.4;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      ringRadius * (1 + Math.sin(time * 0.12 + index) * 0.022),
      ringRadius * (0.66 + Math.cos(time * 0.1 + index) * 0.024),
      time * 0.032 + index * 0.5,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  context.restore();
}

function drawDeepHalo(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  const glow = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.58,
    centerX,
    centerY,
    radius * (2.22 + force * 0.34),
  );
  glow.addColorStop(0, `rgba(71, 172, 255, ${0.075 + force * 0.035 + voiceEnergy * 0.03})`);
  glow.addColorStop(0.38, `rgba(5, 57, 145, ${0.07 + force * 0.03})`);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, radius * 2.35, 0, Math.PI * 2);
  context.fill();

  for (let index = 0; index < 10; index += 1) {
    const t = index / 9;
    const ringRadius = radius * (0.94 + t * 0.42 + Math.sin(time * 0.05 + index) * 0.012);
    context.strokeStyle = `rgba(107, 210, 255, ${(0.035 + force * 0.018) * (1 - t * 0.35)})`;
    context.lineWidth = 0.42;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      ringRadius * (1.07 + Math.sin(index) * 0.025),
      ringRadius * (0.82 + Math.cos(index) * 0.025),
      time * 0.018 + index * 0.19,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  context.restore();
}

function drawLivingCore(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  breath: number,
  voiceEnergy: number,
  brightness: number,
) {
  const edgeNoise = 0.032 + force * 0.018 + voiceEnergy * 0.058;
  const body = createBlobPath(centerX, centerY, radius, time, edgeNoise, 1, 0.98, 0);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.shadowColor = `rgba(38, 137, 255, ${0.56 + force * 0.24})`;
  context.shadowBlur = radius * (0.54 + voiceEnergy * 0.55);

  const bodyGradient = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.04,
    centerX,
    centerY,
    radius * 1.05,
  );
  bodyGradient.addColorStop(0, `rgba(77, 232, 255, ${0.48 * brightness})`);
  bodyGradient.addColorStop(0.08, `rgba(17, 112, 255, ${0.24 * brightness})`);
  bodyGradient.addColorStop(0.26, "rgba(3, 21, 78, 0.72)");
  bodyGradient.addColorStop(0.56, "rgba(0, 9, 43, 0.92)");
  bodyGradient.addColorStop(0.82, "rgba(4, 31, 105, 0.72)");
  bodyGradient.addColorStop(1, "rgba(0, 4, 20, 0.98)");
  context.fillStyle = bodyGradient;
  context.fill(body);
  context.restore();

  context.save();
  context.clip(body);
  context.globalCompositeOperation = "source-over";
  drawInnerDepthShadows(context, centerX, centerY, radius, time);
  context.restore();

  context.save();
  context.clip(body);
  context.globalCompositeOperation = "screen";
  drawSubsurfaceClouds(context, centerX, centerY, radius, time, force, breath);
  drawInnerCaustics(context, centerX, centerY, radius, time, force, voiceEnergy);
  drawCellularPetals(context, centerX, centerY, radius, time, force, breath, voiceEnergy);
  drawLightningVeins(context, centerX, centerY, radius, time, force, voiceEnergy);
  drawNodeLights(context, centerX, centerY, radius, time, brightness);
  drawCentralPulse(context, centerX, centerY, radius, time, force, voiceEnergy);
  context.restore();

  drawOuterMembranes(context, centerX, centerY, radius, time, force, voiceEnergy);

  context.save();
  context.globalCompositeOperation = "screen";
  context.strokeStyle = `rgba(176, 235, 255, ${0.48 + force * 0.15 + voiceEnergy * 0.14})`;
  context.lineWidth = 1 + force * 0.95 + voiceEnergy * 1.2;
  context.shadowColor = "rgba(64, 194, 255, 0.9)";
  context.shadowBlur = radius * 0.18;
  context.stroke(body);
  context.restore();
}

function drawOuterMembranes(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let layer = 0; layer < 20; layer += 1) {
    const t = layer / 19;
    const path = createBlobPath(
      centerX,
      centerY,
      radius * (1.01 + t * 0.24),
      time * (0.88 + t * 0.18),
      0.036 + t * 0.026 + voiceEnergy * 0.022,
      1 + Math.sin(time * 0.11 + layer) * 0.018,
      0.96 + Math.cos(time * 0.1 + layer) * 0.018,
      layer * 0.73,
    );

    context.strokeStyle =
      layer % 5 === 0
        ? `rgba(200, 242, 255, ${0.13 + force * 0.045})`
        : `rgba(40, 139, 255, ${0.105 - t * 0.045 + force * 0.03})`;
    context.lineWidth = layer % 5 === 0 ? 1.05 : 0.54;
    context.stroke(path);
  }

  context.restore();
}

function drawInnerDepthShadows(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
) {
  const shadow = context.createRadialGradient(
    centerX - radius * 0.08,
    centerY - radius * 0.02,
    radius * 0.12,
    centerX,
    centerY,
    radius * 1.04,
  );
  shadow.addColorStop(0, "rgba(0, 0, 0, 0)");
  shadow.addColorStop(0.52, "rgba(0, 4, 23, 0.08)");
  shadow.addColorStop(0.86, "rgba(0, 1, 10, 0.38)");
  shadow.addColorStop(1, "rgba(0, 0, 4, 0.72)");
  context.fillStyle = shadow;
  context.beginPath();
  context.arc(centerX, centerY, radius * 1.06, 0, Math.PI * 2);
  context.fill();

  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.11 + time * 0.025;
    const x = centerX + Math.cos(angle) * radius * (0.3 + seeded(index * 7.1) * 0.33);
    const y = centerY + Math.sin(angle) * radius * (0.22 + seeded(index * 9.4) * 0.28);
    const lobe = context.createRadialGradient(x, y, 0, x, y, radius * 0.34);
    lobe.addColorStop(0, "rgba(0, 2, 18, 0.18)");
    lobe.addColorStop(0.7, "rgba(0, 1, 10, 0.05)");
    lobe.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = lobe;
    context.beginPath();
    context.ellipse(
      x,
      y,
      radius * (0.28 + seeded(index * 5.8) * 0.16),
      radius * (0.2 + seeded(index * 4.2) * 0.11),
      angle,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

function drawSubsurfaceClouds(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  breath: number,
) {
  for (let layer = 0; layer < 20; layer += 1) {
    const seed = layer * 1.71;
    const angle = seed + time * (0.035 + (layer % 4) * 0.006);
    const distance = radius * (0.12 + seeded(layer * 81.7) * 0.56);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle * 0.9) * distance * 0.78;
    const lobeRadius = radius * (0.16 + seeded(layer * 63.2) * 0.25 + breath * 0.035);
    const gradient = context.createRadialGradient(x, y, 0, x, y, lobeRadius);

    gradient.addColorStop(0, `rgba(38, 142, 255, ${0.08 + force * 0.035})`);
    gradient.addColorStop(0.5, "rgba(7, 54, 155, 0.045)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(
      x,
      y,
      lobeRadius * (1.1 + Math.sin(seed) * 0.28),
      lobeRadius * (0.74 + Math.cos(seed) * 0.16),
      angle * 0.6,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

function drawInnerCaustics(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  caustics.forEach((seed, index) => {
    const angle = seed.angle + Math.sin(time * seed.drift + index) * 0.08;
    const innerRadius = radius * seed.radius;
    const x = centerX + Math.cos(angle) * innerRadius;
    const y = centerY + Math.sin(angle) * innerRadius * 0.82;
    const tangent = angle + Math.PI / 2;
    const length = radius * seed.length;
    const alpha = seed.alpha * (0.52 + force * 0.36 + voiceEnergy * 0.4);

    context.beginPath();
    context.moveTo(
      x - Math.cos(tangent) * length * 0.5,
      y - Math.sin(tangent) * length * 0.28,
    );
    context.quadraticCurveTo(
      x + Math.cos(angle) * radius * 0.04,
      y + Math.sin(angle) * radius * 0.03,
      x + Math.cos(tangent) * length * 0.5,
      y + Math.sin(tangent) * length * 0.28,
    );
    context.strokeStyle =
      index % 4 === 0
        ? `rgba(190, 246, 255, ${alpha * 0.72})`
        : `rgba(76, 184, 255, ${alpha * 0.48})`;
    context.lineWidth = index % 7 === 0 ? 0.9 : 0.44;
    context.stroke();
  });
}

function drawCellularPetals(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  breath: number,
  voiceEnergy: number,
) {
  const petals = 28;

  for (let index = 0; index < petals; index += 1) {
    const angle = (index / petals) * Math.PI * 2 + Math.sin(time * 0.08) * 0.08;
    const petalRadius = radius * (0.34 + 0.38 * seeded(index * 41.3) + 0.08 * Math.sin(index * 1.8 + time * 0.18));
    const spread = 0.23 + Math.sin(index * 0.7) * 0.055;
    const endX = centerX + Math.cos(angle) * petalRadius;
    const endY = centerY + Math.sin(angle) * petalRadius * 0.86;
    const leftX = centerX + Math.cos(angle - spread) * radius * (0.26 + breath * 0.04);
    const leftY = centerY + Math.sin(angle - spread) * radius * 0.26;
    const rightX = centerX + Math.cos(angle + spread) * radius * (0.26 + breath * 0.04);
    const rightY = centerY + Math.sin(angle + spread) * radius * 0.26;

    const petal = new Path2D();
    petal.moveTo(centerX, centerY);
    petal.quadraticCurveTo(leftX, leftY, endX, endY);
    petal.quadraticCurveTo(rightX, rightY, centerX, centerY);
    petal.closePath();

    context.fillStyle = `rgba(2, 12, 50, ${0.1 + force * 0.04})`;
    context.fill(petal);
    context.strokeStyle = `rgba(61, 170, 255, ${0.055 + force * 0.055 + voiceEnergy * 0.075})`;
    context.lineWidth = index % 4 === 0 ? 0.85 : 0.48;
    context.stroke(petal);
  }
}

function drawLightningVeins(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  for (let index = 0; index < 72; index += 1) {
    const angle = index * 2.399 + Math.sin(time * 0.07 + index) * 0.05;
    const length = radius * (0.18 + ((index * 37) % 100) / 100 * 0.74);
    const bend = Math.sin(index * 1.37) * radius * 0.14;
    const start = radius * (0.05 + ((index * 19) % 20) / 100);
    const sx = centerX + Math.cos(angle) * start;
    const sy = centerY + Math.sin(angle) * start * 0.84;
    const cx = centerX + Math.cos(angle + 0.45) * length * 0.55 + Math.cos(angle + Math.PI / 2) * bend;
    const cy = centerY + Math.sin(angle + 0.45) * length * 0.45;
    const ex = centerX + Math.cos(angle) * length;
    const ey = centerY + Math.sin(angle) * length * 0.84;
    const alpha = 0.045 + force * 0.04 + voiceEnergy * 0.075;

    context.beginPath();
    context.moveTo(sx, sy);
    context.quadraticCurveTo(cx, cy, ex, ey);
    context.strokeStyle = `rgba(77, 210, 255, ${alpha})`;
    context.lineWidth = index % 9 === 0 ? 1.1 : 0.55;
    context.stroke();

    if (index % 5 === 0) {
      const branchAngle = angle + (index % 10 === 0 ? 0.52 : -0.46);
      context.beginPath();
      context.moveTo(ex, ey);
      context.quadraticCurveTo(
        ex + Math.cos(branchAngle) * radius * 0.08,
        ey + Math.sin(branchAngle) * radius * 0.06,
        ex + Math.cos(branchAngle) * radius * 0.18,
        ey + Math.sin(branchAngle) * radius * 0.13,
      );
      context.strokeStyle = `rgba(117, 226, 255, ${alpha * 0.72})`;
      context.lineWidth = 0.48;
      context.stroke();
    }
  }
}

function drawNodeLights(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  brightness: number,
) {
  nodes.forEach((node, index) => {
    const angle = node.angle + Math.sin(time * 0.09 + index) * 0.04;
    const r = radius * node.radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r * 0.85;
    const pulse = 0.5 + Math.sin(time * node.pulse + index) * 0.5;
    const alpha = node.alpha * (0.45 + pulse * 0.7) * brightness;

    context.fillStyle = `rgba(74, 202, 255, ${alpha})`;
    context.shadowColor = "rgba(72, 198, 255, 0.85)";
    context.shadowBlur = node.size * 7;
    context.beginPath();
    context.arc(x, y, node.size * (0.72 + pulse * 0.4), 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  });
}

function drawCentralPulse(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  force: number,
  voiceEnergy: number,
) {
  const pulse = 0.5 + Math.sin(time * 1.1) * 0.5;
  const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.36);
  core.addColorStop(0, `rgba(221, 255, 255, ${0.68 + voiceEnergy * 0.2})`);
  core.addColorStop(0.14, `rgba(75, 231, 255, ${0.38 + force * 0.14})`);
  core.addColorStop(0.36, "rgba(17, 103, 255, 0.16)");
  core.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = core;
  context.beginPath();
  context.arc(centerX, centerY, radius * (0.28 + pulse * 0.04), 0, Math.PI * 2);
  context.fill();

  for (let ray = 0; ray < 32; ray += 1) {
    const angle = (ray / 32) * Math.PI * 2 + Math.sin(time * 0.13) * 0.12;
    const length = radius * (0.08 + seeded(ray * 23.1) * 0.28);
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.quadraticCurveTo(
      centerX + Math.cos(angle + 0.42) * length * 0.55,
      centerY + Math.sin(angle + 0.42) * length * 0.46,
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length * 0.84,
    );
    context.strokeStyle = `rgba(116, 238, 255, ${0.09 + force * 0.05 + voiceEnergy * 0.12})`;
    context.lineWidth = ray % 6 === 0 ? 0.95 : 0.46;
    context.stroke();
  }
}

function drawMicroEventBurst(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  eventEnergy: number,
  eventSeed: number,
) {
  if (eventEnergy <= 0.001) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "screen";

  for (let index = 0; index < 36; index += 1) {
    const seed = eventSeed * 13.7 + index * 29.3;
    const angle = seeded(seed) * Math.PI * 2 + time * 0.08;
    const distance = radius * (0.58 + seeded(seed + 11.2) * 1.15) * (0.78 + eventEnergy * 0.38);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.76;
    const size = 1.2 + seeded(seed + 4.2) * 2.8;
    const alpha = eventEnergy * (0.16 + seeded(seed + 7.9) * 0.24);

    context.fillStyle = `rgba(141, 234, 255, ${alpha})`;
    context.shadowColor = "rgba(80, 201, 255, 0.92)";
    context.shadowBlur = size * 8;
    context.beginPath();
    context.arc(x, y, size * (0.65 + eventEnergy * 0.55), 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = `rgba(122, 225, 255, ${0.12 * eventEnergy})`;
  context.lineWidth = 0.8 + eventEnergy * 1.2;
  context.beginPath();
  context.ellipse(
    centerX,
    centerY,
    radius * (1.25 + eventEnergy * 0.75),
    radius * (0.78 + eventEnergy * 0.34),
    time * 0.04,
    0,
    Math.PI * 2,
  );
  context.stroke();
  context.restore();
}

function createBlobPath(
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  amount: number,
  xScale: number,
  yScale: number,
  phase: number,
) {
  const path = new Path2D();
  const steps = 220;

  for (let step = 0; step <= steps; step += 1) {
    const theta = (step / steps) * Math.PI * 2;
    const organic =
      Math.sin(theta * 5 + time * 0.34 + phase) * amount +
      Math.sin(theta * 9 - time * 0.22 + phase * 0.7) * amount * 0.58 +
      Math.cos(theta * 13 + time * 0.14) * amount * 0.28;
    const r = radius * (1 + organic);
    const x = centerX + Math.cos(theta) * r * xScale;
    const y = centerY + Math.sin(theta) * r * yScale;

    if (step === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }

  path.closePath();
  return path;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const random = seeded(index * 942.217);
    const randomTwo = seeded((index + 11) * 527.73);

    return {
      angle: random * Math.PI * 2,
      distance: 1.22 + randomTwo * 1.86,
      speed: (random - 0.5) * 0.026,
      size: 0.62 + randomTwo * 1.35,
      alpha: 0.045 + random * 0.24,
      drift: 0.08 + randomTwo * 0.28,
    };
  });
}

function createNodes(count: number): NodeSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: seeded(index * 171.13) * Math.PI * 2,
    radius: 0.18 + seeded(index * 91.7) * 0.72,
    size: 1 + seeded(index * 42.3) * 2.1,
    alpha: 0.14 + seeded(index * 23.91) * 0.55,
    pulse: 0.42 + seeded(index * 77.7) * 0.7,
  }));
}

function createCaustics(count: number): CausticSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: seeded(index * 201.51) * Math.PI * 2,
    radius: 0.12 + seeded(index * 79.21) * 0.72,
    length: 0.08 + seeded(index * 131.9) * 0.22,
    alpha: 0.035 + seeded(index * 44.8) * 0.11,
    drift: 0.04 + seeded(index * 18.3) * 0.09,
  }));
}

function seeded(value: number) {
  const seed = Math.sin(value) * 10000;
  return seed - Math.floor(seed);
}
