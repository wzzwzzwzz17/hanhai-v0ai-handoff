-- 《瀚海归义录》多人联机版 · PostgreSQL DDL
-- CONTRACT_VERSION = 0.1.0 | FROZEN 2026-11-09
-- 依据：技术方案 v0.1 附录 A，逐表落地并格式化；[补充] 标记补全项。
-- 规则：任何 agent 不得自行加表/改列。变更走 contracts/README.md C6。
-- 注：npc_memory.embedding 使用 pgvector 的 vector(768)；MVP 可先去掉该列（见文末）。

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() [补充]
-- CREATE EXTENSION IF NOT EXISTS vector;    -- MVP 无向量检索时可注释 [补充]

-- ── 世界单例：tick / 年月 / 季节 ─────────────────────────────
CREATE TABLE world (
  id            serial PRIMARY KEY,
  tick          bigint  NOT NULL DEFAULT 0,
  year          int     NOT NULL DEFAULT 1,
  week          int     NOT NULL DEFAULT 1,
  season        smallint NOT NULL DEFAULT 0,
  paused        boolean NOT NULL DEFAULT false
);

-- ── 账号 ────────────────────────────────────────────────────
CREATE TABLE player (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle        text UNIQUE NOT NULL,
  api_key_enc   bytea,                 -- 加密存储；建议只内存透传不落库 [2.6]
  device_fp     text,
  last_ip       inet,
  deaths        int  NOT NULL DEFAULT 0,
  risk_score    int  NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',  -- active|restricted|banned
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 角色 ────────────────────────────────────────────────────
CREATE TABLE character (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES player(id),
  name          text NOT NULL,
  age           int  NOT NULL CHECK (age >= 18),   -- 合规硬约束 [2.3]
  talent        jsonb NOT NULL,
  stats         jsonb NOT NULL,
  location_id   text NOT NULL,
  state         text NOT NULL DEFAULT 'online',    -- online|proxy|spectator|offline
  alive         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_character_player ON character(player_id);

-- ── NPC ─────────────────────────────────────────────────────
CREATE TABLE npc (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  location_id   text,
  state         jsonb NOT NULL,
  alive         boolean NOT NULL DEFAULT true,
  known_facts   bigint[] NOT NULL DEFAULT '{}'
);

-- ── NPC × 玩家 认知（防串味第一道防线：二维主键） ─────────────
CREATE TABLE npc_player_rel (
  npc_id        text REFERENCES npc(id),
  player_id     uuid REFERENCES player(id),
  favor         int  NOT NULL DEFAULT 0,
  trust         int  NOT NULL DEFAULT 0,
  tags          text[] NOT NULL DEFAULT '{}',
  contract      text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (npc_id, player_id)
);

-- ── NPC 记忆卡 ──────────────────────────────────────────────
CREATE TABLE npc_memory (
  id             bigserial PRIMARY KEY,
  npc_id         text NOT NULL REFERENCES npc(id),
  player_id      uuid NOT NULL REFERENCES player(id),
  event_id       bigint NOT NULL,
  summary        text NOT NULL,
  attitude_delta int  NOT NULL DEFAULT 0,
  importance     smallint NOT NULL CHECK (importance BETWEEN 1 AND 5),
  decay          real NOT NULL DEFAULT 1.0,
  embedding      vector(768),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_npc_memory_pair ON npc_memory(npc_id, player_id, created_at DESC);

-- ── 事件流（只追加，不做就地修改） ───────────────────────────
CREATE TABLE event (
  id            bigserial PRIMARY KEY,
  tick          bigint NOT NULL,
  kind          text NOT NULL,
  subject       text,
  object        text,
  location_id   text,
  fact_level    text NOT NULL,       -- hard|soft
  visibility    text NOT NULL,       -- public|faction|location|private
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_tick ON event(tick);
CREATE INDEX idx_event_level ON event(fact_level, tick DESC);

-- ── 行动队列（一个数据库表即队列，无需消息中间件） ────────────
CREATE TABLE action_queue (
  id            bigserial PRIMARY KEY,
  tick          bigint NOT NULL,
  actor_id      uuid NOT NULL,
  intent        jsonb NOT NULL,
  source        text NOT NULL,       -- player|proxy|system
  status        text NOT NULL DEFAULT 'pending',  -- pending|settled|rejected|compensated
  domain_key    text NOT NULL,       -- 冲突域键
  submitted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_action_queue_tick ON action_queue(tick, status);

-- ── 处罚 / 处决 ─────────────────────────────────────────────
CREATE TABLE sanction (
  id            bigserial PRIMARY KEY,
  character_id  uuid NOT NULL,
  level         text NOT NULL,       -- warn|debuff|execute
  reason        text NOT NULL,
  evidence      jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'pending',  -- pending|confirmed|overturned|appealed
  appeal        text,
  decided_at    timestamptz
);

-- ── [补充] 契约落地所需的 4 张表 ─────────────────────────────
-- 依据 12.x / 附录 C / 3.6，原附录 A 未列但接口已依赖。

-- 会话：写接口签名校验，禁止仅凭前端参数确定身份
CREATE TABLE session (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES player(id),
  session_sig   text NOT NULL,
  world_rev     int  NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 行为章程（附录 C）
CREATE TABLE proxy_persona (
  character_id  uuid PRIMARY KEY REFERENCES character(id),
  persona       jsonb NOT NULL,
  tier          text NOT NULL DEFAULT 'daily',   -- still|daily|active
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 玩家叙事：生成即固定，可重生成；三层模型第三层
CREATE TABLE player_narrative (
  id            bigserial PRIMARY KEY,
  player_id     uuid NOT NULL REFERENCES player(id),
  event_id      bigint NOT NULL,
  action_id     text,
  text          text NOT NULL,
  regenerable   boolean NOT NULL DEFAULT true,
  -- 软否认：只影响叙事展示，不改数值
  soft_denied   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_narrative_player ON player_narrative(player_id, created_at DESC);

-- 配额与预算：尖峰比均值更危险，按账号限流 [9.4 / 10.2]
CREATE TABLE quota_daily (
  player_id     uuid NOT NULL REFERENCES player(id),
  day           date NOT NULL,
  turns_used    int NOT NULL DEFAULT 0,
  tokens_used   bigint NOT NULL DEFAULT 0,
  cost_micros   bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day)
);

-- ── MVP 裁剪提示 ────────────────────────────────────────────
-- 1. 第一版不需要 pgvector：可 ALTER TABLE npc_memory DROP COLUMN embedding;
--    记忆检索先用 (npc_id, player_id) + importance + decay 做 Top-K。
-- 2. 处决全人工，sanction 表只做记录与申诉，不接自动判定。
-- 3. 托管只做 still / daily 两档。
-- 4. 不做同场景实时互见，无需在线状态广播表。
