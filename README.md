# hanhai-v0ai-handoff

《瀚海归义录》多人联机改造 · **给 v0ai 的自包含任务包**（GitHub 公开仓库，用于 agent 协作读取与回传代码）。

> 公开仓库（2026-11-09 由操作人决定转公开）· 仅含**文本**任务包 · 不部署 · 不生成可玩链接
> `CONTRACT_VERSION = 0.2.0`　|　修订 **R5**（wire 首次升版，已定稿）　|　包版本 **R5**　|　整理 2026-11-09
> 仓库地址：https://github.com/wzzwzzwzz17/hanhai-v0ai-handoff

## 一、从哪开始

1. **`00-从这里开始.md` 是唯一入口**，先完整读它；
2. `01-任务清单.md` —— 批次 0 探针 → A/B/C 适配层 → **批次 D 联机组件层** → **批次 E 大世界天道工作台**；
3. `02-验收与回收.md` —— 交付格式与 15 项验收判据；
4. `0.2.0-变更清单.md` —— 本轮 wire 升版的权威说明（端点 / 字段 / 帧 / 枚举 / 文案 key 全表）；
5. `HANDOFF-LOG.md` —— **每批结束或中断前追加一行快照**（P7 / U19）；新 agent 接手先读最后一节；
6. 完成后把回执写到 **`handoff/V0AI-DELIVERY.md`**（该目录已建好）。

> ✅ **R4 的 9 条 + R5 追加的 3 条设计点已全部由操作人裁定采纳**，并已落入 `0.2.0` 契约。
> 本包内**不再有任何「待裁定 / 字段占位 / 不得写死字段名」的旧禁令**：字段逐字取 `contracts/types.ts`（`0.2.0`）。
> `R4-需求增补-历史对照.md` 仅作历史对照保留，其裁定结论见文首「R5 裁定后记」与 `0.2.0-变更清单.md`。

## 二、目录说明

| 路径 | 内容 | 是否可改 |
|---|---|---|
| `00-从这里开始.md` / `01-任务清单.md` / `02-验收与回收.md` | 任务卡、六批清单、验收标准 | 只读 |
| `contracts/`（6 份） | **冻结契约全文 v0.2.0**：`types.ts`、`api-v0.md`、`schema.sql`、`events.md`、`ui-states.md`、`README.md` | **禁止修改**，单一事实源 |
| `0.2.0-变更清单.md` | R5 wire 升版全表 + §8《其他关键设计点》 | 只读依据 |
| `其他关键设计点-对照.md` | 可扩展性 / 中断留痕 / 天道工作台三条的裁定与验收 | 只读依据 |
| `R4-需求增补-历史对照.md` | 9 条设计点的历史对照（文首已标 R5 全部采纳） | 只读依据 |
| `reference/`（10 份） | 原版前端源码参考：完整 `index.html`、7 个核心 module、`index.html.diff`、`tweaks.css` | **只读参考** |
| `client/adapter/generated/`（3 个 JS） | 已验收的 `mock.js` / `i18n-keys.js` / `enums.js`（R5 已同步） | **只读依赖** |
| `client/adapter/*.js` | 批次 0–C 的 7 个原生 JS | ✅ 允许写入 |
| `client/adapter/ui/**` | **批次 D** 联机特有组件（9 个，R4-A 已裁定） | ✅ 允许写入 |
| `client/tiandao/**` | **批次 E** 大世界天道独立管理端（7 个文件，R5 新增） | ✅ 允许写入 |
| `handoff/` | 回执落盘目录 | 只写 `V0AI-DELIVERY.md` |
| `HANDOFF-LOG.md` | 追加式交接日志 | ✅ **每批必须追加**（只追加，不改他人条目） |

## 三、已就绪的前置依赖（R5 / `0.2.0`）

- `window.HHAdapter.mock`：**25 个函数**，对应 `contracts/api-v0.md` 的 25 个端点（1–18 玩家/通用 + 19–25 管理端）；
  单人帧 `delta* → authoritative → done`，合流帧 `scene → delta(speaker)* → authoritative → done`；
- `window.HHAdapter.i18n`：**61 个 key**，与 `types.ts# I18N_KEYS` 逐字一致；
- `window.HHAdapter.i18nAdmin`：**12 个 key**，与 `types.ts# I18N_KEYS_ADMIN` 逐字一致（批次 E 专用）；
- `window.HHAdapter.enums`：**21 组枚举**（含 `ApiErrorCode`、`InteractionKind`、`AdminCommand`、`ReviewDecision`）；
- `storageService` 需覆盖为**只读代理** [U15]，不得把权威数值写回 IndexedDB；
- **`mock` 传输模式已解锁**，不需要等后端；`local` 走同源 `/api`（本地服务已跑通 45/45），`remote` 待授权闸门放行；
- 三项生成物已通过统筹验收，结论见主项目 `handoff/DOUBAO-ACCEPTANCE.md`（本仓库不重复收录）。

自验（仓库内即可运行）：

```bash
node --check client/adapter/generated/mock.js
node --check client/adapter/generated/i18n-keys.js
node --check client/adapter/generated/enums.js
```

## 四、路径边界（三方零重叠）

| 归你 | 归别人 / 禁止碰 |
|---|---|
| `client/adapter/config.js`、`transport.js`、`sse.js`、`action-bridge.js`、`snapshot-bridge.js`、`boot.js`、`probe.js`、**`client/adapter/ui/**`（批次 D）**、**`client/tiandao/**`（批次 E）**、`handoff/V0AI-DELIVERY.md`、`HANDOFF-LOG.md`（追加） | `client/adapter/generated/**`（豆包）、`client/adapter/tweaks.css` 与 `client/index.html`（统筹）、`contracts/**`、`reference/**`、原版基座 `char_card_1-main/**` |

形态要求：原生 JS、IIFE、零构建、零框架、零 CDN、无 TypeScript、无 `package.json`；**玩家端**沿用约 90% 原版 UI，不自造页面或设计系统，新增联机组件只在 `client/adapter/ui/`（F9 / U14 / U16 / U18）；**管理端** `client/tiandao/` 允许独立 HTML 页面（F10 / U17），但不注入 `boot.js`、不复用玩家会话。

## 五、合规与授权边界

- 原作代码与素材版权归原作者所有；用户已声明征得同意用于本地改造，**书面授权留档待补**，上线闸门仍为 `NOT CLEARED`。
- 本仓库为**私人**仓库，仅供 v0ai 读取任务卡与提交适配层代码；**不得公开仓库、部署网站、生成公开链接、邀请外部测试或上传素材**。
- 本仓库只含文本任务卡、契约与参考源码（约 0.9MB），**不含** `img/ assets/ bgm/` 等原版二进制素材，也不含本地服务与后端实现。
- **站长口令绝不写入本仓库**：批次 E 只实现登录表单，口令由操作人现场输入，`admin_token` 只存内存变量。
- 变更契约请走 `handoff/CHANGE-REQUEST.md` 流程（C6：改字段必须升版并广播三方），不得私自加字段或兼容层。
