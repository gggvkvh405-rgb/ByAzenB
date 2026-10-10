/* ============================================================
   loot.js — предметы, лут, кузница, питомцы, руны, сундуки, гача
   ============================================================ */
var LOOT = (function () {
  'use strict';
  var uid = 1;

  var FLAG_TEXT = {
    randomBuff: 'Случайный бафф',
    randomEffect: 'Случайный эффект',
    chaosDebuff: 'Случайный дебафф',
    noPet: 'Питомцы не работают',
    reviveSlow: 'Воскрешение дольше',
    chaosRules: 'Меняет правила боя',
    petAttack: 'Питомец атакует врагов',
    deathExplode: 'Взрыв при смерти врага',
    massFreeze: 'Шанс заморозить всех',
    critBleed: 'При крите — кровотечение',
    freeCraft: 'Шанс не потратить ресурсы',
    banChance: 'Шанс «бана» врага',
    enemyDebuff: 'Случайный дебафф врагам',
    critInvis: 'Невидимость после крита',
    puddle: 'Лужа при смерти врага',
    Shield: 'Щит каждую волну',
    revive: 'Воскрешение 1 раз',
    secretBiomes: 'Тайные биомы',
    secretBosses: 'Секретные боссы',
    chaos: 'Иногда съедает золото'
  };

  /* ---------- создание ---------- */
  function rollRarity(luckPct, waveBonus) {
    var w = D.RARITY.map(function (r, i) {
      var x = r.w;
      if (i > 0) {
        x *= 1 + (luckPct / 100) * (i / 2.2);
        x *= 1 + waveBonus * i * 0.12;
      }
      return x;
    });
    return U.weighted(D.RARITY.map(function (r, i) { return i; }), function (i) { return w[i]; });
  }

  function makeItem(rarIdx, slot, level) {
    var R = D.RARITY[U.clamp(rarIdx, 0, 7)];
    var name, icon, eff, set = null;
    if (slot === 'weapon' && D.WEAPONS[R.k]) {
      var t = D.WEAPONS[R.k];
      var row = U.pick(t);
      name = row[0]; eff = row[1]; icon = D.wicon(name);
    } else if (D.ARMOR[R.k] && slot !== 'weapon') {
      var table = D.ARMOR[R.k].filter(function (r) { return r[1] === slot; });
      if (!table.length) table = D.ARMOR[R.k];
      var row2 = U.pick(table);
      name = row2[0]; icon = row2[2]; eff = row2[3];
    } else {
      var acc = D.ACCESSORIES.filter(function (r) { return r[3] === R.k; });
      var row3 = acc.length ? U.pick(acc) : U.pick(D.ACCESSORIES);
      name = row3[0]; icon = row3[2]; eff = row3[4];
    }
    set = D.setOf(name);
    var e = {};
    Object.keys(eff).forEach(function (k) { e[k] = eff[k]; });
    return {
      uid: 'i' + (uid++) + '_' + Math.floor(Math.random() * 1e6),
      name: name, icon: icon, slot: slot, rar: R.k === undefined ? rarIdx : indexOfRarity(R.k),
      e: e, set: set, lvl: level || 0, runes: [], curse: false, isNew: true, t: U.now()
    };
  }
  function indexOfRarity(k) {
    for (var i = 0; i < D.RARITY.length; i++) if (D.RARITY[i].k === k) return i;
    return 0;
  }

  function rollItem(wave, bonusLuck, forced) {
    var T = Stats.final();
    var luck = (T.luck - 1) * 100 + (bonusLuck || 0);
    var rar = forced !== undefined ? forced : rollRarity(luck, Math.floor((wave || 1) / 25));
    var slots = ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak'];
    var slot = U.pick(slots);
    if (U.chance(0.34)) slot = 'weapon';
    var it = makeItem(rar, slot, 0);
    if (it.rar >= 7) S.chaosItems++;
    return it;
  }

  /* ---------- инвентарь ---------- */
  function addItem(it) {
    if (!it) return;
    /* коллекция */
    var key = it.name + '|' + it.slot;
    S.collection[key] = (S.collection[key] || 0) + 1;
    S.stats.itemsFound++;
    /* фильтр авто-разбора */
    if (S.filter.autoSell >= it.rar && S.filter.autoSell >= 0) {
      var d = dismantleValue(it);
      ST.add('dust', d.dust); ST.add('shards', d.shards);
      U.toast('♻️ Авто-разбор: ' + it.name + ' (+' + U.fmt(d.dust) + ' пыли)', null);
      return null;
    }
    if (S.inv.length >= 120) {
      /* удаляем самый слабый */
      var worst = 0;
      for (var i = 1; i < S.inv.length; i++) if (power(S.inv[i]) < power(S.inv[worst])) worst = i;
      S.inv.splice(worst, 1);
      U.toast('🎒 Инвентарь полон — выброшен самый слабый предмет', 'epic');
    }
    S.inv.push(it);
    return it;
  }
  function find(uid2) {
    for (var i = 0; i < S.inv.length; i++) if (S.inv[i].uid === uid2) return S.inv[i];
    return null;
  }
  function remove(uid2) {
    for (var i = 0; i < S.inv.length; i++) if (S.inv[i].uid === uid2) { return S.inv.splice(i, 1)[0]; }
    return null;
  }
  function power(it) {
    var p = 0;
    Object.keys(it.e).forEach(function (k) {
      var v = it.e[k];
      if (typeof v !== 'number') { p += 20; return; }
      p += (D.EF[k] && D.EF[k].flat) ? v * 3 : v;
    });
    return Math.round(p * (1 + it.rar) * (1 + it.lvl * 0.1));
  }

  /* ---------- экипировка ---------- */
  function equip(uid2, silent) {
    var it = find(uid2);
    if (!it) return false;
    var cur = S.equip[it.slot];
    S.equip[it.slot] = it;
    var idx = S.inv.indexOf(it);
    if (idx >= 0) S.inv.splice(idx, 1);
    if (cur) S.inv.push(cur);
    it.isNew = false;
    if (!silent) {
      U.toast('✅ Надето: <b>' + it.name + '</b>');
      if (window.Audio2) Audio2.sfx('equip');
    }
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function unequip(slot) {
    var it = S.equip[slot];
    if (!it) return false;
    S.equip[slot] = null;
    S.inv.push(it);
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function autoEquipBest() {
    var changed = 0;
    ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak'].forEach(function (slot) {
      var best = null;
      S.inv.forEach(function (it) {
        if (it.slot !== slot) return;
        if (!best || power(it) > power(best)) best = it;
      });
      if (!best) return;
      var cur = S.equip[slot];
      if (!cur || power(best) > power(cur) * 1.05) { equip(best.uid, true); changed++; }
    });
    if (changed) {
      U.toast('🤖 Лучшая экипировка надета (' + changed + ' шт.)', 'epic');
      if (window.Combat) Combat.syncHero();
    } else U.toast('Уже надето лучшее');
    if (window.UI) UI.dirty = true;
  }

  /* ---------- кузница ---------- */
  function upgCost(it) {
    var r = D.RARITY[it.rar];
    return {
      gold: Math.floor(60 * Math.pow(1.28, it.lvl) * Math.pow(2.1, it.rar)),
      dust: Math.floor(4 * Math.pow(1.22, it.lvl) * (1 + it.rar * 1.5))
    };
  }
  function upgrade(uid2) {
    var it = find(uid2) || S.inv.filter(function (x) { return x.uid === uid2; })[0];
    if (!it) {
      for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) it = S.equip[s];
    }
    if (!it) return false;
    var c = upgCost(it);
    var T = Stats.final();
    c.gold = Math.floor(c.gold / T.craft);
    if (!ST.spend('gold', c.gold)) { U.toast('❌ Не хватает золота', null); return false; }
    if (!ST.spend('dust', c.dust)) { ST.add('gold', c.gold); U.toast('❌ Не хватает пыли', null); return false; }
    it.lvl++;
    S.forgeUpg++;
    ST.questProgress('forge', 1);
    ST.checkAch();
    if (window.Audio2) Audio2.sfx('forge');
    if (window.Combat) Combat.syncHero();
    return true;
  }
  function dismantleValue(it) {
    var r = D.RARITY[it.rar] || D.RARITY[0];
    var T = Stats.final ? Stats.final() : { craft: 1 };
    return {
      dust: Math.floor(r.dust * (1 + it.lvl * 0.2) * (T.craft || 1)),
      shards: Math.floor(r.shards * (1 + it.lvl * 0.15) * (T.craft || 1))
    };
  }
  function dismantle(uid2, silent) {
    var it = find(uid2);
    var fromEquip = false;
    if (!it) {
      for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) { it = S.equip[s]; fromEquip = true; }
    }
    if (!it) return false;
    var v = dismantleValue(it);
    ST.add('dust', v.dust);
    ST.add('shards', v.shards);
    (it.runes || []).forEach(function (r) { S.runes.push(r); });
    if (fromEquip) S.equip[it.slot] = null; else remove(uid2);
    if (!silent) U.toast('♻️ Разобрано: +' + U.fmt(v.dust) + ' пыли, +' + U.fmt(v.shards) + ' осколков');
    if (window.Audio2) Audio2.sfx('dismantle');
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function sell(uid2) {
    var it = find(uid2);
    if (!it) return false;
    var g = Math.floor(D.RARITY[it.rar].dust * 25 * (1 + it.lvl * 0.2) * Stats.final().gold);
    ST.add('gold', g);
    remove(uid2);
    U.toast('💰 Продано за ' + U.fmt(g) + ' золота');
    if (window.UI) UI.dirty = true;
    return true;
  }
  function mergeTargets(slot, rar, name) {
    return S.inv.filter(function (it) { return it.slot === slot && it.rar === rar && it.name === name; });
  }
  function merge(uid2) {
    var it = find(uid2);
    if (!it) return false;
    if (it.rar >= 7) { U.toast('❌ Хаоситное нельзя улучшить слиянием'); return false; }
    var group = mergeTargets(it.slot, it.rar, it.name);
    if (group.length < 3) { U.toast('❌ Нужно 3 одинаковых предмета'); return false; }
    var lvls = group.slice(0, 3).map(function (x) { return x.lvl; });
    group.slice(0, 3).forEach(function (x) { remove(x.uid); (x.runes || []).forEach(function (r) { S.runes.push(r); }); });
    var lvl = Math.floor((lvls[0] + lvls[1] + lvls[2]) / 3) + 1;
    var ni = makeItem(it.rar + 1, it.slot, lvl);
    addItem(ni);
    S.merges++;
    ST.questProgress('merge', 1);
    ST.checkAch();
    U.toast('🔀 Слияние! Получено: <b>' + ni.name + '</b>', 'epic', true);
    if (window.Audio2) Audio2.sfx('merge');
    if (window.UI) UI.dirty = true;
    return ni;
  }
  function craftCost(rar) { return { shards: D.RARITY[rar].shards * 4, gold: D.RARITY[rar].dust * 300 }; }
  function craft(rar, slot) {
    var c = craftCost(rar);
    if (!ST.spend('shards', c.shards)) { U.toast('❌ Не хватает осколков'); return false; }
    if (!ST.spend('gold', c.gold)) { ST.add('shards', c.shards); U.toast('❌ Не хватает золота'); return false; }
    if (U.chance(0.25 * Stats.final().craft)) { ST.add('shards', c.shards); U.toast('✨ Сет Кузнеца сэкономил ресурсы!', 'epic'); }
    var it = makeItem(rar, slot, 0);
    addItem(it);
    U.toast('🔨 Создано: <b>' + it.name + '</b>', 'epic');
    if (window.Audio2) Audio2.sfx('forge');
    if (window.UI) UI.dirty = true;
    return it;
  }
  function curseItem(uid2) {
    var it = find(uid2);
    if (!it) return false;
    if (it.rar === 5) { U.toast('Уже проклято'); return false; }
    var curses = [
      { e: { dmgPct: 100, gold: -50 }, t: 'Голод' },
      { e: { dmgPct: 150, hpPct: -50 }, t: 'Безумие' },
      { e: { vamp: 100, heal: -50 }, t: 'Кровь' },
      { e: { crit: 200, armor: -50 }, t: 'Предательство' },
      { e: { dmgPct: 250, hpDrain: 8 }, t: 'Жертва' }
    ];
    var c = U.pick(curses);
    it.curse = c.t;
    it.rar = 5;
    it.name = 'Проклятый ' + it.name;
    Object.keys(c.e).forEach(function (k) { it.e[k] = (it.e[k] || 0) + c.e[k]; });
    U.toast('☠️ Проклятие наложено: ' + c.t, 'epic', true);
    if (window.Audio2) Audio2.sfx('curse');
    if (window.UI) UI.dirty = true;
    return true;
  }
  function uncurseItem(uid2) {
    var it = find(uid2);
    if (!it) it = S.inv.concat(Object.keys(S.equip).map(function (k) { return S.equip[k]; })).filter(function (x) { return x && x.uid === uid2; })[0];
    if (!it || it.rar !== 5) return false;
    if (!ST.spend('crystals', 50)) { U.toast('❌ Нужно 50 кристаллов'); return false; }
    it.rar = Math.max(4, it.rar);
    it.rar = 4;
    var neg = [];
    Object.keys(it.e).forEach(function (k) { if (it.e[k] < 0) { neg.push(k); } });
    neg.forEach(function (k) { it.e[k] = Math.abs(it.e[k]) * 0; delete it.e[k]; });
    it.curse = false;
    it.name = it.name.replace('Проклятый ', 'Очищенный ');
    U.toast('✨ Проклятие снято!', 'epic', true);
    if (window.UI) UI.dirty = true;
    return true;
  }
  function reroll(uid2) {
    var it = find(uid2);
    if (!it) return false;
    if (!ST.spend('crystals', 20)) { U.toast('❌ Нужно 20 кристаллов'); return false; }
    var ni = makeItem(it.rar, it.slot, it.lvl);
    ni.runes = it.runes || [];
    var i = S.inv.indexOf(it);
    if (i >= 0) S.inv[i] = ni;
    for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) S.equip[s] = ni;
    U.toast('🎲 Реролл: <b>' + ni.name + '</b>', 'epic');
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }

  /* ---------- руны ---------- */
  function addRune(k, lvl) {
    S.runes.push({ k: k, lvl: lvl || 1 });
    U.toast('🔯 Получена руна: ' + runeName(k));
    if (window.UI) UI.dirty = true;
  }
  function runeName(k) {
    for (var i = 0; i < D.RUNES.length; i++) if (D.RUNES[i].k === k) return D.RUNES[i].n;
    return k;
  }
  function socketsMax(it) { return Math.min(4, 1 + Math.floor(it.rar / 2)); }
  function socket(it, runeIdx) {
    var r = S.runes[runeIdx];
    if (!r) return false;
    if ((it.runes || []).length >= socketsMax(it)) { U.toast('❌ Нет свободных гнёзд'); return false; }
    it.runes = it.runes || [];
    it.runes.push(S.runes.splice(runeIdx, 1)[0]);
    U.toast('🔯 Руна вставлена');
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function unsocket(it, i) {
    if (!it.runes || !it.runes[i]) return false;
    S.runes.push(it.runes.splice(i, 1)[0]);
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }
  function mergeRunes() {
    var byK = {};
    S.runes.forEach(function (r) { byK[r.k] = (byK[r.k] || 0) + 1; });
    var merged = 0;
    Object.keys(byK).forEach(function (k) {
      while (byK[k] >= 3) {
        var idx = [];
        for (var i = 0; i < S.runes.length && idx.length < 3; i++) if (S.runes[i].k === k) idx.push(i);
        var lvls = idx.map(function (i) { return S.runes[i].lvl; });
        idx.sort(function (a, b) { return b - a; }).forEach(function (i) { S.runes.splice(i, 1); });
        S.runes.push({ k: k, lvl: Math.max.apply(null, lvls) + 1 });
        byK[k] -= 2;
        merged++;
      }
    });
    if (merged) U.toast('🔀 Слито рун: ' + merged, 'epic');
    else U.toast('Нужно 3 одинаковые руны');
    if (window.UI) UI.dirty = true;
  }

  /* ---------- питомцы ---------- */
  function givePet(k) {
    if (S.pets[k]) { S.pets[k]++; U.toast('🐾 ' + petName(k) + ' улучшен до ур. ' + S.pets[k], 'epic'); }
    else { S.pets[k] = 1; U.toast('🐾 Новый питомец: <b>' + petName(k) + '</b>!', 'epic', true); }
    if (!S.petEquipped) S.petEquipped = k;
    ST.checkAch();
    if (window.UI) UI.dirty = true;
  }
  function petName(k) {
    for (var i = 0; i < D.PETS.length; i++) if (D.PETS[i].k === k) return D.PETS[i].n;
    return k;
  }
  function rollPet(rarBias) {
    var idx = U.weighted(D.PETS.map(function (p, i) { return i; }), function (i) {
      return 1 + (rarBias || 0) * (i / D.PETS.length);
    });
    return D.PETS[idx].k;
  }

  /* ---------- артефакты ---------- */
  function rollArtifact(rar) {
    var keys = ['dmgPct', 'hpPct', 'gold', 'luck', 'crit', 'critDmg', 'atkSpeed', 'vamp', 'armor', 'dodge', 'off', 'xp', 'rage', 'allPct'];
    var n = 2 + (rar || 0);
    var e = {};
    for (var i = 0; i < n; i++) {
      var k = U.pick(keys);
      e[k] = (e[k] || 0) + Math.round(U.rnd(5, 25) * (1 + (rar || 0)));
    }
    var names = ['Осколок', 'Сердцевина', 'Слеза', 'Зеркало', 'Кристалл', 'Око', 'Корона', 'Печать', 'Ключ', 'Искра'];
    var of = ['Хаоса', 'Вечности', 'Бездны', 'Жадности', 'Тьмы', 'Света', 'Дракона', 'Судьбы', 'Войны', 'Покоя'];
    var prefixes = ['Древний', 'Пылающий', 'Тёмный', 'Священный', 'Сломанный', 'Проклятый', 'Сияющий', 'Забытый'];
    return {
      uid: 'a' + (uid++),
      name: U.pick(prefixes) + ' ' + U.pick(names) + ' ' + U.pick(of),
      rar: rar || 0, lvl: 0, e: e, slot: 'artifact'
    };
  }
  function equipArtifact(uid2) {
    var a = null;
    for (var i = 0; i < S.artifacts.length; i++) if (S.artifacts[i].uid === uid2) a = S.artifacts[i];
    if (!a) return false;
    if (a.equipped) { a.equipped = false; }
    else {
      var cnt = S.artifacts.filter(function (x) { return x.equipped; }).length;
      if (cnt >= 4) { U.toast('❌ Можно надеть только 4 артефакта'); return false; }
      a.equipped = true;
    }
    if (window.Combat) Combat.syncHero();
    if (window.UI) UI.dirty = true;
    return true;
  }

  /* ---------- сундуки и гача ---------- */
  function openChest(kind) {
    var T = Stats.final();
    var res = { gold: 0, items: [], crystals: 0, runes: [], pet: null };
    var rarBias = { c: 0, r: 1, e: 2, l: 3, m: 4, d: 5, x: 6 }[kind] || 0;
    res.gold = Math.floor(Stats.enemyGold(S.maxWave, false) * 40 * (1 + rarBias * 3) * T.gold);
    ST.add('gold', res.gold);
    var nItems = 1 + Math.floor(rarBias / 2);
    for (var i = 0; i < nItems; i++) {
      var rar = U.clamp(rarBias + U.rndInt(-1, 1), 0, 7);
      var slot = U.pick(['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak']);
      var it = makeItem(rar, slot, 0);
      addItem(it);
      res.items.push(it);
    }
    if (U.chance(0.35 + rarBias * 0.08)) { var r = U.pick(D.RUNES); addRune(r.k, 1 + rarBias); res.runes.push(r); }
    if (U.chance(0.05 + rarBias * 0.03)) { var pk = rollPet(rarBias); givePet(pk); res.pet = pk; }
    if (U.chance(0.08)) { var c = 5 + rarBias * 20; ST.add('crystals', c); res.crystals = c; }
    ST.questProgress('loot', res.items.length);
    return res;
  }
  function gachaRoll() {
    if (!ST.spend('crystals', 100)) { U.toast('❌ Нужно 100 кристаллов'); return null; }
    S.gacha.pity++;
    S.gachaOpens++;
    var rar = 1;
    var r = Math.random();
    if (S.gacha.pity >= 50) rar = 4;
    else if (r < 0.02) rar = 6;
    else if (r < 0.08) rar = 5;
    else if (r < 0.25) rar = 4;
    else if (r < 0.55) rar = 3;
    else if (r < 0.85) rar = 2;
    var slot = U.pick(['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak', 'relic']);
    var it = makeItem(rar, slot, 0);
    if (rar >= 4) S.gacha.pity = 0;
    addItem(it);
    if (U.chance(0.15)) givePet(rollPet(rar));
    if (U.chance(0.2)) S.artifacts.push(rollArtifact(Math.floor(rar / 2)));
    ST.checkAch();
    if (window.UI) UI.dirty = true;
    return it;
  }

  /* ---------- текст эффектов ---------- */
  function effText(e, lvl) {
    var out = [];
    var fs = 1 + 0.25 * (lvl || 0), ps = 1 + 0.08 * (lvl || 0);
    Object.keys(e).forEach(function (k) {
      var v = e[k];
      if (typeof v !== 'number') { out.push('<div class="violet">' + (FLAG_TEXT[k] || k) + '</div>'); return; }
      var val = (D.EF[k] && D.EF[k].flat) ? v * fs : v * ps;
      var txt;
      if (k === 'hpDrain') txt = '−' + val.toFixed(1) + '% HP/сек';
      else if (D.EF[k] && D.EF[k].flat) txt = '+' + U.fmt(val) + ' ' + D.EF[k].n;
      else if (k === 'critDmg') txt = '+' + val.toFixed(0) + '% ' + D.EF[k].n;
      else txt = (val >= 0 ? '+' : '') + val.toFixed(val % 1 === 0 ? 0 : 1) + '% ' + (D.EF[k] ? D.EF[k].n : k);
      out.push('<div class="' + (val < 0 ? 'red' : 'green') + '">' + txt + '</div>');
    });
    return out.join('');
  }

  return {
    makeItem: makeItem, rollItem: rollItem, addItem: addItem, find: find, remove: remove, power: power,
    equip: equip, unequip: unequip, autoEquipBest: autoEquipBest,
    upgCost: upgCost, upgrade: upgrade, dismantle: dismantle, dismantleValue: dismantleValue, sell: sell,
    merge: merge, mergeTargets: mergeTargets, craft: craft, craftCost: craftCost,
    curseItem: curseItem, uncurseItem: uncurseItem, reroll: reroll,
    addRune: addRune, runeName: runeName, socket: socket, unsocket: unsocket, socketsMax: socketsMax, mergeRunes: mergeRunes,
    givePet: givePet, petName: petName, rollPet: rollPet, rollArtifact: rollArtifact, equipArtifact: equipArtifact,
    openChest: openChest, gachaRoll: gachaRoll, effText: effText, indexOfRarity: indexOfRarity, rollRarity: rollRarity,
    FLAG_TEXT: FLAG_TEXT
  };
})();
if (typeof window !== 'undefined') window.LOOT = LOOT;
