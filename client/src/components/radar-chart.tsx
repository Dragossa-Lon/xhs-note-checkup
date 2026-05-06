import type { CheckupReport } from "@shared/schema";

interface RadarChartProps {
  dimensions: CheckupReport["dimensions"];
}

export function RadarChart({ dimensions }: RadarChartProps) {
  const items = [
    { label: "标题", score: dimensions.title.score },
    { label: "钩子", score: dimensions.hook.score },
    { label: "结构", score: dimensions.structure.score },
    { label: "关键词", score: dimensions.keywords.score },
    { label: "互动", score: dimensions.interaction.score },
  ];

  const size = 280;
  const center = size / 2;
  const maxRadius = 105;
  const labelRadius = 128;
  const numAxes = items.length;

  const angle = (i: number) => (Math.PI * 2 * i) / numAxes - Math.PI / 2;

  const point = (i: number, value: number) => {
    const r = (value / 100) * maxRadius;
    return [center + r * Math.cos(angle(i)), center + r * Math.sin(angle(i))];
  };

  const polygon = items
    .map((item, i) => {
      const [x, y] = point(i, item.score);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="radar-chart">
      {/* 背景同心圆 */}
      {[20, 40, 60, 80, 100].map((v) => (
        <polygon
          key={v}
          points={items
            .map((_, i) => {
              const [x, y] = point(i, v);
              return `${x},${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray={v === 100 ? "0" : "2 4"}
        />
      ))}
      {/* 轴线 */}
      {items.map((_, i) => {
        const [x, y] = point(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        );
      })}
      {/* 数据多边形 */}
      <polygon
        points={polygon}
        fill="hsl(var(--primary) / 0.18)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 数据点 */}
      {items.map((item, i) => {
        const [x, y] = point(i, item.score);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--card))"
            strokeWidth="2"
          />
        );
      })}
      {/* 标签 */}
      {items.map((item, i) => {
        const x = center + labelRadius * Math.cos(angle(i));
        const y = center + labelRadius * Math.sin(angle(i));
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="hsl(var(--foreground))"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {item.label}
            </text>
            <text
              x={x}
              y={y + 10}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
            >
              {item.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
