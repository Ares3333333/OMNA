const ruNumber = new Intl.NumberFormat("ru-RU");

export function formatPeople(value: number) {
  return ruNumber.format(Math.round(value));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatCollectiveMinutes(totalMinutes: number) {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours >= 1000) {
    return `${ruNumber.format(hours)} ч`;
  }

  if (hours > 0) {
    return `${hours} ч ${restMinutes.toString().padStart(2, "0")} мин`;
  }

  return `${restMinutes} мин`;
}

export function formatSessionSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${restSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${restSeconds.toString().padStart(2, "0")}`;
}

export function formatSessionDurationWords(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${pluralRu(hours, ["час", "часа", "часов"])}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${pluralRu(minutes, ["минута", "минуты", "минут"])}`);
  }

  if (restSeconds > 0 || parts.length === 0) {
    parts.push(
      `${restSeconds} ${pluralRu(restSeconds, ["секунда", "секунды", "секунд"])}`,
    );
  }

  return parts.slice(0, 2).join(" ");
}

export function formatRitualLife(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ${pluralRu(hours, ["час", "часа", "часов"])} ${minutes} ${pluralRu(minutes, ["минута", "минуты", "минут"])}`;
  }

  return `${minutes} ${pluralRu(minutes, ["минута", "минуты", "минут"])}`;
}

function pluralRu(value: number, forms: [string, string, string]) {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;

  if (absolute > 10 && absolute < 20) {
    return forms[2];
  }

  if (last > 1 && last < 5) {
    return forms[1];
  }

  if (last === 1) {
    return forms[0];
  }

  return forms[2];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function easeInOutSine(value: number) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}
