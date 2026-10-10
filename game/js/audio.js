/* ============================================================
   audio.js — синтезированный звук и динамическая музыка (WebAudio)
   ============================================================ */
var Audio2 = (function () {
  'use strict';
  var ac = null, master = null, musicGain = null, sfxGain = null;
  var ready = false, musicOn = false, noiseBuf = null;
  var step = 0, nextNote = 0, timer = null;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ac = new Ctx();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      var len = ac.sampleRate * 0.5;
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      ready = true;
      if (S.settings.music) startMusic();
    } catch (e) { ready = false; }
  }

  function tone(freq, dur, type, gain, when, slideTo) {
    if (!ready || !S.settings.sound) return;
    var t0 = (when || ac.currentTime);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, gain, filterFreq, when) {
    if (!ready || !S.settings.sound) return;
    var t0 = (when || ac.currentTime);
    var src = ac.createBufferSource(); src.buffer = noiseBuf;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq || 1200;
    var g = ac.createGain();
    g.gain.setValueAtTime(gain || 0.25, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur);
  }

  var SFX = {
    hit: function () { noise(0.06, 0.16, 1800); tone(180, 0.06, 'square', 0.08, 0, 120); },
    tap: function () { noise(0.04, 0.1, 2600); },
    crit: function () { tone(880, 0.09, 'square', 0.22, 0, 1600); noise(0.09, 0.2, 3200); tone(300, 0.16, 'sawtooth', 0.14, 0, 90); },
    coin: function () { tone(1320, 0.05, 'triangle', 0.14); tone(1760, 0.08, 'triangle', 0.12, ac.currentTime + 0.05); },
    die: function () { noise(0.14, 0.2, 700); tone(220, 0.16, 'sawtooth', 0.1, 0, 60); },
    bossdie: function () { noise(0.5, 0.3, 400); tone(120, 0.6, 'sawtooth', 0.2, 0, 40); },
    boss: function () { tone(90, 0.5, 'sawtooth', 0.25, 0, 140); noise(0.4, 0.2, 300); },
    levelup: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.16, ac.currentTime + i * 0.08); }); },
    ult: function () { tone(120, 0.5, 'sawtooth', 0.3, 0, 900); noise(0.4, 0.25, 900); },
    forge: function () { noise(0.12, 0.22, 2400); tone(520, 0.1, 'square', 0.12, 0, 700); },
    equip: function () { tone(700, 0.08, 'triangle', 0.14); tone(1050, 0.1, 'triangle', 0.12, ac.currentTime + 0.07); },
    achieve: function () { [659, 880, 1175].forEach(function (f, i) { tone(f, 0.22, 'sine', 0.18, ac.currentTime + i * 0.1); }); },
    loot: function () { [784, 988, 1319].forEach(function (f, i) { tone(f, 0.14, 'triangle', 0.14, ac.currentTime + i * 0.06); }); },
    curse: function () { tone(200, 0.6, 'sawtooth', 0.2, 0, 60); noise(0.5, 0.18, 500); },
    merge: function () { [440, 554, 659, 880].forEach(function (f, i) { tone(f, 0.12, 'square', 0.1, ac.currentTime + i * 0.05); }); },
    dismantle: function () { noise(0.25, 0.2, 1500); },
    click: function () { tone(660, 0.04, 'square', 0.1); },
    error: function () { tone(180, 0.18, 'square', 0.16, 0, 120); },
    chest: function () { noise(0.2, 0.2, 800); [523, 784, 1047].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.14, ac.currentTime + i * 0.09); }); },
    gates: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.14, ac.currentTime + i * 0.07); }); },
    coinrush: function () { for (var i = 0; i < 8; i++) tone(1200 + i * 120, 0.05, 'triangle', 0.08, ac.currentTime + i * 0.03); }
  };

  function sfx(name) {
    if (!ready || !S.settings.sound) return;
    var f = SFX[name];
    if (f) { try { f(); } catch (e) { } }
  }

  /* ---------- музыка ---------- */
  var SCALES = {
    fields: [0, 2, 4, 7, 9], forest: [0, 3, 5, 7, 10], caves: [0, 2, 3, 7, 8],
    graveyard: [0, 1, 5, 7, 8], volcano: [0, 1, 4, 6, 8], ice: [0, 2, 5, 7, 9],
    desert: [0, 2, 5, 7, 10], swamp: [0, 1, 3, 6, 8], sky: [0, 2, 4, 7, 11],
    abyss: [0, 1, 4, 6, 9], chaos: [0, 1, 3, 6, 10]
  };
  var ROOTS = [55, 58, 49, 52, 45, 62, 51, 57, 59, 41, 43];

  function note(freq, dur, type, gain, when) {
    var t0 = when;
    var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2600;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f); f.connect(g); g.connect(musicGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function drum(when, kind) {
    var src = ac.createBufferSource(); src.buffer = noiseBuf;
    var f = ac.createBiquadFilter(); f.type = kind === 'kick' ? 'lowpass' : 'highpass';
    f.frequency.value = kind === 'kick' ? 180 : 5000;
    var g = ac.createGain();
    g.gain.setValueAtTime(kind === 'kick' ? 0.5 : 0.1, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + (kind === 'kick' ? 0.18 : 0.06));
    src.connect(f); f.connect(g); g.connect(musicGain);
    src.start(when); src.stop(when + 0.2);
  }

  function schedule() {
    if (!ready || !musicOn) return;
    var now = ac.currentTime;
    while (nextNote < now + 0.4) {
      var bi = Stats.biomeIndex();
      var bk = D.BIOMES[bi].k;
      var scale = SCALES[bk] || SCALES.fields;
      var root = ROOTS[bi] || 55;
      var beat = step % 16;
      /* бас */
      if (beat % 4 === 0) note(root, 0.55, 'triangle', 0.5, nextNote);
      /* арп */
      if (beat % 2 === 0) {
        var deg = scale[(step / 2) % scale.length | 0];
        var oct = (beat % 8 === 0) ? 4 : 3;
        note(root * Math.pow(2, oct) / 4 * Math.pow(2, deg / 12), 0.22, 'sine', 0.18, nextNote);
      }
      /* барабаны */
      if (beat % 8 === 0) drum(nextNote, 'kick');
      if (beat % 8 === 4) drum(nextNote, 'snare');
      if (beat % 2 === 1) drum(nextNote, 'hat');
      nextNote += 0.145;
      step++;
    }
    timer = setTimeout(schedule, 120);
  }
  function startMusic() {
    if (!ready || musicOn) return;
    musicOn = true;
    nextNote = ac.currentTime + 0.1;
    schedule();
  }
  function stopMusic() {
    musicOn = false;
    if (timer) clearTimeout(timer);
  }
  function toggleMusic(on) {
    if (!ready) init();
    if (on) startMusic(); else stopMusic();
  }
  function setVolume(v) { if (master) master.gain.value = v; }

  return { init: init, sfx: sfx, startMusic: startMusic, stopMusic: stopMusic, toggleMusic: toggleMusic, setVolume: setVolume, get ready() { return ready; } };
})();
if (typeof window !== 'undefined') window.Audio2 = Audio2;
