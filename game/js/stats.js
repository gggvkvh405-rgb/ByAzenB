/* ============================================================
   stats.js — агрегация всех бонусов в боевые характеристики
   ============================================================ */
var Stats = (function () {
  'use strict';

  function newAgg() {
    return { flat: { dmg: 0, hp: 0 }, pct: {}, flags: {} };
  }
  function addEff(a, eff, lvl) {
    if (!eff) return;
    var fs = 1 + 0.25 * (lvl || 0);
    var ps = 1 + 0.08 * (lvl || 0);
    Object.keys(eff).forEach(function (k) {
      var v = eff[k];
      if (typeof v !== 'number') { a.flags[k] = Math.max(a.flags[k] || 0, v); return; }
      if (D.EF[k] && D.EF[k].flat) a.flat[k] = (a.flat[k] || 0) + v * fs;
      else a.pct[k] = (a.pct[k] || 0) + v * ps;
    });
  }

  /* ---------- экипировка ---------- */
  function equipAgg() {
    var a = newAgg();
    D.SLOTS.forEach(function (sl) {
      var it = S.equip[sl.k];
      if (!it) return;
      addEff(a, it.e, it.lvl || 0);
      if (it.runes && it.runes.length) {
        it.runes.forEach(function (r) {
          var rd = null;
          for (var i = 0; i < D.RUNES.length; i++) if (D.RUNES[i].k === r.k) rd = D.RUNES[i];
          if (rd) addEff(a, rd.e, r.lvl || 0);
        });
      }
    });
    return a;
  }

  /* ---------- сеты ---------- */
  function setAgg() {
    var a = newAgg(), counts = {};
    D.SLOTS.forEach(function (sl) {
      var it = S.equip[sl.k];
      if (it && it.set) counts[it.set] = (counts[it.set] || 0) + 1;
    });
    D.SETS.forEach(function (st) {
      var c = counts[st.k] || 0;
      if (c >= 3 && st.b3) addEff(a, st.b3, 0);
      if (c >= 5 && st.b5) addEff(a, st.b5, 0);
    });
    a.setCounts = counts;
    return a;
  }

  /* ---------- питомцы ---------- */
  function petAgg() {
    var a = newAgg();
    D.PETS.forEach(function (p) {
      var lvl = S.pets[p.k] || 0;
      if (!lvl) return;
      var full = (S.petEquipped === p.k);
      var eff = {};
      Object.keys(p.e).forEach(function (k) { eff[k] = p.e[k] * (full ? 1 : 0.2); });
      addEff(a, eff, lvl - 1);
    });
    return a;
  }

  /* ---------- таланты ---------- */
  function talentAgg() {
    var a = newAgg();
    Object.keys(D.TALENTS).forEach(function (br) {
      D.TALENTS[br].nodes.forEach(function (n) {
        var lvl = S.talents[n.k] || 0;
        if (!lvl) return;
        var eff = {};
        Object.keys(n.e).forEach(function (k) { eff[k] = n.e[k] * lvl; });
        addEff(a, eff, 0);
      });
    });
    return a;
  }

  /* ---------- деревья престижа ---------- */
  function ptreeAgg() {
    var a = newAgg();
    D.PTREES.forEach(function (t) {
      t.nodes.forEach(function (n) {
        var lvl = S.ptree[n.k] || 0;
        if (!lvl) return;
        var eff = {};
        Object.keys(n.e).forEach(function (k) { eff[k] = n.e[k] * lvl; });
        addEff(a, eff, 0);
      });
    });
    return a;
  }

  /* ---------- артефакты, врата, мини-игры, погода, биом ---------- */
  function miscAgg() {
    var a = newAgg();
    S.artifacts.forEach(function (ar) { addEff(a, ar.e, ar.lvl || 0); });
    S.gates.forEach(function (g) { addEff(a, g.e, 0); });
    S.mgBuffs.forEach(function (b) { if (b.until > U.now()) addEff(a, b.e, 0); });
    return a;
  }
  function weatherAgg() {
    var a = newAgg();
    var w = null;
    for (var i = 0; i < D.WEATHER.length; i++) if (D.WEATHER[i].k === S.weather.k) w = D.WEATHER[i];
    if (w) addEff(a, w.e, 0);
    return a;
  }
  function biomeAgg() {
    var a = newAgg();
    var b = D.BIOMES[biomeIndex()];
    if (b) addEff(a, b.mod, 0);
    return a;
  }
  function heroAgg() {
    var a = newAgg();
    S.squad.forEach(function (k, i) {
      var hd = null;
      for (var j = 0; j < D.HEROES.length; j++) if (D.HEROES[j].k === k) hd = D.HEROES[j];
      if (!hd) return;
      var mult = (i === (S.activeSquad || 0)) ? 1 : 0.5;
      var eff = {};
      Object.keys(hd.e).forEach(function (key) { eff[key] = hd.e[key] * mult; });
      addEff(a, eff, 0);
    });
    return a;
  }
  function titleAgg() {
    var a = newAgg();
    addEff(a, ST.titleBonus(), 0);
    return a;
  }

  function biomeIndex() {
    var per = 12;
    return Math.min(D.BIOMES.length - 1, Math.floor((S.wave - 1) / per) % D.BIOMES.length);
  }

  function collectionCount() {
    var c = 0;
    Object.keys(S.collection).forEach(function (k) { c += S.collection[k]; });
    return c;
  }

  function prestigeMult() {
    return 1 + 0.25 * S.prestige + 1.0 * S.ascension + 3 * S.transcend + 10 * S.awaken;
  }

  /* ---------- итог ---------- */
  function final() {
    var aggs = [equipAgg(), setAgg(), petAgg(), talentAgg(), ptreeAgg(), miscAgg(), weatherAgg(), biomeAgg(), heroAgg(), titleAgg()];
    var flat = { dmg: 0, hp: 0 }, pct = {}, flags = {};
    aggs.forEach(function (a) {
      Object.keys(a.flat).forEach(function (k) { flat[k] = (flat[k] || 0) + a.flat[k]; });
      Object.keys(a.pct).forEach(function (k) { pct[k] = (pct[k] || 0) + a.pct[k]; });
      Object.keys(a.flags).forEach(function (k) { flags[k] = Math.max(flags[k] || 0, a.flags[k]); });
    });

    /* улучшения */
    var up = S.upg;
    flat.dmg += up.dmg * 4 * (1 + up.dmg * 0.06);
    flat.hp += up.hp * 16 * (1 + up.hp * 0.05);
    pct.atkSpeed = (pct.atkSpeed || 0) + up.spd * 2;
    pct.crit = (pct.crit || 0) + up.crit * 6;
    pct.gold = (pct.gold || 0) + up.gold * 4;
    pct.luck = (pct.luck || 0) + up.luck * 5;
    pct.tap = (pct.tap || 0) + up.tap * 8;

    /* коллекция: +1% ко всему за каждые 10 предметов */
    var col = collectionCount();
    pct.allPct = (pct.allPct || 0) + col * 0.1;

    /* «ко всему» раскидывается */
    var allPct = pct.allPct || 0;
    if (allPct) D.ALL_PCT_KEYS.forEach(function (k) { pct[k] = (pct[k] || 0) + allPct; });

    /* герой */
    flat.dmg += 5 + S.hero.level * 2.5;
    flat.hp += 100 + S.hero.level * 8;

    var pm = prestigeMult();
    var dmgMult = (pct.dmgMult || 1) * pm;
    var hpMult = (pct.hpMult || 1) * (1 + 0.1 * S.prestige + 0.4 * S.ascension + 1.2 * S.transcend + 4 * S.awaken);
    var goldMult = (pct.goldMult || 1) * (1 + 0.05 * S.prestige);

    var dmg = flat.dmg * (1 + (pct.dmgPct || 0) / 100) * dmgMult;
    var maxHp = Math.max(1, flat.hp * (1 + (pct.hpPct || 0) / 100) * hpMult);
    var atkSpeed = Math.min(8, 1.0 * (1 + (pct.atkSpeed || 0) / 100));
    var crit = U.clamp(0.05 + (pct.crit || 0) / 200, 0.05, 0.8);
    var critMult = 1.5 + (pct.critDmg || 0) / 100;
    var tapDmg = dmg * (1 + (pct.tap || 0) / 100) * 0.8;
    var ultDmg = dmg * (10 + (pct.ultDmg || 0) / 100);

    var T = {
      pct: pct, flat: flat, flags: flags,
      dmg: dmg, maxHp: maxHp, atkSpeed: atkSpeed, crit: crit, critMult: critMult,
      tapDmg: tapDmg, ultDmg: ultDmg,
      gold: 1 + (pct.gold || 0) / 100,
      luck: 1 + (pct.luck || 0) / 100,
      vamp: (pct.vamp || 0) / 100,
      armor: (pct.armor || 0) / 100,
      dodge: (pct.dodge || 0) / 100,
      slow: (pct.slow || 0) / 100,
      poison: (pct.poison || 0) / 100,
      fire: (pct.fire || 0) / 100,
      shock: (pct.shock || 0) / 100,
      bleed: (pct.bleed || 0) / 100,
      stun: (pct.stun || 0) / 100,
      fear: (pct.fear || 0) / 100,
      heal: (pct.heal || 0) / 100,
      execute: (pct.execute || 0) / 100,
      rage: 1 + (pct.rage || 0) / 100,
      off: 1 + (pct.off || 0) / 100,
      craft: 1 + (pct.craft || 0) / 100,
      xp: 1 + (pct.xp || 0) / 100,
      dropChance: pct.dropChance || 1,
      nerfEnemy: (pct.nerfEnemy || 0) / 100,
      prestigeMult: pm, collection: col, goldMult: goldMult,
      power: Math.floor(dmg * 1 + maxHp * 0.3 + crit * 1000 + atkSpeed * 50)
    };
    if (flags.noPet) { T.petAttack = false; }
    T.hpDrain = (pct.hpDrain || 0);
    T.missChance = (pct.missChance || 0) / 100;
    return T;
  }

  function goldPerMinute() {
    var T = final();
    var perKill = enemyHP(S.maxWave, false) * 0.1 * T.gold * T.goldMult;
    var killsPerMin = Math.min(60, 20 * T.atkSpeed);
    return perKill * killsPerMin;
  }

  /* ---------- формулы врагов ---------- */
  function enemyHP(wave, isBoss) {
    var b = D.BIOMES[Math.min(D.BIOMES.length - 1, Math.floor((wave - 1) / 12) % D.BIOMES.length)];
    var bm = 1 + (wave > 100 ? 0.15 * Math.floor(wave / 100) : 0);
    var hp = 10 * Math.pow(1.14, wave - 1) * bm;
    if (isBoss) hp *= 10 + Math.floor(wave / 12);
    return hp;
  }
  function enemyDmg(wave) {
    return 3 * Math.pow(1.12, wave - 1);
  }
  function enemyGold(wave, isBoss) {
    return enemyHP(wave, isBoss) * 0.14;
  }

  return {
    final: final, equipAgg: equipAgg, setAgg: setAgg, petAgg: petAgg, talentAgg: talentAgg,
    ptreeAgg: ptreeAgg, biomeIndex: biomeIndex, collectionCount: collectionCount,
    prestigeMult: prestigeMult, goldPerMinute: goldPerMinute,
    enemyHP: enemyHP, enemyDmg: enemyDmg, enemyGold: enemyGold, addEff: addEff, newAgg: newAgg
  };
})();
if (typeof window !== 'undefined') window.Stats = Stats;
