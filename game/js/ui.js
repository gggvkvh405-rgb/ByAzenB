/* ============================================================
   ui.js — HUD, экраны, карточки предметов, навигация
   ============================================================ */
var UI = (function () {
  'use strict';
  var els = {};
  var UI = {
    screen: 'scr-battle',
    sub: null,
    dirty: true,
    invFilter: 'all',
    forgeTab: 'upg',
    ACT: {}
  };

  /* ---------- helpers ---------- */
  function rc(it) { return D.RARITY[U.clamp(it.rar, 0, 7)].c; }
  function rn(it) { return D.RARITY[U.clamp(it.rar, 0, 7)].n; }

  function itemCard(it, opts) {
    opts = opts || {};
    var c = rc(it);
    return '<div class="itemcard' + (opts.sel ? ' sel' : '') + '" style="--rc:' + c + '" data-act="item" data-uid="' + it.uid + '">' +
      (it.lvl ? '<div class="lv">+' + it.lvl + '</div>' : '') +
      '<div class="rr">' + rn(it).substring(0, 4) + '</div>' +
      '<div class="ico">' + it.icon + '</div>' +
      '<div class="nm">' + U.esc(it.name) + '</div>' +
      (it.isNew ? '<div class="badge-new">NEW</div>' : '') +
      '</div>';
  }
  function slotHTML(slot) {
    var it = S.equip[slot.k];
    if (it) {
      return '<div class="slot filled" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '">' +
        '<div class="ico">' + it.icon + '</div>' +
        '<div class="nm" style="color:' + rc(it) + '">' + U.esc(it.name) + (it.lvl ? ' +' + it.lvl : '') + '</div>' +
        (it.runes && it.runes.length ? '<div class="lbl">' + it.runes.map(function (r) {
          for (var i = 0; i < D.RUNES.length; i++) if (D.RUNES[i].k === r.k) return D.RUNES[i].i;
          return '?';
        }).join('') + '</div>' : '') +
        '</div>';
    }
    return '<div class="slot" data-act="slot" data-slot="' + slot.k + '"><div class="ico">' + slot.i + '</div><div class="nm">' + slot.n + '</div></div>';
  }
  function curLine() {
    return '<div class="row wrap" style="gap:6px;font-size:12px">' +
      '<span class="chip">🪙 ' + U.fmt(S.gold) + '</span>' +
      '<span class="chip">💎 ' + U.fmt(S.crystals) + '</span>' +
      (S.souls ? '<span class="chip">👻 ' + U.fmt(S.souls) + '</span>' : '') +
      (S.cores ? '<span class="chip">🌀 ' + U.fmt(S.cores) + '</span>' : '') +
      (S.seals ? '<span class="chip">🔯 ' + U.fmt(S.seals) + '</span>' : '') +
      (S.sparks ? '<span class="chip">🌟 ' + U.fmt(S.sparks) + '</span>' : '') +
      '<span class="chip">✨ ' + U.fmt(S.dust) + '</span>' +
      '<span class="chip">🧩 ' + U.fmt(S.shards) + '</span>' +
      '<span class="chip">🎟️ ' + U.fmt(S.medals) + '</span>' +
      '<span class="chip">🏟️ ' + U.fmt(S.tokens) + '</span>' +
      '</div>';
  }
  function bar(pctv, cls) {
    return '<div class="pbar' + (cls ? ' ' + cls : '') + '"><div style="width:' + U.clamp(pctv * 100, 0, 100) + '%"></div></div>';
  }

  /* ---------- HUD ---------- */
  function updateHUD() {
    var C = Combat.C;
    var bi = Stats.biomeIndex();
    els.wave.innerHTML = '🌊 <b>' + C.wave + '</b>';
    els.biome.innerHTML = D.BIOMES[bi].i + ' ' + D.BIOMES[bi].n;
    var wd = D.WEATHER[0];
    for (var i = 0; i < D.WEATHER.length; i++) if (D.WEATHER[i].k === S.weather.k) wd = D.WEATHER[i];
    els.weather.innerHTML = wd.i + ' ' + wd.n;
    els.gold.innerHTML = '🪙 <b>' + U.fmt(S.gold) + '</b>';
    els.crystals.innerHTML = '💎 <b>' + U.fmt(S.crystals) + '</b>';
    els.souls.innerHTML = '👻 <b>' + U.fmt(S.souls) + '</b>';
    var hpPct = C.hero.maxHp ? C.hero.hp / C.hero.maxHp : 1;
    els.hpfill.style.width = (hpPct * 100) + '%';
    els.hptext.textContent = U.fmt(C.hero.hp) + ' / ' + U.fmt(C.hero.maxHp);
    els.ragefill.style.width = C.rage + '%';
    els.ragetext.textContent = C.rage >= 100 ? 'УЛЬТА ГОТОВА!' : 'ЯРОСТЬ ' + Math.floor(C.rage) + '%';
    updateUlt();
    /* комбо */
    if (C.combo > 2) {
      els.combo.classList.remove('hidden');
      els.combo.textContent = '🔥 ×' + C.combo;
    } else els.combo.classList.add('hidden');
    /* врата */
    var gs = S.gates.map(function (g) { return '<div class="gate-chip">' + g.i + ' ' + g.n + '</div>'; }).join('');
    if (gs) { els.gates.innerHTML = gs; els.gates.style.display = ''; }
    else { els.gates.innerHTML = ''; els.gates.style.display = 'none'; }
    /* x2 */
    var x2 = S.x2Until > U.now();
    els.x2.classList.toggle('on', x2);
    els.x2.textContent = x2 ? '⏱' + U.fmtTime((S.x2Until - U.now()) / 1000) : '🎬';
    els.auto.classList.toggle('on', !!S.settings.auto);
    /* подсказка тапа */
    els.tapHint.style.opacity = S.settings.auto ? 0 : 0.9;
  }
  function updateUlt() {
    var C = Combat.C;
    if (C.ultReady && !C.dead) els.ult.classList.remove('hidden');
    else els.ult.classList.add('hidden');
    if (C.ultReady) {
      var u = D.ULTS[Combat.ultKey()] || D.ULTS.whirl;
      els.ult.innerHTML = '⚡<br>' + u.n;
    }
  }
  function bumpCur(k) {
    var map = { gold: els.gold, crystals: els.crystals, souls: els.souls };
    var e = map[k];
    if (!e) return;
    e.style.transform = 'scale(1.18)';
    setTimeout(function () { e.style.transform = ''; }, 120);
  }
  function showWaveBanner(w, isBoss) {
    els.banner.textContent = (isBoss ? '👑 БОСС-ВОЛНА ' : 'ВОЛНА ') + w;
    els.banner.classList.remove('hidden');
    els.banner.style.animation = 'none';
    void els.banner.offsetWidth;
    els.banner.style.animation = '';
    clearTimeout(els._bt);
    els._bt = setTimeout(function () { els.banner.classList.add('hidden'); }, 950);
  }
  function bossBar(e) {
    if (!e || !e.boss) return;
    els.bossbar.classList.remove('hidden');
    els.bossname.textContent = '👑 ' + e.def.n + (e.def.ad ? ' — ' + e.def.ad : '');
    UI._boss = e;
  }
  function updateBossBar() {
    var e = UI._boss;
    if (!e || e.dead || !e.boss) { hideBossBar(); return; }
    els.bossfill.style.width = U.clamp(e.hp / e.maxHp * 100, 0, 100) + '%';
    els.bosstext.textContent = U.fmt(e.hp) + ' / ' + U.fmt(e.maxHp);
  }
  function hideBossBar() { els.bossbar.classList.add('hidden'); UI._boss = null; }
  function shake() { Render.kick(7 + Math.min(10, Combat.C.wave / 50), 0.22); }

  /* ---------- экраны ---------- */
  function setScreen(name) {
    if (name === 'scr-sub' && !UI.sub) return;
    UI.screen = name;
    U.qsa('.screen').forEach(function (s) { s.classList.toggle('active', s.id === name); });
    U.qsa('.navbtn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-screen') === name); });
    if (name === 'scr-hero') renderHero();
    if (name === 'scr-forge') renderForge();
    if (name === 'scr-talents') renderTalents();
    if (name === 'scr-menu') renderMenu();
    if (name === 'scr-sub' && UI.sub && !UI._rendering) UI.renderSub(UI.sub);
    UI.dirty = false;
  }

  /* ---------- ГЕРОЙ / ИНВЕНТАРЬ ---------- */
  function renderHero() {
    var T = Stats.final();
    var h = '';
    h += '<div class="card">' +
      '<h3>📊 Сила: <span class="gold">' + U.fmt(T.power) + '</span>' +
      '<span class="tag">ур. ' + S.hero.level + '</span></h3>' +
      bar(S.hero.xp / ST.xpNeed(S.hero.level), 'xp') +
      '<div class="tiny muted center" style="margin-top:3px">' + U.fmt(S.hero.xp) + ' / ' + U.fmt(ST.xpNeed(S.hero.level)) + ' опыта</div>' +
      '<div class="statline"><span class="k">⚔️ Урон</span><span class="v gold">' + U.fmt(T.dmg) + '</span></div>' +
      '<div class="statline"><span class="k">❤️ HP</span><span class="v">' + U.fmt(T.maxHp) + '</span></div>' +
      '<div class="statline"><span class="k">⏩ Скор. атаки</span><span class="v">' + T.atkSpeed.toFixed(2) + '/сек</span></div>' +
      '<div class="statline"><span class="k">🎯 Крит</span><span class="v">' + (T.crit * 100).toFixed(1) + '% ×' + T.critMult.toFixed(2) + '</span></div>' +
      '<div class="statline"><span class="k">🪙 Множитель золота</span><span class="v gold">×' + (T.gold * T.goldMult).toFixed(2) + '</span></div>' +
      '<div class="statline"><span class="k">🍀 Удача</span><span class="v">×' + T.luck.toFixed(2) + '</span></div>' +
      '<div class="statline"><span class="k">👆 Тап</span><span class="v">' + U.fmt(T.tapDmg) + '</span></div>' +
      '<div class="statline"><span class="k">🩸 Вампиризм</span><span class="v">' + (T.vamp * 100).toFixed(1) + '%</span></div>' +
      '<div class="statline"><span class="k">🛡️ Броня</span><span class="v">' + (T.armor * 100).toFixed(1) + '%</span></div>' +
      '<div class="statline"><span class="k">💨 Уклонение</span><span class="v">' + (T.dodge * 100).toFixed(1) + '%</span></div>' +
      '</div>';

    h += '<div class="card"><h3>🎽 Экипировка <span class="tag">' + Object.keys(S.equip).filter(function (k) { return S.equip[k]; }).length + '/12</span></h3>' +
      '<div class="grid g4" style="gap:6px">' + D.SLOTS.map(slotHTML).join('') + '</div>' +
      '<div class="row" style="margin-top:8px;gap:6px"><button class="btn sm green wide" data-act="autoequip">🤖 Надеть лучшее</button></div>' +
      '<div class="tiny muted center" style="margin-top:6px">Сеты: ' + setLine() + '</div>' +
      '</div>';

    h += '<div class="card"><h3>🧑‍🤝‍🧑 Отряд <span class="tag">' + S.squad.length + '/3</span></h3>' +
      '<div class="scroll-x">' + D.HEROES.map(function (hd) {
        var owned = !!S.heroes[hd.k];
        var inSq = S.squad.indexOf(hd.k) >= 0;
        var active = S.squad[S.activeSquad || 0] === hd.k;
        return '<div class="itemcard" style="--rc:' + hd.c + ';min-width:82px;' + (active ? 'outline:2px solid #ffcc3d;' : '') + (owned ? '' : 'filter:grayscale(.8)') + '" data-act="hero" data-k="' + hd.k + '">' +
          '<div class="ico">' + hd.i + '</div><div class="nm">' + hd.n + '</div>' +
          '<div class="tiny ' + (owned ? 'gold' : 'muted') + '">' + (owned ? (inSq ? (active ? 'АКТИВЕН' : 'в отряде') : 'в отряд') : hd.cost + '💎') + '</div>' +
          '</div>';
      }).join('') + '</div>' +
      '<div class="tiny muted" style="margin-top:6px">Пассивка активного: ' + U.esc(Combat.heroDef().p) + '</div>' +
      '<div class="tiny muted">Ульта: ' + (D.ULTS[Combat.ultKey()] || D.ULTS.whirl).n + ' — ' + (D.ULTS[Combat.ultKey()] || D.ULTS.whirl).d + '</div>' +
      '</div>';

    h += '<div class="card"><h3>⬆️ Улучшения</h3>' + D.UPGRADES.map(function (u) {
      var lv = S.upg[u.k] || 0;
      var cost = Math.floor(u.base * Math.pow(u.mul, lv));
      return '<div class="statline">' +
        '<span class="k">' + u.i + ' ' + u.n + ' <span class="muted">(ур.' + lv + ')</span></span>' +
        '<span class="row" style="gap:6px"><span class="tiny muted">+' + u.val + ' ' + u.unit + '</span>' +
        '<button class="btn sm gold" data-act="buyupg" data-k="' + u.k + '"' + (S.gold < cost ? ' disabled' : '') + '>' + U.fmt(cost) + '🪙</button></span></div>';
    }).join('') + '</div>';

    /* инвентарь */
    var inv = S.inv.slice();
    if (UI.invFilter !== 'all') inv = inv.filter(function (it) { return it.slot === UI.invFilter; });
    inv.sort(function (a, b) { return (b.rar - a.rar) || (LOOT.power(b) - LOOT.power(a)); });
    h += '<div class="card"><h3>🎒 Инвентарь <span class="tag">' + S.inv.length + '/120</span></h3>' +
      '<div class="tabs">' + ['all'].concat(D.SLOTS.map(function (s) { return s.k; })).map(function (k) {
        var nm = k === 'all' ? 'Всё' : (D.SLOTS.filter(function (s) { return s.k === k; })[0] || {}).n;
        return '<button data-act="invfilter" data-k="' + k + '" class="' + (UI.invFilter === k ? 'on' : '') + '">' + nm + '</button>';
      }).join('') + '</div>' +
      (inv.length ? '<div class="grid g3">' + inv.map(function (it) { return itemCard(it); }).join('') + '</div>'
        : '<div class="muted center" style="padding:16px">Пусто. Убей пару монстров 🙂</div>') +
      '</div>';
    els.heroContent.innerHTML = h;
  }
  function setLine() {
    var a = Stats.setAgg(), out = [];
    D.SETS.forEach(function (st) {
      var c = a.setCounts[st.k] || 0;
      if (c > 0) out.push(st.n.split(' ').slice(0, 2).join(' ') + ' ' + c + '/5');
    });
    return out.length ? out.join(' • ') : 'нет';
  }

  /* ---------- КУЗНИЦА ---------- */
  function renderForge() {
    var tabs = [['upg', '⬆️ Улучшение'], ['dism', '♻️ Разбор'], ['merge', '🔀 Слияние'], ['craft', '🔨 Крафт'], ['curse', '☠️ Проклятия']];
    var h = '<div class="card"><h3>🔨 Кузница Хаоса</h3>' + curLine() + '</div>';
    h += '<div class="tabs">' + tabs.map(function (t) {
      return '<button data-act="forgetab" data-k="' + t[0] + '" class="' + (UI.forgeTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    if (UI.forgeTab === 'upg') {
      var eq = D.SLOTS.map(function (s) { return S.equip[s.k]; }).filter(Boolean);
      h += '<div class="card"><h3>Экипировка</h3>' +
        (eq.length ? '<div class="grid g3">' + eq.map(function (it) {
          var c = LOOT.upgCost(it);
          return '<div class="itemcard" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '">' +
            '<div class="lv">+' + it.lvl + '</div><div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + '</div>' +
            '<button class="btn sm gold" style="width:100%;margin-top:4px" data-act="upgrade" data-uid="' + it.uid + '">' + U.fmt(c.gold) + '🪙 ' + U.fmt(c.dust) + '✨</button>' +
            '</div>';
        }).join('') + '</div>' : '<div class="muted center">Ничего не надето</div>') + '</div>';
      h += '<div class="card"><h3>Инвентарь</h3><div class="grid g3">' +
        S.inv.slice().sort(function (a, b) { return b.rar - a.rar; }).slice(0, 24).map(function (it) {
          var c = LOOT.upgCost(it);
          return '<div class="itemcard" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '">' +
            '<div class="lv">+' + it.lvl + '</div><div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + '</div>' +
            '<button class="btn sm gold" style="width:100%;margin-top:4px" data-act="upgrade" data-uid="' + it.uid + '">' + U.fmt(c.gold) + '🪙</button>' +
            '</div>';
        }).join('') + '</div></div>';
    } else if (UI.forgeTab === 'dism') {
      h += '<div class="card"><h3>Разбор предметов</h3><div class="grid g3">' +
        S.inv.slice().sort(function (a, b) { return a.rar - b.rar; }).slice(0, 30).map(function (it) {
          var v = LOOT.dismantleValue(it);
          return '<div class="itemcard" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '">' +
            '<div class="lv">+' + it.lvl + '</div><div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + '</div>' +
            '<button class="btn sm" style="width:100%;margin-top:4px" data-act="dismantle" data-uid="' + it.uid + '">+' + U.fmt(v.dust) + '✨</button>' +
            '</div>';
        }).join('') + '</div>' +
        '<div class="banner" style="margin-top:10px">Авто-разбор Rare и ниже ускоряет фарм. Настроить: Меню → Настройки.</div></div>';
    } else if (UI.forgeTab === 'merge') {
      var groups = {};
      S.inv.forEach(function (it) {
        var k = it.name + '|' + it.rar;
        groups[k] = (groups[k] || 0) + 1;
      });
      var ready = Object.keys(groups).filter(function (k) { return groups[k] >= 3; });
      h += '<div class="card"><h3>Слияние: 3 одинаковых → лучше</h3>' +
        (ready.length ? '<div class="grid g3">' + ready.map(function (k) {
          var parts2 = k.split('|');
          var it = S.inv.filter(function (x) { return x.name === parts2[0] && x.rar == parts2[1]; })[0];
          return '<div class="itemcard" style="--rc:' + rc(it) + '">' +
            '<div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + ' ×' + groups[k] + '</div>' +
            '<button class="btn sm green" style="width:100%;margin-top:4px" data-act="merge" data-uid="' + it.uid + '">Слить</button>' +
            '</div>';
        }).join('') + '</div>' : '<div class="muted center" style="padding:14px">Нужно 3 одинаковых предмета одного уровня редкости</div>') +
        '</div>';
    } else if (UI.forgeTab === 'craft') {
      var slots = ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak'];
      h += '<div class="card"><h3>Крафт из осколков</h3><div class="tabs">' +
        slots.map(function (s, i) { return '<button data-act="craftslot" data-k="' + s + '" class="' + (UI.craftSlot === s ? 'on' : '') + '">' + (D.SLOTS.filter(function (x) { return x.k === s; })[0] || {}).n + '</button>'; }).join('') +
        '</div>' +
        [0, 1, 2, 3, 4, 5, 6, 7].map(function (r) {
          var c = LOOT.craftCost(r);
          return '<div class="statline"><span class="k" style="color:' + D.RARITY[r].c + '">' + D.RARITY[r].n + '</span>' +
            '<button class="btn sm ' + (S.shards >= c.shards && S.gold >= c.gold ? 'gold' : '') + '" data-act="craft" data-r="' + r + '">' + U.fmt(c.shards) + '🧩 ' + U.fmt(c.gold) + '🪙</button></div>';
        }).join('') + '</div>';
    } else {
      h += '<div class="card"><h3>☠️ Проклятия</h3>' +
        '<div class="muted tiny">Проклятие: мощный бонус + серьёзный минус. Снятие стоит 50 💎 (бонус остаётся, предмет становится легендарным).</div>' +
        '<div class="grid g3" style="margin-top:8px">' +
        S.inv.slice().sort(function (a, b) { return b.rar - a.rar; }).slice(0, 24).map(function (it) {
          if (it.rar === 5) {
            return '<div class="itemcard" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '"><div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + '</div>' +
              '<button class="btn sm green" style="width:100%;margin-top:4px" data-act="uncurse" data-uid="' + it.uid + '">Снять 50💎</button></div>';
          }
          return '<div class="itemcard" style="--rc:' + rc(it) + '" data-act="item" data-uid="' + it.uid + '"><div class="ico">' + it.icon + '</div><div class="nm">' + U.esc(it.name) + '</div>' +
            '<button class="btn sm red" style="width:100%;margin-top:4px" data-act="curse" data-uid="' + it.uid + '">Проклясть</button></div>';
        }).join('') + '</div></div>';
    }
    els.forgeContent.innerHTML = h;
  }

  /* ---------- ТАЛАНТЫ ---------- */
  function renderTalents() {
    var h = '<div class="card"><h3>🌟 Таланты <span class="tag">очков: ' + S.hero.tp + '</span></h3>' +
      '<div class="muted tiny">Очко таланта даётся за каждый уровень героя. Активный герой даёт 100% пассивки, остальные в отряде — 50%.</div></div>';
    Object.keys(D.TALENTS).forEach(function (br) {
      var B = D.TALENTS[br];
      h += '<div class="card"><h3 style="color:' + B.c + '">' + B.i + ' ' + B.n + '</h3><div class="grid g4">' +
        B.nodes.map(function (n) {
          var lv = S.talents[n.k] || 0;
          return '<div class="tnode ' + (lv >= n.max ? 'max' : (lv ? 'on' : '')) + '" data-act="talent" data-k="' + n.k + '">' +
            '<div class="ti">' + n.i + '</div><div class="tn">' + n.n + '</div>' +
            '<div class="tl">' + (lv ? lv + '/' + n.max : 'взять') + '</div></div>';
        }).join('') + '</div></div>';
    });
    els.talentsContent.innerHTML = h;
  }

  /* ---------- МЕНЮ ---------- */
  var MENU = [
    ['pets', '🐾', 'Питомцы'], ['runes', '🔯', 'Руны'], ['artifacts', '🔮', 'Артефакты'],
    ['pass', '🎟️', 'Баттл-пасс'], ['quests', '✅', 'Задания'], ['shop', '🛒', 'Магазин'],
    ['portal', '🌀', 'Портал'], ['merchant', '⚖️', 'Торговец'], ['arena', '🏟️', 'Арена'],
    ['minigames', '🎮', 'Мини-игры'], ['prestige', '👻', 'Престиж'], ['collection', '📚', 'Коллекция'],
    ['achievements', '🏆', 'Достижения'], ['titles', '🎖️', 'Титулы'], ['stats', '📈', 'Статистика'],
    ['settings', '⚙️', 'Настройки']
  ];
  function renderMenu() {
    var h = '<div class="card">' + curLine() +
      '<div class="tiny muted center" style="margin-top:6px">Этап: <b>' + S.maxWave + '</b> • Убито: ' + U.fmt(S.kills) + ' • Престижей: ' + S.prestige + '</div></div>';
    h += '<div class="grid g3">' + MENU.map(function (m) {
      var badge = '';
      if (m[0] === 'quests') badge = '<div class="badge-new" style="position:static">!</div>';
      return '<button class="btn" data-act="sub" data-k="' + m[0] + '" style="padding:14px 6px;font-size:12px">' +
        '<div style="font-size:24px">' + m[1] + '</div>' + m[2] + badge + '</button>';
    }).join('') + '</div>';
    h += '<div class="card" style="margin-top:10px"><div class="tiny muted center">' + U.esc(U.pick(D.JOKES)) + '</div></div>';
    h += '<div class="card"><div class="row" style="gap:6px">' +
      '<button class="btn sm" data-act="codes">🎟️ Промокод</button>' +
      '<button class="btn sm" data-act="export">💾 Экспорт</button>' +
      '<button class="btn sm red" data-act="wipe">🗑️ Сброс</button>' +
      '</div></div>';
    els.menuContent.innerHTML = h;
  }

  UI.init = function () {
    els = {
      wave: U.qs('#hud-wave'), biome: U.qs('#hud-biome'), weather: U.qs('#hud-weather'),
      gold: U.qs('#cur-gold'), crystals: U.qs('#cur-crystals'), souls: U.qs('#cur-souls'),
      hpfill: U.qs('#hero-hpfill'), hptext: U.qs('#hero-hptext'),
      ragefill: U.qs('#rage-fill'), ragetext: U.qs('#rage-text'),
      ult: U.qs('#ult-btn'), combo: U.qs('#combo-badge'), banner: U.qs('#wave-banner'),
      bossbar: U.qs('#bossbar'), bossname: U.qs('#boss-name'), bossfill: U.qs('#boss-fill'), bosstext: U.qs('#boss-hptext'),
      gates: U.qs('#gates-strip'), x2: U.qs('#btn-x2'), auto: U.qs('#btn-autobattle'),
      tapHint: U.qs('#tap-hint'), offline: U.qs('#offline-float'),
      heroContent: U.qs('#hero-content'), forgeContent: U.qs('#forge-content'),
      talentsContent: U.qs('#talents-content'), menuContent: U.qs('#menu-content'),
      subContent: U.qs('#sub-content'), subTitle: U.qs('#sub-title'), subRight: U.qs('#sub-right')
    };
    /* навигация */
    U.qsa('.navbtn').forEach(function (b) {
      b.addEventListener('click', function () { setScreen(b.getAttribute('data-screen')); Audio2.sfx('click'); });
    });
    U.qs('#sub-back').addEventListener('click', function () { UI.sub = null; setScreen('scr-menu'); });
    /* боевые кнопки */
    U.qs('#ult-btn').addEventListener('click', function (e) { e.stopPropagation(); Combat.doUlt(); });
    U.qs('#btn-autobattle').addEventListener('click', function (e) {
      e.stopPropagation(); S.settings.auto = !S.settings.auto; updateHUD();
      U.toast(S.settings.auto ? '🤖 Автобой включён' : '👆 Ручной режим: +10% золота');
    });
    U.qs('#btn-hero-swap').addEventListener('click', function (e) {
      e.stopPropagation();
      if (S.squad.length < 2) { U.toast('Нужен второй герой в отряде'); return; }
      S.activeSquad = ((S.activeSquad || 0) + 1) % S.squad.length;
      var hd = Combat.heroDef();
      Combat.syncHero();
      U.toast('🔄 Активный герой: <b>' + hd.n + '</b>');
      Audio2.sfx('equip');
    });
    U.qs('#btn-x2').addEventListener('click', function (e) { e.stopPropagation(); UI.openAd('x2'); });
    /* тап по экрану */
    var scene = U.qs('#scene');
    scene.addEventListener('touchstart', function (e) { Combat.tap(); }, { passive: true });
    scene.addEventListener('mousedown', function (e) { Combat.tap(); });

    /* глобальные действия */
    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.getAttribute && t.getAttribute('data-act')) {
          var act = t.getAttribute('data-act');
          var fn = UI.ACT[act];
          if (fn) { e.stopPropagation(); fn(t, e); return; }
        }
        t = t.parentNode;
      }
    });
    UI.els = els;
    /* tooltip для карточек */
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.getAttribute && t.getAttribute('data-tip')) { UI.showTipHTML(t.getAttribute('data-tip')); return; }
        t = t.parentNode;
      }
    });
    document.addEventListener('mouseout', function () { U.hideTip(); });
  };

  UI.showTipHTML = function (html) {
    var tt = U.qs('#tooltip');
    tt.innerHTML = html;
    tt.classList.remove('hidden');
    tt.style.left = '50%';
    tt.style.top = '35%';
    tt.style.transform = 'translateX(-50%)';
  };
  UI.hideTipEl = function () { U.qs('#tooltip').classList.add('hidden'); };

  UI.setScreen = setScreen;
  UI.updateHUD = updateHUD;
  UI.updateUlt = updateUlt;
  UI.updateBossBar = updateBossBar;
  UI.bossBar = bossBar;
  UI.hideBossBar = hideBossBar;
  UI.showWaveBanner = showWaveBanner;
  UI.shake = shake;
  UI.bumpCur = bumpCur;
  UI.renderHero = renderHero;
  UI.renderForge = renderForge;
  UI.renderTalents = renderTalents;
  UI.renderMenu = renderMenu;
  UI.itemCard = itemCard;
  UI.curLine = curLine;
  UI.bar = bar;
  UI.rc = rc;
  UI.rn = rn;
  UI.els = els;
  UI.MENU = MENU;
  return UI;
})();
if (typeof window !== 'undefined') window.UI = UI;
