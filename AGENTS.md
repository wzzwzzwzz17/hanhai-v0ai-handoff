# AGENTS · 本仓库入口（给 v0ai）

你是**前端适配层 Agent**。本仓库是自包含任务包，读下面三份即可开工，不需要包外任何文件。

1. `00-从这里开始.md` —— **唯一入口**，先完整读完；
2. `01-任务清单.md` —— 批次 0 `probe.js` → 操作人回贴实测结果 → A/B/C 三批；
3. `02-验收与回收.md` —— 交付格式、回收路径、验收判据。

## 只允许写这些

```
client/adapter/config.js
client/adapter/transport.js
client/adapter/sse.js
client/adapter/action-bridge.js
client/adapter/snapshot-bridge.js
client/adapter/boot.js
client/adapter/probe.js
client/adapter/ui/**       （R4 联机特有组件，已裁定）
handoff/V0AI-DELIVERY.md   （回执）
```

以及给出一行注入指令（`<script src="adapter/boot.js?v=1"></script>`），由统筹加进 `client/index.html` 并登记。

## 一律不要改

- `contracts/**`（冻结契约）、`reference/**`（原版只读参考）、`client/adapter/generated/**`（豆包成果，已验收）；
- 原版 `index.html`、`module/`、`ui/`、任何 CSS 与二进制素材；
- 不重写原作页面 / 组件 / 设计系统，不产整份 HTML / TypeScript / 构建配置；**允许新增联机特有组件**（`client/adapter/ui/`）。

## 已就绪

`window.HHAdapter.mock`（12 函数）、`i18n`（28 key）、`enums`（13 组）已在 `client/adapter/generated/`；`mock` 模式可直接用于离线开发。

## 需求预告

**前端边界已裁定**：沿用约 90% 原版 UI，`client/adapter/ui/**` 联机特有组件属于你的正式工作，见 `01-任务清单.md` 批次 D。
`R4-需求增补-待裁定.md` 记录 9 条新需求；**契约仍是 `0.1.0`**，`0.2.0` 定稿前组件不得写死新字段名，数据用适配函数占位。批次 0–C 继续按原计划执行。

## 合规

私人仓库、仅供协作；不公开、不部署、不上传素材、不生成公开链接、不邀请外部测试。原作授权书面留档待补，上线闸门 `NOT CLEARED`。
