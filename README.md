*# 笔记体检 Agent · XHS Note Checkup

> 给小红书笔记做一次"全身体检"——基于 DeepSeek API 的 AI 笔记诊断与改写工具。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933)](https://nodejs.org/)
[![Powered by DeepSeek](https://img.shields.io/badge/Powered%20by-DeepSeek-4d6bfe)](https://www.deepseek.com/)

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
- **JSON 模式 + Zod 校验稳定输出** —— 通过 DeepSeek 的 `response_format: json_object` + prompt 内置 JSON 示例 + Zod schema 校验三重约束，杜绝 LLM 输出格式错误；偶发空响应自动重试

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/xhs-note-checkup.git
cd xhs-note-checkup

# 2. 安装依赖（需要 Node.js >= 18）
npm install

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 DEEPSEEK_API_KEY
# 申请地址：https://platform.deepseek.com/api_keys（国内可直连，无需代理）

# 4. 启动开发服务器
npm run dev
```

打开 [http://localhost:5000](http://localhost:5000) 即可使用。

健康检查接口：`GET /api/health` —— 返回 `{ ok: true }` 表示 API Key 已正确配置。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | ✓ | — | DeepSeek API Key（[申请](https://platform.deepseek.com/api_keys)） |
| `DEEPSEEK_MODEL` | | `deepseek-chat` | `deepseek-chat`（默认/便宜）/ `deepseek-reasoner`（思考模式） |
| `PORT` | | `5000` | 服务监听端口（macOS 上 5000 可能被 AirPlay 占用，请改为 `5173` 等） |
| `HOST` | | `localhost` | 监听地址；LAN / 容器里暴露请设为 `0.0.0.0` |

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
| AI 接入 | DeepSeek API (OpenAI 兼容) + `openai` SDK |
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

## 常见问题

### `EADDRINUSE: address already in use 0.0.0.0:5000`

**原因**：端口 5000 已被其它进程占用。最常见的是 **macOS 默认开启的 AirPlay Receiver**。

**解决**（任选一种）：

```bash
# A. 在 .env 里改端口
echo "PORT=5173" >> .env
npm run dev

# B. 临时指定
PORT=5173 npm run dev

# C. 在 macOS 上关闭隔空投送接收器
# 系统设置 → 通用 → 隔空投送接收器 → 关闭
```

改了 PORT 后，请访问 `http://localhost:<你设的端口>`。

### 启动后提示 `⚠️ DEEPSEEK_API_KEY is not set`

没有创建 `.env` 或没填 API Key。按下面创建：

```bash
cp .env.example .env
# 然后编辑 .env，填入从 https://platform.deepseek.com/api_keys 获取的 key
```

### 请求 `/api/checkup` 返回 401

API Key 无效。检查 `.env` 里是否填对，以及 key 是否以 `sk-` 开头。

### 请求 `/api/checkup` 返回 402

DeepSeek 账户余额不足，请到 [platform.deepseek.com](https://platform.deepseek.com) 充值（最低 ¥10，支持微信/支付宝）。

### 请求 `/api/checkup` 返回 429

DeepSeek API 限流或额度用尽，稍后重试或检查你的[使用额度](https://platform.deepseek.com/usage)。

### 提示"AI 没有返回体检结果，请重试"

DeepSeek json_object 模式偶发空响应（官方文档已说明）。代码已自动重试 1 次。如果连续多次失败，可换 `DEEPSEEK_MODEL=deepseek-reasoner` 试试。

## 部署

### 一、自托管（任意 Node 服务器）

```bash
npm run build
DEEPSEEK_API_KEY=sk-xxx NODE_ENV=production node dist/index.cjs
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
- 环境变量配置 `DEEPSEEK_API_KEY`

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

**XHS Note Checkup Agent** — an AI-powered diagnosis tool for Xiaohongshu (Little Red Book) notes, built on the DeepSeek API.

Paste a note's title and body, and the agent generates a "medical-checkup style" report scoring 5 dimensions — **Title, Hook, Structure, Keywords, Engagement** — plus a rewritten draft you can copy directly. The whole UI is themed as a playful health-checkup form: red-cross logo, warm pink accent, paper-grid background.

### Highlights

- 5-axis radar chart, total score with S/A/B/C/D grade
- AI-generated rewrite with rationale
- One-click PNG share card via `html2canvas`
- Constructive, neutral tone — every comment pairs an affirmation with an improvement suggestion
- Reliable JSON output via DeepSeek json_object mode + in-prompt schema example + Zod validation, with auto-retry on empty responses

### Quickstart

```bash
git clone https://github.com/your-username/xhs-note-checkup.git
cd xhs-note-checkup
npm install
cp .env.example .env   # then add your DEEPSEEK_API_KEY
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

### Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion · TanStack Query · Recharts · Express · DeepSeek API · Zod

---

## License

[MIT](./LICENSE) © 2026
