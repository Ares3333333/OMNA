import { formatPeople, formatSessionSeconds } from "@/lib/format";
import { SessionRitualTrace } from "@/lib/sessionRitual";

type ShareCardInput = {
  seconds: number;
  users: number;
  trace: SessionRitualTrace;
};

export async function createSessionShareImage({
  seconds,
  users,
  trace,
}: ShareCardInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  drawShareCard(context, {
    seconds,
    users,
    trace,
    width: canvas.width,
    height: canvas.height,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.92);
  });

  if (!blob) {
    return null;
  }

  return new File([blob], "omna-session.png", { type: "image/png" });
}

function drawShareCard(
  context: CanvasRenderingContext2D,
  {
    seconds,
    users,
    trace,
    width,
    height,
  }: ShareCardInput & { width: number; height: number },
) {
  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#020711");
  background.addColorStop(0.45, "#000711");
  background.addColorStop(1, "#000204");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  drawShareSphere(context, width / 2, 438, 250, trace.resonance / 100);
  drawDistantField(context, width, height);

  context.textAlign = "center";
  context.fillStyle = "rgba(245, 251, 255, 0.94)";
  context.font = "300 54px Manrope, Arial, sans-serif";
  context.fillText("Я держал Omna", width / 2, 780);

  context.fillStyle = "#f7fbff";
  context.font = "500 132px Cormorant Garamond, Times New Roman, serif";
  context.fillText(formatSessionSeconds(seconds), width / 2, 930);

  context.fillStyle = "rgba(192, 223, 248, 0.72)";
  context.font = "400 34px Manrope, Arial, sans-serif";
  context.fillText(`мой след: ${trace.phrase}`, width / 2, 1010);

  context.fillStyle = "rgba(112, 211, 255, 0.66)";
  context.font = "500 28px Manrope, Arial, sans-serif";
  context.fillText(`резонанс ${trace.resonance}% · сейчас держат ${formatPeople(users)}`, width / 2, 1080);

  context.fillStyle = "rgba(238, 248, 255, 0.88)";
  context.font = "400 42px Manrope, Arial, sans-serif";
  context.fillText("omna", width / 2, 1212);

  context.fillStyle = "rgba(167, 202, 232, 0.46)";
  context.font = "400 24px Manrope, Arial, sans-serif";
  context.fillText(trace.traceId, width / 2, 1260);
}

function drawShareSphere(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  resonance: number,
) {
  const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2.4);
  halo.addColorStop(0, `rgba(74, 220, 255, ${0.34 + resonance * 0.18})`);
  halo.addColorStop(0.22, "rgba(24, 116, 255, 0.25)");
  halo.addColorStop(0.58, "rgba(8, 43, 118, 0.16)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(centerX, centerY, radius * 2.45, 0, Math.PI * 2);
  context.fill();

  const body = context.createRadialGradient(
    centerX - radius * 0.08,
    centerY - radius * 0.08,
    radius * 0.04,
    centerX,
    centerY,
    radius,
  );
  body.addColorStop(0, "rgba(176, 252, 255, 0.96)");
  body.addColorStop(0.13, "rgba(55, 179, 255, 0.82)");
  body.addColorStop(0.42, "rgba(9, 59, 169, 0.72)");
  body.addColorStop(0.78, "rgba(1, 18, 72, 0.94)");
  body.addColorStop(1, "rgba(0, 4, 20, 0.98)");
  context.fillStyle = body;
  context.shadowColor = "rgba(67, 183, 255, 0.75)";
  context.shadowBlur = 86;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 30; ring += 1) {
    const progress = ring / 29;
    context.strokeStyle = `rgba(107, 219, 255, ${(0.18 - progress * 0.12) * (0.6 + resonance)})`;
    context.lineWidth = ring % 5 === 0 ? 2.2 : 1;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radius * (0.38 + progress * 0.72),
      radius * (0.28 + progress * 0.54),
      ring * 0.21,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  for (let index = 0; index < 96; index += 1) {
    const angle = index * 2.399;
    const distance = radius * (0.12 + ((index * 37) % 100) / 130);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.84;
    context.fillStyle = `rgba(169, 244, 255, ${0.14 + (index % 7) * 0.018})`;
    context.beginPath();
    context.arc(x, y, 2 + (index % 5) * 0.7, 0, Math.PI * 2);
    context.fill();
  }
  context.globalCompositeOperation = "source-over";
}

function drawDistantField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.save();
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 220; index += 1) {
    const x = ((index * 123.17) % width);
    const y = 90 + ((index * 91.31) % (height - 220));
    const alpha = 0.04 + ((index * 13) % 100) / 1000;
    context.fillStyle = `rgba(43, 159, 255, ${alpha})`;
    context.beginPath();
    context.arc(x, y, 1 + (index % 4), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
