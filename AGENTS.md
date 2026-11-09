# AGENTS · 本仓库入口（给 v0ai）

你是**前端适配层 + 联机组件 + 天道管理端 Agent**。本仓库是自包含任务包，读下面几份即可开工，不需要包外任何文件。

1. `00-从这里开始.md` —— **唯一入口**，先完整读完；
2. `01-任务清单.md` —— 批次 0 `probe.js` → 操作人回贴实测结果 → A/B/C → **D 联机组件** → **E 大世界天道工作台**；
3. `02-验收与回收.md` —— 交付格式、回收路径、15 项验收判据；
4. `0.2.0-变更清单.md` —— wire 升版权威全表（**字段以此为准**）；
5. `HANDOFF-LOG.md` —— **每批结束或中断前追加一行快照**（P7 / U19），新 agent 接手读最后一节。

现行契约 **`CONTRACT_VERSION = 0.2.0`（R5，已定稿）**：25 端点 / 61+12 文案 key / 21 组枚举 / 21 张表。
**没有「待裁定」「字段占位」**：组件与管理端字段逐字取 `contracts/types.ts`，不得发明契约外字段。

## 只允许写这些

```
client/adapter/config.js
client/adapter/transport.js
client/adapter/sse.js
client/adapter/action-bridge.js
client/adapter/snapshot-bridge.js
client/adapter/boot.js
client/adapter/probe.js
client/adapter/ui/**        （批次 D：9 个联机特有组件）
client/tiandao/**           （批次 E：7 个文件，独立管理端）
handoff/V0AI-DELIVERY.md    （回执）
HANDOFF-LOG.md              （只追加快照，不改他人条目）
```

以及给出一行玩家端注入指令（`<script src="adapter/boot.js?v=1"></script>`），由统筹加进 `client/index.html` 并登记。
**批次 E 的管理端是独立页面，不注入 `boot.js`、不复用玩家会话。**

## 一律不要改

- `contracts/**`（冻结契约）、`reference/**`（原版只读参考）、`client/adapter/generated/**`（已验收成果）；
- 原版 `index.html`、`module/`、`ui/`、任何 CSS 与二进制素材；`char_card_1-main/**` 一字不改；
- 不重写原作页面 / 组件 / 设计系统，不产整份玩家端 HTML / TypeScript / 构建配置；**允许新增** `client/adapter/ui/` 联机组件与 `client/tiandao/` 独立管理端页面。

## 已就绪

`HHAdapter.mock`（25 函数）、`i18n`（61 key）、`i18nAdmin`（12 key）、`enums`（21 组）已在 `client/adapter/generated/`；`mock` 模式可直接离线开发。

## 本轮已裁定的需求（全部采纳，无待办裁定）

- R4 9 条：随机出身/点数、服务端权威数值、在线 tick、挂机人设与 NPC 投影、**合流演出组（同场景/同 NPC 不再 409）**、玩家间交互、审核处罚与 UI、**新增联机组件层**、同步本仓库；
- R5 追加 3 条：**P6 可扩展性**（只加不改、按系统分目录、统一注册表、端点按命名空间分组）、**P7 中断留痕**（`HANDOFF-LOG.md`）、**大世界天道工作台**（批次 E）。
- `409 CONFLICT` 已收窄到 `world_rev` 乐观锁失效与真正互斥资源；`SceneGroup` 由 `moderator="global_ai"` 编排，带 `speaker` 的 `delta` 渲染共同演出字幕。

## 中断留痕（硬性）

每批交付结束、或**即将中断前**，在 `HANDOFF-LOG.md` 末尾追加一节快照：时间 / 角色 / 当前批次 / 已完成文件 / 未完成 / 校验命令与结果 / 下一步 / 备注。只追加，不改他人条目。

## 合规

私人仓库、仅供协作；不公开、不部署、不上传素材、不生成公开链接、不邀请外部测试。原作授权书面留档待补，上线闸门 `NOT CLEARED`。
**站长口令绝不写进源码、任务卡、回执、文档或仓库**；批次 E 只做「现场输入 → `POST /api/admin/login` → 内存态 `X-Admin-Token`」。
