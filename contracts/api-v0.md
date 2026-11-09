# HTTP API 契约 v0.2.0 · FROZEN ｜ 修订 R5

> 依据技术方案 `附录 B`，并做必要补全（标 `[补充]`）。
> 所有类型见 `types.ts`；所有响应统一 `ApiEnvelope<T>`；错误码见 `types.ts#ApiErrorCode`。
> **只认本文件的路径与字段。v0ai 对接、豆包写 mock、后端实现，三方以此为准。**
>
> **0.2.0 是不兼容升版**（操作人 2026-11-09 17:22 裁定「都按建议做」）：
> `POST /api/character` 请求体收窄、端点 12 → **25**（含 7 个管理端 `/api/admin/*`）、响应新增服务端权威只读字段、
> `StreamFrame` 新增 `scene` / `message` / `presence` 帧、`CONFLICT` 409 语义收窄。
> 变更全表见 `docs/0.2.0-变更清单.md`。**不允许前端/后端写 0.1.0 兼容层**。

## 0. 通用约定

| 项 | 规定 |
|---|---|
| Base | `/api` |
| 编码 | `application/json; charset=utf-8`；SSE 为 `text/event-stream` |
| 鉴权 | 所有**写接口**必须带 `X-Session-Id` + `X-Session-Sig`（`/api/session` 返回）。**禁止仅凭前端参数确定身份**。 |
| 版本 | 所有响应带 `contract_version: "0.2.0"`；客户端启动时比对 `CONTRACT_VERSION`，不一致拒绝渲染并提示升级 [C5]。 |
| 权威数值 | 任何请求体都**不得**包含数值字段（体力/好感/属性/金钱/物品数量/点数/时间/tick/world_rev 除 `ActionContext.world_rev` 乐观锁外）。服务端忽略并记审计日志 [C4]。 |
| 会话 | 一次叙事可能数十秒，客户端按 `action_id` 轮询/重连拉取，刷新页面不丢结果 [3.6]。 |
| 限流 | 429 时响应含 `Quota.cooldown_sec`；预算告急走降级（缩短叙事），不停服 [10.3]。 |
| 时间推进 | **0.2.0**：在线会话数 > 0 时按 `tick_interval_sec`（生产 30s）推进 tick；无人在线 `paused=true` 停止。见 `events.md` §4。 |
| **管理端鉴权** | **0.2.0**：`/api/admin/*` 全部需要 `X-Admin-Token`（`POST /api/admin/login` 用口令换取，内存态、不落库、有 TTL）；玩家会话**不可越权**访问管理端。口令只存本地配置，**不写进契约 / 交付包 / 仓库**。所有管理端写操作追加 `admin_action_log` 留痕。 |

## 1. 接口总表

| # | 方法 | 路径 | 说明 | 版本 |
|---|---|---|---|---|
| 1 | POST | `/api/session` | 建立会话，校验账号与配额 | 0.1.0 |
| 2 | GET | `/api/world` | 获取世界公开切片与时间 | 0.1.0（+3 字段） |
| 3 | POST | `/api/actions` 🔒 | 提交意图，返回排队序号 | 0.1.0（+`group_id`） |
| 4 | GET | `/api/actions/:id` | 查询结算状态 | 0.1.0（+`group_id`） |
| 5 | GET | `/api/stream/:id` | 流式接收叙事文本（SSE） | 0.1.0（+3 帧类型） |
| 6 | GET | `/api/character` | 获取自身角色只读视图 | 0.1.0（+6 字段） |
| 7 | GET | `/api/recap` | 获取离线纪要 | 0.1.0（+`proxy_encounters`） |
| 8 | POST | `/api/proxy/persona` 🔒 | 保存行为章程 | 0.1.0 |
| 9 | POST | `/api/appeal` 🔒 | 提交申诉 | 0.1.0 |
| 10 | POST | `/api/character` 🔒 | 创建角色（**0.2.0 请求体收窄**） | 0.2.0 |
| 11 | POST | `/api/recap/deny` 🔒 | 对托管纪要条目做「软否认」 | 0.1.0 |
| 12 | GET | `/api/health` | 健康检查 + 契约版本，供前端启动时校验 | 0.1.0 |
| **13** | GET | `/api/scene` | 场景切片：在场玩家 / 离线投影 NPC / 当前合流组 / 最近消息 | **0.2.0** |
| **14** | POST | `/api/interactions` 🔒 | 玩家间交互统一入口（赠予/交易/切磋/留言/聊天/观战/评价/接受/拒绝） | **0.2.0** |
| **15** | GET | `/api/interactions` | 交互与消息分页（`?cursor=`） | **0.2.0** |
| **16** | GET | `/api/sanctions` | 处罚详情与申诉进度（`?cursor=`） | **0.2.0** |
| **17** | POST | `/api/character/reroll` 🔒 | 申请重掷随机出身/点数；**不接受任何数值** | **0.2.0** |
| **18** | GET | `/api/stream/scene` | 场景 SSE：`scene` / `message` / `presence` 帧 | **0.2.0** |
| **19** | POST | `/api/admin/login` | 站长口令登录，签发内存态 `admin_token` | **0.2.0 管理端** |
| **20** | GET | `/api/admin/overview` | 全局总览：在线 / tick / 待审数 / 最近事件 | **0.2.0 管理端** |
| **21** | GET | `/api/admin/reviews` | 全局 AI 提交的人工审核队列 | **0.2.0 管理端** |
| **22** | POST | `/api/admin/reviews/:id` 🔒 | 裁定：通过 / 驳回 / 改判 / 生成处罚 | **0.2.0 管理端** |
| **23** | POST | `/api/admin/world-events` 🔒 | 发布全局世界事件（写只追加 `event` 流） | **0.2.0 管理端** |
| **24** | GET | `/api/admin/entities` | 查看角色 / NPC 的状态、数值、背包、金钱、印象 | **0.2.0 管理端** |
| **25** | POST | `/api/admin/commands` 🔒 | 站长命令（封禁 / 配额 / 暂停 / 强制 tick / 补偿等） | **0.2.0 管理端** |

🔒 = 写接口，必须带会话签名；`/api/admin/*` 的 🔒 改为必须带 `X-Admin-Token`。

---

## 2. 逐接口明细

### 1) `POST /api/session`
**Body** `SessionRequest`
```json
{ "handle": "玩家名", "api_key": "sk-...", "device_fp": "..." }
```
**200** `ApiEnvelope<SessionResponse>`
```json
{
  "contract_version": "0.2.0", "ok": true,
  "data": {
    "session_id": "s_...", "session_sig": "sig_...", "player_id": "uuid",
    "quota": { "turns_left": 10, "degraded": false, "cooldown_sec": 0 }
  },
  "world_rev": 128
}
```
**约束**：`api_key` 玩家自带 DeepSeek Key，**只在内存透传，禁止明文落库**；界面必须明示风险 [2.6]。
建立会话会把 `online_players` +1，从而**启动大世界 tick 推进**；会话失效后 -1，归零则 `paused=true`。
**错误**：`UNAUTHORIZED` / `FORBIDDEN`（封禁或死亡次数达阈值）/ `RATE_LIMITED`。

### 2) `GET /api/world`
**200** `ApiEnvelope<WorldSlice>` — 见 `types.ts`。
**0.2.0 新增只读字段**：`online_players`、`tick_interval_sec`、`next_tick_in_sec`；`paused` 语义改为「无人在线」。
首次进入时 `chronicle` 返回简版大事记，用于建立「世界不是为我临时生成」的信任感 [12.1]。

### 3) `POST /api/actions` 🔒写
**Headers** `X-Session-Id`, `X-Session-Sig`
**Body** `ActionSubmitRequest`
```json
{
  "text": "我去藏经阁找施延年请教",
  "context": { "location_id": "tianshan_library", "present_npc_ids": ["shi_yan_nian"], "world_rev": 128 }
}
```
**202** `ApiEnvelope<ActionAccepted>`
```json
{
  "contract_version": "0.2.0", "ok": true,
  "data": { "action_id": "a_...", "queue_no": 3, "scheduled_tick": 129, "status": "pending", "group_id": "g_..." }
}
```
`group_id` 仅在该行动被并入**合流演出组**时出现。

**流程**（3.5 时序，前端只需知道 3 步）：
1. 提交 → 服务端校验会话/配额/速率，记录原始输入；
2. 意图解析器把自然语言映射为**受控行动**（`IntentType` 14 值，见 `types.ts`）；无法映射返回 `UNMAPPABLE_INTENT` (422)，**不进入模型**；
   `allocate_points` 也只提交文本（例「把点数加到武艺」），数值由结算器算；
3. 行动入队等下一个 tick；**同场景/同 NPC 的并发行动合并为合流演出组**（不再互相 409）；
   结算后通过 `/api/actions/:id` 查状态、`/api/stream/:id` 收文本。

**错误**：`UNMAPPABLE_INTENT` 422 / `CONFLICT` 409（**仅** `world_rev` 乐观锁失效或真正互斥资源已被占用）/ `RATE_LIMITED` 429 / `FORBIDDEN` 403。

### 4) `GET /api/actions/:id`
**200** `ApiEnvelope<ActionStatusView>`
`status=settled` 时 `authoritative` 必带，客户端**用其覆盖本地缓存**，冲突时以服务端为准 [3.6]。

### 5) `GET /api/stream/:id` — SSE
每帧 `data: <JSON>\n\n`，帧类型为 `StreamFrame`（`types.ts`）：

| kind | 载荷 | 前端动作 |
|---|---|---|
| `scene` | `{ group }` | **0.2.0**：合流开始，切换共同演出字幕布局，显示参与者 |
| `delta` | `{ text, speaker?, group_id? }` | 追加到叙事区；`speaker` 存在时显示说话人名 |
| `message` | `{ message }` | **0.2.0**：玩家间聊天/留言，追加到交互面板 |
| `presence` | `{ presence }` | **0.2.0**：在场玩家/托管投影变化，刷新玩家列表 |
| `authoritative` | `{ snapshot, world_rev, group_id? }` | **立即覆盖**四必显数值、金钱/背包/好感 |
| `done` | `{ action_id, event_ids, group_id? }` | 关闭流，刷新可选行动列表 |
| `error` | `{ code, message }` | 展示错误态，停止渲染 |

断线重连：重新请求同一 `:id` 即可续读；已过期返回 `STREAM_EXPIRED` 410，改走 `/api/recap` [补充]。
> **v0ai 注意**：`delta` / `scene` / `message` / `presence` **只影响展示**，只有 `authoritative` 帧能改数值。不要在前端本地累加任何数字。
> **单人行动不发 `scene` 帧**，帧序仍为 `delta* → authoritative → done`。

### 6) `GET /api/character`
**200** `ApiEnvelope<CharacterView>` — 全部字段 `readonly@client`。
**0.2.0 新增**：`origin`、`roll`、`money`、`inventory`、`favor_view`、`proxy_presence?`。
`state=spectator` 时前端切旁观模式：墓志铭、江湖传闻、创建新角色入口 [12.4]。

### 7) `GET /api/recap`
**Query** `?cursor=<string>`（分页展开，`has_more=true` 时继续）
**200** `ApiEnvelope<Recap>` — 顺序固定为：世界变了什么 → 你做了什么 → 谁在等你 → 角色现状 [12.3]。
**0.2.0 新增** `proxy_encounters`（离线角色作为公共 NPC 被他人遇见的记录）。
`overview` 恒为三句总览，前端不得一次性铺开全部 `proxy_log`。

### 8) `POST /api/proxy/persona` 🔒写
**Body** `ProxyPersona`（附录 C 全字段，见 `types.ts`）
**200** `ApiEnvelope<{ saved: true }>`
MVP 只启用 `tier ∈ { still, daily }`；传 `active` 返回 `BAD_REQUEST` [11.2]。

### 9) `POST /api/appeal` 🔒写
**Body** `AppealRequest` → **200** `ApiEnvelope<Sanction>`
MVP 处决全人工，申诉进人工复核台 [11.2]。进度通过 `GET /api/sanctions` 查询。

### 10) `POST /api/character` 🔒写 — **0.2.0 请求体收窄**
**Body** `CreateCharacterRequest`
```json
{
  "name": "燕归尘",
  "persona": { "traits": ["沉静", "守诺"], "speech_style": "简短", "tier": "daily", "...": "..." }
}
```
**201** `ApiEnvelope<CharacterView>`

- **`origin` / `talent` / `age` / 任何数值一律不接受**：请求体出现时服务端忽略并记审计日志 [C4]；
- 出身与点数由**服务端随机生成**，写入 `character.origin` / `character.roll`，并补一条 `kind="origin_roll"` 事件；
- `age` 由服务端固定为 >= 18（合规要求 2.3）；
- `persona` 同时注册挂机档位与禁行事项；离线时按 `proxy_presence` 投影为公共 NPC；
- 响应返回完整 `CharacterView`（含 `money` / `inventory` 等只读字段）。

### 11) `POST /api/recap/deny` 🔒写
**Body** `{ event_id: string }` → **200** `ApiEnvelope<{ accepted: true }>`
软否认**只改玩家叙事，不改任何数值** [术语表 / 7.6]。

### 12) `GET /api/health`
**200** `{ "contract_version": "0.2.0", "status": "ok", "world_tick": 128, "online_players": 1 }`
前端启动第一请求，版本不符即 `error.contract_mismatch`。

### 13) `GET /api/scene` — **0.2.0**
**Query** `?cursor=<string>`（消息分页）
**200** `ApiEnvelope<SceneSlice>`
```json
{
  "contract_version": "0.2.0", "ok": true,
  "data": {
    "location_id": "tianshan_library", "tick": 129, "world_rev": 129,
    "players": [{ "character_id": "c_1", "name": "燕归尘", "state": "online",
                  "location_id": "tianshan_library", "is_proxy_npc": false }],
    "npc_proxies": [],
    "group": { "group_id": "g_...", "tick": 129, "location_id": "tianshan_library",
               "npc_id": "shi_yan_nian", "participant_ids": ["c_1", "c_2"],
               "status": "playing", "moderator": "global_ai" },
    "messages": [], "has_more": false
  }, "world_rev": 129
}
```
**只返回该玩家可感知的切片**；不做位置广播、不返回全场玩家坐标。

### 14) `POST /api/interactions` 🔒写 — **0.2.0**
**Body** `InteractionRequest`
```json
{ "kind": "gift", "text": "把这卷旧籍赠予同门", "target_character_id": "c_2", "item_id": "it_book_01" }
```
**202** `ApiEnvelope<InteractionAccepted>`
```json
{ "contract_version": "0.2.0", "ok": true,
  "data": { "interaction_id": "ix_...", "status": "pending", "scheduled_tick": 130 }, "world_rev": 129 }
```
- `kind` 只能取 `InteractionKind` 9 值；`text` 是自然语言，**不含数值**；
- `item_id` 是字符串引用；**唯一物品（`bound=true`）已被转移时返回 `CONFLICT` 409**，这是 409 收窄后保留的真正互斥资源；
- 交互文本与合流演出文本**一律过审核**（需求 7）；命中规则写 `audit` 记录，可能生成 `Sanction`；
- 聊天/留言写入 `event` 流，并通过 `GET /api/stream/scene` 的 `message` 帧实时下发；
- 交易/切磋邀请用 `kind=accept|decline` + 原 `interaction_id` 写在 `text` 里响应，不新增端点。

**错误**：`BAD_REQUEST` 400 / `UNMAPPABLE_INTENT` 422 / `CONFLICT` 409 / `FORBIDDEN` 403 / `RATE_LIMITED` 429。

### 15) `GET /api/interactions` — **0.2.0**
**Query** `?cursor=<string>` → **200** `ApiEnvelope<InteractionList>`。
默认返回最近 20 条，`has_more=true` 时按 `cursor` 继续。

### 16) `GET /api/sanctions` — **0.2.0**
**Query** `?cursor=<string>` → **200** `ApiEnvelope<SanctionList>`。
`Sanction` 含 `issued_tick` / `review_stage` / `verdict_ref`；申诉进度看 `status` 与 `appeal`。
前端用 `ui/verdict.js` 展示违规提示、处罚详情与申诉进度。

### 17) `POST /api/character/reroll` 🔒写 — **0.2.0**
**Body**：无（或 `{}`）。**不接受任何数值/出身/点数**。
**200** `ApiEnvelope<RerollResponse>`；若已用过重掷返回 `FORBIDDEN` 403。
是否允许重掷、随机结果如何生成，**全部由服务端决定**。

### 18) `GET /api/stream/scene` — SSE — **0.2.0**
持续连接，逐帧下发 `StreamFrame` 的 `scene` / `message` / `presence` 三类帧；
`id:` 递增，支持 `Last-Event-ID` 续读。
**不下发 `authoritative`**：数值仍只由 `/api/stream/:id` 的权威帧更新。
前端 `ui/joint-scene.js`、`ui/players.js`、`ui/interaction.js` 复用这一条连接。

---

### 19) `POST /api/admin/login` — **0.2.0 管理端**
**Body** `AdminLoginRequest`：`{ "password": "<操作人现场输入>" }`
**200** `ApiEnvelope<AdminLoginResponse>`：`{ "admin_token": "adm_...", "expires_in_sec": 3600 }`
**错误**：口令错误 → `401 UNAUTHORIZED`；连续失败记入 `admin_action_log` 并限流。
> ⚠️ 口令**只存本地 `local/tiandao.config.json`**（已 gitignore），不写进任何契约、任务卡、交付包或仓库；
> `admin_token` 是内存态，不落库、不写 `state.json`。公网部署前必须升级为强口令 + 服务端哈希 + HTTPS。

### 20) `GET /api/admin/overview` 🔒管理端
**Headers** `X-Admin-Token` → **200** `ApiEnvelope<AdminOverview>`。
返回 `tick` / `paused` / `online_players` / `character_count` / `npc_count` / `pending_reviews` / `event_count` / `recent_events`。

### 21) `GET /api/admin/reviews` 🔒管理端
**Query** `?status=pending&cursor=<string>` → **200** `ApiEnvelope<ReviewList>`。
数据来源 `audit.review_stage=manual`；`excerpt` 是被判文本片段，`verdict` 是 `VerdictOutput` 全文。

### 22) `POST /api/admin/reviews/:id` 🔒管理端
**Body** `ReviewDecisionRequest`
```json
{ "decision": "approve", "note": "核验原文，无越界" }
```
**200** `ApiEnvelope<ReviewDecisionResult>`。`decision=sanction` 时由**服务端**生成 `Sanction`，
客户端只给等级枚举，**不提交任何数值**。裁定结果写回 `audit.review_stage=closed` 并留痕。

### 23) `POST /api/admin/world-events` 🔒管理端
**Body** `WorldEventDraft`
```json
{ "summary": "瀚海商道骤起风沙，各处驿路暂闭三日", "fact_level": "hard", "visibility": "public" }
```
**201** `ApiEnvelope<WorldEventPublished>`。服务端追加一条 `event`（`kind=world_decree`），
`world_rev` 递增，玩家端 `GET /api/world` 与 `GET /api/recap` 可见；**不改任何角色数值**。

### 24) `GET /api/admin/entities` 🔒管理端
**Query** `?type=character|npc&id=<可选>&cursor=<string>` → **200** `ApiEnvelope<AdminEntityList>`。
- `type=character`：状态 / `stats` / `money` / `inventory` / `favor_view` / `persona`；
- `type=npc`：状态 / 位置 / `impressions`（**按 `(npc_id, player_id)` 逐对隔离**，不得合并）。
> 管理端只读全量；玩家端 `GET /api/scene` 仍只返回「该玩家可感知的切片」，两者不得混用。

### 25) `POST /api/admin/commands` 🔒管理端
**Body** `AdminCommandRequest`
```json
{ "command": "pause_world", "note": "临时维护" }
```
`command` 只能取 `AdminCommand` 9 值；**200** `ApiEnvelope<AdminCommandResult>`。
所有命令追加 `admin_action_log`（操作者 / 时间 / 命令 / 目标 / 结果），可回放审计。

---

## 3. 错误码与 HTTP 状态

| code | HTTP | 前端处理 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 回登录 |
| `FORBIDDEN` | 403 | 展示封禁/只读原因，禁用输入 |
| `BAD_REQUEST` | 400 | 表单校验提示 |
| `UNMAPPABLE_INTENT` | 422 | 「换一种说法」，不消耗回合 |
| `RATE_LIMITED` | 429 | 显示 `cooldown_sec` 倒计时 |
| `NOT_FOUND` | 404 | 通用空态 |
| `CONFLICT` | 409 | **0.2.0 收窄**：`error.conflict_mutex`「这件东西已被人取走」，重新拉 `/api/world`；**同场景/同 NPC 不再返回 409** |
| `STREAM_EXPIRED` | 410 | 跳 `/api/recap` |
| `INTERNAL` | 500 | 通用错误态 + 会话 ID 便于排查 |

## 4. Mock 约定（豆包）

> **R2**：前端沿用上游原生 JS，适配层零构建、不做 TS 编译。本节的**接口与字段形状不变**，仅 mock 的落盘形态改为原生 JS。
> **0.2.0**：端点 12 → **25**（含 7 个管理端），函数数同步；玩家端 `I18N_KEYS` 28 → **61**、管理端 `I18N_KEYS_ADMIN` **12**；枚举 13 → **21** 组。

- `client/adapter/generated/mock.js` 必须提供与上述 **25 个端点**一一对应的函数，返回 `ApiEnvelope<T>` 完整结构；以 IIFE 挂 `window.HHAdapter.mock`，不用 `import` / `export` / TS 语法。
- 所有 mock 数据的字段名从 `types.ts` 逐字照抄；不得出现契约外字段。
- `world_rev` 用固定值 `128`，`tick` 用 `128`，便于快照测试。
- 必须模拟单人 `delta → delta → delta → authoritative → done` 帧顺序，**并单独提供合流组帧序** `scene → delta(speaker) → delta(speaker) → authoritative → done`，供适配层状态机验收。
- `contract_version` 全部为 `"0.2.0"`；`getHealth()` 返回裸对象，版本同为 `"0.2.0"`。
- 管理端 7 个 mock 函数只返回静态假数据，**绝不包含任何真实口令**；`adminLogin()` 固定返回一个假 token。
