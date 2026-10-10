/* ============================================================
   combat.js — боевой цикл: волны, враги, ульта, статусы, награды
   ============================================================ */
var Combat = (function () {
  'use strict';

  var C = {
    wave: 1, enemies: [], toSpawn: [], spawnTimer: 0, waveKills: 0, waveSize: 0,
    hero: { x: 0.2, hp: 100, maxHp: 100, atkCd: 0, anim: 0, hit: 0, swing: 0, alive: true, flash: 0 },
    T: null, rage: 0, ultReady: false, combo: 0, comboT: 0,
    buffs: { berserk: 0, turret: 0, invis: 0, shield: 0 },
    dead: false, started: false, boss: null, waveBannerT: 0,
    killsThisWave: 0, lastWave: 1, weatherT: 0, bossAbT: 0, summonT: 0,
    dps: 0, dpsT: 0, dpsAcc: 0
  };
  var uid = 1;

  function syncHero() {
    C.T = Stats.final();
    var T = C.T;
    var ratio = C.hero.maxHp > 0 ? C.hero.hp / C.hero.maxHp : 1;
    C.hero.maxHp = T.maxHp;
    C.hero.hp = U.clamp(C.hero.maxHp * ratio, 1, T.maxHp);
    if (C.hero.hp > C.hero.maxHp) C.hero.hp = C.hero.maxHp;
  }

  function heroDef() {
    var k = S.squad[S.activeSquad || 0] || 'warrior';
    for (var i = 0; i < D.HEROES.length; i++) if (D.HEROES[i].k === k) return D.HEROES[i];
    return D.HEROES[0];
  }
  function ultKey() { return heroDef().ult; }

  /* ---------- волны ---------- */
  function startWave(w, silent) {
    S.wave = w;
    C.wave = w;
    C.toSpawn = [];
    C.spawnTimer = 0;
    C.killsThisWave = 0;
    C.boss = null;
    C.dead = false;
    if (w > S.maxWave) S.maxWave = w;
    var isBoss = w % 10 === 0;
    if (isBoss) {
      var bi = (Math.floor(w / 10) - 1) % D.BOSSES.length;
      if (bi < 0) bi = 0;
      var bd = D.BOSSES[bi];
      if (w % 100 === 0 && w >= 100) bd = D.BOSSES[D.BOSSES.length - 1];
      if (w === 77) bd = D.BOSSES[16];
      C.toSpawn.push({ boss: bd });
      var minions = Math.min(8, 2 + Math.floor(w / 20));
      for (var i = 0; i < minions; i++) C.toSpawn.push({ m: U.pick(D.MONSTERS) });
    } else {
      var n = Math.min(14, 4 + Math.floor(w / 6));
      for (var j = 0; j < n; j++) C.toSpawn.push({ m: pickMonster(w) });
    }
    C.waveSize = C.toSpawn.length;
    if (!silent) {
      C.waveBannerT = 1.2;
      if (window.UI) UI.showWaveBanner(w, isBoss);
      if (isBoss && window.Audio2) Audio2.sfx('boss');
    }
    /* погода */
    if (w > (S.weather.until || 0)) {
      var wd = U.pick(D.WEATHER);
      S.weather = { k: wd.k, until: w + U.rndInt(8, 18) };
      U.toast(wd.i + ' Погода: <b>' + wd.n + '</b>');
    }
    /* биом */
    var bi2 = Stats.biomeIndex();
    if (w % 12 === 1 && w > 1) {
      U.toast(D.BIOMES[bi2].i + ' Новый биом: <b>' + D.BIOMES[bi2].n + '</b>', 'epic');
    }
  }

  function pickMonster(w) {
    var pool = D.MONSTERS.slice(0, U.clamp(3 + Math.floor(w / 8), 3, D.MONSTERS.length));
    return U.pick(pool);
  }

  function spawnEnemy(spec, idx) {
    var def = spec.boss || spec.m;
    var isBoss = !!spec.boss;
    var hp = Stats.enemyHP(C.wave, isBoss);
    var e = {
      id: 'e' + (uid++), def: def, boss: isBoss,
      x: 1.12 + U.rnd(0, 0.12), targetX: 0.38 + 0.055 * (idx % 5),
      y: 0, hp: hp, maxHp: hp, dmg: Stats.enemyDmg(C.wave) * (isBoss ? 2.2 : 1),
      speed: (isBoss ? 0.055 : 0.085) * (1 + Math.random() * 0.2),
      atkCd: U.rnd(0.4, 1.2), size: def.sz / 100, mut: [], shield: 0, armor: 0,
      st: { slow: 0, freeze: 0, burn: 0, poison: 0, bleed: 0, shock: 0, stun: 0, fear: 0 },
      dots: [], hit: 0, dead: false, deathT: 0, wob: Math.random() * 6.28, elite: false,
      hpBarT: 0
    };
    /* мутации */
    var mutChance = U.clamp(0.05 + C.wave / 900, 0, 0.55);
    if (!isBoss && U.chance(mutChance)) {
      var m = U.pick(D.MUTATIONS);
      e.mut.push(m.k);
      if (m.shield) e.shield = e.maxHp * m.shield;
      if (m.reduc) e.armor += m.reduc;
      if (m.speed) e.speed *= m.speed;
      e.hp *= 1.25; e.maxHp = e.hp;
    }
    if (!isBoss && U.chance(0.07 + C.wave / 3000)) {
      e.elite = true; e.hp *= 3; e.maxHp = e.hp; e.dmg *= 1.5; e.size *= 1.2;
    }
    if (isBoss) { C.boss = e; e.targetX = 0.5; }
    C.enemies.push(e);
    if (window.UI) UI.bossBar(e);
    return e;
  }

  /* ---------- урон ---------- */
  function dealDamage(e, amount, opts) {
    opts = opts || {};
    if (!e || e.dead) return 0;
    var T = C.T;
    if (!opts.trueDmg) {
      if (T.missChance > 0 && U.chance(T.missChance)) { fx(e, 'ПРОМАХ', '#fff'); return 0; }
      var reduc = e.armor || 0;
      amount *= (1 - reduc);
      if (T.nerfEnemy > 0) amount *= (1 + T.nerfEnemy);
      if (e.shield > 0) {
        var absorbed = Math.min(e.shield, amount);
        e.shield -= absorbed; amount -= absorbed;
        if (e.shield <= 0) e.shield = 0;
      }
    }
    /* добивание */
    if (T.execute > 0 && e.hp / e.maxHp < 0.35) amount *= (1 + T.execute);
    amount = Math.max(1, amount);
    e.hp -= amount;
    e.hit = 0.12;
    e.hpBarT = 2;
    C.dpsAcc += amount;
    S.stats.dmgDealt += amount;
    if (amount > S.stats.bestHit) S.stats.bestHit = amount;
    if (opts.crit) {
      S.crits++;
      fx(e, U.fmt(amount) + '!', '#ffcc3d', 1.4);
      if (window.FX) FX.burst(e, '#ffcc3d', 8);
      if (window.Audio2) Audio2.sfx('crit');
      if (C.T.flags.critBleed) e.dots.push({ t: 4, dps: amount * 0.06, k: 'bleed' });
      if (C.T.flags.critInvis) C.buffs.invis = 1.5;
    } else {
      if (U.chance(0.35)) fx(e, U.fmt(amount), '#fff');
    }
    /* вампиризм */
    if (T.vamp > 0 && C.hero.alive) {
      var heal = amount * T.vamp * 0.25;
      C.hero.hp = Math.min(C.hero.maxHp, C.hero.hp + heal);
      if (window.FX) FX.heal(heal);
    }
    if (e.hp <= 0) killEnemy(e, opts);
    return amount;
  }

  function fx(e, txt, color, scale) {
    if (window.FX) FX.text(e.x, e.y, txt, color, scale || 1);
  }

  function applyDot(e, kind, dps, time) {
    e.dots.push({ t: time, dps: dps, k: kind });
  }

  function killEnemy(e, opts) {
    if (e.dead) return;
    e.dead = true; e.deathT = 0.45;
    S.kills++;
    C.killsThisWave++;
    S.stats.killsByType[e.def.k] = (S.stats.killsByType[e.def.k] || 0) + 1;
    ST.questProgress('kill', 1);
    /* награды */
    var T = C.T;
    var isBoss = e.boss;
    var gold = Stats.enemyGold(C.wave, isBoss) * T.gold * T.goldMult * (isBoss ? 1 + (T.pct.bossGold || 0) / 100 : 1);
    if (S.x2Until > U.now()) gold *= 2;
    if (!S.settings.auto && window.UI && UI.screen === 'scr-battle') gold *= 1.1;
    ST.add('gold', gold);
    var xp = (4 + C.wave * 0.6) * (isBoss ? 8 : 1) * T.xp;
    ST.gainXP(xp);
    ST.bpXp(isBoss ? 50 : 10);
    if (isBoss) { S.bossKills++; ST.bpXp(0); ST.questProgress('boss', 1); onBossKill(e); }
    /* лут */
    var drop = (isBoss ? 1 : (e.elite ? 0.28 : 0.07)) * T.dropChance * (1 + (T.luck - 1) * 0.5);
    if (U.chance(drop)) {
      var it = LOOT.rollItem(C.wave, isBoss ? 25 : 0);
      var added = LOOT.addItem(it);
      if (added) {
        var R = D.RARITY[it.rar];
        U.toast(R.n + ' <b>' + it.name + '</b>!', it.rar >= 3 ? 'epic' : null, it.rar >= 4);
        if (it.rar >= 2) ST.unlockAch(['', '', 'epic_loot', 'legend_loot', 'mythic_loot', '', 'divine_loot', 'chaos_loot'][it.rar]);
        if (window.FX) FX.loot(e.x, e.y, R.c);
      }
    }
    /* репутация */
    var f = 'smiths';
    if (e.def.k === 'goblin') f = 'goblins';
    else if (e.def.k === 'skeleton' || e.def.k === 'platskel') f = 'skeletons';
    else if (e.def.k === 'dragon') f = 'dragons';
    else if (e.def.k === 'bug' || e.def.k === 'cthul') f = 'chaos';
    S.reputation[f] = (S.reputation[f] || 0) + (isBoss ? 10 : 1);
    /* мутации смерти */
    if (e.mut.indexOf('explode') >= 0 || C.T.flags.deathExplode) {
      C.enemies.forEach(function (o) { if (!o.dead && Math.abs(o.x - e.x) < 0.3) dealDamage(o, C.T.dmg * 1.5, {}); });
      if (window.FX) FX.burst(e, '#ff8a3d', 22);
    }
    if (e.mut.indexOf('split') >= 0) {
      for (var i = 0; i < 2; i++) {
        var m = spawnEnemy({ m: e.def }, i);
        m.hp = m.maxHp = e.maxHp * 0.35;
        m.size *= 0.7;
        m.x = e.x + i * 0.04;
      }
    }
    if (C.T.flags.puddle && window.FX) FX.puddle(e.x);
    if (window.FX) FX.death(e);
    if (window.Audio2) Audio2.sfx(isBoss ? 'bossdie' : 'die');
    ST.checkAch();
    S.gates.forEach(function () { });
    /* ярость */
    C.rage = Math.min(100, C.rage + (isBoss ? 25 : 2) * C.T.rage);
    if (C.rage >= 100) C.ultReady = true;
    ST.questProgress('wave', 0);
  }

  function onBossKill(e) {
    if (e.def.k === 'dev') S.killedDev++;
    if (e.def.k === 'admin') S.killedAdmin++;
    if (e.def.k === 'chaosmith') S.killedChaos++;
    ST.add('crystals', 5 + Math.floor(C.wave / 20));
    ST.add('keys', 1);
    S.artifacts.push(LOOT.rollArtifact(Math.floor(C.wave / 50)));
    if (U.chance(0.4)) LOOT.givePet(LOOT.rollPet(1));
    if (window.UI) UI.openGates();
  }

  /* ---------- враги атакуют ---------- */
  function enemyAttack(e) {
    if (C.buffs.invis > 0 && U.chance(0.5)) return;
    var T = C.T;
    var dmg = e.dmg * (1 - U.clamp(T.armor, 0, 0.75));
    if (U.chance(T.dodge)) { if (window.FX) FX.text(C.hero.x, 0.4, 'УКЛОН', '#42e8ff'); return; }
    C.hero.hp -= dmg;
    C.hero.flash = 0.2;
    if (window.FX) FX.heroHit();
    if (window.Audio2) Audio2.sfx('hurt');
    if (window.UI) UI.shake();
    if (C.hero.hp <= 0) heroDeath();
  }

  function heroDeath() {
    if (C.dead) return;
    C.dead = true;
    C.hero.alive = false;
    C.hero.hp = 0;
    S.stats.deaths++;
    if (S.settings.auto === false) { }
    if (window.UI) UI.onDeath();
  }

  function revive(full) {
    C.dead = false;
    C.hero.alive = true;
    C.hero.hp = C.hero.maxHp * (full ? 1 : 0.5);
    C.enemies.length = 0;
    C.boss = null;
    if (window.UI) UI.hideBossBar();
    startWave(Math.max(1, C.wave), true);
  }
  function rollback() {
    C.dead = false;
    C.hero.alive = true;
    C.enemies.length = 0;
    C.boss = null;
    var w = Math.max(1, C.wave - 1);
    startWave(w, true);
    C.hero.hp = C.hero.maxHp;
  }

  /* ---------- атаки героя ---------- */
  function heroAttack() {
    var T = C.T;
    var e = nearestEnemy();
    if (!e) return;
    C.hero.swing = 0.18;
    var dmg = T.dmg;
    var crit = U.chance(T.crit);
    if (crit) dmg *= T.critMult;
    dealDamage(e, dmg, { crit: crit });
    /* стихии */
    if (T.fire > 0) applyDot(e, 'burn', dmg * T.fire * 0.35, 3);
    if (T.poison > 0) applyDot(e, 'poison', dmg * T.poison * 0.3, 4);
    if (T.shock > 0 && U.chance(0.3)) { e.st.stun = Math.max(e.st.stun, 0.4); if (window.FX) FX.burst(e, '#42e8ff', 6); }
    if (T.bleed > 0) applyDot(e, 'bleed', dmg * T.bleed * 0.25, 3);
    if (T.slow > 0) e.st.slow = Math.max(e.st.slow, 2);
    if (T.fear > 0 && U.chance(T.fear)) e.st.fear = Math.max(e.st.fear, 1.5);
    if (T.stun > 0 && U.chance(U.clamp(T.stun, 0, 0.5))) e.st.stun = Math.max(e.st.stun, 0.8);
    if (C.T.flags.banChance && U.chance((C.T.pct.banChance || 3) / 100)) {
      if (window.FX) FX.text(e.x, e.y, 'БАН!', '#ff37f3', 1.8);
      e.hp = 0; killEnemy(e, {});
    }
    C.rage = Math.min(100, C.rage + 2 * T.rage);
    if (C.rage >= 100) C.ultReady = true;
    if (window.Audio2) Audio2.sfx(crit ? 'crit' : 'hit');
  }

  function tap() {
    if (C.dead) return;
    var T = C.T;
    var e = nearestEnemy();
    if (!e) { C.hero.swing = 0.12; return; }
    S.taps++;
    C.combo++;
    C.comboT = 1.6;
    var mult = 1 + Math.min(50, C.combo) * 0.05;
    var dmg = T.tapDmg * mult;
    var crit = U.chance(T.crit);
    if (crit) dmg *= T.critMult;
    C.hero.swing = 0.14;
    dealDamage(e, dmg, { crit: crit });
    C.rage = Math.min(100, C.rage + 1.2 * T.rage);
    if (C.rage >= 100) C.ultReady = true;
    ST.questProgress('tap', 1);
    if (window.FX) FX.tap(e);
    if (window.Audio2) Audio2.sfx(crit ? 'crit' : 'tap');
    if (C.combo % 25 === 0) U.toast('🔥 Комбо ×' + C.combo + '!', 'big');
  }

  function nearestEnemy() {
    var best = null, bd = 9;
    C.enemies.forEach(function (e) {
      if (e.dead) return;
      var d = Math.abs(e.x - C.hero.x);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  /* ---------- ульта ---------- */
  function doUlt() {
    if (!C.ultReady || C.dead) return false;
    var T = C.T;
    var k = ultKey();
    C.rage = 0;
    C.ultReady = false;
    S.ults++;
    ST.questProgress('ult', 1);
    ST.checkAch();
    var alive = C.enemies.filter(function (e) { return !e.dead; });
    var i;
    if (window.Audio2) Audio2.sfx('ult');
    if (window.FX) FX.ultFlash(D.ULTS[k] ? D.ULTS[k].i : '⚡');
    switch (k) {
      case 'meteor':
        alive.forEach(function (e) { dealDamage(e, T.ultDmg * 8, { crit: U.chance(0.3) }); applyDot(e, 'burn', T.dmg * 0.5, 4); });
        if (window.FX) FX.meteor();
        break;
      case 'whirl':
        for (i = 0; i < 10; i++) {
          (function (n) {
            setTimeout(function () {
              var a = C.enemies.filter(function (e) { return !e.dead; });
              if (a.length) dealDamage(U.pick(a), T.dmg * 2.5, { crit: U.chance(T.crit) });
            }, n * 70);
          })(i);
        }
        break;
      case 'nova':
        alive.forEach(function (e) { e.st.freeze = Math.max(e.st.freeze, 3); dealDamage(e, T.ultDmg * 4, {}); });
        if (window.FX) FX.freeze();
        break;
      case 'berserk':
        C.buffs.berserk = 8;
        U.toast('😡 БЕРСЕРК!', 'big');
        break;
      case 'raise':
        alive.forEach(function (e) { dealDamage(e, T.ultDmg * 5, {}); e.st.slow = 3; });
        if (window.FX) FX.raise();
        break;
      case 'volley':
        for (i = 0; i < 20; i++) {
          (function (n) {
            setTimeout(function () {
              var a = C.enemies.filter(function (e) { return !e.dead; });
              if (a.length) dealDamage(U.pick(a), T.dmg * 1.6, { crit: U.chance(T.crit) });
            }, n * 45);
          })(i);
        }
        break;
      case 'shadow':
        var t = alive.slice().sort(function (a, b) { return b.hp - a.hp; })[0];
        if (t) dealDamage(t, T.dmg * 15, { crit: true });
        break;
      case 'turret':
        C.buffs.turret = 10;
        U.toast('🔧 Турель активна 10 сек!', 'big');
        break;
      case 'roots':
        alive.forEach(function (e) { e.st.freeze = Math.max(e.st.freeze, 2.5); applyDot(e, 'poison', T.dmg * 0.6, 5); });
        break;
      case 'sacrifice':
        C.hero.hp = Math.max(1, C.hero.hp - C.hero.maxHp * 0.2);
        alive.forEach(function (e) { dealDamage(e, T.ultDmg * 20, { crit: true }); });
        if (window.FX) FX.meteor('#ff2d6f');
        break;
      case 'chaosstorm':
        alive.forEach(function (e) {
          dealDamage(e, T.ultDmg * 10, { crit: U.chance(0.5) });
          if (U.chance(0.5)) e.st.stun = 1;
          if (U.chance(0.5)) applyDot(e, 'burn', T.dmg, 3);
        });
        C.buffs.berserk = Math.max(C.buffs.berserk, 5);
        break;
      default: /* whirl */
        for (i = 0; i < 8; i++) {
          (function (n) {
            setTimeout(function () {
              var a = C.enemies.filter(function (e) { return !e.dead; });
              if (a.length) dealDamage(U.pick(a), T.dmg * 2, {});
            }, n * 80);
          })(i);
        }
    }
    if (window.UI) UI.updateUlt();
    return true;
  }

  /* ---------- способности боссов ---------- */
  function bossAbility(b) {
    var ab = b.def.ab;
    var T = C.T;
    switch (ab) {
      case 'stealGold': case 'takeGold':
        var st = S.gold * 0.05;
        ST.spend('gold', st);
        U.toast('💸 ' + b.def.n + ' забрал ' + U.fmt(st) + ' золота!', 'big');
        break;
      case 'summon': case 'raise':
        for (var i = 0; i < 3; i++) spawnEnemy({ m: D.MONSTERS[U.rndInt(0, 5)] }, i);
        break;
      case 'stun':
        C.hero.hp -= C.hero.maxHp * 0.02;
        U.toast('💫 Оглушение!', 'big');
        break;
      case 'curse':
        C.hero.hp -= C.hero.maxHp * 0.05;
        U.toast('☠️ Проклятие босса!', 'big');
        break;
      case 'breakWeapon':
        U.toast('🔨 ' + b.def.n + ' ломает оружие! −15% урона на волне', 'big');
        C.buffs.broken = 15;
        break;
      case 'fireBreath':
        C.hero.hp -= C.hero.maxHp * 0.08;
        if (window.FX) FX.meteor('#ff8a3d');
        break;
      case 'web':
        C.buffs.web = 5;
        U.toast('🕸️ Сети! Скорость атаки снижена', 'big');
        break;
      case 'shield':
        b.shield = b.maxHp * 0.25;
        U.toast('🔷 Щит босса!', 'big');
        break;
      case 'fear':
        C.buffs.fear = 4;
        U.toast('😱 Страх!', 'big');
        break;
      case 'teleport':
        b.x = U.rnd(0.4, 1.0);
        if (window.FX) FX.burst(b, '#ff6bf3', 16);
        break;
      case 'reflect':
        C.buffs.reflect = 8;
        U.toast('🪞 Отражение урона!', 'big');
        break;
      case 'chaosRules':
        var r = U.pick(['Урон ×2!', 'Золото ×3!', 'Враги слабее!', 'Урон /2... извините', 'Крит-шторм!']);
        if (r.indexOf('×2') > 0) C.buffs.chaosDmg = 20;
        else if (r.indexOf('×3') > 0) C.buffs.chaosGold = 20;
        else if (r.indexOf('слабее') > 0) C.enemies.forEach(function (e) { e.dmg *= 0.7; });
        else if (r.indexOf('/2') > 0) C.buffs.chaosNerf = 20;
        else C.buffs.chaosCrit = 20;
        U.toast('🎲 Император Хаоса: ' + r, 'big', true);
        break;
      case 'ban':
        var alive = C.enemies.filter(function (e) { return !e.dead; });
        if (alive.length && U.chance(0.5)) U.toast('🔨 БАН! (герой оглушён)', 'big');
        C.hero.hp -= C.hero.maxHp * 0.12;
        break;
      case 'debuff':
        U.toast('📉 Разработчик нерфит тебя на 10 сек!', 'big');
        C.buffs.chaosNerf = 10;
        break;
      case 'snowstorm':
        S.weather = { k: 'blizzard', until: C.wave + 3 };
        C.enemies.forEach(function (e) { e.st.slow = 5; });
        U.toast('❄️ Метель!', 'big');
        break;
      case 'devour':
        C.hero.hp -= C.hero.maxHp * 0.15;
        U.toast('🌑 Пожиратель Миров рычит!', 'big', true);
        break;
      case 'mirror':
        b.shield = b.maxHp * 0.15;
        U.toast('🪞 Двойник копирует твои приёмы!', 'big');
        break;
      default:
        C.hero.hp -= C.hero.maxHp * 0.03;
    }
    if (C.hero.hp <= 0) heroDeath();
  }

  /* ---------- апдейт ---------- */
  function update(dt) {
    if (!C.T) syncHero();
    var T = C.T;
    if (!S.settings.auto) S.settings.auto = false;

    /* таймеры */
    if (C.comboT > 0) { C.comboT -= dt; if (C.comboT <= 0) C.combo = 0; }
    if (C.hero.swing > 0) C.hero.swing -= dt;
    if (C.hero.flash > 0) C.hero.flash -= dt;
    if (C.buffs.berserk > 0) C.buffs.berserk -= dt;
    if (C.buffs.invis > 0) C.buffs.invis -= dt;
    if (C.buffs.turret > 0) { C.buffs.turret -= dt; C.summonT -= dt; if (C.summonT <= 0) { C.summonT = 0.5; var tt = nearestEnemy(); if (tt) dealDamage(tt, T.dmg * 1.2, {}); } }
    if (C.buffs.broken > 0) C.buffs.broken -= dt;
    if (C.buffs.web > 0) C.buffs.web -= dt;
    if (C.buffs.fear > 0) C.buffs.fear -= dt;
    if (C.buffs.reflect > 0) C.buffs.reflect -= dt;
    if (C.buffs.chaosDmg > 0) C.buffs.chaosDmg -= dt;
    if (C.buffs.chaosGold > 0) C.buffs.chaosGold -= dt;
    if (C.buffs.chaosNerf > 0) C.buffs.chaosNerf -= dt;
    if (C.buffs.chaosCrit > 0) C.buffs.chaosCrit -= dt;
    C.dpsT += dt;
    if (C.dpsT >= 1) { C.dps = C.dpsAcc / C.dpsT; C.dpsAcc = 0; C.dpsT = 0; }

    if (C.dead) return;

    /* реген и проклятия */
    var regen = C.hero.maxHp * 0.004 * (1 + T.heal * 4);
    C.hero.hp = Math.min(C.hero.maxHp, C.hero.hp + regen * dt);
    if (T.hpDrain > 0) {
      C.hero.hp -= C.hero.maxHp * (T.hpDrain / 100) * dt;
      if (C.hero.hp <= 1) { C.hero.hp = 1; }
    }

    /* спавн волны */
    if (C.toSpawn.length > 0) {
      C.spawnTimer -= dt;
      if (C.spawnTimer <= 0) {
        C.spawnTimer = 0.35;
        var spec = C.toSpawn.shift();
        spawnEnemy(spec, C.waveSize - C.toSpawn.length);
      }
    }

    /* враги */
    var aliveCount = 0;
    for (var i = C.enemies.length - 1; i >= 0; i--) {
      var e = C.enemies[i];
      if (e.dead) {
        e.deathT -= dt;
        if (e.deathT <= 0) {
          if (C.boss === e) { C.boss = null; if (window.UI) UI.hideBossBar(); }
          C.enemies.splice(i, 1);
        }
        continue;
      }
      aliveCount++;
      if (e.hit > 0) e.hit -= dt;
      if (e.hpBarT > 0) e.hpBarT -= dt;
      /* статусы */
      var spd = e.speed;
      if (e.st.freeze > 0) { e.st.freeze -= dt; spd = 0; }
      else if (e.st.slow > 0) { e.st.slow -= dt; spd *= 0.55; }
      if (e.st.stun > 0) e.st.stun -= dt;
      if (e.st.fear > 0) { e.st.fear -= dt; spd *= -0.4; }
      if (T.slow > 0) spd *= (1 - U.clamp(T.slow, 0, 0.6));
      /* доты */
      for (var d = e.dots.length - 1; d >= 0; d--) {
        var dot = e.dots[d];
        dot.t -= dt;
        e.hp -= dot.dps * dt;
        if (dot.t <= 0) e.dots.splice(d, 1);
      }
      if (e.hp <= 0) { killEnemy(e, {}); continue; }
      /* мутация: лечение */
      if (e.mut.indexOf('heal') >= 0) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03 * dt);
      /* движение */
      if (e.x > e.targetX) e.x -= spd * dt;
      else if (e.x < e.targetX - 0.01) e.x += spd * 0.5 * dt;
      /* атака */
      e.atkCd -= dt;
      if (e.atkCd <= 0 && Math.abs(e.x - C.hero.x) < 0.5 && e.st.stun <= 0 && e.st.freeze <= 0) {
        e.atkCd = 1.6 / (1 + (C.wave / 200));
        enemyAttack(e);
        if (e.mut.indexOf('vampiric') >= 0) e.hp = Math.min(e.maxHp, e.hp + e.dmg * 0.2);
        if (C.buffs.reflect > 0) C.hero.hp -= e.dmg * 0.3;
        if (e.mut.indexOf('poison') >= 0) C.hero.hp -= C.hero.maxHp * 0.002;
        if (C.hero.hp <= 0) { heroDeath(); return; }
      }
    }

    /* атака героя */
    if (aliveCount > 0) {
      var aspd = T.atkSpeed * (C.buffs.berserk > 0 ? 2 : 1) * (C.buffs.web > 0 ? 0.6 : 1) * (C.buffs.fear > 0 ? 0.7 : 1);
      C.hero.atkCd -= dt * aspd;
      if (C.hero.atkCd <= 0) {
        C.hero.atkCd = 1;
        heroAttack();
      }
    } else if (C.toSpawn.length === 0) {
      /* волна зачищена */
      nextWave();
    }

    /* босс-абилка */
    if (C.boss && !C.boss.dead) {
      C.bossAbT -= dt;
      if (C.bossAbT <= 0) { C.bossAbT = 6; bossAbility(C.boss); }
    }
  }

  function nextWave() {
    var w = C.wave + 1;
    ST.questProgress('wave', 1);
    if (w % 10 === 0) { /* босс-волна */ }
    startWave(w);
    ST.save();
  }

  function setWaveDmgMult() { return 1; }

  return {
    C: C, syncHero: syncHero, update: update, startWave: startWave, tap: tap, doUlt: doUlt,
    revive: revive, rollback: rollback, heroDef: heroDef, ultKey: ultKey, nearestEnemy: nearestEnemy,
    dealDamage: dealDamage, spawnEnemy: spawnEnemy, nextWave: nextWave, killEnemy: killEnemy
  };
})();
if (typeof window !== 'undefined') window.Combat = Combat;
