import { formatPeople, formatSessionSeconds } from "@/lib/format";
import { SessionRitualTrace } from "@/lib/sessionRitual";

type ShareVideoInput = {
  seconds: number;
  users: number;
  trace: SessionRitualTrace;
};

export async function createSessionShareVideo({
  seconds,
  users,
  trace,
}: ShareVideoInput) {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const stream = canvas.captureStream(30);
  const mimeType = pickMimeType();
  if (!mimeType) {
    return null;
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const durationMs = 4200;
  const startedAt = performance.now();

  return await new Promise<File | null>((resolve) => {
    recorder.onstop = () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      resolve(new File([blob], "omna-session.webm", { type: mimeType }));
    };

    recorder.start();

    const draw = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      drawVideoFrame(context, {
        width: canvas.width,
        height: canvas.height,
        progress,
        seconds,
        users,
        trace,
      });

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(draw);
  });
}

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

function drawVideoFrame(
  context: CanvasRenderingContext2D,
  {
    width,
    height,
    progress,
    seconds,
    users,
    trace,
  }: ShareVideoInput & { width: number; height: number; progress: number },
) {
  const pulse = 0.5 + Math.sin(progress * Math.PI * 6) * 0.5;
  const drift = progress * Math.PI * 2;

  const bg = context.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#020711");
  bg.addColorStop(0.55, "#000814");
  bg.addColorStop(1, "#000204");
  context.fillStyle = bg;
  context.fillRect(0, 0, width, height);

  drawVideoField(context, width, height, drift);
  drawVideoSphere(context, width / 2, 430, 164 + pulse * 10, drift, trace.resonance / 100);

  context.textAlign = "center";
  context.fillStyle = "rgba(246, 251, 255, 0.94)";
  context.font = "300 36px Manrope, Arial, sans-serif";
  context.fillText("Я держал Omna", width / 2, 790);

  context.fillStyle = "#f7fbff";
  context.font = "500 104px Cormorant Garamond, Times New Roman, serif";
  context.fillText(formatSessionSeconds(seconds), width / 2, 910);

  context.fillStyle = "rgba(196, 226, 248, 0.72)";
  context.font = "400 25px Manrope, Arial, sans-serif";
  context.fillText(trace.phrase, width / 2, 972);

  context.fillStyle = "rgba(112, 211, 255, 0.62)";
  context.font = "500 21px Manrope, Arial, sans-serif";
  context.fillText(`${trace.resonance}% резонанса · ${formatPeople(users)} держат звук`, width / 2, 1030);

  context.fillStyle = "rgba(238, 248, 255, 0.86)";
  context.font = "400 35px Manrope, Arial, sans-serif";
  context.fillText("omna", width / 2, 1162);
}

function drawVideoSphere(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  drift: number,
  resonance: number,
) {
  const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2.6);
  halo.addColorStop(0, `rgba(72, 218, 255, ${0.28 + resonance * 0.16})`);
  halo.addColorStop(0.36, "rgba(24, 116, 255, 0.18)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(centerX, centerY, radius * 2.6, 0, Math.PI * 2);
  context.fill();

  const body = context.createRadialGradient(
    centerX - radius * 0.16,
    centerY - radius * 0.16,
    radius * 0.05,
    centerX,
    centerY,
    radius,
  );
  body.addColorStop(0, "rgba(210, 255, 255, 0.95)");
  body.addColorStop(0.18, "rgba(58, 190, 255, 0.78)");
  body.addColorStop(0.56, "rgba(5, 55, 162, 0.76)");
  body.addColorStop(1, "rgba(0, 5, 23, 0.98)");
  context.fillStyle = body;
  context.shadowColor = "rgba(65, 190, 255, 0.78)";
  context.shadowBlur = 72;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 18; index += 1) {
    context.strokeStyle = `rgba(126, 226, 255, ${0.12 - index * 0.004})`;
    context.lineWidth = index % 4 === 0 ? 1.8 : 0.8;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radius * (0.58 + index * 0.036),
      radius * (0.34 + index * 0.028),
      drift * 0.25 + index * 0.28,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
  context.globalCompositeOperation = "source-over";
}

function drawVideoField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  drift: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 160; index += 1) {
    const x = (index * 91.7 + Math.sin(drift + index) * 9) % width;
    const y = 80 + ((index * 47.3 + drift * 34) % (height - 210));
    const alpha = 0.035 + (index % 9) * 0.006;
    context.fillStyle = `rgba(43, 159, 255, ${alpha})`;
    context.beginPath();
    context.arc(x, y, 1 + (index % 3), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
