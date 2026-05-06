import { z } from "zod";

// 笔记体检请求
export const checkupRequestSchema = z.object({
  note: z.string().min(10, "笔记太短啦，至少 10 个字").max(5000, "笔记不能超过 5000 字"),
});
export type CheckupRequest = z.infer<typeof checkupRequestSchema>;

// 单项评分
export const dimensionScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  level: z.enum(["excellent", "good", "warning", "danger"]),
  comment: z.string(),
  suggestions: z.array(z.string()),
});
export type DimensionScore = z.infer<typeof dimensionScoreSchema>;

// 体检报告
export const checkupReportSchema = z.object({
  totalScore: z.number().min(0).max(100),
  grade: z.enum(["S", "A", "B", "C", "D"]),
  diagnosis: z.string(), // 一句话诊断
  dimensions: z.object({
    title: dimensionScoreSchema,        // 标题吸引力
    hook: dimensionScoreSchema,         // 开头钩子
    structure: dimensionScoreSchema,    // 内容结构
    keywords: dimensionScoreSchema,     // 搜索关键词
    interaction: dimensionScoreSchema,  // 互动属性
  }),
  rewrite: z.object({
    title: z.string(),
    content: z.string(),
    explanation: z.string(), // 改写思路
  }),
});
export type CheckupReport = z.infer<typeof checkupReportSchema>;
