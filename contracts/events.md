# 事件 / 意图 / 裁决 / tick 契约 v0.2.0 · FROZEN ｜ 修订 R5

> 依据技术方案 `3.5`、`4.2–4.4`、`6.1–6.8`、`附录 D`，以及操作人 2026-11-09 的 9 条《关键设计点》。
> 后端实现与豆包写用例以此为准；v0ai 只需理解「提交 → 等 tick → 收流」三段与 `scene` 帧，不必读实现细节。
>
> **0.2.0 关键裁定**：同场景 / 同 NPC 的并发行动**合并为合流演出组**（不再互相 409）；
> `CONFLICT` 收窄到 `world_rev` 乐观锁与真正互斥资源；在线会话 > 0 时大世界时间持续推进。
> 变更全表见 `docs/0.2.0-变更清单.md`。

## 1. 三层模型（地基，不可混淆）

| 层 | 内容 | 范围 | 可变性 | 存储表 |
|---|---|---|---|---|
| 世界真相 | 生死、位置、归属、资源、门派状态、金钱 / 背包 | 全局一份 | **只能由结算写入** | `event` + `world` + `npc` + `inventory` + `currency_ledger` |
| NPC 认知 | 对某玩家的好感、信任、标签、记忆卡 | 每对 `NPC × 玩家` 一份 | 由结算与叙事回调写入 | `npc_player_rel` / `npc_memory` |
| 玩家叙事 | 玩家读到的文本与摘要 | 每玩家一份 | 生成即固定，可重生成 | `player_narrative` |

**关联方式**：叙事引用事件 → NPC 记忆引用事件 → 事件改变世界真相。
**翻车方式**：把三层混成一份共享聊天记录，导致 NPC 把甲做过的事说成乙做的。
**0.2.0 特别约束**：合流演出组是**编排层**，不合并三层数据。两个玩家同场时仍各读各的 `PlayerNarrative`、
各用各的 `(npc_id, player_id)` 记忆卡，NPC 对两人各说各的话（伪交流），绝不共享记忆。

## 2. 事件溯源

世界状态**不做就地修改**，保存只追加的事件流，再投影出当前状态。四个收益：可回放、可审计、可撤销（追加「修正事件」而非改历史）、可叙事（江湖大事记素材）。

```jsonc
// WorldEvent —— 字段逐字对齐 types.ts#WorldEvent
{
  "event_id": "ev_0000129",
  "tick": 129,
  "kind": "visit",
  "subject": "char_abc",
  "object": "shi_yan_nian",
  "location_id": "tianshan_library",
  "fact_level": "hard",        // hard|soft
  "visibility": "location",    // public|faction|location|private
  "payload": {},
  "summary": "某弟子赴藏经阁请教施延年",
  "narrative_ref": "nar_..."
}
```

- 写入只经结算器，单线程、串行。
- `fact_level=hard` 全局同步（生死、归属）；`soft` 按传播路径扩散（恩怨、传闻），措辞随路径变化 [12.5]。
- 误判修正：追加 `kind="correction"` 事件，不改历史行。
- **0.2.0 新增 kind**：`origin_roll`（随机出身/点数）、`ambient`（在线空 tick 的世界事件）、
  `joint_scene`（合流演出组形成/结束）、`interaction`（玩家间交互）、`audit_hit`（审核命中）、`correction`。

## 3. 意图 Intent（受控词表）

自然语言**先映射**为受控行动，无法映射直接返回 `UNMAPPABLE_INTENT`，**不进入模型**。

```jsonc
{ "type": "visit", "target": "施延年", "location": "藏经阁", "raw_text": "我去藏经阁找施延年请教" }
```

`type` 只能取 `types.ts#IntentType` 的 **14** 个值：
`visit | move | train | study | rest | work | trade | talk | spar | bounty | explore | skip_week | minigame | allocate_points`

> 意图**不含任何数值**。数值由规则层在结算阶段产生 [C4]。
> `allocate_points` 也只提交文本（例「把点数加到武艺」），由结算器从 `OriginRoll.point_pool` 扣减。
> **玩家间交互不走这里**：赠予 / 交易 / 切磋 / 留言 / 聊天 / 观战 / 评价走 `InteractionKind` + `POST /api/interactions`。

## 4. tick 与结算顺序（0.2.0 重写）

```
在线会话 > 0 ──(每 TICK_INTERVAL_SEC=30s)──> 推进 tick + 生成 ambient 模板事件（不调模型）
                                              │
玩家提交 → 校验(会话/配额/速率) → 意图解析 → 入 action_queue
        → 按「合流组 / 互斥域」分组 → 串行结算
        → 规则层算数值 → 裁决层判越界 → 写 event → 投影世界(含 money/inventory)
        → 逐人叙事(只注入「他能感知的切片」) → 流式下发 + 权威快照
```

| 规则 | 值 |
|---|---|
| 规模 | 20 人以内，**单进程 + 内存锁**足够，不引入分布式锁/消息队列 |
| 队列 | `action_queue` 一张表即是队列 |
| 并发 | 单线程结算器，Node 进程 + 内存锁 |
| **在线推进（0.2.0）** | `world.online_sessions > 0` → 每 `tick_interval_sec`（生产 **30** 秒）推进一次 tick；会话归零 → `paused=true` 并停止定时器。`WorldSlice.online_players` / `next_tick_in_sec` 只读下发 |
| **空 tick 预算** | 每个空 tick 最多 **1 条** `kind=ambient` 模板事件（季节/门派/传闻），**不调用任何模型**；有玩家行动时照常走结算器，不额外生成 ambient |
| **合流演出组（0.2.0）** | 同 tick、同 `location_id` 或同 `npc_id` 的多个玩家行动**合并为一个 `SceneGroup`**，而不是排队互相拒绝。全局 AI 作 `moderator` 编排配角与轮流顺序，逐个玩家模型注入「他能感知的切片」，`delta` 必带 `speaker` |
| **互斥域（收窄后）** | `domain_key` 只用于**真正互斥资源**：`item:<id>`（唯一物品归属）、`bounty:<id>`（唯一名额）。同 NPC / 同地点**不再是冲突域** |
| **409 语义（收窄后）** | 仅两种：`ActionContext.world_rev` 落后于服务端（乐观锁）；唯一资源已被转移/占用。前端对应 `error.conflict_mutex` |
| 无交互 tick | **不调用模型** [10.3 省钱手段]；只写模板 ambient 事件 |
| 在线/离线 | 托管意图与玩家意图进同一队列，走同一结算器，不享有优先权 |
| 权威写入 | 只有结算器写 `authoritative`；`scene` / `message` / `presence` 帧**只改展示** |

### 4.1 合流演出（伪交流）的完整规则

1. **成组**：同一 tick 内，把 `location_id` 相同、或 `present_npc_ids` 有交集的待结算行动归为一组；
   `participant_ids.length >= 2` 时创建 `SceneGroup{status:"forming"}` 并写入 `scene_group` 表。
2. **编排**：`moderator="global_ai"` 只做三件事——决定谁先开口、给每个玩家模型注入各自的感知切片、
   把 NPC 的回应拆成带 `speaker` 的多段 `delta`。**不写任何数值、不改世界真相**。
3. **下发**：先 `scene` 帧，随后每人收到带 `speaker` 的 `delta`（`Speaker.kind = npc|player|proxy|narrator`）；
   `authoritative` / `done` 带同一个 `group_id`；`status` 在 `done` 后置为 `closed`。
4. **隔离**：NPC 对甲说的话只进甲的 `player_narrative`；记忆卡仍按 `(npc_id, player_id)` 写入，
   不因同场而合并。共同演出**不改变** AC-02「记忆串味率 0」。
5. **不做**：3D 同屏、位置广播、全场玩家坐标。第一版只做**合流演出字幕 + 在场名单**（`GET /api/scene`）。
6. **审核**：合流 `delta` 与交互文本一样过 §6 裁决；命中规则写 `audit` 记录，不得跳过。

### 4.2 大世界天道 · 全局事件与人工审核（0.2.0《其他关键设计点》第 3 条）

- **发布全局事件**：站长在 `POST /api/admin/world-events` 手写 `WorldEventDraft`，
  结算器追加一条 `kind=world_decree` 的 `event`（`fact_level` / `visibility` 由站长选），
  `world_rev` 递增并进 `WorldSlice.bulletin`。**只写事件，不改任何角色数值**；
  需要改数值时走 `POST /api/admin/commands`，仍由同一结算器执行。
- **人工审核队列**：§6 命中且 `review_stage=manual` 的条目进 `GET /api/admin/reviews`；
  站长在工作台裁定 `approve | reject | reclassify | sanction`，
  结果写回 `audit.review_stage=closed`，`sanction` 时由服务端生成 `Sanction`。
  **`hard` 仍必须双模型一致且 `confidence >= 0.9` 才能自动执行，MVP 一律人工**。
- **留痕**：所有管理端写操作追加 `admin_action_log`（actor / action / command / target_id / result / tick），
  可回放审计；`admin_token` 内存态、不落库，失败登录也记一条 `login_failed`。
- **隔离**：管理端 `GET /api/admin/entities?type=npc` 返回的印象按 `(npc_id, player_id)` 逐对分列，
  不得把甲的印象当成乙的（AC-11）。

## 5. 失败与补偿

| 场景 | 处理 |
|---|---|
| 模型超时/失败 | 行动保留在队列，下个 tick 重试；不写事实、不扣回合 |
| 叙事流中断 | 按 `action_id` 重连 `/api/stream/:id`；过期 410 → `/api/recap` |
| 结算中途崩溃 | 事件流可回放重算，投影幂等 |
| 误判处决 | 追加修正事件 + 人工复核 + 救济额度 |
| **合流组某玩家掉线（0.2.0）** | 该玩家转 `proxy` 档由章程代答；组内其余人继续，不整组回滚 |
| **在线推进定时器漂移（0.2.0）** | 用 `world.last_tick_at` 补算漏掉的 tick，最多补 3 个，避免长时间挂机后世界跳变 |

## 6. 裁决输出（附录 D，逐字对齐；0.2.0 强化覆盖面）

```json
{
  "verdict": "ok | soft | hard",
  "rule_hits": ["teleport", "power_claim"],
  "evidence": "引用原文片段",
  "confidence": 0.0,
  "suggested_action": "none | warn | debuff | execute",
  "rationale": "一句话理由"
}
```

**硬约束**：`verdict === "hard"` 时 `confidence >= 0.9`，且需**两个独立模型一致**，方可自动执行。
MVP 处决**全人工**，不做自动判定 [11.2]；`Sanction.review_stage` 一律 `manual`。

三层判定（8.2）：规则命中（关键词/结构）→ 语义判定（小模型）→ 人工复核。
叙事生成阶段即使被注入，**只能改变文本，不能改变事实** [9.5]。

**0.2.0 强化（需求 7）**：审核对象从「行动文本」扩展到
① `ActionSubmitRequest.text`；② `InteractionRequest.text`（赠予/交易/聊天/留言）；
③ 合流演出组里每个 `delta`（含 NPC 代答）；④ `allocate_points` 的自然语言。
命中一律写 `audit` 表，`review_stage` 递进；生成 `Sanction` 时前端用 `ui/verdict.js`
展示违规提示 / 处罚详情 / 申诉进度，数据来自 `GET /api/sanctions`。
**审核结果只由服务端写入**，客户端不得自行判定或隐藏处罚。
站长裁定流程见 §4.2（工作台入口 `GET /api/admin/reviews`）；`GET /api/admin/reviews` 只暴露 `audit` 表里 `review_stage=manual` 的条目，
不把模型内部推理或玩家隐私切片直接透出。

## 7. 托管意图的边界

- 托管由 `ProxyPersona`（附录 C）驱动，只提交白名单内的 `IntentType`。
- `forbidden_actions` 列出的动作永不由托管代行。
- 回归复盘「软否认」：玩家否认托管行为，**仅影响叙事，不影响数值**。
- 托管收益按档位系数折算，不得优于在线玩家（公平约束 7.5）。
- **0.2.0**：离线角色按 `npc_proxy` 表投影为公共 NPC，可被他人遇见（`idle=true` 时基本闲置）；
  由玩家自带 Key 的 LLM 低频驱动，**Key 仍只内存透传、不落库**。被遇见的记录进 `Recap.proxy_encounters`。

## 8. 世界感（低成本，给文案/前端）

| 手段 | 来源 |
|---|---|
| 世界公告 | 每日一条，从 event 流挑选，史书笔法 → `WorldSlice.bulletin` |
| 传闻系统 | 重大行为按 soft 事实传播，措辞随路径变化 |
| 时间痕迹 | 久未登录时 NPC 说「好久不见」，而非原地等待；**0.2.0 在线时世界持续推进** |
| 不可逆事件 | 真正死亡、门派变故、季节更替 |
| 合流演出 | 同场玩家各自看到带说话人的字幕，NPC 可同时与两人交流（伪交流） |

## 9. 验收断言（豆包写用例时照此生成）

**AC-01（0.2.0 重写 · 共同演出，取代原「同 tick 争同一 NPC → 409」）**
两名玩家同 tick、同 `location_id`、同 `npc_id` 各提交一条行动：
- 两条都返回 **202**（不得出现 409），`ActionAccepted.group_id` 相同；
- `scene_group` 表生成 1 条 `moderator="global_ai"`、`participant_ids` 长度 2 的记录；
- 两人的 SSE 均以 `scene` 帧开头，随后每个 `delta` 都带 `speaker`，NPC 分别对两人说话；
- `authoritative` 只有一份世界真相：两人各自的 `CharacterView` 数值互不串写；
- 记忆卡仍按 `(npc_id, player_id)` 隔离，AC-02 串味率仍为 0；
- 全局 AI 不产生任何数值写入，所有数值来自唯一结算器。

**AC-02**　连续 100 回合，NPC 未把甲的恩情算到乙头上（记忆串味率 0）。〔不变〕
**AC-03**　玩家改前端缓存或伪造请求（含伪造 `money` / `inventory` / `talent` / `origin` / `age`）→ 无法改变自身属性。〔0.2.0 扩展〕
**AC-04**　托管角色离线 7 天回归 → 纪要完整、`proxy_encounters` 可见、无越权行为。〔0.2.0 扩展〕
**AC-05**　处决一名角色后，其事迹仍能被其他玩家叙事提及（江湖记忆）。〔不变〕
**AC-06（0.2.0 新增 · 409 收窄）**　两个玩家先后赠予同一件 `bound=true` 唯一物品 → 第一个 202，
第二个 **`CONFLICT` 409**（`error.conflict_mutex`）；同场景普通行动绝不返回 409。
**AC-07（0.2.0 新增 · 在线推进）**　建立一个会话后静置 3 个 tick 间隔：
`world.tick` 递增、`kind=ambient` 事件出现、`paused=false`、未调用任何模型；
会话失效后 `paused=true` 且 tick 不再推进。
**AC-08（0.2.0 新增 · 创角随机）**　`POST /api/character` 只带 `{name, persona}`，
响应里 `origin` / `roll.point_pool` / `roll.allocation` 由服务端生成；
请求体里夹带 `talent` / `money` / `age` 时数值被忽略且记审计日志。
**AC-09（R5 · 天道鉴权）**　无口令 / 错口令访问任一 `/api/admin/*` → `401 UNAUTHORIZED`；
正确口令返回内存态 `admin_token`（不写 `state.json`），玩家会话令牌不能越权访问管理端。
**AC-10（R5 · 全局事件）**　站长发布一条 `fact_level=hard` 的 `world_decree`：
`event` 流新增一条、`world_rev` 递增、玩家端 `GET /api/world` 可见、任何角色数值不变；
操作在 `admin_action_log` 留痕。
**AC-11（R5 · 印象隔离）**　`GET /api/admin/entities?type=npc` 返回的 `impressions`
按 `(npc_id, player_id)` 分列；同一 NPC 对甲乙两人的好感/信任不得合并或串写。
