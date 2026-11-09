/**
 * 《瀚海归义录》多人联机版 · 共享类型契约
 * CONTRACT_VERSION = 0.2.0  |  FROZEN 2026-11-09  |  REVISION R5
 *
 * ⚠️ 本文件是单一事实源。前端(v0ai)、后端(统筹)、样板代码(豆包)一律直接复制/引用，
 *    禁止改名、禁止另建同义类型、禁止私自加字段。变更走 contracts/README.md C6。
 *
 * 0.2.0 是对 0.1.0 的**不兼容升版**：随机出身 / 服务端数值 / 在线推进 /
 *    合流演出 / 玩家交互 / 审核查询。详见 docs/0.2.0-变更清单.md。
 *    禁止私自写兼容层，客户端只认 0.2.0。
 *
 * 标注约定：
 *   readonly@client —— 客户端只读，禁止在请求体中出现
 *   server-only     —— 仅服务端内部使用，不下发
 */

export const CONTRACT_VERSION = "0.2.0" as const;

// ─────────────────────────────────────────────────────────────
// 基础枚举
// ─────────────────────────────────────────────────────────────

/** 角色在线/托管状态 */
export type CharacterState =
  | "online"      // 玩家在线
  | "proxy"       // 离线 AI 托管中
  | "spectator"   // 被处决后的旁观模式
  | "offline";    // 未托管、单纯离线

/** 账号状态 */
export type PlayerStatus = "active" | "restricted" | "banned";

/** 事实等级：硬事实全局同步，软事实按传播路径扩散 */
export type FactLevel = "hard" | "soft";

/** 事件可见性 */
export type Visibility = "public" | "faction" | "location" | "private";

/** 意图行动类型（受控词表，不允许自由文本透传进结算器）
 *  0.2.0：+allocate_points（点数分配也只提交自然语言，不提交数值）。
 *  玩家间交互不在此词表，走 InteractionKind / POST /api/interactions。 */
export type IntentType =
  | "visit"       // 拜访 NPC
  | "move"        // 前往地点
  | "train"       // 练武
  | "study"       // 学艺/藏经阁
  | "rest"        // 休息
  | "work"        // 打杂/打铁
  | "trade"       // 与系统/NPC 交易
  | "talk"        // 对话
  | "spar"        // 与 NPC 切磋
  | "bounty"      // 悬赏
  | "explore"     // 探索
  | "skip_week"   // 跳过一周
  | "minigame"    // 小游戏结算回传
  | "allocate_points"; // 0.2.0 把随机点数分配到某项，文本表达，数值由结算器算

/** 行动队列状态 */
export type ActionStatus = "pending" | "settled" | "rejected" | "compensated";

/** 裁决等级 */
export type Verdict = "ok" | "soft" | "hard";

/** 裁决建议动作 */
export type SuggestedAction = "none" | "warn" | "debuff" | "execute";

/** 托管档位（MVP 只启用前两档） */
export type ProxyTier = "still" | "daily" | "active";

/** 处决/处罚等级 */
export type SanctionLevel = "warn" | "debuff" | "execute";

/** 申诉/处罚状态 */
export type SanctionStatus = "pending" | "confirmed" | "overturned" | "appealed";

/** 审核阶段：0.2.0 强化「不合理事件」审核，hard 仍全人工 */
export type ReviewStage = "rule" | "semantic" | "manual" | "closed";

/** 季节 */
export type Season = 0 | 1 | 2 | 3; // 春 夏 秋 冬

/** 0.2.0 物品分类 */
export type ItemCategory = "equipment" | "consumable" | "material" | "quest" | "currency";

/** 0.2.0 玩家间交互类型 */
export type InteractionKind =
  | "gift"      // 赠予物品
  | "trade"     // 玩家间交易
  | "spar"      // 切磋邀请
  | "message"   // 留言（离线可达）
  | "chat"      // 在线聊天
  | "observe"   // 观战
  | "rate"      // 评价
  | "accept"    // 接受邀请
  | "decline";  // 拒绝邀请

/** 0.2.0 交互状态 */
export type InteractionStatus = "pending" | "accepted" | "declined" | "settled" | "rejected";

/** 0.2.0 合流演出组状态 */
export type SceneGroupStatus = "forming" | "playing" | "closed";

/** 0.2.0 叙事说话人类型 */
export type SpeakerKind = "npc" | "player" | "proxy" | "narrator";

// ─────────────────────────────────────────────────────────────
// 通用包装
// ─────────────────────────────────────────────────────────────

/** 所有响应的统一外层 */
export interface ApiEnvelope<T> {
  contract_version: typeof CONTRACT_VERSION;
  ok: boolean;
  data?: T;
  error?: ApiError;
  /** 服务端权威快照版本号，客户端用于判断是否需要刷新 [补充] */
  world_rev?: number;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** 可重试的请求携带该值 [补充] */
  retryable?: boolean;
}

export type ApiErrorCode =
  | "UNAUTHORIZED"        // 401 会话无效
  | "FORBIDDEN"           // 403 配额/封禁/只读角色
  | "BAD_REQUEST"         // 400 输入不合契约
  | "UNMAPPABLE_INTENT"   // 422 自然语言无法映射为受控行动
  | "RATE_LIMITED"        // 429 限流/预算熔断
  | "NOT_FOUND"           // 404
  | "CONFLICT"            // 409 **0.2.0 收窄**：仅 world_rev 乐观锁 / 真正互斥资源（唯一物品归属等）
  | "STREAM_EXPIRED"      // 410 叙事流已过期，改走 /api/recap
  | "INTERNAL";           // 500

// ─────────────────────────────────────────────────────────────
// 会话与账号
// ─────────────────────────────────────────────────────────────

export interface SessionRequest {
  handle: string;
  /** 玩家自带 DeepSeek Key；服务端只内存透传，禁止落库 [C4/隐私] */
  api_key?: string;
  device_fp?: string;
}

export interface SessionResponse {
  session_id: string;
  /** 会话签名，写接口必须带，禁止仅凭前端参数确定身份 */
  session_sig: string;
  player_id: string;
  quota: Quota;
}

export interface Quota {
  /** 本日剩余回合 */
  turns_left: number;
  /** 全局 Key 预算是否触发降级 */
  degraded: boolean;
  /** 熔断剩余秒数，0 表示未熔断 [补充] */
  cooldown_sec: number;
}

// ─────────────────────────────────────────────────────────────
// 世界切片（只读视图）
// ─────────────────────────────────────────────────────────────

export interface WorldSlice {
  /** readonly@client */
  tick: number;
  /** readonly@client */
  year: number;
  /** readonly@client */
  week: number;
  /** readonly@client */
  season: Season;
  /** readonly@client 0.2.0：无人在线时 true，tick 停止推进 */
  paused: boolean;
  /** readonly@client 0.2.0：当前在线会话数，>0 时大世界时间持续推进 */
  online_players: number;
  /** readonly@client 0.2.0：tick 固定间隔（秒），生产取 30 */
  tick_interval_sec: number;
  /** readonly@client 0.2.0：距下一次 tick 的秒数 */
  next_tick_in_sec: number;
  /** 三句以内门派近况 */
  faction_brief: string;
  /** 「你到来之前的江湖」简版大事记 */
  chronicle: ChronicleEntry[];
  /** 每日世界公告，史书笔法 */
  bulletin?: string;
  /** readonly@client 服务端权威快照版本 */
  world_rev: number;
}

export interface ChronicleEntry {
  event_id: string;
  tick: number;
  summary: string;
  fact_level: FactLevel;
}

// ─────────────────────────────────────────────────────────────
// 角色只读视图
// ─────────────────────────────────────────────────────────────

/** 0.2.0：随机出身与点数结果，服务端生成，客户端只读 */
export interface OriginRoll {
  origin_id: string;
  origin_name: string;
  /** readonly@client 本轮随机得到的总点数 */
  point_pool: number;
  /** readonly@client 服务端分配后的结果；玩家只能用自然语言表达分配意图 */
  allocation: Record<string, number>;
  rolled_tick: number;
  /** readonly@client 是否已用过重掷 */
  reroll_used: boolean;
}

/** 0.2.0：背包条目，全部数值服务端权威 */
export interface ItemStack {
  item_id: string;
  name: string;
  category: ItemCategory;
  /** readonly@client */
  quantity: number;
  /** 唯一物品：转移时属真正互斥资源，抢不到返回 CONFLICT 409 */
  bound: boolean;
}

/** 0.2.0：好感只读投影（真实值在 npc_player_rel，按 npc_id × player_id 隔离） */
export interface FavorView {
  npc_id: string;
  /** readonly@client */
  favor: number;
  /** readonly@client */
  trust: number;
}

/** 0.2.0：离线角色在公共世界里的 NPC 投影（基本闲置） */
export interface NpcProxy {
  npc_proxy_id: string;
  character_id: string;
  name: string;
  /** 基本闲置：true 时由玩家自带 Key 的 LLM 低频驱动 */
  idle: boolean;
  tier: ProxyTier;
  registered_tick: number;
}

export interface CharacterView {
  /** readonly@client */ character_id: string;
  /** readonly@client */ name: string;
  /** readonly@client */ age: number;      // 契约约束 >= 18
  /** readonly@client */ state: CharacterState;
  /** readonly@client */ alive: boolean;
  /** readonly@client */ location_id: string;
  /** readonly@client 0.2.0 服务端随机出身，客户端不得提交 */
  origin: string;
  /** readonly@client 0.2.0 随机点数结果 */
  roll: OriginRoll;
  /** readonly@client 数值永远以服务端为准 */
  stats: CharacterStats;
  /** readonly@client 界面四必显要素之二、三 */
  stamina: number;
  action_points: number;
  /** readonly@client 由 roll.allocation 投影，客户端不得提交 */
  talent: Record<string, number>;
  /** readonly@client 0.2.0 金钱，只由结算器写入 */
  money: number;
  /** readonly@client 0.2.0 背包 */
  inventory: ItemStack[];
  /** readonly@client 0.2.0 好感只读投影 */
  favor_view: FavorView[];
  /** readonly@client 0.2.0 离线时注册为公共 NPC（未注册则缺省） */
  proxy_presence?: NpcProxy;
  /** readonly@client */ deaths: number;
}

export interface CharacterStats {
  /** 学识 */
  knowledge: number;
  /** 体魄 */
  physique: number;
  /** 声望 */
  repute: number;
  /** 武艺 */
  martial: number;
  /** readonly@client 由结算器写入，客户端不得提交 */
  updated_tick: number;
}

// ─────────────────────────────────────────────────────────────
// 意图与行动
// ─────────────────────────────────────────────────────────────

/** 客户端提交：只有自然语言 + 上下文，不含任何数值 [C4] */
export interface ActionSubmitRequest {
  text: string;
  context: ActionContext;
}

export interface ActionContext {
  location_id: string;
  present_npc_ids: string[];
  /** 客户端已知的 world_rev，用于服务端检测陈旧提交 [补充] */
  world_rev: number;
}

/** 服务端解析后的结构化意图（server-only，仅用于下发展示与测试） */
export interface Intent {
  type: IntentType;
  target?: string;
  location?: string;
  /** 原始文本引用，用于审计 */
  raw_text: string;
}

export interface ActionAccepted {
  action_id: string;
  /** 排队序号 */
  queue_no: number;
  /** 预计生效的 tick */
  scheduled_tick: number;
  status: "pending";
  /** 0.2.0：若该行动被并入合流演出组则带此 id */
  group_id?: string;
}

export interface ActionStatusView {
  action_id: string;
  status: ActionStatus;
  tick?: number;
  /** 被拒原因，status=rejected|compensated 时必填 */
  reason?: string;
  /** 结算后下发权威数值覆盖客户端缓存 [3.6] */
  authoritative?: CharacterView;
  group_id?: string;
}

/** 0.2.0：合流演出组。全局 AI 只做编排，不赋予玩家数值权限 */
export interface SceneGroup {
  group_id: string;
  tick: number;
  location_id: string;
  npc_id?: string;
  /** 参与角色 id；>= 2 时才产生 scene 帧 */
  participant_ids: string[];
  status: SceneGroupStatus;
  /** 固定 "global_ai"：编排者不是玩家 */
  moderator: "global_ai";
}

/** 0.2.0：叙事说话人，用于共同演出字幕 */
export interface Speaker {
  kind: SpeakerKind;
  id: string;
  name: string;
}

/** 0.2.0：玩家间消息（聊天 / 留言 / 交互提示） */
export interface PlayerMessage {
  message_id: string;
  tick: number;
  kind: InteractionKind;
  from_character_id: string;
  from_name: string;
  to_character_id?: string;
  text: string;
  /** ISO-8601，不是游戏数值 */
  created_at: string;
}

/** 0.2.0：在场玩家/托管投影的只读切片 */
export interface PlayerPresence {
  character_id: string;
  name: string;
  state: CharacterState;
  location_id: string;
  /** true 表示这是离线角色的 NPC 投影，不是在线玩家 */
  is_proxy_npc: boolean;
}

/** 0.2.0：场景切片，只回「该玩家可感知」的部分 */
export interface SceneSlice {
  location_id: string;
  tick: number;
  world_rev: number;
  players: PlayerPresence[];
  npc_proxies: NpcProxy[];
  group?: SceneGroup;
  messages: PlayerMessage[];
  has_more: boolean;
  cursor?: string;
}

/** 流式叙事：SSE 逐帧。单人行动不发 scene 帧 */
export type StreamFrame =
  | { kind: "delta"; text: string; speaker?: Speaker; group_id?: string }
  | { kind: "scene"; group: SceneGroup }
  | { kind: "message"; message: PlayerMessage }
  | { kind: "presence"; presence: PlayerPresence }
  | { kind: "authoritative"; snapshot: CharacterView; world_rev: number; group_id?: string }
  | { kind: "done"; action_id: string; event_ids: string[]; group_id?: string }
  | { kind: "error"; code: ApiErrorCode; message: string };

// ─────────────────────────────────────────────────────────────
// 玩家间交互（0.2.0）
// ─────────────────────────────────────────────────────────────

/** 客户端提交：文本 + 目标 id，**不含任何数值** [C4] */
export interface InteractionRequest {
  kind: InteractionKind;
  text: string;
  target_character_id?: string;
  /** 赠予/交易引用的物品 id（字符串，非数值） */
  item_id?: string;
}

export interface InteractionAccepted {
  interaction_id: string;
  status: InteractionStatus;
  scheduled_tick: number;
}

export interface InteractionRecord {
  interaction_id: string;
  tick: number;
  kind: InteractionKind;
  from_character_id: string;
  to_character_id?: string;
  item_id?: string;
  text: string;
  status: InteractionStatus;
  /** 0.2.0：交互文本一律过审核，引用裁决 id */
  verdict_ref?: string;
}

export interface InteractionList {
  items: InteractionRecord[];
  has_more: boolean;
  cursor?: string;
}

// ─────────────────────────────────────────────────────────────
// 离线纪要
// ─────────────────────────────────────────────────────────────

export interface Recap {
  /** 三句总览 [12.3] */
  overview: string[];
  world_changes: string[];
  /** 托管纪要，可逐条评价 */
  proxy_log: ProxyLogEntry[];
  /** 0.2.0：离线期间角色作为公共 NPC 被他人遇见的记录 */
  proxy_encounters: ProxyLogEntry[];
  /** 谁在等你 */
  pending_matters: string[];
  character_now: CharacterView;
  /** 分段展开标记，避免一次性倾倒 [补充] */
  has_more: boolean;
  cursor?: string;
}

export interface ProxyLogEntry {
  event_id: string;
  tick: number;
  summary: string;
  /** 玩家可「软否认」：只影响叙事，不影响数值 [术语表] */
  soft_deniable: boolean;
}

// ─────────────────────────────────────────────────────────────
// 行为章程（附录 C）
// ─────────────────────────────────────────────────────────────

export interface ProxyPersona {
  /** 3 个枚举 */
  traits: string[];
  speech_style: string;
  catchphrase: string;
  values: string[];
  boundaries: string[];
  social: "respond_only" | "initiate" | "avoid";
  risk: "cautious" | "by_opponent" | "bold";
  goal: string;
  tier: ProxyTier;
  /** 不可代行事项 */
  forbidden_actions: string[];
}

// ─────────────────────────────────────────────────────────────
// 三层模型（4.1）
// ─────────────────────────────────────────────────────────────

/** 世界真相：全局一份，只能由结算写入 */
export interface WorldTruth {
  tick: number;
  facts: HardFact[];
}

export interface HardFact {
  key: string;
  value: string;
  /** 来源事件 */
  event_id: string;
}

/** NPC 认知：每对 NPC × 玩家一份。合流演出也不共享记忆卡 */
export interface NpcCognition {
  npc_id: string;
  player_id: string;
  favor: number;
  trust: number;
  tags: string[];
  contract?: string;
  memory_cards: MemoryCard[];
}

export interface MemoryCard {
  memory_id: string;
  /** 必须带 (npc_id, player_id) 过滤，防串味 [5.6] */
  npc_id: string;
  player_id: string;
  event_id: string;
  summary: string;
  attitude_delta: number;
  /** 1..5 */
  importance: 1 | 2 | 3 | 4 | 5;
  decay: number;
  created_tick: number;
}

/** 玩家叙事：每玩家一份，生成即固定 */
export interface PlayerNarrative {
  player_id: string;
  event_id: string;
  text: string;
  regenerable: boolean;
}

// ─────────────────────────────────────────────────────────────
// 事件与裁决
// ─────────────────────────────────────────────────────────────

export interface WorldEvent {
  event_id: string;
  tick: number;
  kind: string;
  subject?: string;
  object?: string;
  location_id?: string;
  fact_level: FactLevel;
  visibility: Visibility;
  payload: Record<string, unknown>;
  summary: string;
  /** 原始叙事引用 */
  narrative_ref?: string;
}

/** 附录 D：裁决输出 Schema，逐字对齐 */
export interface VerdictOutput {
  verdict: Verdict;
  rule_hits: string[];
  evidence: string;
  confidence: number;
  suggested_action: SuggestedAction;
  rationale: string;
}
// 硬约束：verdict === "hard" 时 confidence >= 0.9 且需两个独立模型一致，方可自动执行。
// 0.2.0 强化：所有 InteractionRequest.text 与合流演出 delta 都过审核，命中写 audit 记录。

export interface Sanction {
  sanction_id: string;
  character_id: string;
  level: SanctionLevel;
  reason: string;
  evidence: Record<string, unknown>;
  status: SanctionStatus;
  appeal?: string;
  /** 0.2.0：处罚生效 tick */
  issued_tick: number;
  /** 0.2.0：审核阶段，hard 一律 manual */
  review_stage: ReviewStage;
  /** 0.2.0：裁决输出引用，便于详情 UI 展示证据 */
  verdict_ref?: string;
}

export interface SanctionList {
  items: Sanction[];
  has_more: boolean;
  cursor?: string;
}

export interface AppealRequest {
  sanction_id: string;
  statement: string;
}

// ─────────────────────────────────────────────────────────────
// 角色创建（12.1）—— 0.2.0 收窄
// ─────────────────────────────────────────────────────────────

/** 0.2.0：出身与点数由服务端随机生成，**客户端不得提交 origin / talent / age / 任何数值** [C4] */
export interface CreateCharacterRequest {
  name: string;
  /** 行为章程在创建时就填；同时决定挂机档位与禁行事项 */
  persona: ProxyPersona;
}

/** 0.2.0：重掷申请无请求体数值，是否允许由服务端决定 */
export interface RerollResponse {
  roll: OriginRoll;
  character: CharacterView;
}

// ─────────────────────────────────────────────────────────────
// 管理端 · 大世界天道（0.2.0 / R5，站长专用，见 docs/其他关键设计点-对照.md）
// 与玩家端分离：独立登录、独立页面 client/tiandao/，不复用玩家会话。
// ─────────────────────────────────────────────────────────────

/** 站长命令受控词表（不允许自由文本透传执行器） */
export type AdminCommand =
  | "ban"             // 封禁账号
  | "unban"           // 解封
  | "grant_quota"     // 调整配额
  | "set_tier"        // 改托管档位
  | "pause_world"     // 暂停世界 tick
  | "resume_world"    // 恢复 tick
  | "force_tick"      // 强制推进一次
  | "reseed_origin"   // 重置某角色随机出身
  | "compensate";     // 救济补偿

/** 人工审核裁定 */
export type ReviewDecision = "approve" | "reject" | "reclassify" | "sanction";

export interface AdminLoginRequest {
  /** 口令由操作人现场输入；**绝不写进任何交付包 / 仓库 / 契约文档** */
  password: string;
}

export interface AdminLoginResponse {
  /** 内存态令牌，服务端不落库；后续管理端请求带 X-Admin-Token */
  admin_token: string;
  expires_in_sec: number;
}

export interface AdminOverview {
  tick: number;
  paused: boolean;
  online_players: number;
  character_count: number;
  npc_count: number;
  pending_reviews: number;
  event_count: number;
  recent_events: WorldEvent[];
}

/** 全局 AI 提交、需人工判定的审核条目 */
export interface ReviewItem {
  audit_id: string;
  tick: number;
  source_kind: "action" | "interaction" | "joint_delta";
  source_id: string;
  excerpt: string;
  verdict: VerdictOutput;
  review_stage: ReviewStage;
  status: "pending" | "decided";
}

export interface ReviewList {
  items: ReviewItem[];
  has_more: boolean;
  cursor?: string;
}

export interface ReviewDecisionRequest {
  decision: ReviewDecision;
  note: string;
  /** 改判后的等级；具体数值由服务端落库，前端不提交数值 */
  verdict_override?: Verdict;
  sanction_level?: SanctionLevel;
}

export interface ReviewDecisionResult {
  audit_id: string;
  status: "decided";
  review_stage: ReviewStage;
  sanction?: Sanction;
}

/** 站长手写全局事件；写只追加 event 流 */
export interface WorldEventDraft {
  summary: string;
  fact_level: FactLevel;
  visibility: Visibility;
  location_id?: string;
  payload?: Record<string, unknown>;
}

export interface WorldEventPublished {
  event: WorldEvent;
  world_rev: number;
}

export type EntityType = "character" | "npc";

/** 角色 / NPC 全量只读视图（管理端专用，玩家端不得调用） */
export interface AdminEntityView {
  type: EntityType;
  id: string;
  name: string;
  location_id?: string;
  state: string;
  stats?: CharacterStats;
  money?: number;
  inventory?: ItemStack[];
  /** NPC 对各玩家的印象，按 (npc_id, player_id) 逐对隔离 */
  impressions?: Array<{ player_id: string; favor: number; trust: number; tags: string[] }>;
  persona?: ProxyPersona;
  raw: Record<string, unknown>;
}

export interface AdminEntityList {
  type: EntityType;
  items: AdminEntityView[];
  has_more: boolean;
  cursor?: string;
}

export interface AdminCommandRequest {
  command: AdminCommand;
  target_id?: string;
  note: string;
}

export interface AdminCommandResult {
  command_id: string;
  command: AdminCommand;
  applied: boolean;
  world_rev: number;
  note: string;
}

// ─────────────────────────────────────────────────────────────
// UI 文案 key（v0ai 只许使用这些 key，不许硬编码中文） [补充]
// 0.2.0：玩家端 28 → 61（创角 8 / 背包 5 / 场景 5 / 交互 8 / 裁决 4 / 错误 3）
//        管理端另设 I18N_KEYS_ADMIN（12），与玩家端分开，便于后期新增系统 [P6]
// ─────────────────────────────────────────────────────────────

export const I18N_KEYS = [
  // 0.1.0 原有 28
  "world.time", "world.season", "world.faction", "world.chronicle",
  "char.stamina", "char.action_points", "char.state", "char.location",
  "state.online", "state.proxy", "state.spectator", "state.offline",
  "action.submit", "action.waiting", "action.accepted", "action.rejected",
  "recap.overview", "recap.world_changes", "recap.proxy_log",
  "recap.pending_matters", "recap.character_now", "recap.expand",
  "death.epitaph", "death.rumors", "death.new_character",
  "error.contract_mismatch", "error.quota_exceeded", "error.readonly",
  // 0.2.0 创角 / 随机出身
  "create.title", "create.name", "create.persona", "create.proxy_tier",
  "create.submit", "create.rolled_origin", "create.point_pool", "create.reroll",
  // 0.2.0 背包 / 金钱
  "inventory.title", "inventory.money", "inventory.empty",
  "inventory.item", "inventory.quantity",
  // 0.2.0 场景 / 共同演出
  "scene.title", "scene.players", "scene.npc", "scene.joint", "scene.speaker",
  // 0.2.0 玩家间交互
  "interaction.gift", "interaction.trade", "interaction.spar", "interaction.message",
  "interaction.chat", "interaction.observe", "interaction.accept", "interaction.decline",
  // 0.2.0 违规 / 处罚 / 申诉
  "verdict.warn", "verdict.detail", "verdict.appeal", "verdict.status",
  // 0.2.0 新增错误态
  "error.conflict_mutex", "error.joint_closed", "error.interaction_blocked",
] as const;

export type I18nKey = typeof I18N_KEYS[number];

/** 管理端（大世界天道）独立文案表，12 个 key；与玩家端互不污染 [P6] */
export const I18N_KEYS_ADMIN = [
  "admin.title", "admin.login", "admin.password", "admin.submit",
  "admin.overview", "admin.reviews", "admin.approve", "admin.reject",
  "admin.world_event", "admin.characters", "admin.npcs", "admin.logout",
] as const;

export type I18nAdminKey = typeof I18N_KEYS_ADMIN[number];
