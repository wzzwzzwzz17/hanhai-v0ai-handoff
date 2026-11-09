# hanhai-v0ai-handoff

《瀚海归义录》多人联机改造 · **给 v0ai 的自包含任务包**（GitHub 私人仓库，仅用于 agent 协作读取与回传代码）。

> 私人仓库 · 不公开 · 不部署 · 不生成公开链接
> `CONTRACT_VERSION = 0.1.0`　|　包版本 R3　|　整理 2026-11-09
> 仓库地址：https://github.com/wzzwzzwzz17/hanhai-v0ai-handoff

## 一、从哪开始

1. **`00-从这里开始.md` 是唯一入口**，先完整读它；
2. `01-任务清单.md` —— 批次 0 探针 → A/B/C 三批适配层 + **批次 D 联机组件层**（R4 新增）；
3. `02-验收与回收.md` —— 交付格式与 11 项验收判据；
4. 完成后把回执写到 **`handoff/V0AI-DELIVERY.md`**（该目录已建好）。

> 📌 **R4 前端边界已裁定（操作人 2026-11-09 17:10）**：沿用原版约 **90%** 的 UI，同时新增不少**联机版特有前端**，这是 v0 正式工作的一部分。
> 新增组件只落 `client/adapter/ui/**`，见 `01-任务清单.md` 批次 D 与 `R4-需求增补-待裁定.md` §3。
> ⚠️ `CONTRACT_VERSION` 仍为 `0.1.0`；契约升版与共同演出两点待裁定，**组件不得写死新字段名**，数据用适配函数占位。批次 0–C 继续按原计划执行。

## 二、目录说明

| 路径 | 内容 | 是否可改 |
|---|---|---|
| `00-从这里开始.md` / `01-任务清单.md` / `02-验收与回收.md` | 任务卡、清单、验收标准 | 只读 |
| `contracts/`（6 份） | 冻结契约全文：`types.ts`、`api-v0.md`、`schema.sql`、`events.md`、`ui-states.md`、`README.md` | **禁止修改**，单一事实源 |
| `reference/`（10 份） | 原版前端源码参考：完整 `index.html`、7 个核心 module、`index.html.diff`、`tweaks.css` | **只读参考** |
| `client/adapter/generated/`（3 个 JS） | 豆包已交付并验收的 `mock.js` / `i18n-keys.js` / `enums.js` | **只读依赖** |
| `client/adapter/*.js` | 批次 0–C 的 7 个原生 JS | ✅ 允许写入 |
| `client/adapter/ui/**` | 批次 D 联机特有组件（R4 已裁定） | ✅ 允许写入 |
| `handoff/` | 回执落盘目录 | 只写 `V0AI-DELIVERY.md` |
| `R4-需求增补-待裁定.md` | 9 条新需求与现状 / 冲突对照；前端边界已裁定 | **只读依据** |

## 三、已就绪的前置依赖

- `window.HHAdapter.mock`：12 个函数，对应 12 个端点，帧序 `delta → delta → authoritative → done`；
- `window.HHAdapter.i18n`：28 个 key，与 `contracts/types.ts# I18N_KEYS` 逐字一致；
- `window.HHAdapter.enums`：13 组枚举（含 `ApiErrorCode`）；
- **`mock` 传输模式已解锁**，不需要等后端；`local` 模式走同源 `/api`，`remote` 模式待授权闸门放行后启用；
- 三项均已通过统筹验收，结论见主项目的 `handoff/DOUBAO-ACCEPTANCE.md`（本仓库不重复收录）。

自验（仓库内即可运行）：

```bash
node --check client/adapter/generated/mock.js
node --check client/adapter/generated/i18n-keys.js
node --check client/adapter/generated/enums.js
```

## 四、路径边界（三方零重叠）

| 归你 | 归别人 / 禁止碰 |
|---|---|
| `client/adapter/config.js`、`transport.js`、`sse.js`、`action-bridge.js`、`snapshot-bridge.js`、`boot.js`、`probe.js`、**`client/adapter/ui/**`（批次 D）** | `client/adapter/generated/**`（豆包）、`client/adapter/tweaks.css` 与 `client/index.html`（统筹）、`contracts/**`、`reference/**`、原版基座 `char_card_1-main/**` |

形态要求：原生 JS、IIFE、零构建、零框架、零 CDN、无 TypeScript、无 `package.json`；沿用约 90% 原版 UI，不自造页面或设计系统；新增联机组件只在 `client/adapter/ui/`，满足 F9 / U14。

## 五、合规与授权边界

- 原作代码与素材版权归原作者所有；用户已声明征得同意用于本地改造，**书面授权留档待补**，上线闸门仍为 `NOT CLEARED`。
- 本仓库为**私人**仓库，仅供 v0ai 读取任务卡与提交适配层代码；**不得公开仓库、部署网站、生成公开链接、邀请外部测试或上传素材**。
- 本仓库只含文本任务卡、契约与参考源码（约 800KB），**不含** `img/ assets/ bgm/` 等原版二进制素材，也不含本地服务与后端实现。
- 变更契约请走 `handoff/CHANGE-REQUEST.md` 流程，不得私自加字段或兼容层。
