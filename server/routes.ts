import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { checkupRequestSchema, checkupReportSchema } from "@shared/schema";

// 给 DeepSeek 看的 JSON 结构示例（json_object 模式必须在 prompt 里展示示例）
const JSON_EXAMPLE = `{
  "totalScore": 82,
  "grade": "A",
  "diagnosis": "整体内容基础扎实，标题和互动引导仍有较大提升空间。",
  "dimensions": {
    "title": {
      "name": "标题吸引力",
      "score": 70,
      "level": "good",
      "comment": "标题清晰传达了主题【秋冬护肤】，建议加入具体数字或痛点词以增强吸引力。",
      "suggestions": ["建议在标题中加入具体数字，例如『3 步』『7 天』", "可以尝试加入目标人群词，如『干皮姐妹必看』"]
    },
    "hook": {
      "name": "开头钩子",
      "score": 65,
      "level": "warning",
      "comment": "开头交代了背景，建议前 3 行加入更具体的场景或冲突，让读者快速代入。",
      "suggestions": ["建议用『最近...你是不是也...』这类共鸣式开头", "可以尝试以一个反差或意外的场景作为引子"]
    },
    "structure": {
      "name": "内容结构",
      "score": 85,
      "level": "good",
      "comment": "段落分明、节奏流畅，已具备较好的可读性。可以考虑增加小标题让重点更突出。",
      "suggestions": ["建议为每个步骤加上数字小标题", "考虑使用 emoji 作为段落分割提示"]
    },
    "keywords": {
      "name": "搜索关键词",
      "score": 78,
      "level": "good",
      "comment": "关键词覆盖了主要场景，建议在末尾加入更多长尾标签以扩展曝光面。",
      "suggestions": ["建议增加品类相关标签如 #秋冬护肤 #敏感肌", "可以尝试加入价格段词，如『平价』『学生党』"]
    },
    "interaction": {
      "name": "互动属性",
      "score": 60,
      "level": "warning",
      "comment": "结尾提供了使用方法，建议增加一个明确的提问或互动点引导评论。",
      "suggestions": ["建议在结尾抛出一个开放式问题", "可以尝试用『收藏起来慢慢看』提示收藏行为"]
    }
  },
  "rewrite": {
    "title": "干皮姐妹必看｜3 步搞定秋冬泛红，我亲测 7 天有效",
    "content": "改写后的笔记正文……",
    "explanation": "在标题中加入了人群词【干皮姐妹】、数字【3 步 / 7 天】和效果承诺，使曝光更精准；开头改为共鸣式场景代入；结尾增加了互动提问。"
  }
}`;

const SYSTEM_PROMPT = `你是一位专业、中立的小红书内容顾问，擅长用建设性的方式帮助创作者优化笔记。
你需要对用户提交的小红书笔记进行"体检"，从 5 个维度客观评分（0-100），并提供建议。

【评分维度】
1. **标题吸引力**（title）：是否有钩子、数字、痛点、好奇心、利益点；字数是否合适（小红书最佳 12-20 字）
2. **开头钩子**（hook）：前 3 行是否能抓住读者；是否有场景代入、冲突、悬念、利益承诺
3. **内容结构**（structure）：段落清晰度、是否分点、有无小标题、是否有 emoji 视觉断点、信息密度
4. **搜索关键词**（keywords）：是否含目标人群关键词、场景词、品类词；标签是否合理
5. **互动属性**（interaction）：是否引导收藏（实用清单/教程）、评论（提问/争议点）、转发（共鸣/价值）

【评分等级】
- 90-100: excellent（表现优秀）
- 70-89: good（基础扎实，仍有优化空间）
- 50-69: warning（有提升空间，建议优化）
- 0-49: danger（建议重点改进）

【总分等级】
S (90+)、A (80-89)、B (70-79)、C (60-69)、D (<60)

【语调与风格要求 — 极其重要】
- **保持客观中立**。先肯定笔记中已经做得好的地方，再指出可优化之处。每个维度的 comment 都应包含至少一处肯定 + 一处可改进项。
- **用建议式语言，不用批评式语言**：
  - 不要说"标题完全没有钩子，太平淡了"
  - 改为"标题已经清晰传达了主题，如果加入数字或具体场景词，会更容易吸引目标读者点击"
- **避免负面词汇**：不要使用"差"、"糟糕"、"严重"、"必须"、"完全没有"、"手术"、"病"等过于消极或夸张的措辞。
- **避免讽刺、嘲讽、戏谑的口吻**。这是一份专业的优化建议，不是吐槽。
- **suggestions 字段以"建议"、"可以尝试"、"不妨"、"考虑"等动词开头**，给出具体可执行的方向。
- **comment 要具体**，指出笔记中的实际内容，而非泛泛而谈。
- **一句话诊断（diagnosis）要中性、专业、鼓励性**。
- **改写版要真正更好**，体现所有改进建议；改写思路（explanation）用平和的口吻说明做了哪些调整、为什么。
- 文本中如需引用例子，请使用【】或「」中文括号，避免使用双引号。

【输出格式 — 必须严格按以下 JSON 格式输出，不要输出任何其它文字、markdown 标记或解释】
各维度的 name 字段使用中文：标题吸引力、开头钩子、内容结构、搜索关键词、互动属性。
level 字段必须是这 4 个英文小写值之一：excellent / good / warning / danger。
grade 字段必须是这 5 个大写字母之一：S / A / B / C / D。

JSON 示例（你输出的结构必须与此完全一致，只替换内容）：
${JSON_EXAMPLE}`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn(
      "\n⚠️  DEEPSEEK_API_KEY is not set. The /api/checkup endpoint will fail.\n" +
        "   Please copy .env.example to .env and add your API key.\n" +
        "   Get one at: https://platform.deepseek.com/api_keys\n"
    );
  }

  // 走代理：同时支持 HTTP/HTTPS 代理与 SOCKS 代理。
  // DeepSeek 国内可直连，通常不需要代理；保留兼容性以应对企业网络等场景。
  const proxyUrl =
    process.env.ALL_PROXY ||
    process.env.all_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  let httpAgent: any = undefined;
  if (proxyUrl) {
    if (/^socks/i.test(proxyUrl)) {
      httpAgent = new SocksProxyAgent(proxyUrl);
      console.log(`🌐 Using SOCKS proxy: ${proxyUrl}`);
    } else {
      httpAgent = new HttpsProxyAgent(proxyUrl);
      console.log(`🌐 Using HTTP proxy: ${proxyUrl}`);
    }
  }

  // DeepSeek 完全兼容 OpenAI SDK，只需把 baseURL 指向 https://api.deepseek.com
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    httpAgent,
    timeout: 120_000, // DeepSeek 长输出可能较慢，给 120s
  } as any);

  const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  // 健康检查
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.DEEPSEEK_API_KEY),
      model: MODEL,
      provider: "deepseek",
    });
  });

  app.post("/api/checkup", async (req, res) => {
    try {
      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(503).json({
          error: "服务未配置 DEEPSEEK_API_KEY，请查看 README 说明",
        });
      }

      const parsed = checkupRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "输入无效" });
      }

      const { note } = parsed.data;

      // DeepSeek 用 json_object 模式（不支持 json_schema），靠 prompt 中的 JSON 示例约束结构。
      // 偶发返回空内容时自动重试 1 次。
      const callLLM = async () =>
        client.chat.completions.create({
          model: MODEL,
          max_tokens: 4096,
          temperature: 0.4,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `请对以下小红书笔记进行体检，按上面定义的 JSON 结构输出体检报告（json）：\n\n---\n${note}\n---`,
            },
          ],
          response_format: { type: "json_object" },
        });

      let completion = await callLLM();
      let content = completion.choices?.[0]?.message?.content;

      // DeepSeek json_object 模式偶尔会返回空字符串，重试一次
      if (!content || (typeof content === "string" && content.trim().length === 0)) {
        console.warn("DeepSeek returned empty content, retrying once...");
        completion = await callLLM();
        content = completion.choices?.[0]?.message?.content;
      }

      if (!content || typeof content !== "string") {
        console.error("Empty completion content:", JSON.stringify(completion).slice(0, 500));
        return res.status(500).json({ error: "AI 没有返回体检结果，请重试" });
      }

      // 解析 JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch (e) {
        // 兜底：偶尔模型可能在 JSON 前后加了文字，提取大括号块
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) {
          console.error("Failed to parse JSON:", content.slice(0, 500));
          return res.status(500).json({ error: "AI 返回格式异常，请重试" });
        }
        try {
          parsedJson = JSON.parse(match[0]);
        } catch (e2) {
          console.error("Failed to parse extracted JSON:", match[0].slice(0, 500));
          return res.status(500).json({ error: "AI 返回格式异常，请重试" });
        }
      }

      const validation = checkupReportSchema.safeParse(parsedJson);
      if (!validation.success) {
        console.error("Schema validation failed:", validation.error.issues);
        console.error("Raw payload:", JSON.stringify(parsedJson).slice(0, 1000));
        return res.status(500).json({ error: "AI 返回结构异常，请重试" });
      }

      res.json(validation.data);
    } catch (error: any) {
      console.error("Checkup error:", error);
      const status = error?.status || error?.response?.status;
      const message =
        error?.error?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        "体检失败，请重试";
      if (status === 401) {
        return res.status(401).json({ error: "DEEPSEEK_API_KEY 无效，请检查 .env" });
      }
      if (status === 402) {
        return res
          .status(402)
          .json({ error: "DeepSeek 账户余额不足，请到 platform.deepseek.com 充值" });
      }
      if (status === 429) {
        return res.status(429).json({ error: "请求过于频繁或额度已用尽，请稍后再试" });
      }
      res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
