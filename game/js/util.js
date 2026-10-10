/* ============================================================
   util.js — математика, формат чисел, DOM-хелперы, модалки
   ============================================================ */
var U = (function () {
  'use strict';

  var SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
             'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
             'UVg', 'DVg', 'TVg', 'QaVg'];

  function letters(t) { // aa, ab, ac ... для совсем диких чисел
    t = t - SUF.length;
    var s = '', n = t;
    do { s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
    return s;
  }

  function fmt(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    if (!isFinite(n)) return '∞';
    var neg = n < 0; n = Math.abs(n);
    if (n < 1000) {
      var s = n < 10 && n % 1 !== 0 ? n.toFixed(Math.min(2, dec === undefined ? 2 : dec))
            : n < 1000 && n % 1 !== 0 ? n.toFixed(n < 100 ? 1 : 0) : String(Math.floor(n));
      return (neg ? '-' : '') + s;
    }
    var tier = Math.floor(Math.log10(n) / 3);
    var scaled = n / Math.pow(1000, tier);
    var d = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
    if (dec !== undefined) d = dec;
    var suf = tier < SUF.length ? SUF[tier] : letters(tier);
    return (neg ? '-' : '') + scaled.toFixed(d) + suf;
  }
  function fmtInt(n) { return fmt(n, 0); }
  function fmtPct(x, d) { return (x >= 0 ? '+' : '') + (x * 100).toFixed(d === undefined ? 0 : d) + '%'; }
  function fmtMult(x) { return '×' + x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0); }
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return h + 'ч ' + pad(m) + 'м';
    return m + ':' + pad(s);
  }
  function pad(x) { return (x < 10 ? '0' : '') + x; }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); }
  function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
  function chance(p) { return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function weighted(list, wf) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += wf(list[i]);
    if (total <= 0) return list[0];
    var r = Math.random() * total;
    for (i = 0; i < list.length; i++) { r -= wf(list[i]); if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function gauss(mean, dev) {
    var u = 1 - Math.random(), v = Math.random();
    return mean + dev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------- DOM ---------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function h(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function on(root, sel, evt, fn) {
    qsa(sel, root).forEach(function (e) { e.addEventListener(evt, fn); });
  }
  function delegate(root, sel, evt, fn) {
    root.addEventListener(evt, function (e) {
      var t = e.target;
      while (t && t !== root) {
        if (t.matches && t.matches(sel)) { fn.call(t, e, t); return; }
        t = t.parentNode;
      }
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- toast ---------- */
  var toastRoot = null;
  function toast(msg, kind, big) {
    if (!toastRoot) toastRoot = document.getElementById('toasts');
    if (!toastRoot) return;
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = msg;
    if (big) t.style.fontSize = '16px';
    toastRoot.appendChild(t);
    while (toastRoot.children.length > 5) toastRoot.removeChild(toastRoot.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3100);
  }

  /* ---------- modal ---------- */
  var modalStack = [];
  function modal(opts) {
    var root = document.getElementById('modal-root');
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    var m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = opts.html || '';
    bg.appendChild(m);
    root.appendChild(bg);
    var entry = { bg: bg, onClose: opts.onClose };
    modalStack.push(entry);
    if (opts.onMount) opts.onMount(m, function () { closeModal(entry); });
    if (opts.dismissable !== false) {
      bg.addEventListener('click', function (e) { if (e.target === bg) closeModal(entry); });
    }
    return entry;
  }
  function closeModal(entry) {
    var i = modalStack.indexOf(entry);
    if (i < 0) return;
    modalStack.splice(i, 1);
    if (entry.bg.parentNode) entry.bg.parentNode.removeChild(entry.bg);
    if (entry.onClose) entry.onClose();
  }
  function closeAllModals() { modalStack.slice().forEach(closeModal); }

  function confirmBox(title, text, onYes, yesLabel) {
    modal({
      html: '<h2>' + title + '</h2><div class="sub">' + text + '</div>' +
        '<div class="actions"><button class="btn" data-no>Нет</button>' +
        '<button class="btn red" data-yes>' + (yesLabel || 'Да') + '</button></div>',
      onMount: function (m, close) {
        m.querySelector('[data-no]').onclick = close;
        m.querySelector('[data-yes]').onclick = function () { close(); onYes && onYes(); };
      }
    });
  }

  /* ---------- tooltip ---------- */
  var ttEl = null;
  function showTip(html, x, y) {
    if (!ttEl) ttEl = document.getElementById('tooltip');
    if (!ttEl) return;
    ttEl.innerHTML = html;
    ttEl.classList.remove('hidden');
    var r = ttEl.getBoundingClientRect();
    var w = window.innerWidth, hgt = window.innerHeight;
    var px = clamp(x - r.width / 2, 8, w - r.width - 8);
    var py = y - r.height - 14;
    if (py < 60) py = y + 24;
    py = clamp(py, 60, hgt - r.height - 8);
    ttEl.style.left = px + 'px';
    ttEl.style.top = py + 'px';
  }
  function hideTip() { if (ttEl) ttEl.classList.add('hidden'); }

  /* ---------- storage ---------- */
  var mem = {};
  /* В Android-оболочке сохранение идёт через нативный мост (надёжнее localStorage) */
  function bridge() {
    try {
      if (typeof window !== 'undefined' && window.AndroidBridge && typeof window.AndroidBridge.saveGame === 'function') return window.AndroidBridge;
    } catch (e) { }
    return null;
  }
  var store = {
    get: function (k) {
      var b = bridge();
      if (b) { try { var v = b.loadSave(); if (v && v !== 'undefined') return v; return null; } catch (e) { } }
      try { return window.localStorage.getItem(k); } catch (e) { return mem[k] || null; }
    },
    set: function (k, v) {
      var b = bridge();
      if (b) { try { b.saveGame(v); return; } catch (e) { } }
      try { window.localStorage.setItem(k, v); } catch (e) { mem[k] = v; }
    },
    del: function (k) {
      var b = bridge();
      if (b) { try { b.saveGame(''); return; } catch (e) { } }
      try { window.localStorage.removeItem(k); } catch (e) { delete mem[k]; }
    },
    isNative: function () { return !!bridge(); }
  };

  /* ---------- misc ---------- */
  function now() { return Date.now(); }
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function weekKey() { var d = new Date(); var onejan = new Date(d.getFullYear(), 0, 1); var wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7); return d.getFullYear() + '-w' + wk; }
  function daysSince(ts) { return Math.floor((Date.now() - ts) / 86400000); }

  function b64encode(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return ''; } }
  function b64decode(s) { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } }

  return {
    SUF: SUF, fmt: fmt, fmtInt: fmtInt, fmtPct: fmtPct, fmtMult: fmtMult, fmtTime: fmtTime, pad: pad,
    clamp: clamp, lerp: lerp, rnd: rnd, rndInt: rndInt, chance: chance, pick: pick, shuffle: shuffle,
    weighted: weighted, gauss: gauss,
    qs: qs, qsa: qsa, h: h, on: on, delegate: delegate, esc: esc,
    toast: toast, modal: modal, closeModal: closeModal, closeAllModals: closeAllModals, confirmBox: confirmBox,
    showTip: showTip, hideTip: hideTip,
    store: store, now: now, todayKey: todayKey, weekKey: weekKey, daysSince: daysSince,
    b64encode: b64encode, b64decode: b64decode
  };
})();
if (typeof window !== 'undefined') window.U = U;
