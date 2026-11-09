# HTTP API 契约 v0.1.0 · FROZEN

> 依据技术方案 `附录 B`，并做必要补全（标 `[补充]`）。
> 所有类型见 `types.ts`；所有响应统一 `ApiEnvelope<T>`；错误码见 `types.ts#ApiErrorCode`。
> **只认本文件的路径与字段。v0ai 对接、豆包写 mock、后端实现，三方以此为准。**

## 0. 通用约定

| 项 | 规定 |
|---|---|
| Base | `/api` |
| 编码 | `application/json; charset=utf-8`；SSE 为 `text/event-stream` |
| 鉴权 | 所有**写接口**必须带 `X-Session-Id` + `X-Session-Sig`（`/api/session` 返回）。**禁止仅凭前端参数确定身份**。 |
| 版本 | 所有响应带 `contract_version: "0.1.0"`；客户端启动时比对 `CONTRACT_VERSION`，不一致拒绝渲染并提示升级 [C5]。 |
| 权威数值 | 任何请求体都**不得**包含数值字段（体力/好感/属性/时间/tick）。服务端忽略并记审计日志 [C4]。 |
| 会话 | 一次叙事可能数十秒，客户端按 `action_id` 轮询/重连拉取，刷新页面不丢结果 [3.6]。 |
| 限流 | 429 时响应含 `Quota.cooldown_sec`；预算告急走降级（缩短叙事），不停服 [10.3]。 |

## 1. 接口总表

原草案 10 个端点全部保留（路径逐字一致），另补 3 个必要端点。

| # | 方法 | 路径 | 说明 | 来源 |
|---|---|---|---|---|
| 1 | POST | `/api/session` | 建立会话，校验账号与配额 | 附录 B |
| 2 | GET | `/api/world` | 获取世界公开切片与时间 | 附录 B |
| 3 | POST | `/api/actions` | 提交意图，返回排队序号 | 附录 B |
| 4 | GET | `/api/actions/:id` | 查询结算状态 | 附录 B |
| 5 | GET | `/api/stream/:id` | 流式接收叙事文本（SSE） | 附录 B |
| 6 | GET | `/api/character` | 获取自身角色只读视图 | 附录 B |
| 7 | GET | `/api/recap` | 获取离线纪要 | 附录 B |
| 8 | POST | `/api/proxy/persona` | 保存行为章程 | 附录 B |
| 9 | POST | `/api/appeal` | 提交申诉 | 附录 B |
| 10 | POST | `/api/character` | 创建角色（12.1 首次进入必需） | `[补充]` |
| 11 | POST | `/api/recap/deny` | 对托管纪要条目做「软否认」 | `[补充]` |
| 12 | GET | `/api/health` | 健康检查 + 契约版本，供前端启动时校验 | `[补充]` |

> 原草案未列 but 体验流程明确需要：角色创建、软否认、旁观模式读取（复用 `/api/character` + `/api/recap`）。

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
  "contract_version": "0.1.0", "ok": true,
  "data": {
    "session_id": "s_...", "session_sig": "sig_...", "player_id": "uuid",
    "quota": { "turns_left": 10, "degraded": false, "cooldown_sec": 0 }
  },
  "world_rev": 128
}
```
**约束**：`api_key` 玩家自带 DeepSeek Key，**只在内存透传，禁止明文落库**；界面必须明示风险 [2.6]。
**错误**：`UNAUTHORIZED` / `FORBIDDEN`（封禁或死亡次数达阈值）/ `RATE_LIMITED`。

### 2) `GET /api/world`
**200** `ApiEnvelope<WorldSlice>` — 见 `types.ts`。
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
  "contract_version": "0.1.0", "ok": true,
  "data": { "action_id": "a_...", "queue_no": 3, "scheduled_tick": 129, "status": "pending" }
}
```
**流程**（3.5 时序，前端只需知道 3 步）：
1. 提交 → 服务端校验会话/配额/速率，记录原始输入；
2. 意图解析器把自然语言映射为**受控行动**（`IntentType` 词表，见 `types.ts`）；无法映射返回 `UNMAPPABLE_INTENT` (422)，**不进入模型**；
3. 行动入队等下一个 tick；结算后通过 `/api/actions/:id` 查状态、`/api/stream/:id` 收文本。

**错误**：`UNMAPPABLE_INTENT` 422 / `CONFLICT` 409（冲突域争抢）/ `RATE_LIMITED` 429 / `FORBIDDEN` 403（只读/旁观角色）。

### 4) `GET /api/actions/:id`
**200** `ApiEnvelope<ActionStatusView>`
`status=settled` 时 `authoritative` 必带，客户端**用其覆盖本地缓存**，冲突时以服务端为准 [3.6]。

### 5) `GET /api/stream/:id` — SSE
每帧 `data: <JSON>\n\n`，帧类型为 `StreamFrame`（`types.ts`）：

| kind | 载荷 | 前端动作 |
|---|---|---|
| `delta` | `{ text }` | 追加到叙事区（逐字/逐段渲染） |
| `authoritative` | `{ snapshot, world_rev }` | **立即覆盖**四必显数值与角色状态 |
| `done` | `{ action_id, event_ids }` | 关闭流，刷新可选行动列表 |
| `error` | `{ code, message }` | 展示错误态，停止渲染 |

断线重连：重新请求同一 `:id` 即可续读；已过期返回 `STREAM_EXPIRED` 410，改走 `/api/recap` [补充]。
> **v0ai 注意**：`delta` 只影响文本，**只有 `authoritative` 帧能改数值**。不要在前端本地累加任何数字。

### 6) `GET /api/character`
**200** `ApiEnvelope<CharacterView>` — 全部字段 `readonly@client`。
`state=spectator` 时前端切旁观模式：墓志铭、江湖传闻、创建新角色入口 [12.4]。

### 7) `GET /api/recap`
**Query** `?cursor=<string>`（分页展开，`has_more=true` 时继续）
**200** `ApiEnvelope<Recap>` — 顺序固定为：世界变了什么 → 你做了什么 → 谁在等你 → 角色现状 [12.3]。
`overview` 恒为三句总览，前端不得一次性铺开全部 `proxy_log`。

### 8) `POST /api/proxy/persona` 🔒写
**Body** `ProxyPersona`（附录 C 全字段，见 `types.ts`）
**200** `ApiEnvelope<{ saved: true }>`
MVP 只启用 `tier ∈ { still, daily }`；传 `active` 返回 `BAD_REQUEST` [11.2]。

### 9) `POST /api/appeal` 🔒写
**Body** `AppealRequest` → **200** `ApiEnvelope<Sanction>`
MVP 处决全人工，申诉进人工复核台 [11.2]。

### 10) `POST /api/character` 🔒写 `[补充]`
**Body** `CreateCharacterRequest` → **201** `ApiEnvelope<CharacterView>`
`age` 由服务端固定为 >= 18（合规要求 2.3），**不接受客户端传 age**。

### 11) `POST /api/recap/deny` 🔒写 `[补充]`
**Body** `{ event_id: string }` → **200** `ApiEnvelope<{ accepted: true }>`
软否认**只改玩家叙事，不改任何数值** [术语表 / 7.6]。

### 12) `GET /api/health` `[补充]`
**200** `{ "contract_version": "0.1.0", "status": "ok", "world_tick": 128 }`
前端启动第一请求，版本不符即 `error.contract_mismatch`。

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
| `CONFLICT` | 409 | 「有人抢先了」，重新拉 `/api/world` |
| `STREAM_EXPIRED` | 410 | 跳 `/api/recap` |
| `INTERNAL` | 500 | 通用错误态 + 会话 ID 便于排查 |

## 4. Mock 约定（豆包）

> **R2**：前端沿用上游原生 JS，适配层零构建、不做 TS 编译。本节的**接口与字段形状不变**，仅 mock 的落盘形态改为原生 JS。

- `client/adapter/generated/mock.js` 必须提供与上述 12 个端点一一对应的函数，返回 `ApiEnvelope<T>` 完整结构；以 IIFE 挂 `window.HHAdapter.mock`，不用 `import` / `export` / TS 语法。
- 所有 mock 数据的字段名从 `types.ts` 逐字照抄；不得出现契约外字段。
- `world_rev` 用固定值 `128`，`tick` 用 `128`，便于快照测试。
- 必须模拟 `delta → authoritative → done` 帧顺序，供适配层状态机验收。
