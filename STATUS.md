# STATUS · 状态板（三方唯一汇合点）

> 更新 2026-11-09 ｜ 现行修订 **R5** ｜ `CONTRACT_VERSION = 0.2.0`（**首次 wire 升版，已定稿**）
> 变更请走 `handoff/CHANGE-REQUEST.md`（C6）；本文件由统筹 Agent 维护。
> 中断接手请先读 `handoff/HANDOFF-LOG.md` 最后一节 → 本文件 → `contracts/README.md` → 对应包 `00-从这里开始.md`。

## 一、本迭代（R5）做了什么

| 项 | 状态 |
|---|---|
| 操作人裁定「**都按建议做，记得更新 v0**」+ 追加《其他关键设计点》3 条 | ✅ 全部采纳，并入本轮 `0.2.0`，不另升 `0.3.0` |
| `contracts/` 6 份重写为 `v0.2.0 / R5` | ✅ 单一事实源，三方只读 |
| 端点 **12 → 25**（18 玩家/通用 + 7 个 `/api/admin/*`） | ✅ `api-v0.md` 端点表 1–25 连续 |
| `I18N_KEYS` **28 → 61**，新增 `I18N_KEYS_ADMIN` **12** | ✅ `types.ts` / `i18n-keys.js` 逐字一致 |
| 枚举 **13 → 21 组**；DDL **13 → 21 表**（+8 表） | ✅ 含 `admin_action_log` |
| `StreamFrame` 新增 `scene` / `message` / `presence`；`CreateCharacterRequest` 收窄 `{ name, persona }` | ✅ 服务端权威数值 `origin` / `roll` / `money` / `inventory` / `favor_view` / `proxy_presence` |
| 共同演出：同场景 / 同 NPC 并发**不再 409**，改合流演出组 `SceneGroup` | ✅ `409` 收窄到 `world_rev` 乐观锁与真正互斥资源 |
| 在线 tick（`online_sessions > 0` 推进，无人 `paused=true`） | ✅ `local/server.mjs` 已实现并在回归中验证 |
| 玩家间交互 9 值 `InteractionKind`、审核扩展、`GET /api/sanctions` | ✅ AC-01…AC-11 已重写 |
| **大世界天道工作台**：管理端 7 端点 + 人工审核 / 全局事件 / 实体查看 / 站长命令 / 操作留痕 | ✅ `local/server.mjs`；前端为 **v0 批次 E**（`client/tiandao/`） |
| 天道口令本地化 | ✅ 只存 `local/tiandao.config.json`，已加入根 `.gitignore`；不进契约 / 任务卡 / 交付包 / 仓库；`admin_token` 内存态 |
| **[P6] 可扩展性** | ✅ `contracts/README.md` P6 + `ui-states.md` U18 |
| **[P7] 中断留痕** | ✅ `handoff/HANDOFF-LOG.md` 追加式日志，两个交付包各一份副本 |
| v0 任务包升级为 R5 正式版（批次 0/A/B/C/D/E） | ✅ 5 份文档重写 + `0.2.0-变更清单.md` + `其他关键设计点-对照.md` + `HANDOFF-LOG.md` |
| 本地回归 `tools/verify_local.py` | ✅ **58/58 PASS**（含 `/game/adapter/*` 10 个资源、`/tiandao/`、boot 注入） |
| 适配层接线审计 `tools/check_adapter.py` | ✅ **0 失败 0 提醒**（装载清单 / 文案 key / 枚举 / 命名空间 / 25 端点 / 管理端边界） |
| 无浏览器冒烟 `tools/smoke_adapter.mjs` | ✅ **26/26 PASS**（mock 链路、帧序、只读快照、错误文案） |
| 真实浏览器验收 `tools/e2e_browser.mjs`（Edge 157 + playwright-core，装于项目外） | ✅ **25/25 PASS**：开场页渲染/主菜单/0 破图；游戏页登录流→boot ready→9 模块→双桥→只读代理→mock 链路 tick=143→帧序；天道页 200+口令表单；0 JS 异常 |
| 契约 + 3109 原版基线 `tools/check_contract.py` | ✅ **PASS**（含 wire 一致性） |
| 上线闸门 | ⛔ **NOT CLEARED**（书面授权留档、内容清理、天道强口令前置等未完） |

## 二、WBS 状态

| # | 工作包 | 负责 | 状态 | 备注 |
|---|---|---|---|---|
| W1 | 契约冻结 **v0.2.0 / R5** | 统筹 | ✅ | **首次真正 wire 升版**；R1–R4 是项目约束修订，R5 改了端点/字段/帧/枚举/文案 key |
| W2 | 技术方案消化（885 段全文） | 统筹 | ✅ | `docs/技术方案-v0.1-全文.txt` |
| W3 | 上游资源拉取与盘点 | 统筹 | ✅ | 完整 3109 文件 / 906MB 原版仓库 |
| W4 | 前端适配层（7 JS）+ **批次 D 联机组件（6 组件 + 入口）** + **批次 E 天道工作台（8 文件）** | **v0ai → 统筹集成** | ✅ **已回收并集成 + 真浏览器 25/25**（v0 中断，成果经 `5555.zip` 交回） | `client/adapter/`、`client/adapter/ui/`、`client/tiandao/`；回执 `V0AI-DELIVERY.md`（ACCEPTED） |
| W5 | 繁琐机械代码（批次 1 三 JS + 批次 2 五文件） | **豆包** | ✅ **已交付并验收通过** | 8 文件 + 回执；`DOUBAO-ACCEPTANCE.md`；R5 生成物由统筹同步，无需返工 |
| W6–W11 | 服务端权威骨架 / 三层模型 / tick / 托管 / 治理 | 统筹 | ⬜ M1–M4 | 授权放行后移植；`local/server.mjs` 目前是 25 端点替身 |
| W12 | 合规清理与书面授权留档 | 统筹 + 操作人 | 🔄 进行中 | 用户已声明征得同意，**书面留档与内容清理待补** |
| W13 | 集成验收与契约一致性 | 统筹 | ✅ 工具就绪 | `check_contract.py`、`verify_local.py` 当前均 PASS |
| W14 | 本地可跑版本 | 统筹 | ✅ **R5 升级完成** | 25 端点 + 单人/合流 SSE + 在线 tick + 天道鉴权 + 完整原版托管，58/58 |
| W15 | 两个自包含交付包 | 统筹 | ✅ **R5 重写完成** | `to-v0ai` 32 文件 / ~0.9MB；`to-doubao` 15 文件 / ~264KB |
| W16 | 100% 原版基座 + 覆盖层 + 微调登记 | 统筹 | ✅ | `apply_tweaks.py` / `BASELINE.json` / `patches/` |
| W17 | **P6 可扩展 / P7 中断留痕 / 天道工作台** | 统筹 + v0ai | ✅ 契约与后端落地 / ⬜ 前端待 v0 批次 E | `docs/0.2.0-变更清单.md` §8 |
| W18 | 上线闸门 | 操作人 | ⛔ NOT CLEARED | `DEPLOY-GATE.md` 已新增 **B5 天道强口令前置** |

## 三、三方当前动作

| 角色 | 现在该做什么 | 交付物 |
|---|---|---|
| **操作人（用户）** | 把 `handoff/to-v0ai/` 或直接把 **仓库地址** 交给 v0（已公开，无需授权）；豆包包已无需投递 | — |
| **豆包** | ✅ 已完成，无需返工；R5 生成物由统筹同步 | `handoff/DOUBAO-DELIVERY.md` |
| **v0ai** | 批次 0 `probe.js` → 操作人回贴实测 → A/B/C → **D 联机组件** → **E 天道工作台**；**每批结束/中断前追加 `HANDOFF-LOG.md` 快照** | `handoff/V0AI-DELIVERY.md` |
| **统筹 Agent** | ✅ R5 契约/后端/校验/交付包/仓库已收口；下一步：回收 v0 成果、加 T3 注入并登记、四档视口与天道鉴权验收、更新本文件 | `client/adapter/**`、`client/tiandao/**`、`handoff/STATUS.md` |

## 四、关键约束广播

- **A5 顺序固定**：本地制作完毕 → 取得书面授权并留档 → `DEPLOY-GATE.md` 全绿并签字 → 才移植服务器并上传网站。
- **P3 100% 原版**：`char_card_1-main/` 只读一字不改；改动只在 `client/` 覆盖层并登记 `client/patches/`；当前仅 4 行微调。
- **P4 整夹投递**：两个包各自自包含，外部 agent 不得引用包外路径；根目录 `AGENTS.md` 是整夹入口。
- **C4 服务端权威**：客户端只读，请求体不含数值（`CreateCharacterRequest` 只有 `name` + `persona`），只有 `authoritative` 帧能改数值；`storageService` 只读代理 [U15]。
- **C6 升版**：R5 已把 `CONTRACT_VERSION` 升到 `0.2.0` 并广播三方；后续改字段仍需先提 `CHANGE-REQUEST.md`。
- **P6 可扩展**：新系统只加不改、按系统分目录、统一注册表可独立卸载、端点按命名空间分组、文案分表 [U18]。
- **P7 中断留痕**：任何 agent 每批结束或中断前必须在 `HANDOFF-LOG.md` 追加快照，只追加不改他人条目 [U19]。
- **天道口令**：只存本地 `local/tiandao.config.json`（已 gitignore）；**禁止**写进任何源码 / 文档 / 交付包 / 仓库；公网部署前必须换强口令 + 哈希 + HTTPS（闸门 B5）。
- **仓库边界**：`wzzwzzwzz17/hanhai-v0ai-handoff` 于 2026-11-09 按操作人指示由 `PRIVATE` 转为 **`PUBLIC`**；只含 v0 文本任务包（32 文件 / 约 0.9MB），不含 906MB 素材、不含站长口令、不含本地服务；公开后任何人均可读取，**不得再向其提交密钥、口令、玩家数据或未授权素材**。
- **桌面优先**：`1440×900` 主验收，兼容 `375px`；沿用原版响应式 CSS，不重做设计系统。

## 五、验证记录

| 日期 | 命令 | 结果 |
|---|---|---|
| 2026-11-09 | `python3 tools/apply_tweaks.py` | 4 行微调，基座 sha256 未变，LF 换行风格保持 |
| 2026-11-09（豆包验收） | `node --check` ×3 + IIFE 加载 + fixtures 字段扫描 + `check_contract.py` + `verify_local.py` | **全 PASS**：12/28/13（当时 `0.1.0`）、fixtures 无契约外字段、3109 基线一致；见 `DOUBAO-ACCEPTANCE.md`（历史验收原文保留） |
| 2026-11-09 | `gh repo view` | GitHub 仓库 `hanhai-v0ai-handoff` 创建：`PRIVATE` / `main`（后按操作人指示转 `PUBLIC`） |
| 2026-11-09（R4 同步） | `python tools/gh_api_push.py ...` | git HTTPS 被代理 502 阻断，改走 Git Data API 复刻提交；本地/远端 sha 一致 |
| 2026-11-09（R5） | `node --check local/server.mjs` + `generated/*.js` ×3 | **全 PASS** |
| 2026-11-09（R5） | `python tools/check_contract.py` | **PASS**：3109 文件基线一致 + 覆盖层白名单 + wire 一致性（`0.2.0` / 25 端点 / 61+12 key / 21 枚举组 / 21 表 / 包副本同步） |
| 2026-11-09（R5） | `python tools/verify_local.py` | **58/58 PASS**：覆盖层 / `?raw=1` / 中文路径素材 / Range / ETag / 404 / 穿越 / 25 端点 / 单人+合流 SSE / 409 收窄 / 创角随机 / 交互 / 处罚 / 天道鉴权 / 全局事件 / 在线 tick |
| 2026-11-09（R5 收口） | `python tools/gh_api_push.py --repo wzzwzzwzz17/hanhai-v0ai-handoff --repo-dir handoff/to-v0ai` | ✅ R5 全量首提交 **`41345ab0bc978c99dfc6dd7f9760ffb375242412`**；其后为日志 / 契约索引 / 变更清单 / 文件改名等同步提交，**最终 HEAD 以远端 `main` 为准**（本地 `git rev-parse HEAD` 与远端 ref sha 逐字一致） |
| 2026-11-09（R5 定稿） | 交付面整理 | ✅ `R4-需求增补-待裁定.md` → `R4-需求增补-历史对照.md`，引用同步 4 处；`gh repo view` 实测 `PUBLIC / main`（匿名 raw 可读 200），远端 tree **32 文件**，与本地清单 **32/32** 同名；远端 `types.ts=0.2.0/R5`、端点表 1–25 连续、`schema.sql` 21 表、`i18nAdmin` 12 key、批次 E 与 `HANDOFF-LOG.md` 均在位；口令 0 命中 |
| 2026-11-09 19:30 | v0 成果接收 + 集成（T3 注入启用） | ✅ 22 个 JS 落地并 `node --check` 全 PASS；`client/index.html` 注入 `adapter/boot.js?v=1`（总改动 6 行）；代码 CRLF→LF；`check_contract` PASS / `check_adapter` 0 失败 / `smoke_adapter` 26/26 / `verify_local` 58/58 |
| 2026-11-09 18:15 | `gh repo edit --visibility public` | ✅ `PRIVATE` → **`PUBLIC`**；`isPrivate=false`，匿名 `raw` 200；仓库仍 **32 文件**、无密钥/口令/玩家数据；`02-合规待办.md` 已改为「公开发布登记」，注明公开传播风险与「公开 ≠ 上线」（闸门仍 `NOT CLEARED`） |

## 六、风险与阻塞

| 项 | 状态 | 处理 |
|---|---|---|
| **书面授权留档 / 成人内容清理 / 年龄 ≥18 / 音乐美术权利 / 隐私政策** | ⛔ 未完成 | 阻塞 **公网部署与邀请测试**，不阻塞本地开发；见 `02-合规待办.md`、`DEPLOY-GATE.md` |
| **天道明文弱口令** | ⛔ 公网前置未完成 | 仅本机 `127.0.0.1` 可用；`DEPLOY-GATE.md` **B5** 已列为硬性放行项 |
| 906MB 素材投递体积 | ⚠️ 提示 | 发给 agent 时可排除 `img/ assets/ bgm/ music/ history_version/ apk/`；本机演示仍完整 |
| `client/adapter/` v0 侧 7 个 JS、`ui/` 9 个组件、`client/tiandao/` 7 个文件尚未落地 | ⬜ 正常 | `generated/` 3 个 JS 已到位；`boot.js` **目前不注入**，避免 404 |
| `AC-06…AC-11` 需真实 PostgreSQL / 后端骨架实跑 | ⬜ 待 M1 | 本地阶段用 `verify_local.py` 的等价断言验证，见 `tests/cases/acceptance.md` |
| 唯一外链 `rentry.org/how2playJXZ` | ℹ️ 已知 | 仅点击玩法说明时打开，不影响离线运行 |
| **R4 9 条 + R5 追加 3 条设计点** | ✅ **全部裁定采纳** | 已落入 `0.2.0`；`docs/关键设计点-R4-需求对照.md` 与 `docs/其他关键设计点-对照.md` 保留为历史/裁定依据；`CHANGE-REQUEST.md` 无遗留待评估项 |

## 七、交付包清单

| 包 | 文件数 | 体积 | 入口 |
|---|---|---|---|
| `handoff/to-v0ai/` | **32 文件**（任务卡 4 + R5 变更清单 3 + 6 契约 + 10 参考 + 3 个已验收 JS + `HANDOFF-LOG.md` + `README.md` / `AGENTS.md` / `.gitkeep` / 2 dotfile） | ~0.9MB | `00-从这里开始.md`；**已同步到 GitHub 公开仓库** |
| `handoff/to-doubao/` | **15 文件**（6 契约 + 文档 + R5 副本 + 回执） | ~264KB | `00-从这里开始.md`（已完成，无需再投递） |
| GitHub 公开仓库 `wzzwzzwzz17/hanhai-v0ai-handoff` | **`PUBLIC`** / `main` / R5 全量 / **32 文件** / 首提交 `41345ab0bc`，最终 HEAD = 远端 `main` | ~0.9MB | 仓库根 `README.md`；见 `发送说明.md` 方式 C |
| 根目录 | — | — | `AGENTS.md`（整夹入口） |
