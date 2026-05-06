export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="笔记体检"
    >
      {/* 红十字背景圆 */}
      <rect width="32" height="32" rx="8" fill="hsl(var(--health-cross))" />
      {/* 心电图脉冲线 */}
      <path
        d="M5 16 L10 16 L12 10 L15 22 L18 13 L20 18 L22 16 L27 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
