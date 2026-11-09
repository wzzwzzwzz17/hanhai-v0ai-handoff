/**
 * i18n-keys.js - 《瀚海归义录》联机版新增提示文案表
 * CONTRACT_VERSION = 0.1.0
 *
 * 仅覆盖 contracts/types.ts 中 I18N_KEYS 列出的联机新增 key；
 * 原版 UI 既有中文文案属既有资产，不在此表、不迁移、不重写。
 * 形态：原生 IIFE，挂 window.HHAdapter.i18n，零构建、零依赖。
 *
 * 说明：types.ts 的 I18N_KEYS 实际逐个数为 28 个（任务卡写 26），
 * 已按契约逐字全部覆盖，不多不少；详见 handoff/DOUBAO-DELIVERY.md。
 */
(function () {
  var HH = window.HHAdapter = window.HHAdapter || {};

  HH.i18n = {
    /* 世界四 key */
    "world.time": "时辰",
    "world.season": "四时",
    "world.faction": "门派",
    "world.chronicle": "江湖纪事",

    /* 角色四 key */
    "char.stamina": "体力",
    "char.action_points": "行动点",
    "char.state": "状态",
    "char.location": "所在",

    /* 角色状态四 key */
    "state.online": "在线",
    "state.proxy": "托管中",
    "state.spectator": "旁观",
    "state.offline": "离线",

    /* 行动四 key */
    "action.submit": "行事",
    "action.waiting": "静待结算",
    "action.accepted": "已接令",
    "action.rejected": "未获准",

    /* 离线纪要六 key */
    "recap.overview": "三句总览",
    "recap.world_changes": "江湖之变",
    "recap.proxy_log": "托管行止",
    "recap.pending_matters": "待了之务",
    "recap.character_now": "今日之我",
    "recap.expand": "展开详情",

    /* 处决/旁观三 key */
    "death.epitaph": "墓志铭",
    "death.rumors": "江湖传闻",
    "death.new_character": "另起新身",

    /* 错误三 key */
    "error.contract_mismatch": "契约版本不符，请更新客户端",
    "error.quota_exceeded": "今日行动之数已尽",
    "error.readonly": "此乃只读之境，不可更改"
  };
})();
