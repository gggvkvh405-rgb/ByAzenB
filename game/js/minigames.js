/* ============================================================
   minigames.js — мини-игры «как из рекламы», но реально играбельные
   ============================================================ */
var MG = (function () {
  'use strict';
  var root = null, cb = null, state = null;

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'mg-root';
    document.getElementById('app').appendChild(root);
    return root;
  }

  function finish(win, msg, reward) {
    var t = U.fmt(reward.gold || 0);
    var html = '<h2>' + (win ? '🎉 ПОБЕДА!' : '😅 Неплохо!') + '</h2>' +
      '<div class="sub">' + msg + '</div>' +
      '<div class="card center"><div class="big-num">+' + t + ' 🪙</div>' +
      (reward.crystals ? '<div class="gold">+' + reward.crystals + ' 💎</div>' : '') +
      (reward.buff ? '<div class="muted" style="margin-top:6px">Бафф: ' + reward.buff.n + ' (10 мин)</div>' : '') +
      '</div>' +
      '<div class="actions"><button class="btn gold" data-ok>Забрать</button></div>';
    U.modal({
      html: html, dismissable: false,
      onMount: function (m, close) { m.querySelector('[data-ok]').onclick = close; }
    });
    ST.add('gold', reward.gold);
    if (reward.crystals) ST.add('crystals', reward.crystals);
    if (reward.buff) {
      S.mgBuffs.push({ e: reward.buff.e, n: reward.buff.n, until: U.now() + 600000 });
      S.mgBuffs = S.mgBuffs.filter(function (b) { return b.until > U.now(); });
    }
    S.minigame.last = U.now();
    if (cb) cb(win);
  }

  function rewardFor(win, power) {
    var T = Stats.final();
    var gold = Stats.enemyGold(S.maxWave, false) * 30 * T.gold * (win ? power : 0.35);
    var crystals = win ? U.rndInt(5, 15) : U.rndInt(1, 4);
    var buff = null;
    if (win) {
      var pool = [
        { n: '×2 урон (10 мин)', e: { dmgPct: 100 } },
        { n: '+50% золота (10 мин)', e: { gold: 50 } },
        { n: '+50% лута (10 мин)', e: { luck: 50 } },
        { n: '+30% скорости атаки', e: { atkSpeed: 30 } },
        { n: '+30 к криту', e: { crit: 30 } }
      ];
      buff = U.pick(pool);
    }
    return { gold: Math.floor(gold), crystals: crystals, buff: buff };
  }

  /* ---------- 1. Врата ---------- */
  function gates() {
    var correct = U.rndInt(0, 2);
    var opts = [
      { n: 'Врата с шипами', i: '🚪' }, { n: 'Врата с драконом', i: '🚪' }, { n: 'Врата с золотом', i: '🚪' }
    ];
    root.innerHTML =
      '<div class="mg-stage">' +
      '<div class="mg-top"><button class="back-btn" data-exit>✕</button><div>🎮 Мини-игра: выбери врата!</div></div>' +
      '<div class="mg-body" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:10px">' +
      opts.map(function (o, i) { return '<button class="btn" data-g="' + i + '" style="font-size:34px;padding:26px 18px">' + o.i + '</button>'; }).join('') +
      '</div>' +
      '<div class="mg-bottom"><div class="muted center">Одно из врат ведёт к сокровищам. Интуиция!</div></div>' +
      '</div>';
    U.delegate(root, '[data-g]', 'click', function (e, el) {
      var pick = parseInt(el.getAttribute('data-g'), 10);
      var win = pick === correct;
      close();
      finish(win, win ? 'Ты выбрал правильные врата!' : 'За дверью был гоблин с палкой.', rewardFor(win, 1));
    });
    U.delegate(root, '[data-exit]', 'click', function () { close(); });
  }

  /* ---------- 2. Спаси принцессу ---------- */
  function princess() {
    var order = U.shuffle([0, 1, 2, 3]);
    var step = 0;
    var pins = ['📌', '📌', '📌', '📌'];
    function render() {
      root.innerHTML =
        '<div class="mg-stage">' +
        '<div class="mg-top"><button class="back-btn" data-exit>✕</button><div>👸 Спаси принцессу!</div></div>' +
        '<div class="mg-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">' +
        '<div style="font-size:60px">👸</div>' +
        '<div style="display:flex;gap:8px">' + pins.map(function (p, i) {
          return '<button class="btn ' + (p === '✅' ? 'green' : '') + '" data-p="' + i + '" style="font-size:26px">' + p + '</button>';
        }).join('') + '</div>' +
        '<div class="muted center" style="padding:0 20px">Убери чеку в правильном порядке: сначала ту, что держит воду, потом lava...</div>' +
        '</div>' +
        '<div class="mg-bottom"><div class="muted">Осталось: ' + (4 - step) + '</div></div>' +
        '</div>';
    }
    render();
    U.delegate(root, '[data-p]', 'click', function (e, el) {
      var i = parseInt(el.getAttribute('data-p'), 10);
      if (pins[i] === '✅') return;
      if (order[step] === i) { pins[i] = '✅'; step++; Audio2.sfx('click'); }
      else {
        close();
        finish(false, 'Принцесса промокла. Она не в восторге.', rewardFor(false, 0.6));
        return;
      }
      if (step === 4) { close(); finish(true, 'Принцесса спасена! Она дала тебе золото.', rewardFor(true, 1.2)); return; }
      render();
    });
    U.delegate(root, '[data-exit]', 'click', function () { close(); });
  }

  /* ---------- 3. Убей слизь ---------- */
  function slime() {
    var taps = 0, timeLeft = 5;
    var slim = { hp: 100, max: 100 };
    root.innerHTML =
      '<div class="mg-stage">' +
      '<div class="mg-top"><button class="back-btn" data-exit>✕</button><div>🟢 Убей слизь! <span id="mg-time">5.0</span>с</div></div>' +
      '<div class="mg-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">' +
      '<div id="mg-slime" style="font-size:110px;cursor:pointer;user-select:none;transition:transform .08s">🟢</div>' +
      '<div class="pbar" style="width:70%"><div id="mg-hp" style="width:100%"></div></div>' +
      '<div class="muted">Тапов: <b id="mg-taps">0</b></div>' +
      '</div>' +
      '<div class="mg-bottom"><div class="muted">Жми быстро!</div></div>' +
      '</div>';
    var iv = setInterval(function () {
      timeLeft -= 0.1;
      var el = document.getElementById('mg-time');
      if (el) el.textContent = Math.max(0, timeLeft).toFixed(1);
      if (timeLeft <= 0) {
        clearInterval(iv);
        var win = slim.hp <= 0;
        close();
        finish(win, win ? 'Слизь повержена за ' + taps + ' тапов!' : 'Слизь выжила... пока.', rewardFor(win, 1 + taps / 60));
      }
    }, 100);
    var sl = document.getElementById('mg-slime');
    sl.onclick = function () {
      taps++;
      slim.hp -= 4;
      S.taps++;
      sl.style.transform = 'scale(1.25) rotate(' + U.rnd(-10, 10) + 'deg)';
      setTimeout(function () { sl.style.transform = 'scale(1)'; }, 80);
      document.getElementById('mg-taps').textContent = taps;
      document.getElementById('mg-hp').style.width = U.clamp(slim.hp / slim.max * 100, 0, 100) + '%';
      Audio2.sfx('tap');
      if (slim.hp <= 0 && timeLeft > 0) {
        clearInterval(iv);
        close();
        finish(true, 'Слизь повержена за ' + taps + ' тапов!', rewardFor(true, 1 + taps / 60));
      }
    };
    U.delegate(root, '[data-exit]', 'click', function () { clearInterval(iv); close(); });
  }

  /* ---------- 4. Выбери сундук ---------- */
  function chest() {
    var good = U.rndInt(0, 2);
    root.innerHTML =
      '<div class="mg-stage">' +
      '<div class="mg-top"><button class="back-btn" data-exit>✕</button><div>📦 Выбери сундук</div></div>' +
      '<div class="mg-body" style="display:flex;align-items:center;justify-content:center;gap:12px">' +
      [0, 1, 2].map(function (i) { return '<button class="btn" data-c="' + i + '" style="font-size:46px;padding:24px">📦</button>'; }).join('') +
      '</div>' +
      '<div class="mg-bottom"><div class="muted">В одном — легендарка, в остальных — крысы.</div></div>' +
      '</div>';
    U.delegate(root, '[data-c]', 'click', function (e, el) {
      var i = parseInt(el.getAttribute('data-c'), 10);
      var win = i === good;
      close();
      if (win) {
        var it = LOOT.makeItem(U.rndInt(3, 5), U.pick(['weapon', 'armor', 'helmet', 'boots', 'gloves', 'belt', 'amulet', 'ring', 'cloak']), 0);
        LOOT.addItem(it);
        U.toast('🎁 Из сундука: <b>' + it.name + '</b>!', 'epic', true);
      }
      finish(win, win ? 'Ты угадал!' : 'Крысы. Много крыс.', rewardFor(win, 1.1));
    });
    U.delegate(root, '[data-exit]', 'click', function () { close(); });
  }

  var GAMES = { gates: gates, princess: princess, slime: slime, chest: chest };

  function close() { if (root) { root.innerHTML = ''; root.style.display = 'none'; } }

  function start(key, done) {
    ensureRoot();
    root.style.display = 'block';
    cb = done || null;
    S.stats.mgPlayed++;
    ST.checkAch();
    Audio2.sfx('click');
    (GAMES[key] || gates)();
  }

  function random() { return U.pick(Object.keys(GAMES)); }

  function canPlay() { return (U.now() - (S.minigame.last || 0)) > 120000; }
  function cooldownLeft() { return Math.max(0, 120000 - (U.now() - (S.minigame.last || 0))); }

  return { start: start, random: random, canPlay: canPlay, cooldownLeft: cooldownLeft, close: close };
})();
if (typeof window !== 'undefined') window.MG = MG;
