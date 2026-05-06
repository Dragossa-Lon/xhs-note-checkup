import { forwardRef } from "react";
import type { CheckupReport } from "@shared/schema";
import { Logo } from "./logo";

interface ShareCardProps {
  report: CheckupReport;
}

const gradeColor = (score: number) =>
  score >= 90
    ? "hsl(var(--health-excellent))"
    : score >= 70
    ? "hsl(var(--health-good))"
    : score >= 50
    ? "hsl(var(--health-warning))"
    : "hsl(var(--health-danger))";

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ report }, ref) => {
  const items = [
    { label: "标题吸引力", ...report.dimensions.title },
    { label: "开头钩子", ...report.dimensions.hook },
    { label: "内容结构", ...report.dimensions.structure },
    { label: "搜索关键词", ...report.dimensions.keywords },
    { label: "互动属性", ...report.dimensions.interaction },
  ];

  const totalColor = gradeColor(report.totalScore);

  return (
    <div
      ref={ref}
      className="w-[420px] bg-card rounded-3xl overflow-hidden border border-border"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--paper-grid) / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--paper-grid) / 0.6) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* 顶部红十字标题栏 */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ background: "hsl(var(--health-cross))" }}
      >
        <div className="flex items-center gap-2.5 text-white">
          <Logo />
          <div>
            <div className="font-display font-extrabold text-lg leading-none">笔记体检报告</div>
            <div className="text-[10px] opacity-80 tracking-widest mt-1">XHS HEALTH CHECK</div>
          </div>
        </div>
        <div className="text-white/90 text-[10px] tracking-widest">
          NO. {String(Math.floor(Math.random() * 9000) + 1000)}
        </div>
      </div>

      {/* 总分区 */}
      <div className="px-6 py-7 flex items-center gap-5 border-b border-dashed border-border">
        <div className="relative w-28 h-28 shrink-0">
          <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
            <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke={totalColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - report.totalScore / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="font-display font-extrabold text-4xl leading-none"
              style={{ color: totalColor }}
            >
              {report.totalScore}
            </div>
            <div className="text-[9px] text-muted-foreground tracking-widest mt-0.5">/ 100</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-white mb-2"
            style={{ background: totalColor }}
          >
            等级 {report.grade}
          </div>
          <div className="font-display font-bold text-base leading-snug text-foreground break-words">
            {report.diagnosis}
          </div>
        </div>
      </div>

      {/* 五维评分 */}
      <div className="px-6 py-5 space-y-3">
        {items.map((item, i) => {
          const c = gradeColor(item.score);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="text-xs font-bold w-20 shrink-0">{item.label}</div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.score}%`, background: c }}
                />
              </div>
              <div
                className="font-display font-extrabold text-base w-9 text-right"
                style={{ color: c }}
              >
                {item.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部水印 */}
      <div className="px-6 py-3 border-t border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="tracking-widest">AI 智能体检 · 仅供参考</span>
        <span className="font-display font-bold text-foreground">笔记体检 Agent</span>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";
