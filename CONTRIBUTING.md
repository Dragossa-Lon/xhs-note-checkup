# 贡献指南 · Contributing

感谢你对 **笔记体检 Agent** 感兴趣 🎉。

## 提 Issue

提交 bug 前请先：

1. 搜索一下是否已有相同 issue
2. 用对应模板（Bug Report / Feature Request）描述清楚
3. Bug 务必附上**复现步骤**、Node 版本、浏览器、错误日志

## 开发流程

```bash
# Fork 后克隆你的仓库
git clone https://github.com/<your-username>/xhs-note-checkup.git
cd xhs-note-checkup
npm install
cp .env.example .env   # 填入你自己的 DEEPSEEK_API_KEY
npm run dev
```

### 分支规范

- `main` —— 稳定分支
- `feat/xxx` —— 新功能
- `fix/xxx` —— Bug 修复
- `docs/xxx` —— 文档

### Commit 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)：

```
feat: 新增雷达图维度切换
fix: 修复 structured output 解析失败
docs: 完善 README 部署章节
refactor: 抽取 ScoreRing 动画
chore: 升级依赖
```

### 代码风格

- TypeScript 严格模式，禁止 `any`（必要时加注释说明）
- 组件文件用 `kebab-case`，组件名用 `PascalCase`
- Tailwind 工具类按 [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) 顺序
- 提交前确保：

  ```bash
  npm run check   # tsc 类型检查
  npm run build   # 构建通过
  ```

## 提 PR

1. 关联对应 issue（`Closes #123`）
2. 描述改动动机与方案
3. 涉及 UI 改动请附前后截图 / GIF
4. 涉及 prompt 改动请附**至少 3 组示例笔记**的输出对比

## 关于 AI 评价语气

本项目的核心价值之一是**客观中立、建设性**的评价语气，PR 修改 prompt 时请保持：

- 每条评价含「肯定 + 可改进项」
- 建议以「建议 / 可以尝试 / 不妨 / 考虑」开头
- 禁用词：差、糟糕、严重、必须、完全没有、手术、病
- 避免攻击性、毒舌、绝对化措辞

## 行为准则

请遵守 [Contributor Covenant](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct/)。互相尊重，对事不对人。

---

再次感谢你的贡献 ❤
