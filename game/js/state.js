/* ============================================================
   state.js — сохранение, валюты, квесты, достижения
   ============================================================ */
var SAVE_KEY = 'bc_chaosforge_save_v2';
var S = null;

var ST = (function () {
  'use strict';

  function defaults() {
    return {
      v: 2,
      created: U.now(),
      lastSeen: U.now(),
      /* валюты */
      gold: 0, crystals: 0, souls: 0, cores: 0, seals: 0, sparks: 0,
      tokens: 0, medals: 0, keys: 0, tickets: 3, dust: 0, shards: 0,
      reputation: { smiths: 0, goblins: 0, skeletons: 0, dragons: 0, chaos: 0 },
      /* прогресс */
      wave: 1, maxWave: 1, kills: 0, bossKills: 0, taps: 0, ults: 0, crits: 0,
      prestige: 0, ascension: 0, transcend: 0, awaken: 0,
      forgeUpg: 0, merges: 0, gachaOpens: 0,
      killedDev: 0, killedAdmin: 0, killedChaos: 0,
      maxGold: 0, offHours: 0, chaosItems: 0,
      /* герой */
      hero: { cls: 'warrior', level: 1, xp: 0, tp: 1 },
      heroes: { warrior: 1 },
      squad: ['warrior'],
      activeSquad: 0,
      upg: { dmg: 0, hp: 0, spd: 0, crit: 0, gold: 0, luck: 0, tap: 0, off: 0 },
      /* вещи */
      equip: { weapon: null, armor: null, helmet: null, boots: null, gloves: null, belt: null, amulet: null, ring: null, cloak: null, pet: null, artifact: null, relic: null },
      inv: [],
      runes: [],          // {k, lvl}
      pets: {},           // {key: level}
      petEquipped: null,
      artifacts: [],      // собранные артефакты
      collection: {},     // key -> count
      /* таланты и деревья */
      talents: {},        // k -> lvl
      ptree: {},          // k -> lvl (все 4 дерева)
      /* временное */
      gates: [],          // активные баффы врат
      weather: { k: 'clear', until: 15 },
      mgBuffs: [],
      x2Until: 0,
      /* пропуск */
      bp: { xp: 0, level: 0, premium: false, claimed: {}, season: 1 },
      /* задания */
      quests: { daily: null, weekly: null, season: null, day: '', week: '' },
      achievements: {},
      titles: { unlocked: ['newbie'], current: 'newbie' },
      /* прочее */
      stats: { killsByType: {}, goldEarned: 0, dmgDealt: 0, itemsFound: 0, bestHit: 0, deaths: 0, adsWatched: 0, mgPlayed: 0 },
      settings: { sound: true, music: true, shake: true, particles: 2, auto: false, quality: 1 },
      filter: { autoSell: -1, keepRarity: 0 },
      codes: {},
      merchant: { items: null, refresh: 0 },
      gacha: { pity: 0 },
      arena: { rating: 1000, fights: 0, wins: 0 },
      minigame: { last: 0 },
      offline: null,
      seen: {},
      mg: null
    };
  }

  function init() {
    S = defaults();
    var raw = U.store.get(SAVE_KEY);
    if (raw) {
      try {
        var o = JSON.parse(raw);
        S = merge(S, o);
      } catch (e) { console.warn('save corrupt', e); }
    }
    ensure();
    return S;
  }

  function merge(base, o) {
    if (o === null || typeof o !== 'object') return base;
    Object.keys(o).forEach(function (k) {
      var b = base[k], v = o[k];
      if (Array.isArray(b) || b === null || typeof b !== 'object' || Array.isArray(v)) base[k] = v === undefined ? b : v;
      else if (typeof v === 'object' && v !== null && typeof b === 'object' && b !== null) base[k] = merge(b, v);
      else base[k] = v;
    });
    return base;
  }

  function ensure() {
    if (!S.equip) S.equip = {};
    D.SLOTS.forEach(function (s) { if (!(s.k in S.equip)) S.equip[s.k] = null; });
    if (!S.inv) S.inv = [];
    if (!S.upg) S.upg = {};
    D.UPGRADES.forEach(function (u) { if (S.upg[u.k] === undefined) S.upg[u.k] = 0; });
    if (!S.stats.killsByType) S.stats.killsByType = {};
    if (S.bp.level === undefined) S.bp = { xp: 0, level: 0, premium: false, claimed: {}, season: 1 };
    if (!S.quests) S.quests = { daily: null, weekly: null, season: null, day: '', week: '' };
    if (!S.titles) S.titles = { unlocked: ['newbie'], current: 'newbie' };
    if (!S.heroes) S.heroes = { warrior: 1 };
    if (!S.squad) S.squad = ['warrior'];
    if (S.squad.indexOf('warrior') < 0) S.squad.push('warrior');
    if (!S.mg) S.mg = null;
  }

  function save() {
    try {
      S.lastSeen = U.now();
      U.store.set(SAVE_KEY, JSON.stringify(S));
    } catch (e) { console.warn('save failed', e); }
  }
  function wipe() {
    U.store.del(SAVE_KEY);
    S = defaults();
    ensure();
  }

  /* ---------- валюты ---------- */
  function add(k, v) {
    if (typeof S[k] !== 'number') S[k] = 0;
    S[k] += v;
    if (k === 'gold') {
      if (S[k] > S.maxGold) S.maxGold = S[k];
      S.stats.goldEarned += Math.max(0, v);
      if (S[k] < 0) S[k] = 0;
    }
    if (v > 0 && window.UI && UI.bumpCur) UI.bumpCur(k);
  }
  function spend(k, v) {
    if ((S[k] || 0) < v) return false;
    S[k] -= v;
    if (k === 'gold' && S[k] < 0) S[k] = 0;
    return true;
  }
  function can(k, v) { return (S[k] || 0) >= v; }

  /* ---------- опыт героя ---------- */
  function xpNeed(level) { return Math.floor(50 * Math.pow(1.28, level - 1)); }
  function gainXP(v) {
    S.hero.xp += v;
    var levels = 0;
    while (S.hero.xp >= xpNeed(S.hero.level)) {
      S.hero.xp -= xpNeed(S.hero.level);
      S.hero.level++;
      S.hero.tp++;
      levels++;
    }
    if (levels > 0) {
      U.toast('🎉 Уровень героя <b>' + S.hero.level + '</b>! +' + levels + ' очко талантов', 'epic', true);
      if (window.Audio2) Audio2.sfx('levelup');
      checkTitles();
    }
    return levels;
  }

  /* ---------- достижения ---------- */
  function hasAch(k) { return !!S.achievements[k]; }
  function unlockAch(k) {
    if (S.achievements[k]) return false;
    var a = null;
    for (var i = 0; i < D.ACHIEVEMENTS.length; i++) if (D.ACHIEVEMENTS[i].k === k) a = D.ACHIEVEMENTS[i];
    if (!a) return false;
    S.achievements[k] = U.now();
    var rw = a.r || {};
    if (rw.gold) add('gold', rw.gold);
    if (rw.crystals) add('crystals', rw.crystals);
    U.toast('🏆 Достижение: <b>' + a.n + '</b>' + (rw.crystals ? ' (+' + rw.crystals + '💎)' : ''), 'epic', true);
    if (window.Audio2) Audio2.sfx('achieve');
    checkTitles();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function checkAch() {
    var st = S.stats;
    if (S.kills >= 1) unlockAch('first_blood');
    if (S.maxWave >= 10) unlockAch('wave10');
    if (S.maxWave >= 25) unlockAch('wave25');
    if (S.maxWave >= 50) unlockAch('wave50');
    if (S.maxWave >= 100) unlockAch('wave100');
    if (S.bossKills >= 1) unlockAch('boss1');
    if (S.bossKills >= 10) unlockAch('boss10');
    if (S.bossKills >= 50) unlockAch('boss50');
    if (S.merges >= 1) unlockAch('merge1');
    if (S.merges >= 50) unlockAch('merge50');
    if (S.forgeUpg >= 10) unlockAch('forge10');
    if (S.forgeUpg >= 100) unlockAch('forge100');
    if (Object.keys(S.pets).length >= 1) unlockAch('pet1');
    if (Object.keys(S.pets).length >= 5) unlockAch('pet5');
    if (S.taps >= 1000) unlockAch('tap1000');
    if (S.ults >= 50) unlockAch('ult50');
    if (S.stats.goldEarned >= 1e6) unlockAch('million');
    if (S.stats.goldEarned >= 1e9) unlockAch('billion');
    if (S.stats.adsWatched >= 1) unlockAch('ad1');
    if (S.stats.mgPlayed >= 1) unlockAch('minigame1');
    if (Object.keys(S.codes).length >= 1) unlockAch('code1');
    if (S.gachaOpens >= 10) unlockAch('gacha10');
    if (S.arena.fights >= 1) unlockAch('arena1');
    var runes = 0;
    D.SLOTS.forEach(function (sl) { var it = S.equip[sl.k]; if (it && it.runes) runes += it.runes.length; });
    if (runes >= 10) unlockAch('rune10');
    if (S.prestige >= 1) unlockAch('prestige1');
    if (S.prestige >= 10) unlockAch('prestige10');
  }

  /* ---------- титулы ---------- */
  function titleCtx() {
    var runes = 0, col = 0, chaos = 0;
    Object.keys(S.collection).forEach(function (k) { col += S.collection[k]; });
    D.SLOTS.forEach(function (sl) { var it = S.equip[sl.k]; if (it && it.runes) runes += it.runes.length; });
    S.inv.concat(Object.keys(S.equip).map(function (k) { return S.equip[k]; })).forEach(function (it) {
      if (it && it.rar >= 7) chaos++;
    });
    return {
      kills: S.kills, maxGold: S.maxGold, maxWave: S.maxWave, prestige: S.prestige,
      collection: col, forgeUpg: S.forgeUpg, bossKills: S.bossKills, chaosItems: chaos + S.chaosItems,
      taps: S.taps, offHours: S.offHours, killedDev: S.killedDev, killedAdmin: S.killedAdmin, killedChaos: S.killedChaos
    };
  }
  function checkTitles() {
    var ctx = titleCtx();
    D.TITLES.forEach(function (t) {
      if (!t.c || S.titles.unlocked.indexOf(t.k) >= 0) return;
      var parts = t.c.split('>=');
      if (parts.length === 2 && (ctx[parts[0]] || 0) >= parseFloat(parts[1])) {
        S.titles.unlocked.push(t.k);
        U.toast('🎖️ Новый титул: <b>' + t.n + '</b>', 'epic', true);
      }
    });
  }
  function titleBonus() {
    var b = {};
    var t = null;
    for (var i = 0; i < D.TITLES.length; i++) if (D.TITLES[i].k === S.titles.current) t = D.TITLES[i];
    if (t && t.e) b = t.e;
    return b;
  }

  /* ---------- квесты ---------- */
  function rollQuests(pool, n) {
    var list = U.shuffle(pool.slice()).slice(0, n);
    return list.map(function (q) {
      var v = Math.round(U.rnd(q.v[0], q.v[1]));
      var step = Math.pow(10, Math.max(0, String(Math.round(v)).length - 1));
      v = Math.max(1, Math.round(v / step) * step);
      return { k: q.k, t: q.t, label: q.n, n: v, p: 0, r: q.r, done: false, claimed: false };
    });
  }
  function ensureQuests() {
    var day = U.todayKey(), wk = U.weekKey();
    if (S.quests.day !== day || !S.quests.daily) {
      S.quests.daily = rollQuests(D.QUEST_POOL.daily, 3);
      S.quests.day = day;
      S.tickets = Math.min(9, S.tickets + 1);
    }
    if (S.quests.week !== wk || !S.quests.weekly) {
      S.quests.weekly = rollQuests(D.QUEST_POOL.weekly, 2);
      S.quests.week = wk;
    }
    if (!S.quests.season) S.quests.season = rollQuests(D.QUEST_POOL.season, 3);
  }
  function questProgress(type, amount) {
    ['daily', 'weekly', 'season'].forEach(function (grp) {
      var l = S.quests[grp];
      if (!l) return;
      l.forEach(function (q) {
        if (q.t !== type || q.done) return;
        q.p = Math.min(q.n, q.p + amount);
        if (q.p >= q.n) {
          q.done = true;
          U.toast('✅ Задание выполнено: ' + q.k, 'big');
          if (window.UI) UI.dirty = true;
        }
      });
    });
    var dailyDone = (S.quests.daily || []).filter(function (q) { return q.done; }).length;
    if (dailyDone >= 5) unlockAch('daily5');
  }
  function bpXp(v) {
    S.bp.xp += v;
    var levels = 0;
    while (S.bp.xp >= D.BP.xpPerLevel && S.bp.level < D.BP.levels) {
      S.bp.xp -= D.BP.xpPerLevel;
      S.bp.level++;
      levels++;
      U.toast('🎟️ Пропуск: уровень <b>' + S.bp.level + '</b>!', 'epic');
    }
    if (levels && window.UI) UI.dirty = true;
  }

  /* ---------- оффлайн ---------- */
  function offlineCap() { return 2 + (S.upg.off || 0); }
  function offlineReport() {
    var elapsed = (U.now() - (S.lastSeen || U.now())) / 1000;
    if (elapsed < 60) return null;
    var cap = offlineCap() * 3600;
    var sec = Math.min(elapsed, cap);
    var gpm = window.Stats ? Stats.goldPerMinute() : 0;
    var gold = gpm * (sec / 60);
    var items = Math.floor(sec / 900);
    /* оффлайн считаем на (maxWave-10) этапе */
    var wave = Math.max(1, S.maxWave - 10);
    return { sec: sec, gold: gold, items: items, wave: wave, capped: elapsed > cap };
  }

  return {
    defaults: defaults, init: init, save: save, wipe: wipe, ensure: ensure, merge: merge,
    add: add, spend: spend, can: can, gainXP: gainXP, xpNeed: xpNeed,
    unlockAch: unlockAch, hasAch: hasAch, checkAch: checkAch, checkTitles: checkTitles,
    titleBonus: titleBonus, titleCtx: titleCtx,
    ensureQuests: ensureQuests, questProgress: questProgress, rollQuests: rollQuests, bpXp: bpXp,
    offlineCap: offlineCap, offlineReport: offlineReport
  };
})();
if (typeof window !== 'undefined') window.ST = ST;
