/**
 * mock.js - 《瀚海归义录》联机版纯静态假数据
 * CONTRACT_VERSION = 0.2.0 | REVISION R5
 *
 * 与 contracts/api-v0.md 的 25 个端点（含 7 个管理端）一一对应，函数返回完整 ApiEnvelope<T>
 * （health 端点按 api-v0 约定为裸对象）。world_rev 与 tick 固定 128。
 *
 * getStreamFrames() 返回单人帧序 delta -> delta -> delta -> authoritative -> done；
 * getStreamFrames("joint") 返回 0.2.0 合流演出帧序
 * scene -> delta(speaker) -> delta(speaker) -> authoritative -> done，
 * 供适配层状态机与共同演出字幕验收。
 *
 * 纯静态、无状态计算、不累加数值：所有数值只作为服务端 authoritative 快照的
 * 固定内容出现，客户端调用任意次数返回值均不变。
 * 形态：原生 IIFE，挂 window.HHAdapter.mock，零构建、零依赖。
 */
(function () {
  var HH = window.HHAdapter = window.HHAdapter || {};
  var REV = 128;
  var VERSION = "0.2.0";

  /* 统一成功外层 ApiEnvelope<T> */
  function envelope(data) {
    return {
      contract_version: VERSION,
      ok: true,
      data: data,
      world_rev: REV
    };
  }

  /* 0.2.0 随机出身与点数结果 OriginRoll（服务端生成，只读） */
  var ROLL = {
    origin_id: "origin_wanderer",
    origin_name: "瀚海行商遗孤",
    point_pool: 12,
    allocation: {
      "根骨": 3,
      "悟性": 4,
      "心性": 3,
      "魅力": 2
    },
    rolled_tick: REV,
    reroll_used: false
  };

  /* 服务端权威角色快照（CharacterView，字段逐字对齐 types.ts 0.2.0） */
  var CHARACTER = {
    character_id: "char_player_01",
    name: "燕归尘",
    age: 20,
    state: "online",
    alive: true,
    location_id: "tianshan_library",
    origin: "origin_wanderer",
    roll: ROLL,
    stats: {
      knowledge: 42,
      physique: 38,
      repute: 35,
      martial: 46,
      updated_tick: REV
    },
    stamina: 80,
    action_points: 2,
    talent: {
      "根骨": 3,
      "悟性": 4,
      "心性": 3,
      "魅力": 2
    },
    money: 320,
    inventory: [
      {
        item_id: "it_book_01",
        name: "泛黄旧籍",
        category: "quest",
        quantity: 1,
        bound: true
      },
      {
        item_id: "it_herb_02",
        name: "山间草药",
        category: "consumable",
        quantity: 3,
        bound: false
      }
    ],
    favor_view: [
      { npc_id: "shi_yan_nian", favor: 6, trust: 4 },
      { npc_id: "po_zhen_zi", favor: 2, trust: 3 }
    ],
    proxy_presence: {
      npc_proxy_id: "npc_proxy_01",
      character_id: "char_player_01",
      name: "燕归尘",
      idle: true,
      tier: "daily",
      registered_tick: REV
    },
    deaths: 0
  };

  /* 简版大事记（WorldSlice.chronicle） */
  var CHRONICLE = [
    {
      event_id: "ev_0000120",
      tick: 120,
      summary: "掌门仙逝，门派共推长老议事，暂由诸长老共掌门户",
      fact_level: "hard"
    },
    {
      event_id: "ev_0000124",
      tick: 124,
      summary: "西域义军遣使上山，外务长老破阵子设宴相待",
      fact_level: "soft"
    },
    {
      event_id: "ev_0000127",
      tick: 127,
      summary: "秋汛将至，公田开镰，弟子轮番下山助农",
      fact_level: "soft"
    }
  ];

  /* 世界公开切片 WorldSlice（0.2.0 新增在线推进三字段） */
  var WORLD = {
    tick: REV,
    year: 3,
    week: 8,
    season: 2,
    paused: false,
    online_players: 2,
    tick_interval_sec: 30,
    next_tick_in_sec: 12,
    faction_brief: "天山派秋意渐浓，长老议事如常，外务与公田两事最为紧要。",
    chronicle: CHRONICLE,
    bulletin: "秋日开镰，门下弟子当惜农时，各安其位。",
    world_rev: REV
  };

  /* 行动入队回执 ActionAccepted */
  var ACTION_ACCEPTED = {
    action_id: "a_mock_128",
    queue_no: 3,
    scheduled_tick: 129,
    status: "pending"
  };

  /* 行动结算状态 ActionStatusView（settled，带权威快照） */
  var ACTION_STATUS = {
    action_id: "a_mock_128",
    status: "settled",
    tick: REV,
    authoritative: CHARACTER
  };

  /* 0.2.0 合流演出组 SceneGroup */
  var SCENE_GROUP = {
    group_id: "g_mock_128",
    tick: REV,
    location_id: "tianshan_library",
    npc_id: "shi_yan_nian",
    participant_ids: ["char_player_01", "char_player_02"],
    status: "playing",
    moderator: "global_ai"
  };

  /* 0.2.0 说话人 */
  var NPC_SPEAKER = {
    kind: "npc",
    id: "shi_yan_nian",
    name: "施延年"
  };
  var PLAYER_SPEAKER = {
    kind: "player",
    id: "char_player_02",
    name: "同行弟子"
  };

  /* 单人行动帧序：delta* -> authoritative -> done */
  var STREAM_FRAMES = [
    {
      kind: "delta",
      text: "你穿过落满秋叶的回廊，来到藏经阁前。阁门半掩，施延年正伏案整理旧卷。"
    },
    {
      kind: "delta",
      text: "她抬眼见是你，搁下笔，将一卷泛黄的典籍轻轻推到案边。"
    },
    {
      kind: "delta",
      text: "窗外风过松檐，阁中只余翻书之声。"
    },
    {
      kind: "authoritative",
      snapshot: CHARACTER,
      world_rev: REV
    },
    {
      kind: "done",
      action_id: "a_mock_128",
      event_ids: ["ev_0000128", "ev_0000129"]
    }
  ];

  /* 0.2.0 合流演出帧序：scene -> delta(speaker)* -> authoritative -> done */
  var JOINT_FRAMES = [
    { kind: "scene", group: SCENE_GROUP },
    {
      kind: "delta",
      text: "施延年将两卷书分别推向案边：「一个问内功，一个问旧事，都别急。」",
      speaker: NPC_SPEAKER,
      group_id: "g_mock_128"
    },
    {
      kind: "delta",
      text: "同行弟子拱手：「晚辈想请教瀚海商道的旧闻。」",
      speaker: PLAYER_SPEAKER,
      group_id: "g_mock_128"
    },
    {
      kind: "authoritative",
      snapshot: CHARACTER,
      world_rev: REV,
      group_id: "g_mock_128"
    },
    {
      kind: "done",
      action_id: "a_mock_128",
      event_ids: ["ev_0000128", "ev_0000129"],
      group_id: "g_mock_128"
    }
  ];

  /* 0.2.0 场景 SSE 帧（scene / message / presence） */
  var SCENE_FRAMES = [
    { kind: "presence", presence: {
      character_id: "char_player_02", name: "同行弟子", state: "online",
      location_id: "tianshan_library", is_proxy_npc: false
    } },
    { kind: "message", message: {
      message_id: "msg_mock_01", tick: REV, kind: "chat",
      from_character_id: "char_player_02", from_name: "同行弟子",
      to_character_id: "char_player_01", text: "阁中借一步说话？",
      created_at: "2026-11-09T09:00:00+08:00"
    } },
    { kind: "scene", group: SCENE_GROUP }
  ];

  /* 0.2.0 场景切片 SceneSlice */
  var SCENE = {
    location_id: "tianshan_library",
    tick: REV,
    world_rev: REV,
    players: [
      {
        character_id: "char_player_01", name: "燕归尘", state: "online",
        location_id: "tianshan_library", is_proxy_npc: false
      },
      {
        character_id: "char_player_02", name: "同行弟子", state: "online",
        location_id: "tianshan_library", is_proxy_npc: false
      }
    ],
    npc_proxies: [CHARACTER.proxy_presence],
    group: SCENE_GROUP,
    messages: [
      {
        message_id: "msg_mock_01", tick: REV, kind: "chat",
        from_character_id: "char_player_02", from_name: "同行弟子",
        to_character_id: "char_player_01", text: "阁中借一步说话？",
        created_at: "2026-11-09T09:00:00+08:00"
      }
    ],
    has_more: false
  };

  /* 0.2.0 玩家交互回执与列表 */
  var INTERACTION_ACCEPTED = {
    interaction_id: "ix_mock_01",
    status: "pending",
    scheduled_tick: 129
  };
  var INTERACTIONS = {
    items: [
      {
        interaction_id: "ix_mock_01", tick: REV, kind: "gift",
        from_character_id: "char_player_01", to_character_id: "char_player_02",
        item_id: "it_book_01", text: "把这卷旧籍赠予同门",
        status: "pending", verdict_ref: "ver_mock_01"
      }
    ],
    has_more: false
  };

  /* 离线纪要 Recap（0.2.0 新增 proxy_encounters） */
  var RECAP = {
    overview: [
      "你闭关七日，门派诸事安宁，并无大变。",
      "托管期间日常修行不辍，按章程行事，未越雷池。",
      "归山之时，尚有两件事待你亲自处置。"
    ],
    world_changes: [
      "秋汛已至，公田开镰，门中多了几分忙碌。",
      "西域义军的使者已下山，留下一封书信。"
    ],
    proxy_log: [
      {
        event_id: "ev_0000130",
        tick: 130,
        summary: "依日常章程在演武场练功，未与他人争执",
        soft_deniable: true
      },
      {
        event_id: "ev_0000133",
        tick: 133,
        summary: "按轮值下山助农半日，如期归山",
        soft_deniable: true
      }
    ],
    proxy_encounters: [
      {
        event_id: "ev_0000131",
        tick: 131,
        summary: "有人于藏经阁与你闲谈数句，你依章程简答",
        soft_deniable: true
      }
    ],
    pending_matters: [
      "施延年在藏经阁留了一部典籍，等你去取。",
      "破阵子长老请你得空往议事厅一叙。"
    ],
    character_now: CHARACTER,
    has_more: false
  };

  /* 申诉相关 Sanction（0.2.0 新增 issued_tick / review_stage / verdict_ref） */
  var SANCTION = {
    sanction_id: "san_mock_01",
    character_id: "char_player_01",
    level: "warn",
    reason: "行事言辞略有越界，先予警告",
    evidence: { note: "记录于案的原始片段" },
    status: "pending",
    issued_tick: REV,
    review_stage: "manual",
    verdict_ref: "ver_mock_01"
  };
  var SANCTIONS = { items: [SANCTION], has_more: false };

  /* 0.2.0 管理端 · 大世界天道（静态假数据；绝不含真实口令） */
  var ADMIN_LOGIN = {
    admin_token: "adm_mock_token",
    expires_in_sec: 3600
  };
  var ADMIN_OVERVIEW = {
    tick: REV,
    paused: false,
    online_players: 2,
    character_count: 12,
    npc_count: 34,
    pending_reviews: 1,
    event_count: 128,
    recent_events: [
      {
        event_id: "ev_0000128", tick: REV, kind: "world_decree",
        location_id: "tianshan_library", fact_level: "hard", visibility: "public",
        payload: {}, summary: "瀚海商道骤起风沙，各处驿路暂闭三日"
      }
    ]
  };
  var ADMIN_REVIEWS = {
    items: [
      {
        audit_id: "aud_mock_01", tick: REV, source_kind: "interaction",
        source_id: "ix_mock_01", excerpt: "把这卷旧籍赠予同门",
        verdict: {
          verdict: "soft", rule_hits: ["power_claim"], evidence: "赠予描述略带越界措辞",
          confidence: 0.62, suggested_action: "warn", rationale: "语义待人工复核"
        },
        review_stage: "manual", status: "pending"
      }
    ],
    has_more: false
  };
  var ADMIN_DECISION = {
    audit_id: "aud_mock_01",
    status: "decided",
    review_stage: "closed"
  };
  var ADMIN_WORLD_EVENT = {
    event: ADMIN_OVERVIEW.recent_events[0],
    world_rev: REV
  };
  var ADMIN_ENTITIES = {
    type: "character",
    items: [
      {
        type: "character", id: "char_player_01", name: "燕归尘",
        location_id: "tianshan_library", state: "online",
        stats: CHARACTER.stats, money: CHARACTER.money,
        inventory: CHARACTER.inventory,
        impressions: CHARACTER.favor_view,
        raw: {}
      }
    ],
    has_more: false
  };
  var ADMIN_COMMAND = {
    command_id: "cmd_mock_01",
    command: "pause_world",
    applied: true,
    world_rev: REV,
    note: "临时维护"
  };

  HH.mock = {
    /* 1) /api/session —— 建立会话 */
    createSession: function () {
      return envelope({
        session_id: "s_mock_01",
        session_sig: "sig_mock_01",
        player_id: "player_mock_01",
        quota: {
          turns_left: 10,
          degraded: false,
          cooldown_sec: 0
        }
      });
    },

    /* 2) /api/world —— 世界公开切片 */
    getWorld: function () {
      return envelope(WORLD);
    },

    /* 3) /api/actions —— 意图入队（HTTP 202） */
    enqueueAction: function () {
      return envelope(ACTION_ACCEPTED);
    },

    /* 4) /api/actions/:id —— 查询结算状态 */
    getActionStatus: function () {
      return envelope(ACTION_STATUS);
    },

    /* 5) /api/stream/:id —— SSE 帧；"joint" 返回合流演出帧序 */
    getStreamFrames: function (mode) {
      return (mode === "joint" ? JOINT_FRAMES : STREAM_FRAMES).slice();
    },

    /* 6) /api/character —— 自身角色只读视图 */
    getCharacter: function () {
      return envelope(CHARACTER);
    },

    /* 7) /api/recap —— 离线纪要 */
    getRecap: function () {
      return envelope(RECAP);
    },

    /* 8) /api/proxy/persona —— 保存行为章程 */
    savePersona: function () {
      return envelope({ saved: true });
    },

    /* 9) /api/appeal —— 提交申诉，进人工复核 */
    createAppeal: function () {
      return envelope(SANCTION);
    },

    /* 10) /api/character（写）—— 创建角色（HTTP 201） */
    createCharacter: function () {
      return envelope(CHARACTER);
    },

    /* 11) /api/recap/deny —— 软否认，只改叙事不改数值 */
    denyRecapEntry: function () {
      return envelope({ accepted: true });
    },

    /* 12) /api/health —— 健康检查，按契约为裸对象 */
    getHealth: function () {
      return {
        contract_version: VERSION,
        status: "ok",
        world_tick: REV,
        online_players: 2
      };
    },

    /* 13) /api/scene —— 场景切片（0.2.0） */
    getScene: function () {
      return envelope(SCENE);
    },

    /* 14) /api/interactions（写）—— 玩家间交互统一入口（HTTP 202） */
    createInteraction: function () {
      return envelope(INTERACTION_ACCEPTED);
    },

    /* 15) /api/interactions —— 交互与消息分页 */
    getInteractions: function () {
      return envelope(INTERACTIONS);
    },

    /* 16) /api/sanctions —— 处罚详情与申诉进度 */
    getSanctions: function () {
      return envelope(SANCTIONS);
    },

    /* 17) /api/character/reroll（写）—— 重掷随机出身/点数 */
    rerollCharacter: function () {
      return envelope({ roll: ROLL, character: CHARACTER });
    },

    /* 18) /api/stream/scene —— 场景 SSE 帧 */
    getSceneStreamFrames: function () {
      return SCENE_FRAMES.slice();
    },

    /* 19) /api/admin/login —— 站长登录（假 token，不含真实口令） */
    adminLogin: function () {
      return envelope(ADMIN_LOGIN);
    },

    /* 20) /api/admin/overview —— 全局总览 */
    getAdminOverview: function () {
      return envelope(ADMIN_OVERVIEW);
    },

    /* 21) /api/admin/reviews —— 人工审核队列 */
    getAdminReviews: function () {
      return envelope(ADMIN_REVIEWS);
    },

    /* 22) /api/admin/reviews/:id —— 裁定 */
    decideAdminReview: function () {
      return envelope(ADMIN_DECISION);
    },

    /* 23) /api/admin/world-events —— 发布全局事件（HTTP 201） */
    publishWorldEvent: function () {
      return envelope(ADMIN_WORLD_EVENT);
    },

    /* 24) /api/admin/entities —— 角色 / NPC 全量查看 */
    getAdminEntities: function () {
      return envelope(ADMIN_ENTITIES);
    },

    /* 25) /api/admin/commands —— 站长命令 */
    runAdminCommand: function () {
      return envelope(ADMIN_COMMAND);
    }
  };
})();
