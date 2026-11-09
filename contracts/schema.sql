-- 《瀚海归义录》多人联机版 · PostgreSQL DDL
-- CONTRACT_VERSION = 0.2.0 | FROZEN 2026-11-09 | REVISION R5
-- 依据：技术方案 v0.1 附录 A，逐表落地并格式化；[补充] 标记补全项。
-- 0.2.0：+8 表（item / inventory / currency_ledger / npc_proxy / scene_group /
--        player_interaction / audit / admin_action_log），并为 world / character / sanction / action_queue 加列。
--        变更全表见 docs/0.2.0-变更清单.md。
-- 规则：任何 agent 不得自行加表/改列。变更走 contracts/README.md C6。
-- 注：npc_memory.embedding 使用 pgvector 的 vector(768)；MVP 可先去掉该列（见文末）。

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() [补充]
-- CREATE EXTENSION IF NOT EXISTS vector;    -- MVP 无向量检索时可注释 [补充]

-- ── 世界单例：tick / 年月 / 季节 ─────────────────────────────
CREATE TABLE world (
  id                  serial PRIMARY KEY,
  tick                bigint  NOT NULL DEFAULT 0,
  year                int     NOT NULL DEFAULT 1,
  week                int     NOT NULL DEFAULT 1,
  season              smallint NOT NULL DEFAULT 0,
  paused              boolean NOT NULL DEFAULT false,   -- 0.2.0：无人在线时 true
  online_sessions     int     NOT NULL DEFAULT 0,       -- 0.2.0 [补充]
  tick_interval_sec   int     NOT NULL DEFAULT 30,      -- 0.2.0 [补充] 在线时固定间隔
  last_tick_at        timestamptz NOT NULL DEFAULT now()-- 0.2.0 [补充]
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
  origin        text NOT NULL,                    -- 0.2.0 服务端随机，客户端不得提交
  roll          jsonb NOT NULL,                  -- 0.2.0 OriginRoll：point_pool / allocation / rolled_tick / reroll_used
  talent        jsonb NOT NULL,                  -- 0.2.0 由 roll.allocation 投影
  stats         jsonb NOT NULL,
  money         bigint NOT NULL DEFAULT 0,       -- 0.2.0 只由结算器 / currency_ledger 投影写入
  location_id   text NOT NULL,
  state         text NOT NULL DEFAULT 'online',  -- online|proxy|spectator|offline
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
-- 0.2.0：合流演出组也不共享记忆卡，查询必须带 (npc_id, player_id)。
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
-- 0.2.0 新增 kind：origin_roll / ambient / joint_scene / interaction / audit_hit /
--                    world_decree（站长发布）/ correction
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
CREATE INDEX idx_event_kind ON event(kind, tick DESC);          -- 0.2.0 [补充]

-- ── 行动队列（一个数据库表即队列，无需消息中间件） ────────────
CREATE TABLE action_queue (
  id            bigserial PRIMARY KEY,
  tick          bigint NOT NULL,
  actor_id      uuid NOT NULL,
  intent        jsonb NOT NULL,
  source        text NOT NULL,       -- player|proxy|system
  status        text NOT NULL DEFAULT 'pending',  -- pending|settled|rejected|compensated
  domain_key    text NOT NULL,       -- 0.2.0：只用于真正互斥资源（item:<id> / bounty:<id>）
  group_id      text,                -- 0.2.0：合流演出组，同场景并发不再互相 409
  submitted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_action_queue_tick ON action_queue(tick, status);
CREATE INDEX idx_action_queue_group ON action_queue(group_id);  -- 0.2.0 [补充]

-- ── 处罚 / 处决 ─────────────────────────────────────────────
CREATE TABLE sanction (
  id            bigserial PRIMARY KEY,
  character_id  uuid NOT NULL,
  level         text NOT NULL,       -- warn|debuff|execute
  reason        text NOT NULL,
  evidence      jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'pending',  -- pending|confirmed|overturned|appealed
  appeal        text,
  issued_tick   bigint NOT NULL DEFAULT 0,        -- 0.2.0
  review_stage  text NOT NULL DEFAULT 'manual',   -- 0.2.0 rule|semantic|manual|closed
  verdict_ref   text,                            -- 0.2.0 裁决输出引用
  decided_at    timestamptz
);
CREATE INDEX idx_sanction_character ON sanction(character_id, issued_tick DESC);  -- 0.2.0 [补充]

-- ── [补充] 契约落地所需的表 ──────────────────────────────────
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

-- ══════════════════════════════════════════════════════════
-- 0.2.0 新增 8 张表（对应 docs/0.2.0-变更清单.md §8）
-- ══════════════════════════════════════════════════════════

-- 物品定义：唯一物品 bound=true 是 409 收窄后保留的真正互斥资源
CREATE TABLE item (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  category      text NOT NULL,       -- equipment|consumable|material|quest|currency
  bound         boolean NOT NULL DEFAULT false,
  unique_owner  boolean NOT NULL DEFAULT false,  -- true：全服仅一份，转移互斥
  meta          jsonb NOT NULL DEFAULT '{}'
);

-- 背包：数量只由结算器写入，客户端只读
CREATE TABLE inventory (
  character_id  uuid NOT NULL REFERENCES character(id),
  item_id       text NOT NULL REFERENCES item(id),
  quantity      int  NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  updated_tick  bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, item_id)
);

-- 金钱账本：每次变动只追加，投影出 character.money
CREATE TABLE currency_ledger (
  id            bigserial PRIMARY KEY,
  character_id  uuid NOT NULL REFERENCES character(id),
  delta         bigint NOT NULL,
  reason        text NOT NULL,
  event_id      bigint NOT NULL,
  tick          bigint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_character ON currency_ledger(character_id, tick DESC);

-- 离线角色的公共 NPC 投影（需求 4：基本闲置，玩家自带 Key 低频驱动）
CREATE TABLE npc_proxy (
  id              text PRIMARY KEY,
  character_id    uuid NOT NULL REFERENCES character(id),
  npc_proxy_id    text UNIQUE NOT NULL,
  name            text NOT NULL,
  idle            boolean NOT NULL DEFAULT true,
  tier            text NOT NULL DEFAULT 'daily',
  location_id     text NOT NULL,
  registered_tick bigint NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_npc_proxy_location ON npc_proxy(location_id);

-- 合流演出组（需求 5）：全局 AI 只做编排，不写数值
CREATE TABLE scene_group (
  id              text PRIMARY KEY,
  tick            bigint NOT NULL,
  location_id     text NOT NULL,
  npc_id          text,
  participant_ids uuid[] NOT NULL,
  status          text NOT NULL DEFAULT 'forming',  -- forming|playing|closed
  moderator       text NOT NULL DEFAULT 'global_ai',
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_scene_group_tick ON scene_group(tick DESC);

-- 玩家间交互（需求 6）：文本进事件流并受裁决
CREATE TABLE player_interaction (
  id                  bigserial PRIMARY KEY,
  interaction_id      text UNIQUE NOT NULL,
  tick                bigint NOT NULL,
  kind                text NOT NULL,       -- gift|trade|spar|message|chat|observe|rate|accept|decline
  from_character_id   uuid NOT NULL,
  to_character_id     uuid,
  item_id             text,
  text                text NOT NULL,
  status              text NOT NULL DEFAULT 'pending',  -- pending|accepted|declined|settled|rejected
  verdict_ref         text,
  event_id            bigint,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_interaction_pair ON player_interaction(from_character_id, to_character_id, tick DESC);
CREATE INDEX idx_interaction_kind ON player_interaction(kind, tick DESC);

-- 审核记录（需求 7）：所有 ActionSubmitRequest.text / InteractionRequest.text / 合流 delta 都过审核
CREATE TABLE audit (
  id            bigserial PRIMARY KEY,
  tick          bigint NOT NULL,
  source_kind   text NOT NULL,       -- action|interaction|joint_delta
  source_id     text NOT NULL,
  verdict       jsonb NOT NULL,      -- VerdictOutput 逐字对齐
  review_stage  text NOT NULL,       -- rule|semantic|manual|closed
  sanction_id   bigint,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tick ON audit(tick DESC);
CREATE INDEX idx_audit_stage ON audit(review_stage, tick DESC);

-- 站长操作留痕（0.2.0《其他关键设计点》第 3 条：万能工作台可回放审计）
-- 所有 /api/admin/* 写操作（登录失败、裁定、发布事件、命令）只追加，不修改。
CREATE TABLE admin_action_log (
  id            bigserial PRIMARY KEY,
  actor         text NOT NULL DEFAULT 'tiandao',
  action        text NOT NULL,       -- login|login_failed|review_decision|world_event|command
  command       text,                -- AdminCommand 取值（action=command 时）
  target_id     text,
  payload       jsonb NOT NULL DEFAULT '{}',
  result        text NOT NULL,       -- ok|denied|failed
  tick          bigint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_log_tick ON admin_action_log(tick DESC);

-- ── MVP 裁剪提示（0.2.0 更新） ──────────────────────────────
-- 1. 第一版不需要 pgvector：可 ALTER TABLE npc_memory DROP COLUMN embedding;
--    记忆检索先用 (npc_id, player_id) + importance + decay 做 Top-K。
-- 2. 处决全人工，hard 需双模型一致且 confidence >= 0.9，review_stage=manual。
-- 3. 托管只做 still / daily 两档；npc_proxy.idle=true 时基本闲置。
-- 4. 同场景做「合流演出字幕 + 在场名单」，仍不做 3D 同屏 / 位置广播。
-- 5. 空 tick 只写 ambient 模板事件，不调用模型；在线会话归零即 paused。
-- 6. ticket 推进用单进程定时器 + world.last_tick_at 兜底，20 人规模无需分布式锁。
