"use client";

import { motion } from "framer-motion";
import {
  formatCollectiveMinutes,
  formatPeople,
  formatPercent,
  formatSessionSeconds,
} from "@/lib/format";

type StatsPanelProps = {
  globalUsers: number;
  globalForce: number;
  globalMinutes: number;
  personalSeconds: number;
};

type StatKind = "people" | "wave" | "spiral" | "orbit";

export function StatsPanel({
  globalUsers,
  globalForce,
  globalMinutes,
  personalSeconds,
}: StatsPanelProps) {
  const stats: Array<{
    label: string;
    value: string;
    kind: StatKind;
  }> = [
    {
      label: "Сейчас в Omna",
      value: formatPeople(globalUsers),
      kind: "people",
    },
    {
      label: "Сила Omna",
      value: formatPercent(globalForce),
      kind: "wave",
    },
    {
      label: "Общее время",
      value: formatCollectiveMinutes(globalMinutes),
      kind: "spiral",
    },
    {
      label: "Ты держишь звук",
      value: formatSessionSeconds(personalSeconds),
      kind: "orbit",
    },
  ];

  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-0 w-full items-end"
      aria-label="Статистика Omna"
    >
      <div className="mmatrix-stats-panel mx-auto grid h-full max-h-[7.8rem] min-h-[5.15rem] w-full max-w-[64rem] grid-cols-4 overflow-hidden rounded-[clamp(0.9rem,1.8svh,1.45rem)] border border-white/10 bg-[#020912]/46 shadow-[inset_0_0_30px_rgba(65,155,255,0.05),0_0_38px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        {stats.map((item, index) => (
          <div
            key={item.label}
            className={[
              "mmatrix-stat-item relative flex min-w-0 flex-col items-center justify-center px-1.5 py-[clamp(0.42rem,1svh,0.78rem)] text-center sm:px-5",
              index > 0 ? "border-l border-white/10" : "",
            ].join(" ")}
          >
            <StatGlyph kind={item.kind} />
            <div className="mmatrix-stat-value mt-[0.28rem] max-w-full truncate text-[clamp(1rem,1.58vw,1.64rem)] font-light leading-none text-white/92">
              {item.value}
            </div>
            <div className="mmatrix-stat-label mt-[0.28rem] max-w-full text-[clamp(0.52rem,0.76vw,0.78rem)] leading-tight text-slate-300/50">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function svgNumber(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function StatGlyph({ kind }: { kind: StatKind }) {
  if (kind === "people") {
    return (
      <svg className="mmatrix-stat-glyph h-[clamp(1.1rem,2.75svh,2.15rem)] w-[clamp(2.2rem,4.5vw,4.1rem)] text-[#1b9cff]" viewBox="0 0 96 64" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, index) => {
          const x = svgNumber(12 + index * 12);
          const y = svgNumber(20 + Math.sin(index) * 5);
          return (
            <g key={index} opacity={svgNumber(0.45 + index * 0.06)}>
              <circle cx={x} cy={y} r="4.3" fill="currentColor" />
              <path
                d={`M${x - 6} ${y + 18}c1-9 3-13 6-13s5 4 6 13`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={`M${x} ${y + 9}v16`}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    );
  }

  if (kind === "wave") {
    return (
      <svg className="mmatrix-stat-glyph h-[clamp(1.1rem,2.75svh,2.15rem)] w-[clamp(2.5rem,5.2vw,4.7rem)] text-[#22a8ff]" viewBox="0 0 120 64" aria-hidden="true">
        {Array.from({ length: 31 }).map((_, index) => {
          const x = svgNumber(8 + index * 3.4);
          const height = svgNumber(8 + Math.pow(Math.sin(index * 0.54), 2) * 42);
          return (
            <line
              key={index}
              x1={x}
              x2={x}
              y1={svgNumber(32 - height / 2)}
              y2={svgNumber(32 + height / 2)}
              stroke="currentColor"
              strokeWidth={index % 5 === 0 ? 1.8 : 1.1}
              strokeLinecap="round"
              opacity={svgNumber(0.25 + (height / 50) * 0.65)}
            />
          );
        })}
      </svg>
    );
  }

  if (kind === "spiral") {
    return (
      <svg className="mmatrix-stat-glyph h-[clamp(1.1rem,2.75svh,2.15rem)] w-[clamp(2.2rem,4.5vw,4.1rem)] text-[#168fff]" viewBox="0 0 88 64" aria-hidden="true">
        {Array.from({ length: 70 }).map((_, index) => {
          const t = index / 69;
          const angle = t * Math.PI * 7.6;
          const r = 3 + t * 28;
          const x = svgNumber(44 + Math.cos(angle) * r);
          const y = svgNumber(32 + Math.sin(angle) * r * 0.78);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={svgNumber(0.8 + t * 0.7)}
              fill="currentColor"
              opacity={svgNumber(0.18 + t * 0.72)}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <svg className="mmatrix-stat-glyph h-[clamp(1.1rem,2.75svh,2.15rem)] w-[clamp(2.2rem,4.5vw,4.1rem)] text-[#2fb7ff]" viewBox="0 0 90 64" aria-hidden="true">
      <ellipse cx="45" cy="32" rx="30" ry="14" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.72" />
      <ellipse cx="45" cy="32" rx="30" ry="14" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.44" transform="rotate(62 45 32)" />
      <ellipse cx="45" cy="32" rx="30" ry="14" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.32" transform="rotate(-42 45 32)" />
      <circle cx="45" cy="32" r="9" fill="currentColor" opacity="0.24" />
      <circle cx="67" cy="21" r="2.4" fill="currentColor" />
    </svg>
  );
}
