# 前端视图状态契约 v0.1.0 · FROZEN ｜ 修订 R3

> **R2（2026-11-09）**：用户指令「**直接沿用 git 项目仓库里的前端改造，不要自己做前端**」，
> 整体作废「React + Vite 从零造 8 个页面」的设计，改为「上游前端为唯一 UI 基座 + 原生 JS 适配胶水」。
>
> **R3（2026-11-09）**：用户提供**完整仓库** `char_card_1-main/`（3109 文件 / 906MB，含全部图片 / BGM / 立绘 / 3D），
> 并声明已征得原作者同意，要求「**100% 使用原版素材 + 优化微调 + 整夹投递**」。
> 本修订把「文本副本」升级为「**完整原版只读基座 + 极小覆盖层**」，新增 F6–F8、U13；
> 本地服务 `local/server.mjs` 已按此跑通（25/25 回归）。
>
> **保留**：§3 主界面状态机、§4 四必显要素、§5 关键交互约束、§6 桌面/手机响应式验收（R1 成果），
> U1/U2/U4/U5/U8/U10 规则不变。
> **wire 零改动**：路由、`I18N_KEYS`、字段名、状态机名一律不变，`CONTRACT_VERSION` 仍为 `0.1.0`；
> `types.ts` / `api-v0.md` / `schema.sql` / `events.md` 无需修改。

## 0. UI 基座（R2 新增 / R3 升级，最高优先级）

| # | 规则 |
|---|---|
| **F1** | **完整原版仓库前端是唯一产品 UI**：`char_card_1-main/` 的 `index.html`(342KB)、`start-screen-noST.html`、10 个 HTML、`module/` 67 个 IIFE 模块、12 个 CSS、`ui/`、`scene3d/`，以及 **906MB 原版素材**（`img/` 468M、`assets/` 197M、`bgm/` 141M、`music/`、`scene3d/`）。**不重写、不迁移框架、不重做页面、不重画组件、不替换/压缩/转码任何素材。** |
| **F2** | 禁止引入 React / Vue / Vite / TS 编译 / CDN / UI 组件库 / `node_modules`。适配层与上游同形态：**原生 JS、IIFE、零构建、零外部依赖**。 |
| **F3** | `char_card_1-main/` **只读、一字不改**（`tools/BASELINE.json` 记录 3109 文件基线，逐次校验）。对上游的唯一改动体现在 `client/index.html` 这份覆盖副本上，且上限为 **4 行微调 + 1 行 boot 注入**，全部登记 `client/patches/`。 |
| **F4** | `client/` 是**极小覆盖层**，不是前端副本：只放 `index.html`(微调版)、`adapter/`(新增代码)、`patches/`(登记)、说明文件。运行时按 `client/<path> → char_card_1-main/<path> → 404` 回落，`?raw=1` 跳过覆盖层。**禁止把原版文件复制进 `client/`**；`client/src/`、`pages/`、`components/`、`styles/` 一律不存在。 |
| **F5** | 四要素**优先复用上游已有状态栏 DOM**；只有确实缺项才允许 `snapshot-bridge.js` 增补最小挂件，禁止另建整套 HUD。 |
| **F6** | **R3**：4 行微调由 `tools/apply_tweaks.py` 幂等生成，只含 T1（viewport 允许手机缩放）、T2（引入可一键移除的 `adapter/tweaks.css`）；删除该 link 或 `client/index.html` 即回到 100% 原版。任何新增微调必须登记并复跑脚本。 |
| **F7** | **R3**：本地服务必须能原样托管完整素材 —— 中文/空格路径解码、完整 mime、`Range`（mp3 拖动 / 16MB glb）、HTML/JS/CSS `no-store`、素材 ETag + 长缓存、缺失资源 **404 而非占位图**。`/game/*` 与 `/api/*` 同源，**无需跨域配置**。 |
| **F8** | **R3**：两个 agent 交付包各自**自包含整夹**（契约全文 + 原版参考源码 + 任务清单 + 回收清单），可整个文件夹直接发送；根目录 `AGENTS.md` 是收到整个项目时的统一入口。外部 agent 不得引用包外路径。 |

## 1. 硬约束（适配层必须遵守）

| # | 规则 |
|---|---|
| U1 | **客户端永远是只读视图**。数值来自服务端，收到 `authoritative` 帧后覆盖本地；冲突时以服务端为准。 |
| U2 | 界面**始终可见四要素**：世界时间、体力、行动点、角色状态（在线/托管）。缺一不可 [12.2]。复用上游状态栏 [F5]。 |
| U3 | **电脑版为主，手机版兼容**：主设计稿按桌面 `1440×900`；`<768px` 手机必须能完整走完一次行动链路；**不另做独立移动版**，也**不重做响应式**——上游已有 `mobile-density-overrides.css` / `secondary-pages-responsive.css`，保留并按需补。断点与降级见 §6，违反即返工。 |
| U4 | 长任务断线重连：一次叙事可能数十秒，按 `action_id` 重连续读，刷新页面不丢结果。 |
| U5 | 离线态可视化：托管角色旁标注「闭关中」等明确标识，避免误以为自己还在行动。 |
| U6 | **保留上游全部表现层**：小游戏 iframe、表情差分、BGM、主题切换、3D 场景；结算结果回传服务端校验。不得替换为新组件。 |
| U7 | 新增文案走 `I18N_KEYS`（`types.ts`），不硬编码中文；中文文案表由豆包按 `handoff/to-doubao/` 生成。**上游原有中文硬编码属既有资产，不改动、不迁移**。 |
| U8 | 启动时先 `GET /api/health` 校验 `contract_version`，不符显示 `error.contract_mismatch` 并拒绝装载适配层（**不改上游 UI 渲染**）。 |
| U9 | 零外部依赖、离线可用：不引 CDN，系统字体栈沿用上游；上游已有的本地第三方库（`markdown-it.min.js`、`jsonrepair.min.js`）保留。 |
| U10 | **transport 三态可切**：`mock`（豆包静态假数据）/ `local`（同源 `/api`，本机 `local/server.mjs`）/ `remote`（同源 `/api`，服务器）。开关由 `client/adapter/config.js` 按 `window.__HH_CONFIG__` → `?hh_api=` → `localStorage.__HH_CONFIG__` → 默认 `local` 读取；**禁止把域名 / IP 硬编码进适配层**。本地阶段只用 `mock` / `local`；移植服务器时只改配置不改代码 [R1 保留，R3 更新为同源]。 |
| **U11** | **R2 新增**：适配层不得直接修改 `module/*.js` 的源码。改变行为只能通过**覆盖全局对象方法**（`window.apiService` / `window.storageService` 等）实现，且必须保存原引用以便回滚。 |
| **U12** | **R2 新增**：注入脚本必须在上游 60 个 script **全部加载完之后**执行；`boot.js` 首步探测全局对象是否存在，缺失则报错而不是自己造一份。 |
| **U13** | **R3 新增**：适配层与回归脚本必须能在「覆盖层生效」与「`?raw=1` 100% 原版」两种状态下分别验证；覆盖层缺失或微调丢失视为集成失败。素材请求落在 `/game/*` 同源路径，中文文件名按 `decodeURIComponent` 处理，不得改写素材 URL。 |

## 2. 页面清单（R3：完整原版真实页面，共 11 个 HTML，非虚构路由）

> 下表是**上游仓库里真实存在的 HTML 文件**，不是待开发的路由。适配层的职责是让这些页面接上服务端，**不新增页面**。

| 上游文件 | 作用 | 主要接口 | MVP 注入 |
|---|---|---|---|
| `start-screen-noST.html` | 独立前端开局页（上游启动入口） | `POST /api/session` | P2 待评估 |
| `start-screen.html` | 开局页（另一版本） | `POST /api/session` | ⬜ 不注入 |
| `index.html` | **主界面**：状态栏、叙事区、行动输入、NPC、地图 | `GET /api/character`、`POST /api/actions`、`GET /api/stream/:id` | ✅ P1 |
| `world_map.html` | 世界地图 / 下山地点 | `GET /api/world` | ⬜ MVP 不做 |
| `turn-based-battle.html` / `turn-based-battle-new.html` | 回合战斗 | 结算回传服务端校验 [U6] | ⬜ MVP 不做 |
| `alchemy.html` / `farm.html` / `blackjack.html` | 炼丹 / 灵田 / 赌场小游戏 | 结算回传服务端校验 [U6] | ⬜ MVP 不做 |
| `index - SR.html` | SillyTavern 版主界面 | — | ⬜ 不在联机版范围 |
| `ui/config-modal.js` | API 配置弹窗 | 自带 Key 输入（**明示 Key 风险**） | 由适配层接管读取，**不改源码** |
| `module/inventory-panel.js` / `equipment-panel.js` / `dialog-panel.js` | 背包 / 装备 / 对话面板 | 快照字段映射 | 复用 |

**联机新增能力以「最小挂件 + 弹窗」形式增补，不新建路由**（由 `snapshot-bridge.js` / `transport.js` 提供数据与回调）：

| 能力 | 承载方式 | 接口 |
|---|---|---|
| 离线纪要（三句总览 + 折叠明细 + 软否认） | 上游现有弹窗体系内增补 | `GET /api/recap`、`POST /api/recap/deny` |
| 行为章程表单 | 复用 `ui/config-modal.js` 的弹窗样式 | `POST /api/proxy/persona` |
| 旁观 / 申诉 | 复用现有弹窗 | `GET /api/recap`、`POST /api/appeal` |

> **不做**：同场景实时互见、多人同屏 3D、独立移动站 / 移动专属路由 / App 壳；**也不再做** M2–M4 期另起的新页面。
> **不做**：把上游页面改写成组件、把上游 CSS 换成新设计系统。

## 3. 主界面状态机（R1 保留，适配层实现）

```
BOOT ──GET /api/health──> READY
READY ──提交行动──> PENDING(排队序号+预计tick)
PENDING ──GET /actions/:id = settled──> STREAMING
STREAMING ──delta*──> STREAMING
STREAMING ──authoritative──> 覆盖四要素数值（仍 STREAMING）
STREAMING ──done──> IDLE（刷新可选行动）
PENDING/STREAMING ──error | 断线──> RECONNECT（按 action_id 重连）
RECONNECT ──410 STREAM_EXPIRED──> 离线纪要弹窗
IDLE ──离线──> OFFLINE
OFFLINE ──回归──> 离线纪要弹窗
任意 ──state=spectator──> 旁观弹窗
```

| 状态 | 输入区 | 叙事区 | 提示 |
|---|---|---|---|
| `BOOT` | 禁用 | 骨架屏（上游原样式） | 校验契约版本 |
| `READY` / `IDLE` | 启用 | 上次叙事保留 | 四要素可见 |
| `PENDING` | 禁用 | 等待态 | 「排队第 N 位，预计 tick X」 |
| `STREAMING` | 禁用 | 逐段追加 | 「结算中…」，可中断不影响服务端 |
| `RECONNECT` | 禁用 | 保留已收文本 | 「连接中断，正在续读」 |
| `OFFLINE` | 禁用 | — | 头像标注「闭关中」[U5] |

> **R2**：状态机由 `adapter/sse.js` + `action-bridge.js` 维护；上游 `pipeline.runTurn()` 的流式生命周期与之对齐，
> 通过既有 `callbacks` 协议回吐 `delta`，不修改上游 `pipeline.js`。

## 4. 四必显要素（常驻，不随滚动消失）

| 要素 | 字段 | 来源 |
|---|---|---|
| 世界时间 | `tick / year / week / season` | `WorldSlice` |
| 体力 | `stamina` | `CharacterView`，**只在 `authoritative` 帧更新** |
| 行动点 | `action_points` | 同上 |
| 角色状态 | `state` | 同上；`online / proxy / spectator / offline` |

> **R2**：上游已有状态栏 DOM（时间 / 体力 / 行动点 / 属性），`snapshot-bridge.js` 把 `authoritative` 快照映射到这些
> **既有元素**即可；角色状态 `proxy / spectator` 为联机新增，允许补一个最小色点 + 文案 key 挂件。
> 手机允许压缩成单行 sticky 条，但四个数值**不得折叠、不得移入需点击才可见的抽屉** [U2]。

## 5. 关键交互约束（R1 保留）

- **自由输入**：只发 `text` + `context`（地点、在场 NPC、world_rev），**不发任何数值** [C4]。
  适配层从上游 `messages` / 当前 DOM 抽取 `text`，禁止把上游 `gameData` 里的数值塞进请求体。
- `UNMAPPABLE_INTENT` 422 → 提示换一种说法，**不消耗回合**。
- `CONFLICT` 409 → 「有人抢先了」，重新 `GET /api/world`。
- `RATE_LIMITED` 429 → 显示 `cooldown_sec` 倒计时。
- 离线纪要**不得一次性倾倒**：`overview` 三句恒显，`proxy_log` 折叠，`has_more` 时按 `cursor` 展开 [12.3]。
- 软否认按钮挂在 `proxy_log[].soft_deniable === true` 的条目上，调 `POST /api/recap/deny`，**只改叙事不改数值**。
- 旁观模式**不踢出玩家**：可读墓志铭、传闻，可创建新角色 [12.4]。
- `authoritative` 到达后，本地存档写入（IndexedDB）改为与服务端同步，**禁止本地数值覆盖权威快照** [U11]。

## 6. 布局与响应式规范（R1 保留，作用于上游现有 CSS）

### 6.1 断点与主次关系

| 档 | 视口宽度 | 定位 | 布局 |
|---|---|---|---|
| **桌面宽屏** | `>= 1280px` | **主设计稿** | 沿用上游三栏/多面板布局；内容最大宽 `1440px` 居中 |
| **桌面标准** | `1024–1279px` | 完整体验 | 沿用上游折叠规则；四要素仍在顶栏 |
| **平板** | `768–1023px` | 兼容 | 上游单栏；世界/角色走侧抽屉，四要素仍在顶栏 |
| **手机** | `< 768px` | 兼容（能完整游玩） | 沿用 `mobile-density-overrides.css`；顶栏 sticky 单行四要素 |

> 以 `1440×900` 桌面为第一验收目标；**禁止用手机稿放大成桌面**，也**禁止推翻上游视觉语言**（古风武侠、既有配色与字号体系）。

### 6.2 手机兼容硬要求（逐条验收）

| # | 要求 |
|---|---|
| M1 | `375px` 宽度下**零横向溢出**；补 CSS 时只用 `min()` / `clamp()` / 百分比 / Grid `minmax(0,1fr)`。 |
| M2 | 所有可点元素 ≥ `44×44px`，间距 ≥ `8px`；`hover` **不得作为唯一交互入口**。 |
| M3 | 输入控件字号 ≥ `16px`（防 iOS 自动缩放）；正文 ≥ `14px`；叙事区行高 ≥ `1.7`。 |
| M4 | 虚拟键盘：输入区用 `dvh` 而非 `vh`；表单聚焦时自动滚动到可视区。 |
| M5 | 安全区：底部操作条 `padding-bottom: env(safe-area-inset-bottom)`；横屏**仅提示**。 |
| M6 | 长文本：桌面叙事区独立滚动 + 分页；手机按段折叠「展开全文」；一次游玩 10–20 分钟可完成。 |
| M7 | 行为章程表单：桌面多列，**手机改分步向导**，每步 ≤ 4 个字段，进度可回退。 |
| M8 | 四要素在手机压缩为 sticky 单行：`时间 · 体力 · 行动点 · 状态`；状态用色点 + 文案 key。 |

### 6.3 桌面体验硬要求

| # | 要求 |
|---|---|
| D1 | 一屏内同时可见：四要素、当前地点、在场 NPC、可选行动、叙事区、自由输入框；**不靠滚动才能提交行动**。 |
| D2 | 叙事区为主要视觉重心（占比 ≥ 50%），沿用上游长时间阅读排版。 |
| D3 | 键盘可用：`Enter` 提交、`Esc` 关抽屉、焦点环可见。 |
| D4 | 宽屏不把内容拉成超长行：叙事文本 `max-width: 72ch`。 |

> **R2 落地方式**：M1–M8 / D1–D4 尽量由上游现有 CSS 满足；确需补齐时，在 `client/adapter/` 内以**注入 `<style>` 的小段覆盖规则**实现，
> 并把规则清单写进交付回执，**不要直接编辑 `module/game-styles-*.css`**。

## 7. 交付格式（v0ai → 统筹，R3 改写为整夹投递）

**投递方式**：整个 `handoff/to-v0ai/` 文件夹一次发送（约 800KB，自包含：契约全文 + 原版参考源码 + 任务卡 + 清单 + 回收说明）。
早期「7 条 ≤4KB 短消息、逐轮粘贴」的做法已作废。根目录 `AGENTS.md` 是收到整个项目时的统一入口。

产出**只有 7 个原生 JS 文件 + 1 份注入指令**，落在 `client/adapter/`：
`probe.js`、`config.js`、`transport.js`、`sse.js`、`action-bridge.js`、`snapshot-bridge.js`、`boot.js`。
详见 `04-前端沿用方案.md` §4、`handoff/to-v0ai/00-从这里开始.md` 与 `01-任务清单.md`。

`handoff/V0AI-DELIVERY.md` 固定五段：
1. 文件清单（实际路径 + 每个文件的 `window.HHAdapter.*` 挂载名）；
2. **覆盖了原版哪些全局方法**（原引用如何保存、如何回滚）——必填；
3. 用到的契约字段逐项列出（便于核对有无越界字段）；
4. 未实现项与原因；`mock` / `local` / `remote` 三态分别怎么切；
5. `1440 / 1024 / 768 / 375px` 四档自测结果，逐条对照 M1–M8 / D1–D4；**以及 `python3 tools/check_contract.py` 的原版基线核对结果**。

**不要交付**：整份 `index.html`、任何原版 `module/*.js` 的改写版、React 组件、CSS 设计系统、页面截图占位实现、任何素材文件。
