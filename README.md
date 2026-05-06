# 笔记体检 Agent · XHS Note Checkup

> 给小红书笔记做一次"全身体检"——基于 Perplexity Sonar API 的 AI 笔记诊断与改写工具。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933)](https://nodejs.org/)
[![Powered by Perplexity](https://img.shields.io/badge/Powered%20by-Perplexity%20Sonar-20808d)](https://www.perplexity.ai/)

把你的小红书笔记标题与正文丢进去，AI 会从 **标题、Hook、结构、关键词、互动引导** 五个维度生成一份"体检报告"，并附上一版可直接抄走的改写示例。整体走「趣味体检风」——红十字 logo、暖粉色调、纸纹底，把 AI 评估包装成一张轻松的医院化验单。

---

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [部署](#部署)
- [Roadmap](#roadmap)
- [English](#english)
- [License](#license)

---

## 功能特性

- **五维体检** —— 标题张力、Hook 抓人度、结构清晰度、关键词命中、互动引导，逐项 0–100 打分
- **总分与等级** —— S / A / B / C / D 五档评定，附整体诊断
- **雷达图** —— 一眼看出五维短板
- **改写建议** —— AI 给出一版改写后的标题与正文，并解释改动思路
- **分享卡片** —— 一键导出 PNG，方便发到群里互相切磋
- **客观中立的语气** —— 评价坚持「肯定 + 可改进」结构，建议用「建议 / 可以尝试 / 不妨」开头，避免负面攻击性表达
- **示例笔记** —— 内置 3 篇不同类型的示例，零成本试用
- **Structured Outputs 稳定输出** —— 通过 Perplexity 的 `response_format: json_schema` 强约束输出结构，再配 Zod 校验，杜绝 LLM 输出格式错误

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/xhs-note-checkup.git
cd xhs-note-checkup

# 2. 安装依赖（需要 Node.js >= 18）
npm install

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 PERPLEXITY_API_KEY
# 申请地址：https://www.perplexity.ai/settings/api

# 4. 启动开发服务器
npm run dev
```

打开 [http://localhost:5000](http://localhost:5000) 即可使用。

健康检查接口：`GET /api/health` —— 返回 `{ ok: true }` 表示 API Key 已正确配置。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PERPLEXITY_API_KEY` | ✓ | — | Perplexity API Key |
| `PERPLEXITY_MODEL` | | `sonar` | Sonar 模型：`sonar` / `sonar-pro` / `sonar-reasoning-pro` / `sonar-deep-research` |
| `PORT` | | `5000` | 服务监听端口 |

详见 [.env.example](./.env.example)。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端框架 | React 18 + TypeScript + Vite |
| 路由 | wouter（hash 路由） |
| UI | Tailwind CSS v3 + shadcn/ui + Radix UI |
| 动效 | Framer Motion |
| 数据请求 | TanStack Query (React Query v5) |
| 图表 | Recharts（雷达图） |
| 卡片导出 | html2canvas |
| 后端 | Express 5 + Node.js |
| AI 接入 | Perplexity Sonar (OpenAI 兼容) + `openai` SDK |
| Schema 校验 | Zod |
| 表单 | react-hook-form + @hookform/resolvers |

## 项目结构

```
xhs-note-checkup/
├── client/                  # 前端
│   └── src/
│       ├── components/      # 自研组件（雷达图 / 评分环 / 维度卡片 / 分享卡片）
│       │   └── ui/          # shadcn/ui 组件
│       ├── pages/           # 页面（home / not-found）
│       ├── lib/             # queryClient 等
│       └── App.tsx
├── server/                  # 后端
│   ├── index.ts             # Express 入口
│   ├── routes.ts            # /api/checkup 与 /api/health
│   ├── static.ts            # 生产环境静态资源
│   └── vite.ts              # 开发环境 Vite 中间件
├── shared/
│   └── schema.ts            # 前后端共享 Zod Schema
├── script/
│   └── build.ts             # 生产构建脚本
├── .env.example
└── package.json
```

## 部署

### 一、自托管（任意 Node 服务器）

```bash
npm run build
PERPLEXITY_API_KEY=pplx-xxx NODE_ENV=production node dist/index.cjs
```

默认监听 `5000` 端口，可用 Nginx / Caddy 反向代理。

### 二、容器部署

可使用如下最简 Dockerfile（自行根据需要调整）：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.cjs"]
```

### 三、Railway / Render / Fly.io

- Build Command: `npm install && npm run build`
- Start Command: `node dist/index.cjs`
- 环境变量配置 `PERPLEXITY_API_KEY`

> 注：本项目前后端共用一个端口，无需额外的反向代理或拆分部署。

## Roadmap

- [ ] 笔记封面图 OCR + 视觉分析
- [ ] 历史报告本地保存与对比
- [ ] 批量体检（CSV 上传）
- [ ] 多平台支持（抖音 / 视频号文案）
- [ ] 自定义评分权重

欢迎在 [Issues](https://github.com/your-username/xhs-note-checkup/issues) 中提需求。

## 贡献

欢迎 PR。提交前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## English

**XHS Note Checkup Agent** — an AI-powered diagnosis tool for Xiaohongshu (Little Red Book) notes, built on the Perplexity Sonar API.

Paste a note's title and body, and the agent generates a "medical-checkup style" report scoring 5 dimensions — **Title, Hook, Structure, Keywords, Engagement** — plus a rewritten draft you can copy directly. The whole UI is themed as a playful health-checkup form: red-cross logo, warm pink accent, paper-grid background.

### Highlights

- 5-axis radar chart, total score with S/A/B/C/D grade
- AI-generated rewrite with rationale
- One-click PNG share card via `html2canvas`
- Constructive, neutral tone — every comment pairs an affirmation with an improvement suggestion
- Reliable JSON output via Perplexity structured outputs (`response_format: json_schema`) + Zod validation

### Quickstart

```bash
git clone https://github.com/your-username/xhs-note-checkup.git
cd xhs-note-checkup
npm install
cp .env.example .env   # then add your PERPLEXITY_API_KEY
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

### Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion · TanStack Query · Recharts · Express · Perplexity Sonar API · Zod

---

## License

[MIT](./LICENSE) © 2026
