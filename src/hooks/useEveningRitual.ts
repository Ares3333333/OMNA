"use client";

import { useEffect, useState } from "react";

const ritualHour = 22;
const ritualDurationMinutes = 18;

type EveningRitual = {
  isLive: boolean;
  label: string;
  detail: string;
};

export function useEveningRitual(): EveningRitual {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const firstTick = window.setTimeout(() => {
      setNow(new Date());
    }, 0);
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, []);

  if (!now) {
    return {
      isLive: false,
      label: "Общий вечерний Ом",
      detail: "Каждый день в 22:00.",
    };
  }

  const start = new Date(now);
  start.setHours(ritualHour, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + ritualDurationMinutes);

  if (now >= start && now < end) {
    return {
      isLive: true,
      label: "Сейчас общий вечерний Ом",
      detail: "Останься на несколько дыханий.",
    };
  }

  const nextStart = now < start ? start : new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const secondsLeft = Math.max(0, Math.floor((nextStart.getTime() - now.getTime()) / 1000));

  return {
    isLive: false,
    label: `До общего вечернего Ом: ${formatCountdown(secondsLeft)}`,
    detail: "Каждый день в 22:00.",
  };
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}
