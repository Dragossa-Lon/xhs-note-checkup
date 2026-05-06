import type { DimensionScore } from "@shared/schema";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

interface DimensionCardProps {
  dimension: DimensionScore;
  index: number;
}

const levelMap = {
  excellent: {
    label: "优秀",
    color: "hsl(var(--health-excellent))",
    bg: "hsl(var(--health-excellent) / 0.1)",
    Icon: CheckCircle2,
  },
  good: {
    label: "良好",
    color: "hsl(var(--health-good))",
    bg: "hsl(var(--health-good) / 0.1)",
    Icon: CheckCircle2,
  },
  warning: {
    label: "可优化",
    color: "hsl(var(--health-warning))",
    bg: "hsl(var(--health-warning) / 0.1)",
    Icon: AlertCircle,
  },
  danger: {
    label: "建议改进",
    color: "hsl(var(--health-danger))",
    bg: "hsl(var(--health-danger) / 0.1)",
    Icon: AlertTriangle,
  },
};

export function DimensionCard({ dimension, index }: DimensionCardProps) {
  const config = levelMap[dimension.level];
  const { Icon } = config;

  return (
    <div
      className="paper-card rounded-2xl p-5 flex flex-col gap-3"
      data-testid={`card-dimension-${index}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-extrabold text-sm"
            style={{ background: config.bg, color: config.color }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="font-display font-bold text-base">{dimension.name}</h3>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: config.color }}>
          <Icon className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider">{config.label}</span>
        </div>
      </div>

      {/* 分数条 */}
      <div className="flex items-baseline gap-2">
        <span
          className="font-display font-extrabold text-3xl leading-none"
          style={{ color: config.color }}
          data-testid={`text-score-${index}`}
        >
          {dimension.score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
        <div className="flex-1 ml-2 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${dimension.score}%`,
              background: config.color,
            }}
          />
        </div>
      </div>

      <div className="dotted-divider" />

      <p className="text-sm leading-relaxed text-foreground/80" data-testid={`text-comment-${index}`}>
        {dimension.comment}
      </p>

      {dimension.suggestions.length > 0 && (
        <ul className="space-y-1.5 mt-1">
          {dimension.suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
              <span style={{ color: config.color }} className="font-bold">·</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
