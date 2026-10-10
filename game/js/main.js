/* ============================================================
   main.js — загрузка, игровой цикл, сохранение, оффлайн-доход
   ============================================================ */
(function () {
  'use strict';
  var last = 0, acc = 0, hudAcc = 0, saveAcc = 0, running = false;

  function boot() {
    ST.init();
    ST.ensureQuests();
    Render.init();
    UI.init();
    Combat.syncHero();
    Combat.startWave(S.wave || 1, true);
    Combat.C.hero.hp = Combat.C.hero.maxHp;

    /* стартовый экран */
    var fill = document.getElementById('boot-fill');
    var startBtn = document.getElementById('boot-start');
    var tip = document.getElementById('boot-tip');
    tip.textContent = U.pick(D.TIPS);
    var p = 0;
    var iv = setInterval(function () {
      p = Math.min(100, p + U.rnd(6, 18));
      if (fill) fill.style.width = p + '%';
      if (p >= 100) { clearInterval(iv); startBtn.classList.add('flashy'); }
    }, 90);
    startBtn.addEventListener('click', function () {
      if (p < 100) return;
      document.getElementById('boot').style.display = 'none';
      Audio2.init();
      if (S.settings.music) Audio2.startMusic();
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
      /* оффлайн-доход */
      setTimeout(function () {
        var rep = ST.offlineReport();
        if (rep && rep.gold >= 1) UI.showOffline(rep);
        if (!S.seen.intro) {
          S.seen.intro = 1;
          U.toast('👋 Добро пожаловать в Кузницу Хаоса!', 'big', true);
          setTimeout(function () { U.toast('💡 ' + U.pick(D.TIPS)); }, 3200);
        }
      }, 400);
    });
  }

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;

    Combat.update(dt);
    FX.update(dt);

    if (UI.screen === 'scr-battle') Render.frame(dt);

    hudAcc += dt;
    if (hudAcc > 0.1) {
      hudAcc = 0;
      UI.updateHUD();
      UI.updateBossBar();
    }
    saveAcc += dt;
    if (saveAcc > 12) { saveAcc = 0; ST.save(); }
    /* квесты и достижения — реже */
    if (acc > 2) { acc = 0; ST.checkAch(); ST.checkTitles(); }
  }

  /* ---------- системное ---------- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { ST.save(); }
    else { last = performance.now(); }
  });
  window.addEventListener('beforeunload', function () { ST.save(); });
  window.addEventListener('resize', function () { if (window.Render) Render.resize(); });

  /* кнопка «Назад» на Android (вызывается из WebView) */
  window.onBackPressed = function () {
    if (document.getElementById('boot').style.display !== 'none') return true;
    if (U.qs('#modal-root').children.length) { U.closeAllModals(); return true; }
    if (MG && U.qs('#mg-root') && U.qs('#mg-root').style.display === 'block') { MG.close(); return true; }
    if (UI.screen === 'scr-sub') { UI.sub = null; UI.setScreen('scr-menu'); return true; }
    if (UI.screen !== 'scr-battle') { UI.setScreen('scr-battle'); return true; }
    return false;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
