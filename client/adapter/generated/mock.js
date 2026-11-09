/**
 * mock.js - 《瀚海归义录》联机版纯静态假数据
 * CONTRACT_VERSION = 0.1.0
 *
 * 与 contracts/api-v0.md 的 12 个端点一一对应，函数返回完整 ApiEnvelope<T>
 * （health 端点按 api-v0 约定为裸对象）。world_rev 与 tick 固定 128。
 * getStreamFrames 按 delta -> authoritative -> done 顺序产出帧，供适配层状态机验收。
 *
 * 纯静态、无状态计算、不累加数值：所有数值只作为服务端 authoritative 快照的
 * 固定内容出现，客户端调用任意次数返回值均不变。
 * 形态：原生 IIFE，挂 window.HHAdapter.mock，零构建、零依赖。
 */
(function () {
  var HH = window.HHAdapter = window.HHAdapter || {};
  var REV = 128;

  /* 统一成功外层 ApiEnvelope<T> */
  function envelope(data) {
    return {
      contract_version: "0.1.0",
      ok: true,
      data: data,
      world_rev: REV
    };
  }

  /* 服务端权威角色快照（CharacterView，字段逐字对齐 types.ts） */
  var CHARACTER = {
    character_id: "char_player_01",
    name: "燕归尘",
    age: 20,
    state: "online",
    alive: true,
    location_id: "tianshan_library",
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
      "根骨": 25,
      "悟性": 30,
      "心性": 28,
      "魅力": 26
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

  /* 世界公开切片 WorldSlice */
  var WORLD = {
    tick: REV,
    year: 3,
    week: 8,
    season: 2,
    paused: false,
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

  /* 流式叙事帧 StreamFrame：delta -> authoritative -> done */
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

  /* 离线纪要 Recap */
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
    pending_matters: [
      "施延年在藏经阁留了一部典籍，等你去取。",
      "破阵子长老请你得空往议事厅一叙。"
    ],
    character_now: CHARACTER,
    has_more: false
  };

  /* 申诉相关 Sanction（人工复核，pending） */
  var SANCTION = {
    sanction_id: "san_mock_01",
    character_id: "char_player_01",
    level: "warn",
    reason: "行事言辞略有越界，先予警告",
    evidence: { note: "记录于案的原始片段" },
    status: "pending"
  };

  HH.mock = {
    /* 1) 端点 /api/session —— 建立会话 */
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

    /* 2) 端点 /api/world —— 世界公开切片 */
    getWorld: function () {
      return envelope(WORLD);
    },

    /* 3) 端点 /api/actions —— 意图入队，返回排队序号（HTTP 202） */
    enqueueAction: function () {
      return envelope(ACTION_ACCEPTED);
    },

    /* 4) 端点 /api/actions/:id —— 查询结算状态 */
    getActionStatus: function () {
      return envelope(ACTION_STATUS);
    },

    /* 5) 端点 /api/stream/:id —— SSE 帧（delta -> authoritative -> done） */
    getStreamFrames: function () {
      return STREAM_FRAMES.slice();
    },

    /* 6) 端点 /api/character —— 自身角色只读视图 */
    getCharacter: function () {
      return envelope(CHARACTER);
    },

    /* 7) 端点 /api/recap —— 离线纪要 */
    getRecap: function () {
      return envelope(RECAP);
    },

    /* 8) 端点 /api/proxy/persona —— 保存行为章程 */
    savePersona: function () {
      return envelope({ saved: true });
    },

    /* 9) 端点 /api/appeal —— 提交申诉，进人工复核 */
    createAppeal: function () {
      return envelope(SANCTION);
    },

    /* 10) 端点 /api/character（写入）—— 创建角色（HTTP 201），age 由服务端定 */
    createCharacter: function () {
      return envelope(CHARACTER);
    },

    /* 11) 端点 /api/recap/deny —— 软否认，只改叙事不改数值 */
    denyRecapEntry: function () {
      return envelope({ accepted: true });
    },

    /* 12) 端点 /api/health —— 健康检查，按契约为裸对象 */
    getHealth: function () {
      return {
        contract_version: "0.1.0",
        status: "ok",
        world_tick: REV
      };
    }
  };
})();
