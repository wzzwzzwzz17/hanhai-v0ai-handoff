/**
 * 《瀚海归义录》多人联机版 · 共享类型契约
 * CONTRACT_VERSION = 0.1.0  |  FROZEN 2026-11-09
 *
 * ⚠️ 本文件是单一事实源。前端(v0ai)、后端(统筹)、样板代码(豆包)一律直接复制/引用，
 *    禁止改名、禁止另建同义类型、禁止私自加字段。变更走 contracts/README.md C6。
 *
 * 标注约定：
 *   readonly@client —— 客户端只读，禁止在请求体中出现
 *   server-only     —— 仅服务端内部使用，不下发
 */

export const CONTRACT_VERSION = "0.1.0" as const;

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

/** 意图行动类型（受控词表，不允许自由文本透传进结算器） */
export type IntentType =
  | "visit"       // 拜访 NPC
  | "move"        // 前往地点
  | "train"       // 练武
  | "study"       // 学艺/藏经阁
  | "rest"        // 休息
  | "work"        // 打杂/打铁
  | "trade"       // 交易
  | "talk"        // 对话
  | "spar"        // 切磋
  | "bounty"      // 悬赏
  | "explore"     // 探索
  | "skip_week"   // 跳过一周
  | "minigame";   // 小游戏结算回传

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

/** 季节 */
export type Season = 0 | 1 | 2 | 3; // 春 夏 秋 冬

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
  | "CONFLICT"            // 409 冲突域争抢，行动被拒
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
  /** readonly@client */
  paused: boolean;
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

export interface CharacterView {
  /** readonly@client */ character_id: string;
  /** readonly@client */ name: string;
  /** readonly@client */ age: number;      // 契约约束 >= 18
  /** readonly@client */ state: CharacterState;
  /** readonly@client */ alive: boolean;
  /** readonly@client */ location_id: string;
  /** readonly@client 数值永远以服务端为准 */
  stats: CharacterStats;
  /** readonly@client 界面四必显要素之二、三 */
  stamina: number;
  action_points: number;
  /** readonly@client */ talent: Record<string, number>;
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
}

export interface ActionStatusView {
  action_id: string;
  status: ActionStatus;
  tick?: number;
  /** 被拒原因，status=rejected|compensated 时必填 */
  reason?: string;
  /** 结算后下发权威数值覆盖客户端缓存 [3.6] */
  authoritative?: CharacterView;
}

/** 流式叙事：SSE 逐帧 */
export type StreamFrame =
  | { kind: "delta"; text: string }
  | { kind: "authoritative"; snapshot: CharacterView; world_rev: number }
  | { kind: "done"; action_id: string; event_ids: string[] }
  | { kind: "error"; code: ApiErrorCode; message: string };

// ─────────────────────────────────────────────────────────────
// 离线纪要
// ─────────────────────────────────────────────────────────────

export interface Recap {
  /** 三句总览 [12.3] */
  overview: string[];
  world_changes: string[];
  /** 托管纪要，可逐条评价 */
  proxy_log: ProxyLogEntry[];
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

/** NPC 认知：每对 NPC × 玩家一份 */
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

export interface Sanction {
  sanction_id: string;
  character_id: string;
  level: SanctionLevel;
  reason: string;
  evidence: Record<string, unknown>;
  status: SanctionStatus;
  appeal?: string;
}

export interface AppealRequest {
  sanction_id: string;
  statement: string;
}

// ─────────────────────────────────────────────────────────────
// 角色创建（12.1）
// ─────────────────────────────────────────────────────────────

export interface CreateCharacterRequest {
  name: string;
  /** 出身枚举，由 content/ 提供 */
  origin: string;
  talent: Record<string, number>;
  /** 行为章程在创建时就填，同时作为叙事性格约束 */
  persona: ProxyPersona;
}

// ─────────────────────────────────────────────────────────────
// UI 文案 key（v0ai 只许使用这些 key，不许硬编码中文） [补充]
// ─────────────────────────────────────────────────────────────

export const I18N_KEYS = [
  "world.time", "world.season", "world.faction", "world.chronicle",
  "char.stamina", "char.action_points", "char.state", "char.location",
  "state.online", "state.proxy", "state.spectator", "state.offline",
  "action.submit", "action.waiting", "action.accepted", "action.rejected",
  "recap.overview", "recap.world_changes", "recap.proxy_log",
  "recap.pending_matters", "recap.character_now", "recap.expand",
  "death.epitaph", "death.rumors", "death.new_character",
  "error.contract_mismatch", "error.quota_exceeded", "error.readonly",
] as const;

export type I18nKey = typeof I18N_KEYS[number];
