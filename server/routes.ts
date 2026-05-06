import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { checkupRequestSchema, checkupReportSchema, type CheckupReport } from "@shared/schema";

// 工具调用的 schema（强制输出合法 JSON）
const dimensionSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    score: { type: "number", minimum: 0, maximum: 100 },
    level: { type: "string", enum: ["excellent", "good", "warning", "danger"] },
    comment: { type: "string", description: "具体评价，包含肯定 + 可改进项" },
    suggestions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  },
  required: ["name", "score", "level", "comment", "suggestions"],
};

const CHECKUP_TOOL = {
  name: "submit_checkup_report",
  description: "提交小红书笔记体检报告",
  input_schema: {
    type: "object" as const,
    properties: {
      totalScore: { type: "number", minimum: 0, maximum: 100 },
      grade: { type: "string", enum: ["S", "A", "B", "C", "D"] },
      diagnosis: { type: "string", description: "中性、鼓励性的一句话诊断" },
      dimensions: {
        type: "object",
        properties: {
          title: dimensionSchema,
          hook: dimensionSchema,
          structure: dimensionSchema,
          keywords: dimensionSchema,
          interaction: dimensionSchema,
        },
        required: ["title", "hook", "structure", "keywords", "interaction"],
      },
      rewrite: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["title", "content", "explanation"],
      },
    },
    required: ["totalScore", "grade", "diagnosis", "dimensions", "rewrite"],
  },
};

const SYSTEM_PROMPT = `你是一位专业、中立的小红书内容顾问，擅长用建设性的方式帮助创作者优化笔记。
你需要对用户提交的小红书笔记进行"体检"，从 5 个维度客观评分（0-100），并提供建议。

评分维度：
1. **标题吸引力**（title）：是否有钩子、数字、痛点、好奇心、利益点；字数是否合适（小红书最佳 12-20 字）
2. **开头钩子**（hook）：前 3 行是否能抓住读者；是否有场景代入、冲突、悬念、利益承诺
3. **内容结构**（structure）：段落清晰度、是否分点、有无小标题、是否有 emoji 视觉断点、信息密度
4. **搜索关键词**（keywords）：是否含目标人群关键词、场景词、品类词；标签是否合理
5. **互动属性**（interaction）：是否引导收藏（实用清单/教程）、评论（提问/争议点）、转发（共鸣/价值）

评分等级：
- 90-100: excellent（表现优秀）
- 70-89: good（基础扎实，仍有优化空间）
- 50-69: warning（有提升空间，建议优化）
- 0-49: danger（建议重点改进）

总分等级：S (90+)、A (80-89)、B (70-79)、C (60-69)、D (<60)

语调与风格要求（重要）：
- **保持客观中立**。先肯定笔记中已经做得好的地方，再指出可优化之处。每个维度的 comment 都应包含至少一处肯定 + 一处可改进项。
- **用建议式语言，不用批评式语言**。
  - 不要说："标题完全没有钩子，太平淡了"
  - 改为说："标题已经清晰传达了主题，如果加入数字或具体场景词，会更容易吸引目标读者点击"
  - 不要说："结构混乱，读不下去"
  - 改为说："内容信息量充足，建议通过分点或小标题让读者更易于扫读"
- **避免负面词汇**：不要使用"差"、"糟糕"、"严重"、"必须"、"完全没有"、"手术"、"病"等过于消极或夸张的措辞。
- **避免讽刺、嘲讽、戏谑的口吻**。这是一份专业的优化建议，不是吐槽。
- **suggestions 字段以"建议"、"可以尝试"、"不妨"、"考虑"等动词开头**，给出具体可执行的方向。
- **comment 要具体**，指出笔记中的实际内容（"目前标题是XX，可以尝试加入..."），而非泛泛而谈。
- **一句话诊断（diagnosis）要中性、专业、鼓励性**。例如："内容基础良好，重点优化标题与开头钩子可显著提升曝光"，而不是"重度爆款乏力综合征"这类负面戏谐表达。
- 改写版要真正更好，体现所有改进建议；改写思路（explanation）用平和的口吻说明做了哪些调整、为什么。

请调用 submit_checkup_report 工具提交体检报告。所有字段都要填写，各维度的 name 使用中文名称：标题吸引力、开头钩子、内容结构、搜索关键词、互动属性。文本中如需引用例子，请使用【】或「」中文括号，避免使用双引号。`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "\n⚠️  ANTHROPIC_API_KEY is not set. The /api/checkup endpoint will fail.\n" +
      "   Please copy .env.example to .env and add your API key.\n"
    );
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

  // 健康检查
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      model: MODEL,
    });
  });

  app.post("/api/checkup", async (req, res) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
          error: "服务未配置 ANTHROPIC_API_KEY，请查看 README 说明",
        });
      }

      const parsed = checkupRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "输入无效" });
      }

      const { note } = parsed.data;

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        tools: [CHECKUP_TOOL],
        tool_choice: { type: "tool", name: CHECKUP_TOOL.name },
        messages: [
          {
            role: "user",
            content: `请对以下小红书笔记进行体检：\n\n---\n${note}\n---\n\n请调用 submit_checkup_report 工具提交报告。`,
          },
        ],
      });

      // 提取 tool_use
      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        console.error("No tool_use in response:", JSON.stringify(message.content).slice(0, 500));
        return res.status(500).json({ error: "AI 没有返回体检结果，请重试" });
      }

      // tool_use.input 已经是解析好的 JSON 对象
      const validation = checkupReportSchema.safeParse(toolUse.input);
      if (!validation.success) {
        console.error("Schema validation failed:", validation.error.issues);
        console.error("Raw input:", JSON.stringify(toolUse.input).slice(0, 1000));
        return res.status(500).json({ error: "AI 返回结构异常，请重试" });
      }

      res.json(validation.data);
    } catch (error: any) {
      console.error("Checkup error:", error);
      res.status(500).json({ error: error.message || "体检失败，请重试" });
    }
  });

  return httpServer;
}
