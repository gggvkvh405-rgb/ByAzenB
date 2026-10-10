/* ============================================================
   ui2.js — подэкраны, модалки, магазины, престиж, арена
   ============================================================ */
(function () {
  'use strict';
  var bar = UI.bar, curLine = UI.curLine;

  /* ================= ПОДЭКРАНЫ ================= */
  UI.renderSub = function (kind) {
    UI.sub = kind;
    var t = '', right = '', c = '';
    var T = Stats.final();

    if (kind === 'pets') {
      t = '🐾 Питомцы'; right = Object.keys(S.pets).length + ' шт.';
      c = '<div class="card"><div class="muted tiny">Экипированный питомец даёт 100% бонуса, остальные — 20%. Свиток питомца: нажми, чтобы экипировать.</div></div>';
      c += '<div class="grid g3">' + D.PETS.map(function (p) {
        var lv = S.pets[p.k] || 0;
        if (!lv) return '<div class="itemcard" style="--rc:#555;opacity:.5"><div class="ico">' + p.i + '</div><div class="nm">??? </div></div>';
        var eq = S.petEquipped === p.k;
        return '<div class="itemcard" style="--rc:' + (eq ? '#ffcc3d' : '#8fa3b8') + '" data-act="pet" data-k="' + p.k + '">' +
          '<div class="lv">ур.' + lv + '</div><div class="ico">' + p.i + '</div><div class="nm">' + p.n + '</div>' +
          '<div class="tiny ' + (eq ? 'gold' : 'muted') + '">' + (eq ? 'НАДЕТ' : 'надеть') + '</div></div>';
      }).join('') + '</div>';
      c += '<div class="card"><h3>Бонусы питомцев</h3>' + D.PETS.filter(function (p) { return S.pets[p.k]; }).map(function (p) {
        return '<div class="statline"><span class="k">' + p.i + ' ' + p.n + '</span><span class="v green">' + LOOT.effText(p.e, (S.pets[p.k] || 1) - 1).replace(/<[^>]+>/g, ' ').trim() + '</span></div>';
      }).join('') + '</div>';

    } else if (kind === 'runes') {
      t = '🔯 Руны'; right = S.runes.length + ' шт.';
      c = '<div class="card"><div class="row spread"><b>Сумка рун</b>' +
        '<button class="btn sm green" data-act="mergerunes">🔀 Слить одинаковые</button></div>' +
        '<div class="muted tiny" style="margin-top:6px">Вставляй руны в экипировку: заходи в предмет (экран Герой/Кузница). Гнёзд у предмета: 1 + редкость/2.</div></div>';
      if (!S.runes.length) c += '<div class="card muted center">Рун пока нет. Они падают с боссов и из сундуков.</div>';
      c += '<div class="grid g4">' + S.runes.map(function (r, i) {
        var rd = null;
        for (var j = 0; j < D.RUNES.length; j++) if (D.RUNES[j].k === r.k) rd = D.RUNES[j];
        return '<div class="itemcard" style="--rc:#b45cff" data-act="runeinfo" data-i="' + i + '">' +
          '<div class="lv">' + (r.lvl || 1) + '</div><div class="ico">' + rd.i + '</div><div class="nm">' + rd.n.replace('Руна ', '') + '</div></div>';
      }).join('') + '</div>';
      c += '<div class="card"><h3>Вставленные руны</h3>' + D.SLOTS.map(function (sl) {
        var it = S.equip[sl.k];
        if (!it || !it.runes || !it.runes.length) return '';
        return '<div class="statline"><span class="k">' + it.icon + ' ' + U.esc(it.name) + '</span><span class="v">' +
          it.runes.map(function (r, i) {
            for (var j = 0; j < D.RUNES.length; j++) if (D.RUNES[j].k === r.k) return D.RUNES[j].i + (r.lvl || 1);
            return '?';
          }).join(' ') + '</span></div>';
      }).join('') + '</div>';

    } else if (kind === 'artifacts') {
      t = '🔮 Артефакты'; right = S.artifacts.filter(function (a) { return a.equipped; }).length + '/4';
      c = '<div class="card"><div class="muted tiny">Можно надеть до 4 артефактов. Артефакты падают с боссов и выпадают в Портале.</div></div>';
      if (!S.artifacts.length) c += '<div class="card muted center">Пока ни одного. Убей босса!</div>';
      c += '<div class="grid g2">' + S.artifacts.map(function (a) {
        return '<div class="itemcard" style="--rc:' + (a.equipped ? '#ffcc3d' : '#b45cff') + '" data-act="artifact" data-uid="' + a.uid + '">' +
          '<div class="ico">🔮</div><div class="nm">' + U.esc(a.name) + '</div>' +
          '<div class="tiny ' + (a.equipped ? 'gold' : 'muted') + '">' + (a.equipped ? 'НАДЕТ' : 'надеть') + '</div></div>';
      }).join('') + '</div>';

    } else if (kind === 'pass') {
      t = '🎟️ Баттл-пасс'; right = 'ур. ' + S.bp.level;
      var need = D.BP.xpPerLevel;
      c = '<div class="card"><h3>Сезон 1: ' + D.BP.name + '</h3>' +
        bar(S.bp.xp / need, 'xp') +
        '<div class="tiny muted center" style="margin-top:4px">' + U.fmt(S.bp.xp) + ' / ' + U.fmt(need) + ' опыта</div>' +
        '<div class="muted tiny" style="margin-top:8px">Опыт капает за волны (10), боссов (50), престижи (200) и задания.</div>' +
        (!S.bp.premium ? '<button class="btn gold wide" style="margin-top:8px" data-act="buypremium">💎 Купить Premium (демо — бесплатно)</button>' : '<div class="chip g" style="margin-top:8px">Premium активен ✅</div>') +
        '</div>';
      [['free', 'Бесплатная дорожка', D.BP.free], ['premium', 'Premium', D.BP.premium], ['premiumPlus', 'Premium+', D.BP.premiumPlus]].forEach(function (tr) {
        c += '<div class="card"><h3>' + tr[1] + '</h3>' + Object.keys(tr[2]).map(function (lv) {
          var claimed = S.bp.claimed[tr[0] + '_' + lv];
          var ok = S.bp.level >= parseInt(lv, 10);
          var locked = (tr[0] !== 'free' && !S.bp.premium);
          return '<div class="statline"><span class="k">Ур. ' + lv + ' — ' + UI.rewardText(tr[2][lv]) + '</span>' +
            (claimed ? '<span class="chip g">получено</span>' :
              '<button class="btn sm ' + (ok && !locked ? 'green' : '') + '"' + (ok && !locked ? '' : ' disabled') + ' data-act="claimbp" data-track="' + tr[0] + '" data-lv="' + lv + '">Забрать</button>') +
            '</div>';
        }).join('') + '</div>';
      });

    } else if (kind === 'quests') {
      t = '✅ Задания'; right = '🎟️ ' + S.medals;
      [['daily', 'Ежедневные'], ['weekly', 'Еженедельные'], ['season', 'Сезонные']].forEach(function (g) {
        var l = S.quests[g[0]] || [];
        c += '<div class="card"><h3>' + g[1] + '</h3>' + l.map(function (q, i) {
          return '<div class="statline"><span class="k">' + (q.label || '').replace('{n}', U.fmt(q.n)) + '</span></div>' +
            '<div class="row" style="gap:6px;margin-bottom:8px">' + bar(q.p / q.n) +
            (q.claimed ? '<span class="chip g">✔</span>' :
              '<button class="btn sm ' + (q.done ? 'green' : '') + '"' + (q.done ? '' : ' disabled') + ' data-act="claimquest" data-g="' + g[0] + '" data-i="' + i + '">+</button>') +
            '</div>' +
            '<div class="tiny muted">' + U.fmt(q.p) + ' / ' + U.fmt(q.n) + ' • награда: ' + UI.rewardText(q.r) + '</div>';
        }).join('') + '</div>';
      });

    } else if (kind === 'shop') {
      t = '🛒 Магазин'; right = '💎 ' + U.fmt(S.crystals);
      c = '<div class="card"><div class="muted tiny">Демо-сборка: покупки за реальные деньги не работают, но всё можно забрать бесплатно. Приятной игры!</div></div>';
      c += D.SHOP.map(function (s) {
        return '<div class="card"><div class="row spread"><div><b>' + s.i + ' ' + s.n + '</b><div class="tiny muted">' + (s.crystals ? s.crystals + ' 💎' : s.price) + '</div></div>' +
          '<button class="btn sm gold" data-act="buy" data-k="' + s.k + '">' + (s.crystals ? 'Забрать' : 'Купить') + '</button></div></div>';
      }).join('');
      c += '<div class="card"><h3>🎁 Сундуки</h3>' +
        [['c', 'Обычный', 0], ['r', 'Редкий', 2000], ['e', 'Эпический', 15000], ['l', 'Легендарный', 150000]].map(function (ch) {
          return '<button class="btn sm" style="margin:3px" data-act="chest" data-k="' + ch[0] + '">' + ch[1] + (ch[2] ? ' (' + U.fmt(ch[2]) + '🪙)' : ' (бесплатно)') + '</button>';
        }).join('') + '</div>';

    } else if (kind === 'portal') {
      t = '🌀 Кузнечный портал'; right = 'pity ' + S.gacha.pity + '/50';
      c = '<div class="card"><h3>Гача с pity 50</h3>' +
        '<div class="muted tiny">На 50-м открытии гарантировано мифическое или лучше. Шансы: 2% Божественное, 6% Проклятое, 17% Мифическое, 30% Легендарное.</div>' +
        '<div class="row" style="margin-top:10px;gap:8px">' +
        '<button class="btn gold wide" data-act="gacha" data-n="1">100💎 ×1</button>' +
        '<button class="btn gold wide" data-act="gacha" data-n="10">900💎 ×10</button></div></div>';

    } else if (kind === 'merchant') {
      t = '⚖️ Торговец';
      if (!S.merchant.items || S.merchant.refresh < U.now()) rollMerchant();
      var left = Math.max(0, S.merchant.refresh - U.now());
      right = '⏳ ' + U.fmtTime(left / 1000);
      c = '<div class="card"><div class="muted tiny">Случайные товары. Обновление раз в 30 минут.</div>' +
        '<button class="btn sm" data-act="rerollmerchant" style="margin-top:6px">🔄 Обновить за 50💎</button></div>';
      c += '<div class="grid g3">' + S.merchant.items.map(function (m, i) {
        if (m.kind === 'item') {
          return '<div class="itemcard" style="--rc:' + UI.rc(m.it) + '" data-act="merch" data-i="' + i + '">' +
            '<div class="ico">' + m.it.icon + '</div><div class="nm">' + U.esc(m.it.name) + '</div>' +
            '<div class="tiny gold">' + U.fmt(m.price) + (m.cur === 'crystals' ? '💎' : '🪙') + '</div></div>';
        }
        if (m.kind === 'rune') {
          var rd = null;
          for (var j = 0; j < D.RUNES.length; j++) if (D.RUNES[j].k === m.rune.k) rd = D.RUNES[j];
          return '<div class="itemcard" style="--rc:#b45cff" data-act="merch" data-i="' + i + '"><div class="ico">' + rd.i + '</div><div class="nm">' + rd.n + '</div><div class="tiny gold">' + U.fmt(m.price) + '🪙</div></div>';
        }
        return '<div class="itemcard" style="--rc:#ffcc3d" data-act="merch" data-i="' + i + '"><div class="ico">' + (m.kind === 'pet' ? '🥚' : '📦') + '</div><div class="nm">' + (m.kind === 'pet' ? 'Яйцо питомца' : 'Сундук') + '</div><div class="tiny gold">' + U.fmt(m.price) + '🪙</div></div>';
      }).join('') + '</div>';

    } else if (kind === 'arena') {
      t = '🏟️ Арена'; right = '🏅 ' + S.arena.rating;
      c = '<div class="card"><h3>Асинхронный PvP</h3>' +
        '<div class="muted tiny">Бой автоматический: считаются мощь, урон, HP и немного удачи. Победа даёт жетоны и рейтинг.</div>' +
        '<div class="statline"><span class="k">Твоя мощь</span><span class="v gold">' + U.fmt(T.power) + '</span></div>' +
        '<div class="statline"><span class="k">Жетоны</span><span class="v">' + U.fmt(S.tokens) + '</span></div>' +
        '<div class="statline"><span class="k">Боёв / побед</span><span class="v">' + S.arena.fights + ' / ' + S.arena.wins + '</span></div>' +
        '<div class="statline"><span class="k">Лига</span><span class="v">' + league() + '</span></div>' +
        '<button class="btn green wide" style="margin-top:8px" data-act="arenafight">⚔️ Найти противника (1 🎫)</button></div>';
      c += '<div class="card"><h3>Магазин арены</h3>' +
        '<button class="btn sm" data-act="arenabuy" data-k="pet">🥚 Яйцо питомца (300)</button> ' +
        '<button class="btn sm" data-act="arenabuy" data-k="rune">🔯 Руна (150)</button> ' +
        '<button class="btn sm" data-act="arenabuy" data-k="chest">📦 Сундук (200)</button></div>';

    } else if (kind === 'minigames') {
      t = '🎮 Мини-игры';
      var cd = MG.cooldownLeft();
      c = '<div class="card"><div class="muted tiny">Мини-игры «как из рекламы», но реально играбельные. Награда: золото, кристаллы и бафф на 10 минут.</div>' +
        (cd > 0 ? '<div class="chip" style="margin-top:6px">⏳ До следующей игры: ' + U.fmtTime(cd / 1000) + '</div>' : '') + '</div>';
      c += D.MINIGAMES.map(function (g) {
        return '<div class="card"><div class="row spread"><div><b>' + g.i + ' ' + g.n + '</b><div class="tiny muted">' + g.d + '</div></div>' +
          '<button class="btn sm green" data-act="playmg" data-k="' + g.k + '"' + (cd > 0 ? ' disabled' : '') + '>Играть</button></div></div>';
      }).join('');

    } else if (kind === 'prestige') {
      t = '👻 Престиж';
      c = '<div class="card"><div class="muted tiny">Престиж сбрасывает этап, золото и обычные улучшения, но даёт вечные множители. Коллекция, питомцы, руны, предметы и скины остаются.</div></div>';
      c += D.PRESTIGE_TIERS.map(function (pt) {
        var unlocked = S.maxWave >= pt.wave;
        var gain = pt.f(S.maxWave);
        var cur = S[pt.cur] || 0;
        return '<div class="card"><h3>' + pt.i + ' ' + pt.n + ' <span class="tag">с ' + pt.wave + ' этапа</span></h3>' +
          '<div class="statline"><span class="k">Твой этап</span><span class="v">' + S.maxWave + ' / ' + pt.wave + '</span></div>' +
          '<div class="statline"><span class="k">Получишь</span><span class="v gold">+' + U.fmt(gain) + ' ' + pt.curName + '</span></div>' +
          '<div class="statline"><span class="k">У тебя</span><span class="v">' + U.fmt(cur) + '</span></div>' +
          (unlocked ? '<button class="btn gold wide" style="margin-top:8px" data-act="doprestige" data-k="' + pt.k + '">Переродиться</button>'
            : '<button class="btn wide" style="margin-top:8px" disabled>Нужно ' + pt.wave + ' этап</button>') +
          '</div>';
      }).join('');
      c += D.PTREES.map(function (tree) {
        var cur = S[tree.cur] || 0;
        return '<div class="card"><h3>' + tree.i + ' ' + tree.n + ' <span class="tag">' + U.fmt(cur) + '</span></h3>' +
          tree.nodes.map(function (n) {
            var lv = S.ptree[n.k] || 0;
            var cost = Math.floor(n.cost * Math.pow(1.25, lv));
            return '<div class="statline"><span class="k">' + n.i + ' ' + n.n + ' <span class="muted">(' + lv + '/' + n.max + ')</span>' +
              '<div class="tiny muted">' + LOOT.effText(n.e, 0).replace(/<[^>]+>/g, ' ').trim() + '</div></span>' +
              '<button class="btn sm gold" data-act="ptree" data-k="' + n.k + '"' + (cur < cost ? ' disabled' : '') + '>' + U.fmt(cost) + '</button></div>';
          }).join('') + '</div>';
      }).join('');

    } else if (kind === 'collection') {
      t = '📚 Коллекция';
      var col = Stats.collectionCount();
      c = '<div class="card"><h3>Собрано предметов: ' + col + '</h3>' +
        '<div class="muted tiny">Каждые 10 предметов дают +1% ко всем характеристикам. Сейчас: +' + (col * 0.1).toFixed(1) + '%</div></div>';
      var keys = Object.keys(S.collection).sort(function (a, b) { return S.collection[b] - S.collection[a]; });
      c += '<div class="card"><div class="grid g3">' + keys.slice(0, 60).map(function (k) {
        var parts = k.split('|');
        return '<div class="itemcard" style="--rc:#8fa3b8"><div class="ico">📦</div><div class="nm">' + U.esc(parts[0]) + '</div><div class="lv">×' + S.collection[k] + '</div></div>';
      }).join('') + '</div>' + (keys.length > 60 ? '<div class="muted tiny center">…и ещё ' + (keys.length - 60) + '</div>' : '') + '</div>';
      c += '<div class="card"><h3>Репутация фракций</h3>' + D.FACTIONS.map(function (f) {
        return '<div class="statline"><span class="k">' + D.FACTION_NAMES[f] + '</span><span class="v">' + U.fmt(S.reputation[f] || 0) + '</span></div>';
      }).join('') + '</div>';

    } else if (kind === 'achievements') {
      t = '🏆 Достижения'; right = Object.keys(S.achievements).length + '/' + D.ACHIEVEMENTS.length;
      c = '<div class="card">' + D.ACHIEVEMENTS.map(function (a) {
        var got = !!S.achievements[a.k];
        return '<div class="statline"><span class="k">' + (got ? a.i : '🔒') + ' ' + a.n + '<div class="tiny muted">' + a.d + '</div></span>' +
          '<span class="v ' + (got ? 'green' : 'muted') + '">' + (got ? '✔' : (a.r.crystals ? a.r.crystals + '💎' : U.fmt(a.r.gold || 0) + '🪙')) + '</span></div>';
      }).join('') + '</div>';

    } else if (kind === 'titles') {
      t = '🎖️ Титулы';
      var ctx = ST.titleCtx();
      c = '<div class="card">' + D.TITLES.map(function (ti) {
        var got = S.titles.unlocked.indexOf(ti.k) >= 0;
        var cur = S.titles.current === ti.k;
        return '<div class="statline"><span class="k">' + (got ? '🎖️' : '🔒') + ' ' + ti.n + '<div class="tiny muted">' + ti.d + '</div></span>' +
          '<button class="btn sm ' + (cur ? 'green' : '') + '"' + (got ? '' : ' disabled') + ' data-act="title" data-k="' + ti.k + '">' + (cur ? 'НАДЕТ' : 'надеть') + '</button></div>';
      }).join('') + '</div>';

    } else if (kind === 'stats') {
      t = '📈 Статистика';
      var st = S.stats;
      c = '<div class="card">' +
        '<div class="statline"><span class="k">🌊 Макс. этап</span><span class="v gold">' + S.maxWave + '</span></div>' +
        '<div class="statline"><span class="k">☠️ Убито монстров</span><span class="v">' + U.fmt(S.kills) + '</span></div>' +
        '<div class="statline"><span class="k">👑 Боссов</span><span class="v">' + U.fmt(S.bossKills) + '</span></div>' +
        '<div class="statline"><span class="k">👆 Тапов</span><span class="v">' + U.fmt(S.taps) + '</span></div>' +
        '<div class="statline"><span class="k">⚡ Ульт</span><span class="v">' + U.fmt(S.ults) + '</span></div>' +
        '<div class="statline"><span class="k">💥 Критов</span><span class="v">' + U.fmt(S.crits) + '</span></div>' +
        '<div class="statline"><span class="k">🗡️ Нанесено урона</span><span class="v">' + U.fmt(st.dmgDealt) + '</span></div>' +
        '<div class="statline"><span class="k">💪 Лучший удар</span><span class="v gold">' + U.fmt(st.bestHit) + '</span></div>' +
        '<div class="statline"><span class="k">💰 Заработано золота</span><span class="v">' + U.fmt(st.goldEarned) + '</span></div>' +
        '<div class="statline"><span class="k">🎁 Найдено предметов</span><span class="v">' + U.fmt(st.itemsFound) + '</span></div>' +
        '<div class="statline"><span class="k">💀 Смертей</span><span class="v">' + S.stats.deaths + '</span></div>' +
        '<div class="statline"><span class="k">🎬 «Реклама»</span><span class="v">' + S.stats.adsWatched + '</span></div>' +
        '<div class="statline"><span class="k">⏱ В игре</span><span class="v">' + U.fmtTime((U.now() - S.created) / 1000) + '</span></div>' +
        '</div>';
      c += '<div class="card"><h3>Любимые жертвы</h3>' + Object.keys(st.killsByType).sort(function (a, b) { return st.killsByType[b] - st.killsByType[a]; }).slice(0, 10).map(function (k) {
        return '<div class="statline"><span class="k">' + k + '</span><span class="v">' + U.fmt(st.killsByType[k]) + '</span></div>';
      }).join('') + '</div>';

    } else if (kind === 'settings') {
      t = '⚙️ Настройки';
      var s = S.settings;
      c = '<div class="card"><h3>Звук и эффекты</h3>' +
        toggle('sound', '🔊 Звуки', s.sound) + toggle('music', '🎵 Музыка', s.music) +
        toggle('shake', '📳 Тряска экрана', s.shake) + toggle('auto', '🤖 Автобой', s.auto) +
        '<div class="statline"><span class="k">✨ Частицы</span><span class="v">' +
        ['Минимум', 'Норма', 'Максимум'].map(function (n, i) {
          return '<button class="btn sm ' + (s.particles === i ? 'gold' : '') + '" data-act="setpart" data-v="' + i + '">' + n + '</button>';
        }).join(' ') + '</span></div></div>';
      c += '<div class="card"><h3>Авто-разбор лута</h3><div class="muted tiny">Предметы этой редкости и ниже будут разбираться автоматически.</div>' +
        '<div class="row wrap" style="margin-top:6px">' +
        [-1].concat([0, 1, 2, 3, 4]).map(function (r) {
          return '<button class="btn sm ' + (S.filter.autoSell === r ? 'gold' : '') + '" data-act="setautosell" data-v="' + r + '">' + (r < 0 ? 'Выключено' : D.RARITY[r].n) + '</button>';
        }).join('') + '</div></div>';
      c += '<div class="card"><h3>Сохранение</h3>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' +
        '<button class="btn sm" data-act="save">💾 Сохранить</button>' +
        '<button class="btn sm" data-act="export">📤 Экспорт</button>' +
        '<button class="btn sm" data-act="import">📥 Импорт</button>' +
        '<button class="btn sm red" data-act="wipe">🗑️ Сброс прогресса</button></div>' +
        '<div class="tiny muted" style="margin-top:6px">Прогресс хранится локально в приложении.</div></div>';
    }

    UI._rendering = true;
    UI.els.subTitle.textContent = t;
    UI.els.subRight.innerHTML = right;
    UI.els.subContent.innerHTML = c;
    U.qsa('.screen').forEach(function (s2) { s2.classList.toggle('active', s2.id === 'scr-sub'); });
    U.qsa('.navbtn').forEach(function (b) { b.classList.remove('active'); });
    UI.screen = 'scr-sub';
    UI._rendering = false;
  };

  function toggle(k, label, val) {
    return '<div class="statline"><span class="k">' + label + '</span>' +
      '<button class="btn sm ' + (val ? 'green' : '') + '" data-act="toggle" data-k="' + k + '">' + (val ? 'ВКЛ' : 'ВЫКЛ') + '</button></div>';
  }
  function league() {
    var r = S.arena.rating;
    if (r < 1100) return '🥉 Бронза';
    if (r < 1300) return '🥈 Серебро';
    if (r < 1600) return '🥇 Золото';
    if (r < 1900) return '💠 Платина';
    if (r < 2300) return '💎 Алмаз';
    return '🌈 Хаос';
  }
  function rollMerchant() {
    var items = [];
    var T = Stats.final();
    for (var i = 0; i < 6; i++) {
      var r = Math.random();
      if (r < 0.45) {
        var rar = U.weighted([0, 1, 2, 3, 4], function (x) { return [5, 4, 2.5, 1, 0.25][x]; });
        var it = LOOT.makeItem(rar, U.pick(['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak']), 0);
        var price = Math.floor(D.RARITY[rar].dust * 60 * (1 + rar) * T.gold);
        items.push({ kind: 'item', it: it, price: Math.max(100, price), cur: 'gold' });
      } else if (r < 0.65) {
        var rk = U.pick(D.RUNES).k;
        items.push({ kind: 'rune', rune: { k: rk, lvl: 1 }, price: Math.floor(300 * T.gold * (1 + S.maxWave / 50)), cur: 'gold' });
      } else if (r < 0.8) {
        items.push({ kind: 'pet', price: Math.floor(2000 * T.gold * (1 + S.maxWave / 30)), cur: 'gold' });
      } else if (r < 0.95) {
        items.push({ kind: 'chest', chest: U.pick(['r', 'e']), price: Math.floor(1500 * T.gold), cur: 'gold' });
      } else {
        items.push({ kind: 'crystalpack', amount: 50, price: Math.floor(5000 * T.gold), cur: 'gold' });
      }
    }
    S.merchant = { items: items, refresh: U.now() + 1800000 };
  }
  UI.rewardText = function (r) {
    if (!r) return '';
    var out = [];
    if (r.gold) out.push(U.fmt(r.gold) + '🪙');
    if (r.crystals) out.push(r.crystals + '💎');
    if (r.medals) out.push(r.medals + '🎟️');
    if (r.bp) out.push(r.bp + ' XP пропуска');
    if (r.chest) out.push('📦×' + r.chest);
    if (r.chestL) out.push('📦 Легендарный×' + r.chestL);
    if (r.chestM) out.push('📦 Мифический×' + r.chestM);
    if (r.rune) out.push('🔯 Руна');
    if (r.pet) out.push('🐾 ' + LOOT.petName(r.pet));
    if (r.weapon) out.push('⚔️ Оружие');
    if (r.skin) out.push('👕 Скин');
    if (r.skinEx) out.push('👕 ' + r.skinEx);
    if (r.skinChaos) out.push('🌈 Хаос-скин');
    if (r.frame) out.push('🖼️ Рамка');
    if (r.avatar) out.push('🖼️ Аватар');
    if (r.emote) out.push('😀 Эмоция');
    if (r.title) out.push('🎖️ ' + r.title);
    return out.join(', ');
  };

  /* ================= МОДАЛКИ ================= */
  UI.itemModal = function (uid2) {
    var it = LOOT.find(uid2);
    var equipped = false, slot = null;
    if (!it) {
      for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) { it = S.equip[s]; equipped = true; slot = s; }
    }
    if (!it) return;
    it.isNew = false;
    var c = LOOT.upgCost(it);
    var same = LOOT.mergeTargets(it.slot, it.rar, it.name).length;
    var v = LOOT.dismantleValue(it);
    var setTxt = '';
    if (it.set) {
      var a = Stats.setAgg(), cnt = a.setCounts[it.set] || 0;
      var st = null;
      for (var i = 0; i < D.SETS.length; i++) if (D.SETS[i].k === it.set) st = D.SETS[i];
      setTxt = '<div class="tt-set">💠 ' + st.n + ' (' + cnt + '/5)<br>' +
        (cnt >= 3 ? '✔ ' + LOOT.effText(st.b3, 0).replace(/<[^>]+>/g, ' ').trim() : '3 предмета: ' + LOOT.effText(st.b3, 0).replace(/<[^>]+>/g, ' ').trim()) + '<br>' +
        (cnt >= 5 ? '✔ ' + st.b5t : '5 предметов: ' + st.b5t) + '</div>';
    }
    var runeTxt = '';
    if (it.runes && it.runes.length) {
      runeTxt = '<div class="tt-set">🔯 ' + it.runes.map(function (r, idx) {
        return '<span data-act="unsocket" data-uid="' + it.uid + '" data-i="' + idx + '">' + (D.RUNES.filter(function (x) { return x.k === r.k; })[0] || {}).i + (r.lvl || 1) + '</span>';
      }).join(' ') + '</div>';
    }
    var html = '<h2 style="color:' + UI.rc(it) + '">' + it.icon + ' ' + U.esc(it.name) + (it.lvl ? ' +' + it.lvl : '') + '</h2>' +
      '<div class="sub">' + UI.rn(it) + ' • ' + slotName(it.slot) + ' • мощь ' + U.fmt(LOOT.power(it)) + '</div>' +
      '<div class="card"><div class="tt-eff">' + LOOT.effText(it.e, it.lvl) + '</div>' + setTxt + runeTxt + '</div>' +
      '<div class="row wrap" style="gap:6px">' +
      (equipped ? '<button class="btn sm" data-act="unequip" data-slot="' + slot + '">Снять</button>'
        : '<button class="btn sm green" data-act="equip" data-uid="' + it.uid + '">Надеть</button>') +
      '<button class="btn sm gold" data-act="upgrade" data-uid="' + it.uid + '">⬆️ ' + U.fmt(c.gold) + '🪙 ' + U.fmt(c.dust) + '✨</button>' +
      '<button class="btn sm" data-act="dismantle" data-uid="' + it.uid + '">♻️ +' + U.fmt(v.dust) + '✨</button>' +
      (same >= 3 ? '<button class="btn sm green" data-act="merge" data-uid="' + it.uid + '">🔀 Слить (' + same + ')</button>' : '') +
      '<button class="btn sm" data-act="socket" data-uid="' + it.uid + '">🔯 Гнездо</button>' +
      '<button class="btn sm" data-act="reroll" data-uid="' + it.uid + '">🎲 20💎</button>' +
      (it.rar === 5 ? '<button class="btn sm green" data-act="uncurse" data-uid="' + it.uid + '">✨ Снять проклятие 50💎</button>'
        : '<button class="btn sm red" data-act="curse" data-uid="' + it.uid + '">☠️ Проклясть</button>') +
      (equipped ? '' : '<button class="btn sm" data-act="sell" data-uid="' + it.uid + '">💰 Продать</button>') +
      '</div>' +
      '<div class="actions"><button class="btn" data-close>Закрыть</button></div>';
    U.modal({
      html: html,
      onMount: function (m, close) {
        m.querySelector('[data-close]').onclick = close;
      },
      onClose: function () { UI.refresh(); }
    });
  };
  function slotName(k) {
    for (var i = 0; i < D.SLOTS.length; i++) if (D.SLOTS[i].k === k) return D.SLOTS[i].n;
    return k;
  }

  UI.openGates = function () {
    var opts = U.shuffle(D.GATES.slice()).slice(0, 3);
    Audio2.sfx('gates');
    U.modal({
      html: '<h2>🚪 ВРАТА ВЫБОРА</h2><div class="sub">Выбери один дар. Он действует до конца забега.</div>' +
        opts.map(function (g, i) {
          return '<div class="card" style="cursor:pointer" data-g="' + i + '"><h3>' + g.i + ' ' + g.n + '</h3><div class="muted tiny">' + g.d + '</div></div>';
        }).join(''),
      dismissable: false,
      onMount: function (m, close) {
        U.delegate(m, '[data-g]', 'click', function (e, el) {
          var g = opts[parseInt(el.getAttribute('data-g'), 10)];
          S.gates.push(g);
          if (S.gates.length > 6) S.gates.shift();
          Combat.syncHero();
          U.toast(g.i + ' ' + g.n + '!', 'epic', true);
          if (window.FX) FX.confetti(30);
          close();
          UI.refresh();
        });
      }
    });
  };

  UI.onDeath = function () {
    var canPrestige = S.maxWave >= D.PRESTIGE_TIERS[0].wave;
    U.modal({
      html: '<h2>💀 ТЫ ПАЛ</h2>' +
        '<div class="sub">Волна ' + Combat.C.wave + ' • мощь ' + U.fmt(Stats.final().power) + '</div>' +
        '<div class="card center"><div class="muted">' + U.esc(U.pick(D.JOKES)) + '</div></div>' +
        '<div class="actions" style="flex-direction:column">' +
        '<button class="btn gold wide" data-revive>🎬 Воскреситься (реклама)</button>' +
        '<button class="btn wide" data-rollback>↩️ Откатиться на 1 волну</button>' +
        (canPrestige ? '<button class="btn green wide" data-prestige>👻 В Престиж!</button>' : '') +
        '</div>',
      dismissable: false,
      onMount: function (m, close) {
        m.querySelector('[data-revive]').onclick = function () { close(); UI.openAd('revive'); };
        m.querySelector('[data-rollback]').onclick = function () { Combat.rollback(); close(); UI.refresh(); };
        var p = m.querySelector('[data-prestige]');
        if (p) p.onclick = function () { close(); UI.openSub && UI.sub; UI.renderSub('prestige'); };
      }
    });
  };

  var AD_TEXTS = [
    '🪒 Брейтесь клинком! Клинок и Монеты — sponsor',
    '🍔 Съешь гоблина. Нет, серьёзно.',
    '🎰 Казино «У Огра»: ставки слизью',
    '🚗 Тапай по экрану, как по педали',
    '💊 Урона мало? Попробуй «Нерфин»!',
    '🧦 Носки +999 к удаче. Только сегодня'
  ];
  UI.openAd = function (type) {
    S.stats.adsWatched++;
    ST.checkAch();
    var txt = U.pick(AD_TEXTS);
    var t = 0, dur = 3;
    var m = U.modal({
      html: '<h2>📺 РЕКЛАМА</h2><div class="sub">Так, посмотрим…</div>' +
        '<div class="card center" style="min-height:120px;display:flex;flex-direction:column;justify-content:center;gap:8px">' +
        '<div style="font-size:34px">' + txt.split(' ')[0] + '</div>' +
        '<div class="tiny muted">' + txt + '</div>' +
        '<div class="pbar"><div id="adbar" style="width:0%"></div></div>' +
        '<div class="tiny muted" id="adtime">' + dur + 'с</div></div>' +
        '<div class="actions"><button class="btn" id="adskip" disabled>Пропустить</button></div>',
      dismissable: false,
      onMount: function (mm, close) {
        var iv = setInterval(function () {
          t += 0.1;
          var b = document.getElementById('adbar');
          var tt = document.getElementById('adtime');
          if (b) b.style.width = Math.min(100, t / dur * 100) + '%';
          if (tt) tt.textContent = Math.max(0, dur - t).toFixed(1) + 'с';
          if (t >= dur) {
            clearInterval(iv);
            var sk = document.getElementById('adskip');
            if (sk) { sk.disabled = false; sk.className = 'btn gold'; sk.textContent = 'Забрать награду!'; }
          }
        }, 100);
        document.getElementById('adskip').onclick = function () {
          if (t < dur) return;
          clearInterval(iv);
          close();
          grantAd(type);
        };
      }
    });
    return m;
  };
  function grantAd(type) {
    S.stats.adsWatched++;
    switch (type) {
      case 'x2':
        S.x2Until = U.now() + 300000;
        U.toast('⏱ x2 золото на 5 минут!', 'epic', true);
        break;
      case 'revive':
        Combat.revive(true);
        U.toast('💚 Воскрешение!', 'epic', true);
        break;
      case 'offline':
        if (S._offline) {
          ST.add('gold', S._offline.gold);
          for (var i = 0; i < S._offline.items; i++) LOOT.addItem(LOOT.rollItem(S._offline.wave, 10));
          U.toast('📦 Оффлайн-награда ×2!', 'epic', true);
          S._offline = null;
        }
        break;
      case 'chest':
        grantChest(LOOT.openChest('r'));
        break;
    }
    ST.checkAch();
    UI.refresh();
  }
  function grantChest(res) {
    var html = '<h2>🎁 Добыча!</h2><div class="sub">Из сундука посыпалось…</div><div class="card">' +
      (res.gold ? '<div class="statline"><span class="k">🪙 Золото</span><span class="v gold">+' + U.fmt(res.gold) + '</span></div>' : '') +
      (res.crystals ? '<div class="statline"><span class="k">💎 Кристаллы</span><span class="v">+' + res.crystals + '</span></div>' : '') +
      res.items.map(function (it) { return '<div class="statline"><span class="k">' + it.icon + ' ' + U.esc(it.name) + '</span><span class="v" style="color:' + UI.rc(it) + '">' + UI.rn(it) + '</span></div>'; }).join('') +
      (res.runes.length ? '<div class="statline"><span class="k">🔯 Руны</span><span class="v">' + res.runes.length + '</span></div>' : '') +
      (res.pet ? '<div class="statline"><span class="k">🐾 Питомец</span><span class="v">' + LOOT.petName(res.pet) + '</span></div>' : '') +
      '</div><div class="actions"><button class="btn gold" data-ok>Забрать</button></div>';
    U.modal({ html: html, onMount: function (m, close) { m.querySelector('[data-ok]').onclick = close; }, onClose: UI.refresh });
    Audio2.sfx('chest');
    if (window.FX) FX.confetti(40);
  }

  UI.showOffline = function (rep) {
    if (!rep || rep.gold < 1) return;
    S._offline = rep;
    var html = '<h2>📦 ПОКА ТЕБЯ НЕ БЫЛО</h2>' +
      '<div class="sub">' + U.fmtTime(rep.sec) + ' герой фармил ' + rep.wave + ' этап' + (rep.capped ? ' (лимит достигнут)' : '') + '</div>' +
      '<div class="card center"><div class="big-num">+' + U.fmt(rep.gold) + ' 🪙</div>' +
      '<div class="muted">+' + rep.items + ' предметов</div></div>' +
      '<div class="actions"><button class="btn green" data-ok>Забрать</button>' +
      '<button class="btn gold" data-x2>🎬 ×2 за рекламу</button></div>';
    U.modal({
      html: html, dismissable: false,
      onMount: function (m, close) {
        m.querySelector('[data-ok]').onclick = function () {
          ST.add('gold', rep.gold);
          for (var i = 0; i < rep.items; i++) LOOT.addItem(LOOT.rollItem(rep.wave, 5));
          S._offline = null; close(); UI.refresh();
        };
        m.querySelector('[data-x2]').onclick = function () { close(); UI.openAd('offline'); };
      }
    });
  };

  UI.openChestModal = function (kind) {
    if (kind !== 'c') {
      var cost = { r: 2000, e: 15000, l: 150000 }[kind] || 0;
      if (!ST.spend('gold', cost)) { U.toast('❌ Не хватает золота'); return; }
    }
    grantChest(LOOT.openChest(kind));
  };

  UI.promoModal = function () {
    U.modal({
      html: '<h2>🎟️ Промокод</h2><div class="sub">Введи код и получи подарок</div>' +
        '<input id="codein" placeholder="КОД" style="width:100%;padding:10px;border-radius:12px;border:2px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35);color:#fff;font-size:16px;text-transform:uppercase">' +
        '<div class="tiny muted" style="margin-top:6px">Подсказка: попробуй CHAOS, FORGE, 404, DONATE, PATCH</div>' +
        '<div class="actions"><button class="btn" data-close>Отмена</button><button class="btn gold" data-ok>Активировать</button></div>',
      onMount: function (m, close) {
        m.querySelector('[data-close]').onclick = close;
        m.querySelector('[data-ok]').onclick = function () {
          var v = (m.querySelector('#codein').value || '').trim().toUpperCase();
          var c = D.CODES[v];
          if (!c) { U.toast('❌ Такого кода нет'); Audio2.sfx('error'); return; }
          if (S.codes[v]) { U.toast('Этот код уже активирован'); return; }
          S.codes[v] = U.now();
          if (c.gold) ST.add('gold', c.gold);
          if (c.crystals) ST.add('crystals', c.crystals);
          if (c.dust) ST.add('dust', c.dust);
          if (c.shards) ST.add('shards', c.shards);
          if (c.tokens) ST.add('tokens', c.tokens);
          if (c.chest) grantChest(LOOT.openChest('r'));
          if (c.pet) LOOT.givePet(c.pet);
          U.toast('🎁 ' + c.tip, 'epic', true);
          ST.checkAch();
          close(); UI.refresh();
        };
      }
    });
  };

  UI.doPrestige = function (key) {
    var tier = null;
    for (var i = 0; i < D.PRESTIGE_TIERS.length; i++) if (D.PRESTIGE_TIERS[i].k === key) tier = D.PRESTIGE_TIERS[i];
    if (!tier || S.maxWave < tier.wave) return;
    var gain = tier.f(S.maxWave);
    var soulGain = 1 + (Stats.final().pct.soulGain || 0) / 100;
    U.confirmBox(tier.i + ' ' + tier.n + '?', 'Ты получишь <b>' + U.fmt(Math.floor(gain * soulGain)) + ' ' + tier.curName +
      '</b>. Этап, золото и обычные улучшения сбросятся.', function () {
        ST.add(tier.cur, Math.floor(gain * soulGain));
        if (key === 'prestige') S.prestige++;
        else if (key === 'ascension') S.ascension++;
        else if (key === 'transcend') S.transcend++;
        else S.awaken++;
        S.wave = 1;
        S.gold = 0;
        D.UPGRADES.forEach(function (u) { S.upg[u.k] = 0; });
        S.gates = [];
        S.maxWave = 1;
        ST.bpXp(200);
        ST.checkAch();
        Combat.C.enemies.length = 0;
        Combat.C.boss = null;
        Combat.startWave(1, true);
        Combat.syncHero();
        Combat.C.hero.hp = Combat.C.hero.maxHp;
        U.toast(tier.i + ' ' + tier.n + '! +' + U.fmt(Math.floor(gain * soulGain)) + ' ' + tier.curName, 'epic', true);
        if (window.FX) FX.confetti(60);
        Audio2.sfx('achieve');
        ST.save();
        UI.setScreen('scr-battle');
        UI.refresh();
      }, 'Переродиться');
  };

  UI.refresh = function () {
    if (UI.screen === 'scr-hero') UI.renderHero();
    else if (UI.screen === 'scr-forge') UI.renderForge();
    else if (UI.screen === 'scr-talents') UI.renderTalents();
    else if (UI.screen === 'scr-menu') UI.renderMenu();
    else if (UI.screen === 'scr-sub' && UI.sub) UI.renderSub(UI.sub);
  };

  /* ================= ДЕЙСТВИЯ ================= */
  var A = UI.ACT;

  A.item = function (el) { Audio2.sfx('click'); UI.itemModal(el.getAttribute('data-uid')); };
  A.slot = function (el) {
    var k = el.getAttribute('data-slot');
    var list = S.inv.filter(function (it) { return it.slot === k; });
    if (!list.length) { U.toast('Нет предметов для этого слота'); return; }
    list.sort(function (a, b) { return LOOT.power(b) - LOOT.power(a); });
    UI.itemModal(list[0].uid);
  };
  A.equip = function (el) { if (LOOT.equip(el.getAttribute('data-uid'))) { U.closeAllModals(); UI.refresh(); } };
  A.unequip = function (el) { LOOT.unequip(el.getAttribute('data-slot')); U.closeAllModals(); UI.refresh(); };
  A.autoequip = function () { LOOT.autoEquipBest(); UI.refresh(); };
  A.upgrade = function (el) { if (LOOT.upgrade(el.getAttribute('data-uid'))) { UI.refresh(); } };
  A.dismantle = function (el) { LOOT.dismantle(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.merge = function (el) { LOOT.merge(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.sell = function (el) { LOOT.sell(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.reroll = function (el) { LOOT.reroll(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.curse = function (el) { LOOT.curseItem(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.uncurse = function (el) { LOOT.uncurseItem(el.getAttribute('data-uid')); U.closeAllModals(); UI.refresh(); };
  A.socket = function (el) {
    var uid2 = el.getAttribute('data-uid');
    var it = LOOT.find(uid2) || S.inv.filter(function (x) { return x.uid === uid2; })[0];
    if (!it) { for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) it = S.equip[s]; }
    if (!it) return;
    if (!S.runes.length) { U.toast('Нет рун в сумке'); return; }
    if ((it.runes || []).length >= LOOT.socketsMax(it)) { U.toast('Нет свободных гнёзд (макс ' + LOOT.socketsMax(it) + ')'); return; }
    U.modal({
      html: '<h2>🔯 Вставить руну</h2><div class="sub">' + U.esc(it.name) + '</div><div class="grid g4">' +
        S.runes.map(function (r, i) {
          var rd = D.RUNES.filter(function (x) { return x.k === r.k; })[0] || {};
          return '<div class="itemcard" style="--rc:#b45cff" data-ri="' + i + '"><div class="ico">' + rd.i + '</div><div class="nm">' + (rd.n || '').replace('Руна ', '') + ' ' + (r.lvl || 1) + '</div></div>';
        }).join('') + '</div><div class="actions"><button class="btn" data-close>Отмена</button></div>',
      onMount: function (m, close) {
        m.querySelector('[data-close]').onclick = close;
        U.delegate(m, '[data-ri]', 'click', function (e, rr) {
          LOOT.socket(it, parseInt(rr.getAttribute('data-ri'), 10));
          close(); U.closeAllModals(); UI.refresh();
        });
      }
    });
  };
  A.unsocket = function (el) {
    var uid2 = el.getAttribute('data-uid');
    var it = LOOT.find(uid2);
    if (!it) { for (var s in S.equip) if (S.equip[s] && S.equip[s].uid === uid2) it = S.equip[s]; }
    if (it) LOOT.unsocket(it, parseInt(el.getAttribute('data-i'), 10));
    U.closeAllModals(); UI.refresh();
  };
  A.runeinfo = function (el) {
    var r = S.runes[parseInt(el.getAttribute('data-i'), 10)];
    var rd = D.RUNES.filter(function (x) { return x.k === r.k; })[0];
    U.modal({
      html: '<h2>' + rd.i + ' ' + rd.n + '</h2><div class="sub">уровень ' + (r.lvl || 1) + '</div>' +
        '<div class="card">' + LOOT.effText(rd.e, (r.lvl || 1) - 1) + '</div>' +
        '<div class="actions"><button class="btn" data-close>Ок</button></div>',
      onMount: function (m, close) { m.querySelector('[data-close]').onclick = close; }
    });
  };
  A.mergerunes = function () { LOOT.mergeRunes(); UI.refresh(); };
  A.pet = function (el) {
    var k = el.getAttribute('data-k');
    S.petEquipped = (S.petEquipped === k) ? null : k;
    Combat.syncHero();
    UI.refresh();
  };
  A.artifact = function (el) { LOOT.equipArtifact(el.getAttribute('data-uid')); UI.refresh(); };
  A.hero = function (el) {
    var k = el.getAttribute('data-k');
    var hd = D.HEROES.filter(function (x) { return x.k === k; })[0];
    if (!S.heroes[k]) {
      if (!ST.spend('crystals', hd.cost)) { U.toast('❌ Нужно ' + hd.cost + ' 💎'); Audio2.sfx('error'); return; }
      S.heroes[k] = 1;
      U.toast('🎉 Открыт герой: <b>' + hd.n + '</b>!', 'epic', true);
    }
    var i = S.squad.indexOf(k);
    if (i >= 0) { S.activeSquad = i; U.toast('Активный герой: ' + hd.n); }
    else {
      if (S.squad.length >= 3) S.squad.shift();
      S.squad.push(k);
      S.activeSquad = S.squad.length - 1;
      U.toast('В отряд добавлен: ' + hd.n);
    }
    Combat.syncHero();
    UI.refresh();
  };
  A.buyupg = function (el) {
    var k = el.getAttribute('data-k');
    var u = D.UPGRADES.filter(function (x) { return x.k === k; })[0];
    var lv = S.upg[k] || 0;
    var cost = Math.floor(u.base * Math.pow(u.mul, lv));
    if (!ST.spend('gold', cost)) { U.toast('❌ Не хватает золота'); Audio2.sfx('error'); return; }
    S.upg[k] = lv + 1;
    Audio2.sfx('forge');
    Combat.syncHero();
    UI.refresh();
  };
  A.talent = function (el) {
    var k = el.getAttribute('data-k');
    var node = null, max = 0;
    Object.keys(D.TALENTS).forEach(function (b) {
      D.TALENTS[b].nodes.forEach(function (n) { if (n.k === k) { node = n; max = n.max; } });
    });
    if (!node) return;
    var lv = S.talents[k] || 0;
    if (lv >= max) { U.toast('Максимум'); return; }
    if (S.hero.tp <= 0) { U.toast('❌ Нет очков талантов. Качай уровень героя!'); Audio2.sfx('error'); return; }
    S.hero.tp--;
    S.talents[k] = lv + 1;
    Combat.syncHero();
    Audio2.sfx('levelup');
    UI.refresh();
  };
  A.ptree = function (el) {
    var k = el.getAttribute('data-k');
    var node = null, tree = null, max = 0;
    D.PTREES.forEach(function (t) { t.nodes.forEach(function (n) { if (n.k === k) { node = n; tree = t; max = n.max; } }); });
    if (!node) return;
    var lv = S.ptree[k] || 0;
    if (lv >= max) return;
    var cost = Math.floor(node.cost * Math.pow(1.25, lv));
    if ((S[tree.cur] || 0) < cost) { U.toast('❌ Не хватает: ' + tree.curName); Audio2.sfx('error'); return; }
    S[tree.cur] -= cost;
    S.ptree[k] = lv + 1;
    Combat.syncHero();
    Audio2.sfx('levelup');
    UI.refresh();
  };
  A.forgetab = function (el) { UI.forgeTab = el.getAttribute('data-k'); UI.renderForge(); };
  A.craftslot = function (el) { UI.craftSlot = el.getAttribute('data-k'); UI.renderForge(); };
  A.craft = function (el) {
    var r = parseInt(el.getAttribute('data-r'), 10);
    LOOT.craft(r, UI.craftSlot || 'weapon');
    UI.refresh();
  };
  A.invfilter = function (el) { UI.invFilter = el.getAttribute('data-k'); UI.renderHero(); };
  A.sub = function (el) { Audio2.sfx('click'); UI.renderSub(el.getAttribute('data-k')); };
  A.buypremium = function () {
    S.bp.premium = true;
    S.bp.level += 20;
    U.toast('💎 Premium активен! +20 уровней пропуска', 'epic', true);
    if (window.FX) FX.confetti(50);
    UI.refresh();
  };
  A.claimbp = function (el) {
    var track = el.getAttribute('data-track'), lv = el.getAttribute('data-lv');
    var key = track + '_' + lv;
    if (S.bp.claimed[key]) return;
    var table = track === 'free' ? D.BP.free : (track === 'premium' ? D.BP.premium : D.BP.premiumPlus);
    var rw = table[lv] || {};
    grantReward(rw);
    S.bp.claimed[key] = true;
    U.toast('🎁 Награда получена!', 'epic');
    UI.refresh();
  };
  A.claimquest = function (el) {
    var g = el.getAttribute('data-g'), i = parseInt(el.getAttribute('data-i'), 10);
    var q = S.quests[g][i];
    if (!q || !q.done || q.claimed) return;
    q.claimed = true;
    grantReward(q.r);
    U.toast('✅ Награда получена!', 'epic');
    UI.refresh();
  };
  function grantReward(rw) {
    if (!rw) return;
    if (rw.gold) ST.add('gold', rw.gold);
    if (rw.crystals) ST.add('crystals', rw.crystals);
    if (rw.medals) ST.add('medals', rw.medals);
    if (rw.bp) ST.bpXp(rw.bp);
    if (rw.chest) for (var i = 0; i < rw.chest; i++) grantChest(LOOT.openChest('r'));
    if (rw.chestL) for (var j = 0; j < rw.chestL; j++) grantChest(LOOT.openChest('l'));
    if (rw.chestM) grantChest(LOOT.openChest('e'));
    if (rw.rune) LOOT.addRune(U.pick(D.RUNES).k, 1);
    if (rw.pet) LOOT.givePet(rw.pet);
    if (rw.weapon) LOOT.addItem(LOOT.makeItem(3, 'weapon', 0));
    if (rw.title && S.titles.unlocked.indexOf('prestiger') < 0) S.titles.unlocked.push('prestiger');
    Audio2.sfx('loot');
    if (window.FX) FX.confetti(20);
  }
  A.buy = function (el) {
    var k = el.getAttribute('data-k');
    var s = D.SHOP.filter(function (x) { return x.k === k; })[0];
    if (s.crystals) { ST.add('crystals', s.crystals); U.toast('💎 +' + s.crystals + ' кристаллов (демо)', 'epic'); }
    else {
      U.toast('🛒 «Покупка» в демо-сборке бесплатна. Спасибо за поддержку! 😉', 'epic');
      if (s.eff === 'noAds') { ST.add('crystals', 200); }
      if (s.eff === 'monthly') { ST.add('crystals', 500); S.x2Until = U.now() + 86400000; }
      if (s.eff === 'starter') { ST.add('crystals', 300); ST.add('gold', Stats.enemyGold(S.maxWave, false) * 500); LOOT.addItem(LOOT.makeItem(3, 'weapon', 0)); }
      if (s.eff === 'vip') { ST.add('crystals', 1500); S.bp.premium = true; }
    }
    UI.refresh();
  };
  A.chest = function (el) { UI.openChestModal(el.getAttribute('data-k')); };
  A.gacha = function (el) {
    var n = parseInt(el.getAttribute('data-n'), 10) || 1;
    var res = [];
    for (var i = 0; i < n; i++) { var it = LOOT.gachaRoll(); if (it) res.push(it); }
    if (!res.length) return;
    U.modal({
      html: '<h2>🌀 ПОРТАЛ</h2><div class="sub">Выпало ' + res.length + ' предметов</div><div class="card">' +
        res.map(function (it) {
          return '<div class="statline"><span class="k">' + it.icon + ' ' + U.esc(it.name) + '</span><span class="v" style="color:' + UI.rc(it) + '">' + UI.rn(it) + '</span></div>';
        }).join('') + '</div><div class="actions"><button class="btn gold" data-ok>Супер!</button></div>',
      onMount: function (m, close) { m.querySelector('[data-ok]').onclick = close; },
      onClose: UI.refresh
    });
    Audio2.sfx('chest');
    if (window.FX) FX.confetti(40);
  };
  A.merch = function (el) {
    var i = parseInt(el.getAttribute('data-i'), 10);
    var m = S.merchant.items[i];
    if (!m) return;
    var cur = m.cur === 'crystals' ? 'crystals' : 'gold';
    if (!ST.spend(cur, m.price)) { U.toast('❌ Не хватает ' + (cur === 'gold' ? 'золота' : 'кристаллов')); Audio2.sfx('error'); return; }
    if (m.kind === 'item') { LOOT.addItem(m.it); U.toast('Куплено: ' + m.it.name, 'epic'); }
    else if (m.kind === 'rune') LOOT.addRune(m.rune.k, m.rune.lvl);
    else if (m.kind === 'pet') LOOT.givePet(LOOT.rollPet(1));
    else if (m.kind === 'chest') grantChest(LOOT.openChest(m.chest));
    else if (m.kind === 'crystalpack') { ST.add('crystals', m.amount); U.toast('💎 +' + m.amount); }
    S.merchant.items.splice(i, 1);
    UI.refresh();
  };
  A.rerollmerchant = function () {
    if (!ST.spend('crystals', 50)) { U.toast('❌ Нужно 50 💎'); return; }
    S.merchant.items = null;
    UI.refresh();
  };
  A.arenafight = function () {
    if (S.tickets <= 0) { U.toast('❌ Нет билетов. Они приходят каждый день и за задания.'); return; }
    S.tickets--;
    S.arena.fights++;
    var T = Stats.final();
    var opp = {
      name: U.pick(['Гоблин-нянь', 'Крыса-алхимик', 'Скелет-бард', 'Дракон-бухгалтер', 'Огр-веган', 'Баг-тестировщик', 'Некромант-котиков', 'Паладин-пиццы']),
      power: Math.floor(T.power * U.rnd(0.7, 1.35) * (1 + S.arena.rating / 4000))
    };
    var myScore = T.power * U.rnd(0.85, 1.15);
    var win = myScore >= opp.power * U.rnd(0.75, 1.05);
    var delta = win ? U.rndInt(12, 30) : -U.rndInt(8, 18);
    S.arena.rating = Math.max(500, S.arena.rating + delta);
    var tokens = win ? U.rndInt(40, 90) : U.rndInt(8, 20);
    ST.add('tokens', tokens);
    if (win) S.arena.wins++;
    U.modal({
      html: '<h2>' + (win ? '🏆 ПОБЕДА' : '💀 ПОРАЖЕНИЕ') + '</h2>' +
        '<div class="sub">Противник: ' + opp.name + ' • мощь ' + U.fmt(opp.power) + '</div>' +
        '<div class="card">' +
        '<div class="statline"><span class="k">Твоя мощь</span><span class="v">' + U.fmt(T.power) + '</span></div>' +
        '<div class="statline"><span class="k">Рейтинг</span><span class="v ' + (win ? 'green' : 'red') + '">' + (win ? '+' : '') + delta + '</span></div>' +
        '<div class="statline"><span class="k">Жетоны</span><span class="v gold">+' + tokens + '</span></div>' +
        '</div><div class="actions"><button class="btn gold" data-ok>Ок</button></div>',
      onMount: function (m, close) { m.querySelector('[data-ok]').onclick = close; },
      onClose: UI.refresh
    });
    ST.checkAch();
  };
  A.arenabuy = function (el) {
    var k = el.getAttribute('data-k');
    if (k === 'pet' && S.tokens >= 300) { S.tokens -= 300; LOOT.givePet(LOOT.rollPet(2)); }
    else if (k === 'rune' && S.tokens >= 150) { S.tokens -= 150; LOOT.addRune(U.pick(D.RUNES).k, 2); }
    else if (k === 'chest' && S.tokens >= 200) { S.tokens -= 200; grantChest(LOOT.openChest('e')); }
    else { U.toast('❌ Не хватает жетонов'); return; }
    UI.refresh();
  };
  A.playmg = function (el) {
    if (!MG.canPlay()) { U.toast('⏳ Мини-игра будет доступна позже'); return; }
    MG.start(el.getAttribute('data-k'), function () { UI.refresh(); });
  };
  A.doprestige = function (el) { UI.doPrestige(el.getAttribute('data-k')); };
  A.title = function (el) { S.titles.current = el.getAttribute('data-k'); Combat.syncHero(); UI.refresh(); };
  A.toggle = function (el) {
    var k = el.getAttribute('data-k');
    S.settings[k] = !S.settings[k];
    if (k === 'music') Audio2.toggleMusic(S.settings.music);
    UI.refresh();
  };
  A.setpart = function (el) { S.settings.particles = parseInt(el.getAttribute('data-v'), 10); UI.refresh(); };
  A.setautosell = function (el) { S.filter.autoSell = parseInt(el.getAttribute('data-v'), 10); UI.refresh(); };
  A.save = function () { ST.save(); U.toast('💾 Сохранено'); };
  A.codes = function () { UI.promoModal(); };
  A.wipe = function () {
    U.confirmBox('Сброс прогресса?', 'Весь прогресс будет удалён. Точно?', function () {
      ST.wipe();
      Combat.syncHero();
      Combat.startWave(1, true);
      U.toast('Прогресс сброшен');
      UI.setScreen('scr-battle');
      UI.refresh();
    }, 'Сбросить');
  };
  A.export = function () {
    var data = U.b64encode(JSON.stringify(S));
    U.modal({
      html: '<h2>📤 Экспорт</h2><div class="sub">Скопируй код сохранения</div>' +
        '<textarea id="exp" style="width:100%;height:120px;background:rgba(0,0,0,.4);color:#fff;border-radius:10px;border:1px solid rgba(255,255,255,.2);font-size:11px">' + data + '</textarea>' +
        '<div class="actions"><button class="btn" data-close>Закрыть</button></div>',
      onMount: function (m, close) { m.querySelector('[data-close]').onclick = close; }
    });
  };
  A.import = function () {
    U.modal({
      html: '<h2>📥 Импорт</h2><div class="sub">Вставь код сохранения</div>' +
        '<textarea id="imp" style="width:100%;height:120px;background:rgba(0,0,0,.4);color:#fff;border-radius:10px;border:1px solid rgba(255,255,255,.2);font-size:11px"></textarea>' +
        '<div class="actions"><button class="btn" data-close>Отмена</button><button class="btn gold" data-ok>Загрузить</button></div>',
      onMount: function (m, close) {
        m.querySelector('[data-close]').onclick = close;
        m.querySelector('[data-ok]').onclick = function () {
          try {
            var o = JSON.parse(U.b64decode(m.querySelector('#imp').value.trim()));
            S = ST.merge(ST.defaults(), o);
            ST.ensure();
            Combat.syncHero();
            Combat.startWave(S.wave || 1, true);
            U.toast('✅ Сохранение загружено', 'epic');
            close(); UI.refresh();
          } catch (e) { U.toast('❌ Неверный код'); }
        };
      }
    });
  };
})();
