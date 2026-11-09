/**
 * i18n-keys.js - 《瀚海归义录》联机版新增提示文案表
 * CONTRACT_VERSION = 0.2.0 | REVISION R5
 *
 * 仅覆盖 contracts/types.ts 中 I18N_KEYS 列出的联机新增 key；
 * 原版 UI 既有中文文案属既有资产，不在此表、不迁移、不重写。
 * 形态：原生 IIFE，挂 window.HHAdapter.i18n，零构建、零依赖。
 *
 * 0.2.0：玩家端 28 → 61 个 key（创角 8 / 背包 5 / 场景 5 / 交互 8 / 裁决 4 / 错误 3）；
 * 管理端 I18N_KEYS_ADMIN 另 12 个，挂 window.HHAdapter.i18nAdmin，与玩家端分表 [P6]。
 * 逐字对齐 types.ts，不多不少；组件内禁止硬编码中文，一律查此表。
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

    /* 错误三 key（0.1.0） */
    "error.contract_mismatch": "契约版本不符，请更新客户端",
    "error.quota_exceeded": "今日行动之数已尽",
    "error.readonly": "此乃只读之境，不可更改",

    /* 0.2.0 创角 / 随机出身（8） */
    "create.title": "创立角色",
    "create.name": "名号",
    "create.persona": "挂机人设",
    "create.proxy_tier": "托管档位",
    "create.submit": "入世",
    "create.rolled_origin": "随机出身",
    "create.point_pool": "可分配点数",
    "create.reroll": "重掷",

    /* 0.2.0 背包 / 金钱（5） */
    "inventory.title": "行囊",
    "inventory.money": "银钱",
    "inventory.empty": "行囊空空",
    "inventory.item": "物件",
    "inventory.quantity": "数量",

    /* 0.2.0 场景 / 共同演出（5） */
    "scene.title": "此间",
    "scene.players": "在场之人",
    "scene.npc": "山中故人",
    "scene.joint": "同场共演",
    "scene.speaker": "说话人",

    /* 0.2.0 玩家间交互（8） */
    "interaction.gift": "赠予",
    "interaction.trade": "交易",
    "interaction.spar": "切磋",
    "interaction.message": "留言",
    "interaction.chat": "闲谈",
    "interaction.observe": "观战",
    "interaction.accept": "应允",
    "interaction.decline": "婉拒",

    /* 0.2.0 违规 / 处罚 / 申诉（4） */
    "verdict.warn": "行事失度",
    "verdict.detail": "处罚详情",
    "verdict.appeal": "申诉",
    "verdict.status": "复核进度",

    /* 0.2.0 新增错误态（3） */
    "error.conflict_mutex": "此物已归他人，请重新查看",
    "error.joint_closed": "同场共演已散",
    "error.interaction_blocked": "此举未获准许"
  };

  /* 管理端独立文案表（大世界天道，12 key；逐字对齐 I18N_KEYS_ADMIN） */
  HH.i18nAdmin = {
    "admin.title": "大世界天道",
    "admin.login": "验明身份",
    "admin.password": "口令",
    "admin.submit": "入内",
    "admin.overview": "天地总览",
    "admin.reviews": "待审裁决",
    "admin.approve": "准",
    "admin.reject": "驳",
    "admin.world_event": "颁行世界事件",
    "admin.characters": "众生名册",
    "admin.npcs": "山中人物",
    "admin.logout": "退席"
  };
})();
