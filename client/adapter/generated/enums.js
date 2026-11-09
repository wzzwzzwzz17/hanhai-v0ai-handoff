/**
 * enums.js - 《瀚海归义录》联机版运行时枚举表
 * CONTRACT_VERSION = 0.2.0 | REVISION R5
 *
 * 覆盖 contracts/types.ts 全部 21 个 type 联合（含 ApiErrorCode）。
 * 0.2.0：原 13 组 + ItemCategory / InteractionKind / InteractionStatus /
 *        SceneGroupStatus / SpeakerKind / ReviewStage / AdminCommand / ReviewDecision 共 8 组。
 * 每个联合统一形态：{ values: 常量数组, labels: 取值到中文标签的映射 }。
 * 取值逐字对齐 types.ts，禁止增减；形态：原生 IIFE，挂 window.HHAdapter.enums。
 */
(function () {
  var HH = window.HHAdapter = window.HHAdapter || {};

  function makeEnum(values, labels) {
    return { values: values, labels: labels };
  }

  HH.enums = {
    /* 1. 角色在线/托管状态 */
    CharacterState: makeEnum(
      ["online", "proxy", "spectator", "offline"],
      { online: "在线", proxy: "托管中", spectator: "旁观", offline: "离线" }
    ),

    /* 2. 账号状态 */
    PlayerStatus: makeEnum(
      ["active", "restricted", "banned"],
      { active: "正常", restricted: "受限", banned: "封禁" }
    ),

    /* 3. 事实等级 */
    FactLevel: makeEnum(
      ["hard", "soft"],
      { hard: "硬事实", soft: "软事实" }
    ),

    /* 4. 事件可见性 */
    Visibility: makeEnum(
      ["public", "faction", "location", "private"],
      { public: "公开", faction: "门派", location: "此地", private: "私密" }
    ),

    /* 5. 意图行动类型（受控词表，0.2.0 14 值） */
    IntentType: makeEnum(
      [
        "visit", "move", "train", "study", "rest", "work", "trade",
        "talk", "spar", "bounty", "explore", "skip_week", "minigame",
        "allocate_points"
      ],
      {
        visit: "拜访", move: "前往", train: "练武", study: "学艺",
        rest: "休息", work: "打杂", trade: "交易", talk: "对话",
        spar: "切磋", bounty: "悬赏", explore: "探索",
        skip_week: "跳过一周", minigame: "小游戏", allocate_points: "分配点数"
      }
    ),

    /* 6. 行动队列状态 */
    ActionStatus: makeEnum(
      ["pending", "settled", "rejected", "compensated"],
      { pending: "待结算", settled: "已结算", rejected: "已拒绝", compensated: "已补偿" }
    ),

    /* 7. 裁决等级 */
    Verdict: makeEnum(
      ["ok", "soft", "hard"],
      { ok: "合规", soft: "轻度", hard: "重度" }
    ),

    /* 8. 裁决建议动作 */
    SuggestedAction: makeEnum(
      ["none", "warn", "debuff", "execute"],
      { none: "无需处置", warn: "警告", debuff: "减损", execute: "处决" }
    ),

    /* 9. 托管档位 */
    ProxyTier: makeEnum(
      ["still", "daily", "active"],
      { still: "静守", daily: "日常", active: "积极" }
    ),

    /* 10. 处决/处罚等级 */
    SanctionLevel: makeEnum(
      ["warn", "debuff", "execute"],
      { warn: "警告", debuff: "减损", execute: "处决" }
    ),

    /* 11. 申诉/处罚状态 */
    SanctionStatus: makeEnum(
      ["pending", "confirmed", "overturned", "appealed"],
      { pending: "待审", confirmed: "已确认", overturned: "已推翻", appealed: "已申诉" }
    ),

    /* 12. 审核阶段（0.2.0） */
    ReviewStage: makeEnum(
      ["rule", "semantic", "manual", "closed"],
      { rule: "规则命中", semantic: "语义判定", manual: "人工复核", closed: "已结案" }
    ),

    /* 13. 季节（数字联合 0|1|2|3） */
    Season: makeEnum(
      [0, 1, 2, 3],
      { 0: "春", 1: "夏", 2: "秋", 3: "冬" }
    ),

    /* 14. 接口错误码（0.2.0：CONFLICT 语义收窄） */
    ApiErrorCode: makeEnum(
      [
        "UNAUTHORIZED", "FORBIDDEN", "BAD_REQUEST", "UNMAPPABLE_INTENT",
        "RATE_LIMITED", "NOT_FOUND", "CONFLICT", "STREAM_EXPIRED", "INTERNAL"
      ],
      {
        UNAUTHORIZED: "会话无效",
        FORBIDDEN: "无权访问",
        BAD_REQUEST: "请求不合契约",
        UNMAPPABLE_INTENT: "无法领会此意",
        RATE_LIMITED: "行动过频",
        NOT_FOUND: "查无此物",
        CONFLICT: "此物已归他人",
        STREAM_EXPIRED: "叙事已过期",
        INTERNAL: "服务有误"
      }
    ),

    /* 15. 物品分类（0.2.0） */
    ItemCategory: makeEnum(
      ["equipment", "consumable", "material", "quest", "currency"],
      {
        equipment: "装备", consumable: "消耗品", material: "材料",
        quest: "任务之物", currency: "钱货"
      }
    ),

    /* 16. 玩家间交互类型（0.2.0） */
    InteractionKind: makeEnum(
      ["gift", "trade", "spar", "message", "chat", "observe", "rate", "accept", "decline"],
      {
        gift: "赠予", trade: "交易", spar: "切磋", message: "留言",
        chat: "闲谈", observe: "观战", rate: "评价",
        accept: "应允", decline: "婉拒"
      }
    ),

    /* 17. 交互状态（0.2.0） */
    InteractionStatus: makeEnum(
      ["pending", "accepted", "declined", "settled", "rejected"],
      {
        pending: "待回应", accepted: "已应允", declined: "已婉拒",
        settled: "已结算", rejected: "未获准"
      }
    ),

    /* 18. 合流演出组状态（0.2.0） */
    SceneGroupStatus: makeEnum(
      ["forming", "playing", "closed"],
      { forming: "正在成组", playing: "同场共演中", closed: "共演已散" }
    ),

    /* 19. 叙事说话人类型（0.2.0） */
    SpeakerKind: makeEnum(
      ["npc", "player", "proxy", "narrator"],
      { npc: "山中人", player: "同行者", proxy: "托管之人", narrator: "旁白" }
    ),

    /* 20. 站长命令受控词表（0.2.0 大世界天道） */
    AdminCommand: makeEnum(
      [
        "ban", "unban", "grant_quota", "set_tier", "pause_world",
        "resume_world", "force_tick", "reseed_origin", "compensate"
      ],
      {
        ban: "封禁", unban: "解封", grant_quota: "调整配额", set_tier: "改托管档位",
        pause_world: "暂停世界", resume_world: "恢复世界", force_tick: "强制推进",
        reseed_origin: "重置出身", compensate: "救济补偿"
      }
    ),

    /* 21. 人工审核裁定（0.2.0 大世界天道） */
    ReviewDecision: makeEnum(
      ["approve", "reject", "reclassify", "sanction"],
      { approve: "准", reject: "驳", reclassify: "改判", sanction: "予以处罚" }
    )
  };
})();
