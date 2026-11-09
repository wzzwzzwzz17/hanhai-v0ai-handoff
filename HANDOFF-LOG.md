# 交接留痕日志（追加式 · 三方共用）

> **缘起**：《其他关键设计点》第 2 条「开发过程中，随时有某个 agent 可能中断，要注意留痕，保证其他新的 agent 可以快速接手」。
> **铁律**：任何 agent 在**每批交付结束、或即将中断前**，必须在本文末尾追加一行快照。
> 只追加，**不修改、不删除他人条目**。新 agent 接手时只需读本文件最后一节 + `handoff/STATUS.md` + 对应包的 `00-从这里开始.md`。

## 一条快照必须写清 6 件事

| 字段 | 内容 |
|---|---|
| 时间 / 角色 | 谁、什么时候 |
| 当前批次 | 正在做第几批、批次名 |
| 已完成 | 已落盘的**具体文件路径** |
| 未完成 | 还剩什么、卡在哪 |
| 校验结果 | 跑了哪些命令、PASS/FAIL、异常原文 |
| 下一步 | 接手人打开哪个文件、执行哪个动作 |

模板：

```
### YYYY-MM-DD HH:MM ｜ <角色> ｜ <批次>
- 已完成：<文件路径 1>、<文件路径 2>
- 未完成：<…>
- 校验：<命令> → <结果>
- 下一步：<接手人该做什么、先看哪个文件>
- 备注：<中断原因 / 上下文 / 约定>
```

## 快速接手路径（按顺序读）

1. 本文件**最后一节**（最新快照）；
2. `handoff/STATUS.md`（W1–W5 与风险表）；
3. `contracts/README.md`（当前 `CONTRACT_VERSION`，**0.2.0**）+ `docs/0.2.0-变更清单.md`；
4. 对应交付包：`handoff/to-v0ai/00-从这里开始.md` / `handoff/to-doubao/00-从这里开始.md`；
5. 收到整个项目时先读根 `AGENTS.md`。

## 快照

### 2026-11-09 17:30 ｜ 统筹 Agent ｜ R5 / `0.2.0` 定稿中
- 已完成：`docs/关键设计点-原文.txt`、`docs/关键设计点-R4-需求对照.md`、`docs/0.2.0-变更清单.md`、
  `docs/其他关键设计点-原文.txt`、`docs/其他关键设计点-对照.md`、`local/tiandao.config.json`（口令，已 gitignore）、
  `contracts/` 6 份升 `0.2.0`、两个交付包契约副本同步、`client/adapter/generated/` 三 JS 升版。
- 未完成：`local/server.mjs` 25 端点实现、`tools/check_contract.py` / `verify_local.py` 适配、
  用例 AC-01/06/07/08/09/10/11、v0 批次 E 与包内文档、提交并推送 GitHub 私人仓库。
- 校验：`python` 内部一致性 → `I18N_KEYS=61` / 端点表 18 行 / `types.ts=0.2.0` / DDL 20 表；
  待并入天道后应为 25 端点 / 21 枚举组 / 61+12 文案 key / 21 表。
- 下一步：接手人先看 `docs/0.2.0-变更清单.md` §8 与 `docs/其他关键设计点-对照.md`，
  再从 `contracts/api-v0.md` 端点总表继续；**不要重跑已完成的契约重写**。
- 备注：本轮由操作人「都按建议做，记得更新 v0」+ 新文件《其他关键设计点》触发；
  前端边界 R4-A 已裁定（沿用约 90% 原版 UI + 新增联机组件属 v0 工作）；
  `DEPLOY-GATE.md` 仍 `NOT CLEARED`，未部署 / 未公开 / 未上传素材。

### 2026-11-09 16:45 ｜ 豆包 ｜ 批次 1+2（已验收）
- 已完成：`client/adapter/generated/{mock,i18n-keys,enums}.js`、
  `server/db/migrations/{0002_seed_mvp,0003_indexes}.sql`、`tests/fixtures/{actions,events}.json`、
  `tests/cases/acceptance.md`、`handoff/DOUBAO-DELIVERY.md`。
- 未完成：无（本批已 ACCEPTED，见 `handoff/DOUBAO-ACCEPTANCE.md`）；`0.2.0` 升版由统筹同步生成文件。
- 校验：`node --check` ×3 PASS、IIFE 12 函数 / 28 key / 13 枚举组、`check_contract.py` PASS、`verify_local.py` 25/25。
- 下一步：无需接手；若契约再升版，由统筹更新 `generated/` 与用例，豆包只按新契约写机械代码。
- 备注：任务卡曾把 `I18N_KEYS` 误写 26，实际 28，已全项目勘误；责任在统筹，不在豆包。

### 2026-11-09 17:22 ｜ v0ai ｜ 批次 0（尚未投递）
- 已完成：无（用户尚未把 v0 包交给 v0）。
- 未完成：`client/adapter/probe.js` → 操作人回贴实测 → 批次 A/B/C → 批次 D 组件 → **批次 E 天道工作台**。
- 校验：无。
- 下一步：从 `handoff/to-v0ai/00-从这里开始.md` 起步；批次 D/E 字段以 `0.2.0` 为准，不再用占位。
- 备注：私人仓库 `wzzwzzwzz17/hanhai-v0ai-handoff`（PRIVATE / `main`）已就绪；
  git HTTPS 被代理 502 阻断时用 `tools/gh_api_push.py` 走 Git Data API 同步。
