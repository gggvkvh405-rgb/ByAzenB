/* ============================================================
   render.js — canvas-рендер: биомы, существа, частицы, эффекты
   ============================================================ */
var FX = (function () {
  'use strict';
  var parts = [];
  var MAXP = 260;

  function push(p) { if (parts.length > MAXP) parts.shift(); parts.push(p); }
  function entityH(e) { return (e && e.size ? e.size : 0.3) * 0.42; }

  return {
    parts: parts,
    clear: function () { parts.length = 0; },
    text: function (x, y, txt, color, scale) {
      push({ t: 'text', x: x, y: y, txt: txt, c: color || '#fff', s: scale || 1, life: 0.9, max: 0.9, vy: -0.55, vx: U.rnd(-0.05, 0.05) });
    },
    burst: function (e, color, n) {
      n = n || 10;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, sp = U.rnd(0.15, 0.6);
        push({ t: 'bit', x: e.x, y: entityH(e) + U.rnd(0, 0.06), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.15, c: color, r: U.rnd(2, 5), life: U.rnd(0.4, 0.9), max: 0.9 });
      }
    },
    spark: function (x, y, color, n) {
      for (var i = 0; i < (n || 6); i++) {
        var a = Math.random() * Math.PI * 2, sp = U.rnd(0.2, 0.8);
        push({ t: 'line', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: color || '#ffcc3d', r: U.rnd(3, 9), life: 0.35, max: 0.35 });
      }
    },
    death: function (e) {
      var c1 = e.def.c1 || '#fff', c2 = e.def.c2 || '#888';
      var n = e.boss ? 34 : 14;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, sp = U.rnd(0.2, 0.9);
        push({ t: 'bit', x: e.x + U.rnd(-0.02, 0.02), y: entityH(e) * U.rnd(0.2, 1), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.35, c: U.chance(0.5) ? c1 : c2, r: U.rnd(2, e.boss ? 9 : 6), life: U.rnd(0.6, 1.3), max: 1.3, g: 1.6 });
      }
      push({ t: 'ring', x: e.x, y: entityH(e) * 0.5, c: c1, r: 6, life: 0.4, max: 0.4, grow: 260 });
    },
    tap: function (e) {
      push({ t: 'slash', x: e.x, y: entityH(e) * 0.6, life: 0.16, max: 0.16, a: U.rnd(-0.5, 0.5) });
      this.spark(e.x, entityH(e) * 0.6, '#fff', 4);
    },
    loot: function (x, y, color) {
      push({ t: 'beam', x: x, y: y, c: color, life: 1.1, max: 1.1 });
      for (var i = 0; i < 10; i++) push({ t: 'bit', x: x, y: entityH({ size: 0.3 }) + 0.05, vx: U.rnd(-0.25, 0.25), vy: U.rnd(-0.7, -0.3), c: color, r: U.rnd(2, 4), life: 1, max: 1, g: 1.2 });
    },
    heal: function (v) {
      if (U.chance(0.25)) push({ t: 'text', x: 0.2, y: 0.42, txt: '+' + U.fmt(v), c: '#5dff8f', s: 0.9, life: 0.7, max: 0.7, vy: -0.4, vx: 0 });
    },
    coin: function (x, y, n) {
      for (var i = 0; i < (n || 5); i++) push({ t: 'coin', x: x + U.rnd(-0.03, 0.03), y: entityH({ size: 0.3 }) + 0.1, vx: U.rnd(-0.3, 0.3), vy: U.rnd(-0.9, -0.4), r: U.rnd(4, 7), life: U.rnd(0.5, 0.9), max: 0.9, g: 2.2 });
    },
    heroHit: function () {
      push({ t: 'flash', c: 'rgba(255,60,60,.25)', life: 0.2, max: 0.2 });
      this.spark(0.2, 0.3, '#ff5252', 6);
    },
    meteor: function (color) {
      push({ t: 'meteor', c: color || '#ff8a3d', life: 0.6, max: 0.6, x: U.rnd(0.45, 0.95) });
      push({ t: 'flash', c: 'rgba(255,160,60,.3)', life: 0.35, max: 0.35 });
    },
    freeze: function () { push({ t: 'flash', c: 'rgba(120,220,255,.35)', life: 0.5, max: 0.5 }); },
    raise: function () { for (var i = 0; i < 8; i++) push({ t: 'bit', x: U.rnd(0.3, 0.9), y: 0.02, vx: 0, vy: -0.5, c: '#e8e4d8', r: 5, life: 0.8, max: 0.8 }); },
    ultFlash: function (icon) {
      push({ t: 'flash', c: 'rgba(255,255,255,.45)', life: 0.3, max: 0.3 });
      push({ t: 'text', x: 0.5, y: 0.55, txt: icon || '⚡', c: '#ffcc3d', s: 3.2, life: 1, max: 1, vy: -0.2, vx: 0 });
    },
    puddle: function (x) { push({ t: 'puddle', x: x, life: 6, max: 6 }); },
    confetti: function (n) {
      for (var i = 0; i < (n || 40); i++) push({ t: 'bit', x: U.rnd(0, 1), y: U.rnd(0.6, 1.1), vx: U.rnd(-0.2, 0.2), vy: U.rnd(-0.6, -0.2), c: U.pick(['#ffcc3d', '#ff4d9d', '#42e8ff', '#7dff5c', '#ff37f3']), r: U.rnd(3, 7), life: U.rnd(1, 2), max: 2, g: 1.1 });
    },
    update: function (dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        if (p.vx !== undefined) p.x += p.vx * dt;
        if (p.vy !== undefined) p.y += p.vy * dt;
        if (p.g) p.vy += p.g * dt;
        if (p.grow) p.r += p.grow * dt;
      }
    }
  };
})();

var Render = (function () {
  'use strict';
  var cv, ctx, W = 360, H = 700, DPR = 1;
  var imgs = {}, loaded = 0;
  var bgNames = ['bg_fields', 'bg_forest', 'bg_caves', 'bg_graveyard', 'bg_volcano', 'bg_void'];
  var t = 0, shake = 0, shakeMag = 0;
  var drops = [], flakes = [], stars = [];
  var quality = 1;

  function polyfillRoundRect() {
    if (typeof CanvasRenderingContext2D === 'undefined') return;
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        var rr = Math.min(typeof r === 'number' ? r : (r && r[0]) || 0, w / 2, h / 2);
        this.moveTo(x + rr, y);
        this.arcTo(x + w, y, x + w, y + h, rr);
        this.arcTo(x + w, y + h, x, y + h, rr);
        this.arcTo(x, y + h, x, y, rr);
        this.arcTo(x, y, x + w, y, rr);
        this.closePath();
        return this;
      };
    }
  }

  function init() {
    polyfillRoundRect();
    cv = document.getElementById('scene');
    ctx = cv.getContext('2d');
    bgNames.forEach(function (n) {
      var im = new Image();
      im.onload = function () { loaded++; };
      im.src = 'assets/' + n + '.jpg';
      imgs[n] = im;
    });
    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < 90; i++) drops.push({ x: Math.random(), y: Math.random(), s: U.rnd(0.6, 1.4), v: U.rnd(0.9, 1.6) });
    for (var j = 0; j < 60; j++) flakes.push({ x: Math.random(), y: Math.random(), s: U.rnd(1, 3), v: U.rnd(0.1, 0.35), ph: Math.random() * 6.28 });
    for (var k = 0; k < 70; k++) stars.push({ x: Math.random(), y: Math.random() * 0.5, s: U.rnd(0.6, 1.6), tw: Math.random() * 6.28 });
  }
  function resize() {
    if (!cv) return;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth || window.innerWidth;
    H = cv.clientHeight || window.innerHeight;
    cv.width = Math.floor(W * DPR);
    cv.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function feetY() { return H * 0.80; }
  function P(x) { return x * W; }
  function bodyH(e) { return (e.size || 0.3) * H * 0.42; }

  /* ---------- фон ---------- */
  function drawBG(dt) {
    var bi = Stats.biomeIndex();
    var b = D.BIOMES[bi];
    var im = imgs[b.bg];
    var px = -((t * 4) % 40);
    if (im && im.complete && im.naturalWidth) {
      var ir = im.naturalWidth / im.naturalHeight, cr = W / H;
      var dw, dh;
      if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
      var dx = (W - dw) / 2, dy = (H - dh) * 0.35;
      try { ctx.filter = 'hue-rotate(' + (b.hue || 0) + 'deg) saturate(1.15)'; } catch (e) { }
      ctx.drawImage(im, dx + px * 0.5, dy, dw, dh);
      try { ctx.filter = 'none'; } catch (e) { }
    } else {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#241344'); g.addColorStop(1, '#120726');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    /* оттенок биома */
    ctx.fillStyle = b.tint;
    ctx.fillRect(0, 0, W, H);
    /* ночь */
    if (S.weather.k === 'night') {
      ctx.fillStyle = 'rgba(10,10,50,.42)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var a = 0.5 + 0.5 * Math.sin(t * 2 + st.tw);
        ctx.globalAlpha = a * 0.8;
        ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.s, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /* земля */
    var fy = feetY();
    var gg = ctx.createLinearGradient(0, fy - 20, 0, H);
    gg.addColorStop(0, 'rgba(255,255,255,.10)');
    gg.addColorStop(0.25, 'rgba(20,10,35,.55)');
    gg.addColorStop(1, 'rgba(8,4,16,.95)');
    ctx.fillStyle = gg;
    ctx.fillRect(0, fy - 8, W, H - fy + 8);
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, fy - 6); ctx.lineTo(W, fy - 6); ctx.stroke();
    /* виньетка */
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function drawWeather(dt) {
    var k = S.weather.k;
    if (k === 'rain') {
      ctx.strokeStyle = 'rgba(180,220,255,.45)'; ctx.lineWidth = 1.6;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        d.y += d.v * dt * 1.4; if (d.y > 1) { d.y = -0.05; d.x = Math.random(); }
        ctx.beginPath(); ctx.moveTo(d.x * W, d.y * H); ctx.lineTo(d.x * W - 4, d.y * H + 18 * d.s); ctx.stroke();
      }
    } else if (k === 'snow' || k === 'blizzard') {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      var n = k === 'blizzard' ? flakes.length : Math.floor(flakes.length * 0.6);
      for (var j = 0; j < n; j++) {
        var f = flakes[j];
        f.y += f.v * dt * (k === 'blizzard' ? 3 : 1);
        if (f.y > 1) { f.y = -0.02; f.x = Math.random(); }
        var xx = f.x * W + Math.sin(t * 1.5 + f.ph) * (k === 'blizzard' ? 26 : 8);
        ctx.beginPath(); ctx.arc(xx, f.y * H, f.s, 0, 6.283); ctx.fill();
      }
      if (k === 'blizzard') { ctx.fillStyle = 'rgba(200,230,255,.12)'; ctx.fillRect(0, 0, W, H); }
    } else if (k === 'fog') {
      for (var q = 0; q < 3; q++) {
        var g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,' + (0.10 + q * 0.03) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        var yy = feetY() - 60 - q * 60 + Math.sin(t * 0.4 + q) * 12;
        ctx.fillRect(0, yy, W, 90);
      }
    }
  }

  /* ---------- тень ---------- */
  function shadow(x, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.32 : alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(P(x), feetY() + 2, w, w * 0.28, 0, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- существо ---------- */
  function outline(w) { ctx.strokeStyle = 'rgba(20,8,36,.85)'; ctx.lineWidth = w || 3.4; ctx.lineJoin = 'round'; }

  function drawCreature(e) {
    var fy = feetY();
    var x = P(e.x);
    var h = bodyH(e);
    var d = e.def;
    var wob = Math.sin(t * 4 + e.wob) * (e.dead ? 0 : 1);
    var sq = e.dead ? U.clamp(e.deathT / 0.45, 0, 1) : 1;
    if (e.dead) {
      ctx.save();
      ctx.globalAlpha = sq;
      ctx.translate(x, fy - h * 0.5);
      ctx.rotate((1 - sq) * 1.2);
      ctx.scale(sq, sq);
      ctx.translate(-x, -(fy - h * 0.5));
    }
    shadow(e.x, h * 0.42, 0.28 * sq);
    var bx = x, by = fy - h * 0.5 + (d.sh === 'blob' ? wob * 3 : wob * 2);
    var c1 = d.c1 || '#ccc', c2 = d.c2 || '#666';
    if (e.hit > 0) { c1 = '#ffffff'; c2 = '#ffdddd'; }
    /* щит */
    if (e.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 6);
      ctx.strokeStyle = '#42e8ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(bx, by, h * 0.6, h * 0.62, 0, 0, 6.283); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(bx, by);
    var sc = e.size * (e.elite ? 1.15 : 1);
    switch (d.sh) {
      case 'blob': drawBlob(h, c1, c2, sc, e); break;
      case 'spider': drawSpider(h, c1, c2, sc, e); break;
      case 'bone': drawBone(h, c1, c2, sc, e); break;
      case 'witch': drawWitch(h, c1, c2, sc, e); break;
      case 'dragon': drawDragon(h, c1, c2, sc, e, t); break;
      case 'demon': drawDemon(h, c1, c2, sc, e); break;
      case 'mech': drawMech(h, c1, c2, sc, e); break;
      case 'cthul': drawCthul(h, c1, c2, sc, e); break;
      case 'bug': drawBug(h, c1, c2, sc, e, t); break;
      default: drawQuad(h, c1, c2, sc, e, d);
    }
    ctx.restore();
    /* мутации-иконки */
    if (e.mut.length && !e.dead) {
      var mtxt = e.mut.map(function (mk) {
        for (var i = 0; i < D.MUTATIONS.length; i++) if (D.MUTATIONS[i].k === mk) return D.MUTATIONS[i].i;
        return '';
      }).join('');
      ctx.font = (h * 0.28) + 'px serif';
      ctx.textAlign = 'center';
      ctx.fillText(mtxt, x, fy - h - 6);
    }
    if (e.elite && !e.dead) {
      ctx.font = (h * 0.3) + 'px serif'; ctx.textAlign = 'center';
      ctx.fillText('⭐', x, fy - h - (e.mut.length ? 22 : 6));
    }
    /* HP-бар */
    if (!e.boss && !e.dead && (e.hpBarT > 0 || e.hp < e.maxHp)) {
      var bw = Math.max(26, h * 0.9), bh = 5;
      var byy = fy - h - 14;
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.fillRect(x - bw / 2 - 1, byy - 1, bw + 2, bh + 2);
      ctx.fillStyle = e.elite ? '#ffb02e' : '#ff5252';
      ctx.fillRect(x - bw / 2, byy, bw * U.clamp(e.hp / e.maxHp, 0, 1), bh);
    }
    /* статусы */
    if (e.st.freeze > 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#8fe6ff'; ctx.fillRect(x - h * 0.45, fy - h, h * 0.9, h); ctx.globalAlpha = 1; }
    if (e.dead) ctx.restore();
  }

  function eyes(w, y, r, angry) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-w, y, r, 0, 6.283); ctx.arc(w, y, r, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#180a2e';
    var off = angry ? r * 0.25 : 0;
    ctx.beginPath(); ctx.arc(-w + off, y + r * 0.15, r * 0.5, 0, 6.283); ctx.arc(w + off, y + r * 0.15, r * 0.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(-w - r * 0.25, y - r * 0.3, r * 0.22, 0, 6.283); ctx.arc(w - r * 0.25, y - r * 0.3, r * 0.22, 0, 6.283); ctx.fill();
  }

  function drawBlob(h, c1, c2, sc, e) {
    var w = h * 0.75, hh = h * 0.5;
    var g = ctx.createRadialGradient(0, -hh * 0.4, h * 0.1, 0, 0, w);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; outline(4);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, hh, 0, 0, 6.283);
    ctx.fill(); ctx.stroke();
    eyes(w * 0.32, -hh * 0.15, h * 0.13, false);
    ctx.strokeStyle = 'rgba(20,8,36,.7)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(0, hh * 0.2, w * 0.28, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  function drawQuad(h, c1, c2, sc, e, d) {
    var w = h * 0.42, hh = h * 0.5;
    /* ноги */
    ctx.fillStyle = c2; outline(3);
    var legSw = Math.sin(t * 8 + e.wob) * h * 0.08;
    ctx.beginPath(); ctx.roundRect(-w * 0.7, hh * 0.5, w * 0.5, h * 0.3 + legSw, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.2, hh * 0.5, w * 0.5, h * 0.3 - legSw, 4); ctx.fill(); ctx.stroke();
    /* тело */
    var g = ctx.createLinearGradient(0, -hh, 0, hh);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; outline(4);
    ctx.beginPath(); ctx.roundRect(-w, -hh * 0.2, w * 2, hh * 1.3, w * 0.55); ctx.fill(); ctx.stroke();
    /* руки */
    ctx.fillStyle = c1; outline(3);
    ctx.beginPath(); ctx.roundRect(-w * 1.35, -hh * 0.05, w * 0.5, h * 0.28, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.85, -hh * 0.05, w * 0.5, h * 0.28, 5); ctx.fill(); ctx.stroke();
    /* голова */
    var hy = -hh * 0.75;
    ctx.fillStyle = c1; outline(4);
    ctx.beginPath(); ctx.arc(0, hy, w * 0.85, 0, 6.283); ctx.fill(); ctx.stroke();
    if (d && d.ears) {
      ctx.fillStyle = c1; outline(3);
      ctx.beginPath(); ctx.ellipse(-w * 0.85, hy - w * 0.2, w * 0.35, w * 0.16, -0.6, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.85, hy - w * 0.2, w * 0.35, w * 0.16, 0.6, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    if (d && d.horns) {
      ctx.fillStyle = '#f0e6d2'; outline(3);
      ctx.beginPath(); ctx.moveTo(-w * 0.6, hy - w * 0.5); ctx.lineTo(-w * 0.9, hy - w * 1.5); ctx.lineTo(-w * 0.2, hy - w * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.6, hy - w * 0.5); ctx.lineTo(w * 0.9, hy - w * 1.5); ctx.lineTo(w * 0.2, hy - w * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (d && d.armor) {
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-w, -hh * 0.1); ctx.lineTo(w, -hh * 0.1); ctx.stroke();
    }
    if (d && d.tail) {
      ctx.strokeStyle = c2; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.8, hh * 0.6); ctx.quadraticCurveTo(w * 2, hh * 0.3, w * 1.7, -hh * 0.3); ctx.stroke();
    }
    eyes(w * 0.34, hy, h * 0.1, true);
    /* рот с зубами */
    ctx.fillStyle = 'rgba(20,8,36,.8)';
    ctx.beginPath(); ctx.ellipse(0, hy + h * 0.13, w * 0.35, h * 0.06, 0, 0, 6.283); ctx.fill();
  }
  function drawBone(h, c1, c2, sc, e) {
    var w = h * 0.36;
    ctx.strokeStyle = c1; ctx.lineWidth = h * 0.1; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.05); ctx.lineTo(0, h * 0.25);
    ctx.moveTo(-w, h * 0.5); ctx.lineTo(w, h * 0.5);
    ctx.moveTo(-w * 0.8, -h * 0.1); ctx.lineTo(w * 0.8, -h * 0.1);
    ctx.stroke();
    outline(3);
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(0, -h * 0.3, w * 0.85, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#180a2e';
    ctx.beginPath(); ctx.arc(-w * 0.3, -h * 0.32, w * 0.22, 0, 6.283); ctx.arc(w * 0.3, -h * 0.32, w * 0.22, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ff5252';
    ctx.beginPath(); ctx.arc(-w * 0.3, -h * 0.32, w * 0.09, 0, 6.283); ctx.arc(w * 0.3, -h * 0.32, w * 0.09, 0, 6.283); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 2.5;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.05 + i * h * 0.09); ctx.lineTo(w * 0.5, -h * 0.05 + i * h * 0.09); ctx.stroke();
    }
  }
  function drawSpider(h, c1, c2, sc, e) {
    var w = h * 0.45;
    ctx.strokeStyle = c2; ctx.lineWidth = h * 0.07; ctx.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var a = Math.sin(t * 6 + i) * 0.12;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0);
      ctx.quadraticCurveTo(-w * 1.6, -h * 0.2 + i * h * 0.12 + a * h, -w * 1.3, h * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.quadraticCurveTo(w * 1.6, -h * 0.2 + i * h * 0.12 - a * h, w * 1.3, h * 0.42);
      ctx.stroke();
    }
    var g = ctx.createRadialGradient(0, -h * 0.1, h * 0.05, 0, 0, w);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; outline(3.6);
    ctx.beginPath(); ctx.ellipse(0, 0, w, w * 0.85, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5252';
    for (var j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(j * w * 0.3, -h * 0.1, h * 0.06, 0, 6.283); ctx.fill(); }
  }
  function drawWitch(h, c1, c2, sc, e) {
    var w = h * 0.5;
    ctx.fillStyle = c2; outline(4);
    ctx.beginPath(); ctx.moveTo(0, -h * 0.75); ctx.lineTo(-w * 1.3, h * 0.5); ctx.lineTo(w * 1.3, h * 0.5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = c1; outline(3.4);
    ctx.beginPath(); ctx.arc(0, -h * 0.62, w * 0.6, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c2; outline(3.4);
    ctx.beginPath(); ctx.moveTo(-w * 1.1, -h * 0.85); ctx.lineTo(w * 1.1, -h * 0.85); ctx.lineTo(0, -h * 1.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7dff5c';
    ctx.beginPath(); ctx.arc(-w * 0.25, -h * 0.62, h * 0.07, 0, 6.283); ctx.arc(w * 0.25, -h * 0.62, h * 0.07, 0, 6.283); ctx.fill();
  }
  function drawDragon(h, c1, c2, sc, e, tt) {
    var w = h * 0.55;
    var flap = Math.sin(tt * 5 + e.wob) * h * 0.2;
    ctx.fillStyle = c2; outline(3.4);
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -h * 0.1);
    ctx.quadraticCurveTo(-w * 2.2, -h * 0.6 - flap, -w * 1.9, h * 0.2 - flap);
    ctx.quadraticCurveTo(-w, h * 0.1, -w * 0.4, h * 0.1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.4, -h * 0.1);
    ctx.quadraticCurveTo(w * 2.2, -h * 0.6 - flap, w * 1.9, h * 0.2 - flap);
    ctx.quadraticCurveTo(w, h * 0.1, w * 0.4, h * 0.1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    var g = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; outline(4);
    ctx.beginPath(); ctx.ellipse(0, 0, w, h * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    /* хвост */
    ctx.strokeStyle = c2; ctx.lineWidth = h * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w * 0.7, h * 0.2); ctx.quadraticCurveTo(-w * 1.8, h * 0.35, -w * 1.5, -h * 0.1); ctx.stroke();
    /* голова */
    var hy = -h * 0.42;
    ctx.fillStyle = c1; outline(4);
    ctx.beginPath(); ctx.ellipse(w * 0.15, hy, w * 0.6, h * 0.22, 0.1, 0, 6.283); ctx.fill(); ctx.stroke();
    eyes(w * 0.2, hy - h * 0.02, h * 0.07, true);
    if (U.chance(0.02)) { ctx.fillStyle = 'rgba(255,180,60,.7)'; ctx.beginPath(); ctx.arc(w * 0.9, hy + h * 0.06, h * 0.12, 0, 6.283); ctx.fill(); }
  }
  function drawDemon(h, c1, c2, sc, e) {
    var w = h * 0.45;
    ctx.fillStyle = c2; outline(4);
    ctx.beginPath(); ctx.roundRect(-w, -h * 0.2, w * 2, h * 0.75, w * 0.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c1; outline(4);
    ctx.beginPath(); ctx.arc(0, -h * 0.42, w * 0.8, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff8c9';
    ctx.beginPath(); ctx.arc(-w * 0.32, -h * 0.44, h * 0.1, 0, 6.283); ctx.arc(w * 0.32, -h * 0.44, h * 0.1, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#180a2e';
    ctx.beginPath(); ctx.arc(-w * 0.32, -h * 0.42, h * 0.05, 0, 6.283); ctx.arc(w * 0.32, -h * 0.42, h * 0.05, 0, 6.283); ctx.fill();
    /* рога */
    ctx.fillStyle = '#3a1030'; outline(3);
    ctx.beginPath(); ctx.moveTo(-w * 0.6, -h * 0.62); ctx.lineTo(-w * 1.1, -h * 1.35); ctx.lineTo(-w * 0.15, -h * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.6, -h * 0.62); ctx.lineTo(w * 1.1, -h * 1.35); ctx.lineTo(w * 0.15, -h * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function drawMech(h, c1, c2, sc, e) {
    var w = h * 0.5;
    ctx.fillStyle = c2; outline(4);
    ctx.beginPath(); ctx.roundRect(-w, -h * 0.35, w * 2, h * 0.9, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c1; outline(3);
    ctx.beginPath(); ctx.roundRect(-w * 0.7, -h * 0.8, w * 1.4, h * 0.5, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5252';
    ctx.beginPath(); ctx.arc(0, -h * 0.55, h * 0.1, 0, 6.283); ctx.fill();
    ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, -h * 0.55, h * 0.1, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = c2; outline(3);
    ctx.beginPath(); ctx.roundRect(-w * 1.3, -h * 0.2, w * 0.4, h * 0.6, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.9, -h * 0.2, w * 0.4, h * 0.6, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(-w * 0.8, -h * 0.25, w * 1.6, h * 0.1);
  }
  function drawCthul(h, c1, c2, sc, e) {
    var w = h * 0.5;
    ctx.strokeStyle = c2; ctx.lineWidth = h * 0.08; ctx.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var a = -0.6 + i * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * w * 0.7, h * 0.2);
      ctx.quadraticCurveTo(Math.sin(a) * w * 1.8 + Math.sin(t * 3 + i) * 8, h * 0.45, Math.sin(a) * w * 2.2, h * 0.1);
      ctx.stroke();
    }
    ctx.fillStyle = c2; outline(4);
    ctx.beginPath(); ctx.ellipse(0, h * 0.1, w, h * 0.45, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    var g = ctx.createRadialGradient(0, -h * 0.3, h * 0.05, 0, -h * 0.2, w);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; outline(4);
    ctx.beginPath(); ctx.ellipse(0, -h * 0.25, w * 0.85, h * 0.35, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(-w * 0.3, -h * 0.25, h * 0.08, 0, 6.283); ctx.arc(w * 0.3, -h * 0.25, h * 0.08, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#180a2e';
    ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.25, h * 0.03, h * 0.07, 0, 0, 6.283); ctx.ellipse(w * 0.3, -h * 0.25, h * 0.03, h * 0.07, 0, 0, 6.283); ctx.fill();
  }
  function drawBug(h, c1, c2, sc, e, tt) {
    var w = h * 0.45;
    var gl = Math.sin(tt * 30) * 3;
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? c1 : c2;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-w + gl * (i % 2 ? 1 : -1), -h * 0.5 + i * h * 0.25, w * 2, h * 0.25);
    }
    ctx.globalAlpha = 1;
    outline(3);
    ctx.strokeRect(-w, -h * 0.5, w * 2, h);
    ctx.fillStyle = '#fff';
    ctx.font = (h * 0.4) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('404', 0, h * 0.1);
    ctx.strokeStyle = c1; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.55); ctx.lineTo(-w * 0.7, -h * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.4, -h * 0.55); ctx.lineTo(w * 0.7, -h * 0.9); ctx.stroke();
  }

  /* ---------- герой ---------- */
  function drawHero() {
    var C = Combat.C;
    var hd = Combat.heroDef();
    var fy = feetY();
    var x = P(0.2);
    var h = H * 0.17;
    var col = hd.c || '#ff8a3d';
    var swing = C.hero.swing > 0 ? C.hero.swing / 0.18 : 0;
    var bob = Math.sin(t * 5) * (C.hero.alive ? 1 : 0) * h * 0.03;
    shadow(0.2, h * 0.5, C.hero.alive ? 0.35 : 0.15);
    ctx.save();
    ctx.translate(x, fy + bob);
    if (!C.hero.alive) { ctx.rotate(-1.2); ctx.translate(0, h * 0.2); }
    if (C.buffs.invis > 0) ctx.globalAlpha = 0.5;
    /* аура берсерка */
    if (C.buffs.berserk > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 12);
      var ag = ctx.createRadialGradient(0, -h * 0.4, 2, 0, -h * 0.4, h * 1.1);
      ag.addColorStop(0, 'rgba(255,90,40,0)'); ag.addColorStop(1, 'rgba(255,90,40,.8)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(0, -h * 0.4, h * 1.1, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    /* ноги */
    ctx.fillStyle = '#3a2352'; outline(3.4);
    var ls = Math.sin(t * 8) * h * 0.08;
    ctx.beginPath(); ctx.roundRect(-h * 0.22, -h * 0.32, h * 0.16, h * 0.34 + ls, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(h * 0.06, -h * 0.32, h * 0.16, h * 0.34 - ls, 5); ctx.fill(); ctx.stroke();
    /* плащ */
    ctx.fillStyle = 'rgba(90,40,150,.9)'; outline(3);
    ctx.beginPath();
    ctx.moveTo(-h * 0.28, -h * 0.85);
    ctx.quadraticCurveTo(-h * 0.75 - Math.sin(t * 3) * 6, -h * 0.4, -h * 0.5, h * 0.02);
    ctx.lineTo(-h * 0.1, -h * 0.6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* тело */
    var g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, col); g.addColorStop(1, '#2b1440');
    ctx.fillStyle = g; outline(4);
    ctx.beginPath(); ctx.roundRect(-h * 0.3, -h * 0.9, h * 0.6, h * 0.72, h * 0.22); ctx.fill(); ctx.stroke();
    /* эмблема */
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = (h * 0.2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hd.i, 0, -h * 0.55);
    /* голова */
    ctx.fillStyle = '#ffe0c2'; outline(4);
    ctx.beginPath(); ctx.arc(0, -h * 1.05, h * 0.26, 0, 6.283); ctx.fill(); ctx.stroke();
    /* шлем */
    ctx.fillStyle = col; outline(3.4);
    ctx.beginPath(); ctx.arc(0, -h * 1.12, h * 0.27, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#180a2e';
    ctx.beginPath(); ctx.arc(-h * 0.1, -h * 1.0, h * 0.045, 0, 6.283); ctx.arc(h * 0.1, -h * 1.0, h * 0.045, 0, 6.283); ctx.fill();
    /* рука + оружие */
    ctx.save();
    ctx.translate(h * 0.28, -h * 0.62);
    ctx.rotate(-swing * 1.6 + Math.sin(t * 3) * 0.1);
    ctx.fillStyle = '#ffe0c2'; outline(3);
    ctx.beginPath(); ctx.roundRect(0, -h * 0.06, h * 0.3, h * 0.13, 6); ctx.fill(); ctx.stroke();
    var wi = S.equip.weapon ? S.equip.weapon.icon : '⚔️';
    ctx.font = (h * 0.42) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save();
    ctx.scale(-1, 1);
    ctx.fillText(wi, -h * 0.55, 0);
    ctx.restore();
    ctx.restore();
    ctx.restore();
    /* хит-флеш */
    if (C.hero.flash > 0) {
      ctx.save();
      ctx.globalAlpha = C.hero.flash * 3;
      ctx.fillStyle = '#ff5252';
      ctx.beginPath(); ctx.arc(x, fy - h * 0.5, h * 0.9, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    /* питомец */
    if (S.petEquipped && !C.T.flags.noPet) {
      var pk = S.petEquipped, ic = '🐾';
      for (var i = 0; i < D.PETS.length; i++) if (D.PETS[i].k === pk) ic = D.PETS[i].i;
      ctx.font = (h * 0.42) + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var py = fy - h * 0.05 + Math.sin(t * 4) * 5;
      ctx.fillText(ic, P(0.09), py);
    }
  }

  /* ---------- частицы ---------- */
  function drawParticles() {
    var fy = feetY();
    for (var i = 0; i < FX.parts.length; i++) {
      var p = FX.parts[i];
      var a = U.clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.t === 'text') {
        var px = P(p.x), py = fy - (p.y * H) - 26;
        ctx.font = '900 ' + Math.floor(18 * p.s * (1 + (1 - a) * 0.25)) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,8,36,.9)';
        ctx.strokeText(p.txt, px, py);
        ctx.fillStyle = p.c;
        ctx.fillText(p.txt, px, py);
      } else if (p.t === 'bit') {
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(P(p.x), fy - p.y * H, p.r * a, 0, 6.283); ctx.fill();
      } else if (p.t === 'line') {
        ctx.strokeStyle = p.c; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(P(p.x), fy - p.y * H);
        ctx.lineTo(P(p.x + p.vx * 0.05), fy - p.y * H + p.vy * 24);
        ctx.stroke();
      } else if (p.t === 'ring') {
        ctx.strokeStyle = p.c; ctx.lineWidth = 3 * a;
        ctx.beginPath(); ctx.ellipse(P(p.x), fy - p.y * H, p.r, p.r * 0.55, 0, 0, 6.283); ctx.stroke();
      } else if (p.t === 'slash') {
        ctx.save();
        ctx.translate(P(p.x), fy - p.y * H);
        ctx.rotate(p.a);
        ctx.strokeStyle = 'rgba(255,255,255,' + a + ')';
        ctx.lineWidth = 6 * a; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, 26, -0.9, 0.9); ctx.stroke();
        ctx.restore();
      } else if (p.t === 'coin') {
        ctx.fillStyle = '#ffcc3d';
        ctx.beginPath(); ctx.arc(P(p.x), fy - p.y * H, p.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#a45c00';
        ctx.beginPath(); ctx.arc(P(p.x), fy - p.y * H, p.r * 0.5, 0, 6.283); ctx.fill();
      } else if (p.t === 'beam') {
        var g = ctx.createLinearGradient(0, fy - (p.y * H) - 60, 0, fy - 10);
        g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = g;
        ctx.fillRect(P(p.x) - 14, fy - p.y * H - 60, 28, 80);
      } else if (p.t === 'flash') {
        ctx.fillStyle = p.c;
        ctx.fillRect(0, 0, W, H);
      } else if (p.t === 'meteor') {
        var mx = P(p.x), my = (1 - a) * H * 0.7;
        var g2 = ctx.createRadialGradient(mx, my, 2, mx, my, 46);
        g2.addColorStop(0, '#fff'); g2.addColorStop(0.4, p.c); g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(mx, my, 46, 0, 6.283); ctx.fill();
      } else if (p.t === 'puddle') {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = '#7dff5c';
        ctx.beginPath(); ctx.ellipse(P(p.x), fy + 4, 34, 9, 0, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- кадр ---------- */
  function frame(dt) {
    if (!ctx) return;
    t += dt;
    if (shake > 0) shake -= dt;
    ctx.save();
    if (shake > 0 && S.settings.shake) {
      ctx.translate(U.rnd(-shakeMag, shakeMag), U.rnd(-shakeMag, shakeMag));
    }
    drawBG(dt);
    drawWeather(dt);
    /* сортировка: дальние первыми */
    var es = Combat.C.enemies.slice().sort(function (a, b) { return a.x - b.x; });
    for (var i = 0; i < es.length; i++) drawCreature(es[i]);
    drawHero();
    drawParticles();
    ctx.restore();
  }

  function kick(mag, dur) {
    shake = dur || 0.25;
    shakeMag = mag || 8;
  }

  return { init: init, resize: resize, frame: frame, kick: kick, get W() { return W; }, get H() { return H; } };
})();
if (typeof window !== 'undefined') window.Render = Render;
