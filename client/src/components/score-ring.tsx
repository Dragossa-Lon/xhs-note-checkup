import { useEffect, useRef } from "react";

interface ScoreRingProps {
  score: number;
  grade: string;
}

export function ScoreRing({ score, grade }: ScoreRingProps) {
  const ref = useRef<SVGCircleElement>(null);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - score / 100);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty("--circ", `${circumference}`);
      ref.current.style.setProperty("--target", `${targetOffset}`);
      ref.current.style.strokeDasharray = `${circumference}`;
      ref.current.style.strokeDashoffset = `${targetOffset}`;
    }
  }, [score, circumference, targetOffset]);

  const color =
    score >= 90
      ? "hsl(var(--health-excellent))"
      : score >= 70
      ? "hsl(var(--health-good))"
      : score >= 50
      ? "hsl(var(--health-warning))"
      : "hsl(var(--health-danger))";

  return (
    <div className="relative w-52 h-52" data-testid="score-ring">
      <svg width="208" height="208" viewBox="0 0 208 208" className="-rotate-90">
        <circle
          cx="104"
          cy="104"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
        />
        <circle
          ref={ref}
          cx="104"
          cy="104"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          className="score-ring transition-all"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display font-extrabold leading-none"
          style={{ fontSize: "4rem", color }}
          data-testid="text-total-score"
        >
          {score}
        </div>
        <div className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">分 / 100</div>
        <div
          className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold tracking-wider"
          style={{ background: color, color: "white" }}
          data-testid="text-grade"
        >
          等级 {grade}
        </div>
      </div>
    </div>
  );
}
