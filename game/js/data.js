/* ============================================================
   data.js — все игровые таблицы «Клинок и Монеты: Кузница Хаоса»
   ============================================================ */
var D = (function () {
  'use strict';

  /* ---------- эффекты (канонические ключи) ---------- */
  var EF = {
    dmg:      { n: 'Урон', flat: 1 },
    hp:       { n: 'HP', flat: 1 },
    dmgPct:   { n: 'Урон', pct: 1 },
    hpPct:    { n: 'HP', pct: 1 },
    crit:     { n: 'Шанс крита' },
    critDmg:  { n: 'Крит-урон' },
    atkSpeed: { n: 'Скор. атаки' },
    gold:     { n: 'Золото' },
    luck:     { n: 'Лут' },
    vamp:     { n: 'Вампиризм' },
    armor:    { n: 'Броня' },
    dodge:    { n: 'Уклонение' },
    slow:     { n: 'Замедление' },
    poison:   { n: 'Яд' },
    fire:     { n: 'Огонь' },
    stun:     { n: 'Оглушение' },
    fear:     { n: 'Страх' },
    heal:     { n: 'Лечение' },
    allPct:   { n: 'Ко всему' },
    bleed:    { n: 'Кровотечение' },
    shock:    { n: 'Молния' },
    off:      { n: 'Оффлайн-доход' },
    craft:    { n: 'Крафт' },
    xp:       { n: 'Опыт' },
    rage:     { n: 'Ярость' },
    execute:  { n: 'Урон по раненым' }
  };
  var ALL_PCT_KEYS = ['dmgPct', 'hpPct', 'gold', 'luck', 'atkSpeed', 'crit', 'vamp', 'armor', 'dodge'];

  /* ---------- редкости ---------- */
  var RARITY = [
    { k: 'common', n: 'Обычное',      c: '#b9c3cf', m: 1,    w: 1000, dust: 1,  shards: 1 },
    { k: 'rare',   n: 'Редкое',       c: '#4fa3ff', m: 1.7,  w: 260,  dust: 3,  shards: 3 },
    { k: 'epic',   n: 'Эпическое',    c: '#b45cff', m: 2.9,  w: 70,   dust: 9,  shards: 8 },
    { k: 'legend', n: 'Легендарное',  c: '#ffb02e', m: 5.2,  w: 18,   dust: 28, shards: 22 },
    { k: 'mythic', n: 'Мифическое',   c: '#ff4d6d', m: 10,   w: 4.5,  dust: 90, shards: 70 },
    { k: 'cursed', n: 'Проклятое',    c: '#7dff5c', m: 13,   w: 2.6,  dust: 130, shards: 100 },
    { k: 'divine', n: 'Божественное', c: '#ffe66d', m: 22,   w: 0.9,  dust: 400, shards: 320 },
    { k: 'chaos',  n: 'Хаоситное',    c: '#ff37f3', m: 45,   w: 0.28, dust: 1300, shards: 1000 }
  ];

  /* ---------- слоты ---------- */
  var SLOTS = [
    { k: 'weapon',   n: 'Оружие',    i: '⚔️' },
    { k: 'armor',    n: 'Броня',     i: '🦺' },
    { k: 'helmet',   n: 'Шлем',      i: '🪖' },
    { k: 'boots',    n: 'Сапоги',    i: '👢' },
    { k: 'gloves',   n: 'Перчатки',  i: '🧤' },
    { k: 'belt',     n: 'Пояс',      i: '🪢' },
    { k: 'amulet',   n: 'Амулет',    i: '📿' },
    { k: 'ring',     n: 'Кольцо',    i: '💍' },
    { k: 'cloak',    n: 'Плащ',      i: '🧣' },
    { k: 'pet',      n: 'Питомец',   i: '🐾' },
    { k: 'artifact', n: 'Артефакт',  i: '🔮' },
    { k: 'relic',    n: 'Реликвия',  i: '👑' }
  ];

  /* ---------- иконки оружия по названию ---------- */
  function wicon(name) {
    var n = name.toLowerCase();
    if (n.indexOf('меч') >= 0 || n.indexOf('клинок') >= 0 || n.indexOf('клино') >= 0) return '🗡️';
    if (n.indexOf('топор') >= 0) return '🪓';
    if (n.indexOf('молот') >= 0 || n.indexOf('молот') >= 0) return '🔨';
    if (n.indexOf('кинжал') >= 0) return '🔪';
    if (n.indexOf('копь') >= 0 || n.indexOf('трезубец') >= 0 || n.indexOf('гунгнир') >= 0) return '🔱';
    if (n.indexOf('лук') >= 0) return '🏹';
    if (n.indexOf('посох') >= 0 || n.indexOf('жезл') >= 0 || n.indexOf('скипетр') >= 0 || n.indexOf('книг') >= 0 || n.indexOf('корона') >= 0) return '🪄';
    if (n.indexOf('коса') >= 0) return '🌙';
    if (n.indexOf('щит') >= 0) return '🛡️';
    if (n.indexOf('цеп') >= 0 || n.indexOf('хлыст') >= 0) return '⛓️';
    if (n.indexOf('клык') >= 0) return '🦷';
    if (n.indexOf('перо') >= 0) return '🪶';
    return '⚔️';
  }

  /* ---------- ОРУЖИЕ ---------- */
  var WEAPONS = {
    common: [
      ['Ржавый меч', { dmg: 5 }], ['Деревянная дубина', { dmg: 4, stun: 1 }],
      ['Каменный топор', { dmg: 6 }], ['Костяной кинжал', { dmg: 5, crit: 2 }],
      ['Самодельное копьё', { dmg: 5, atkSpeed: 1 }], ['Треснувший лук', { dmg: 4, crit: 2 }],
      ['Гнилой посох', { dmg: 4, poison: 1 }], ['Ржавая коса', { dmg: 6 }],
      ['Кожаный хлыст', { dmg: 5, atkSpeed: 1 }], ['Каменный молот', { dmg: 7, atkSpeed: -1 }]
    ],
    rare: [
      ['Клинок гоблина', { dmg: 12, gold: 3 }], ['Топор крысиного барона', { dmg: 14, gold: 5 }],
      ['Ледяной кинжал', { dmg: 10, slow: 5 }], ['Огненный посох', { dmg: 11, fire: 5 }],
      ['Костяной лук', { dmg: 10, crit: 5 }], ['Копьё скелета', { dmg: 12, vamp: 3 }],
      ['Ядовитый цеп', { dmg: 13, poison: 5 }], ['Шипастый щит', { dmg: 8, armor: 10 }],
      ['Книга искр', { dmg: 9, fire: 5 }], ['Тотем слизи', { dmg: 8, slow: 5 }]
    ],
    epic: [
      ['Клинок Тумана', { dmg: 25, dodge: 10 }], ['Молот Огра', { dmg: 30, stun: 10 }],
      ['Коса Ведьмы', { dmg: 28, poison: 10 }], ['Драконий клык', { dmg: 32, fire: 10 }],
      ['Паучий клинок', { dmg: 26, poison: 10 }], ['Жадный жезл', { dmg: 24, gold: 15 }],
      ['Механический меч', { dmg: 27, atkSpeed: 10 }], ['Ктулхийский трезубец', { dmg: 29, fear: 10 }],
      ['Баг-кинжал', { dmg: 25, crit: 10 }], ['Платиновый топор', { dmg: 31, armor: 10 }]
    ],
    legend: [
      ['Пепельный Клинок', { dmg: 60, fire: 20 }], ['Ледяное Сердце', { dmg: 55, slow: 20 }],
      ['Кровавая Луна', { dmg: 58, vamp: 20 }], ['Громовой Молот', { dmg: 65, shock: 20 }],
      ['Тень Убийцы', { dmg: 50, crit: 25 }], ['Корона Хаоса', { dmg: 70, randomBuff: 1 }],
      ['Клык Дракона', { dmg: 68, fire: 20 }], ['Скипетр Жадности', { dmg: 45, gold: 50 }],
      ['Коса Смерти', { dmg: 75, execute: 20 }], ['Меч Администратора', { dmg: 80, allPct: 10 }]
    ],
    mythic: [
      ['Клинок Пожирателя Миров', { dmg: 150, vamp: 30 }], ['Молот Титана', { dmg: 160, stun: 30 }],
      ['Посох Вечности', { dmg: 140, atkSpeed: 30 }], ['Коса Апокалипсиса', { dmg: 155, poison: 30 }],
      ['Клык Ктулху', { dmg: 145, fear: 30 }], ['Топор Хаоса', { dmg: 165, randomEffect: 1 }],
      ['Лук Бесконечности', { dmg: 135, crit: 30 }], ['Жезл Времени', { dmg: 130, atkSpeed: 30 }],
      ['Кинжал Пространства', { dmg: 125, dodge: 30 }], ['Меч Судьбы', { dmg: 170, allPct: 20 }]
    ],
    cursed: [
      ['Проклятый Клинок Голода', { dmgPct: 100, gold: -50 }],
      ['Топор Безумия', { dmgPct: 150, hpPct: -50 }],
      ['Коса Крови', { vamp: 100, heal: -50 }],
      ['Посох Хаоса', { dmgPct: 200, chaosDebuff: 1 }],
      ['Кинжал Предательства', { crit: 300, armor: -50 }],
      ['Молот Жертвы', { dmgPct: 200, hpDrain: 10 }],
      ['Лук Одиночества', { dmgPct: 150, noPet: 1 }],
      ['Меч Смерти', { dmgPct: 250, reviveSlow: 1 }]
    ],
    divine: [
      ['Экскалибур Хаоса', { dmg: 300, allPct: 50 }], ['Гунгнир Бесконечности', { dmg: 280, crit: 50 }],
      ['Мьёльнир Кузницы', { dmg: 290, shock: 50 }], ['Посох Создателя', { dmg: 270, heal: 50 }],
      ['Коса Жнеца Миров', { dmg: 310, vamp: 50 }], ['Клинок Света и Тьмы', { dmg: 300, randomBuff: 2 }],
      ['Топор Титанов', { dmg: 320, armor: 50 }], ['Лук Звёзд', { dmg: 260, crit: 50 }],
      ['Жезл Абсолюта', { dmg: 250, atkSpeed: 50 }], ['Меч Императора', { dmg: 350, gold: 50 }]
    ],
    chaos: [
      ['Клинок 404', { dmg: 500, missChance: 10 }], ['Топор Разработчика', { dmg: 550, nerfEnemy: 25 }],
      ['Посох Бага', { dmg: 520, randomEffect: 2 }], ['Коса Нерфа', { dmg: 480, nerfEnemy: 50 }],
      ['Молот Патча', { dmg: 530, chaosRules: 1 }], ['Лук Рандома', { dmg: 510, crit: 100 }],
      ['Жезл Пинга', { dmg: 490, slow: 60 }], ['Меч Доната', { dmg: 600, gold: 100 }],
      ['Кинжал Аналитики', { dmg: 470, luck: 100 }], ['Коса Оффлайна', { dmg: 580, off: 100 }]
    ]
  };

  /* ---------- БРОНЯ [название, слот, иконка, эффекты] ---------- */
  var ARMOR = {
    common: [
      ['Кожаная куртка', 'armor', '🦺', { hp: 10 }], ['Тряпичная мантия', 'armor', '🧥', { hp: 8, atkSpeed: 1 }],
      ['Деревянный щит', 'armor', '🛡️', { hp: 5, armor: 2 }], ['Костяной шлем', 'helmet', '🪖', { hp: 6 }],
      ['Ржавые сапоги', 'boots', '👢', { hp: 4, atkSpeed: 1 }], ['Кожаные перчатки', 'gloves', '🧤', { hp: 5, dmgPct: 1 }],
      ['Верёвочный пояс', 'belt', '🪢', { hp: 4 }], ['Простой амулет', 'amulet', '📿', { hp: 3, gold: 1 }],
      ['Медное кольцо', 'ring', '💍', { hp: 3, crit: 1 }], ['Старый плащ', 'cloak', '🧣', { hp: 5 }]
    ],
    rare: [
      ['Броня гоблина', 'armor', '🦺', { hp: 25, gold: 5 }], ['Мантия тумана', 'armor', '🧥', { hp: 20, dodge: 5 }],
      ['Щит скелета', 'armor', '🛡️', { hp: 30, armor: 5 }], ['Шлем огра', 'helmet', '🪖', { hp: 28, stun: 5 }],
      ['Сапоги скорости', 'boots', '👢', { hp: 15, atkSpeed: 10 }], ['Перчатки силы', 'gloves', '🧤', { hp: 18, dmgPct: 10 }],
      ['Пояс жадности', 'belt', '🪢', { hp: 20, gold: 10 }], ['Амулет удачи', 'amulet', '📿', { hp: 15, luck: 5 }],
      ['Кольцо крита', 'ring', '💍', { hp: 12, crit: 5 }], ['Плащ тени', 'cloak', '🧣', { hp: 18, dodge: 5 }]
    ],
    epic: [
      ['Броня рыцаря ржавчины', 'armor', '🦺', { hp: 60, armor: 10 }], ['Мантия ведьмы', 'armor', '🧥', { hp: 50, poison: 10 }],
      ['Щит дракона', 'armor', '🛡️', { hp: 70, fire: 10 }], ['Шлем паука', 'helmet', '🪖', { hp: 55, poison: 10 }],
      ['Сапоги ветра', 'boots', '👢', { hp: 40, atkSpeed: 15 }], ['Перчатки титана', 'gloves', '🧤', { hp: 65, dmgPct: 10 }],
      ['Пояс богатства', 'belt', '🪢', { hp: 45, gold: 20 }], ['Амулет жизни', 'amulet', '📿', { hp: 55, heal: 10 }],
      ['Кольцо огня', 'ring', '💍', { hp: 40, fire: 10 }], ['Плащ хаоса', 'cloak', '🧣', { hp: 50, randomBuff: 1 }]
    ],
    legend: [
      ['Доспех Пепельного Дракона', 'armor', '🦺', { hp: 150, fire: 20 }], ['Мантия Ледяного Сердца', 'armor', '🧥', { hp: 130, slow: 20 }],
      ['Щит Кровавой Луны', 'armor', '🛡️', { hp: 160, vamp: 20 }], ['Шлем Безумного Кузнеца', 'helmet', '🪖', { hp: 140, craft: 20 }],
      ['Сапоги Тени', 'boots', '👢', { hp: 100, dodge: 25 }], ['Перчатки Грома', 'gloves', '🧤', { hp: 120, shock: 20 }],
      ['Пояс Императора', 'belt', '🪢', { hp: 110, gold: 30 }], ['Амулет Бессмертия', 'amulet', '📿', { hp: 170, heal: 20 }],
      ['Кольцо Жадности', 'ring', '💍', { hp: 90, gold: 40 }], ['Плащ Администратора', 'cloak', '🧣', { hp: 130, allPct: 10 }]
    ],
    mythic: [
      ['Броня Пожирателя', 'armor', '🦺', { hp: 300, vamp: 30 }], ['Мантия Вечности', 'armor', '🧥', { hp: 280, atkSpeed: 30 }],
      ['Щит Титана', 'armor', '🛡️', { hp: 350, armor: 30 }], ['Шлем Судьбы', 'helmet', '🪖', { hp: 270, crit: 30 }],
      ['Сапоги Бесконечности', 'boots', '👢', { hp: 220, atkSpeed: 30 }], ['Перчатки Хаоса', 'gloves', '🧤', { hp: 260, randomEffect: 1 }],
      ['Пояс Абсолюта', 'belt', '🪢', { hp: 240, gold: 50 }], ['Амулет Создателя', 'amulet', '📿', { hp: 290, heal: 30 }],
      ['Кольцо Времени', 'ring', '💍', { hp: 210, atkSpeed: 30 }], ['Плащ Пространства', 'cloak', '🧣', { hp: 250, dodge: 30 }]
    ],
    cursed: [
      ['Броня Голода', 'armor', '🦺', { hpPct: -50, gold: 100 }], ['Мантия Безумия', 'armor', '🧥', { dmgPct: 100, armor: -50 }],
      ['Щит Жертвы', 'armor', '🛡️', { armor: 200, atkSpeed: -50 }], ['Шлем Крови', 'helmet', '🪖', { vamp: 100, hpPct: -50 }],
      ['Сапоги Боли', 'boots', '👢', { atkSpeed: 100, hpDrain: 10 }], ['Перчатки Предательства', 'gloves', '🧤', { crit: 200, armor: -50 }],
      ['Пояс Одиночества', 'belt', '🪢', { gold: 100, noPet: 1 }], ['Амулет Смерти', 'amulet', '📿', { dmgPct: 200, reviveSlow: 1 }],
      ['Кольцо Хаоса', 'ring', '💍', { randomEffect: 1, randomBuff: 1 }], ['Плащ Нерфа', 'cloak', '🧣', { dmgPct: -50, gold: 100 }]
    ]
  };

  /* ---------- АКСЕССУАРЫ / АРТЕФАКТЫ ---------- */
  var ACCESSORIES = [
    ['Кольцо Удачи', 'ring', '💍', 'rare', { luck: 5 }],
    ['Амулет Жадности', 'amulet', '📿', 'epic', { gold: 15 }],
    ['Талисман Крита', 'amulet', '📿', 'epic', { crit: 10 }],
    ['Реликвия Времени', 'relic', '👑', 'legend', { atkSpeed: 20 }],
    ['Артефакт Хаоса', 'artifact', '🔮', 'mythic', { randomBuff: 1, allPct: 10 }],
    ['Печать Смерти', 'relic', '👑', 'cursed', { dmgPct: 100, hpPct: -50 }],
    ['Сердце Титана', 'artifact', '🔮', 'divine', { hpPct: 50 }],
    ['Око Судьбы', 'artifact', '🔮', 'chaos', { crit: 100 }],
    ['Клык Пожирателя', 'relic', '👑', 'mythic', { vamp: 30 }],
    ['Перо Феникса', 'artifact', '🔮', 'legend', { revive: 1 }]
  ];

  /* ---------- СЕТЫ ---------- */
  var SETS = [
    { k: 'goblin', n: 'Сет Гоблинского Короля', b3: { gold: 20 }, b5: { petAttack: 1 }, b5t: 'Питомец-гоблин атакует врагов' },
    { k: 'ash', n: 'Сет Пепла', b3: { fire: 15 }, b5: { deathExplode: 1 }, b5t: 'Взрыв при смерти врага' },
    { k: 'ice', n: 'Сет Ледяного Сердца', b3: { slow: 15 }, b5: { massFreeze: 1 }, b5t: 'Шанс заморозить всех' },
    { k: 'blood', n: 'Сет Кровавой Луны', b3: { vamp: 10 }, b5: { critBleed: 1 }, b5t: 'При крите — кровотечение' },
    { k: 'smith', n: 'Сет Безумного Кузнеца', b3: { craft: 20 }, b5: { freeCraft: 25 }, b5t: 'Шанс не потратить ресурсы' },
    { k: 'admin', n: 'Сет Администратора', b3: { allPct: 10 }, b5: { banChance: 3 }, b5t: '«Бан» — мгновенно убить монстра' },
    { k: 'chaos', n: 'Сет Хаоса', b3: { randomBuff: 1 }, b5: { enemyDebuff: 1 }, b5t: 'Случайный дебафф врагам' },
    { k: 'titan', n: 'Сет Титана', b3: { hpPct: 30 }, b5: { Shield: 1 }, b5t: 'Щит каждую волну' },
    { k: 'shadow', n: 'Сет Тени', b3: { dodge: 20 }, b5: { critInvis: 1 }, b5t: 'Невидимость после крита' },
    { k: 'slime', n: 'Сет Слизи', b3: { slow: 20 }, b5: { puddle: 1 }, b5t: 'Лужа при смерти врага' }
  ];
  var SET_KW = [
    ['админ', 'admin'], ['император', 'admin'], ['создател', 'admin'],
    ['пепел', 'ash'], ['пепельн', 'ash'], ['огн', 'ash'], ['spark', 'ash'], ['искр', 'ash'],
    ['лед', 'ice'], ['ледян', 'ice'], ['льд', 'ice'], ['мороз', 'ice'], ['снег', 'ice'], ['пингвин', 'ice'],
    ['кров', 'blood'], ['кровав', 'blood'], ['вампир', 'blood'], ['пожирател', 'blood'],
    ['кузнец', 'smith'], ['кова', 'smith'],
    ['титан', 'titan'], ['голем', 'titan'],
    ['тень', 'shadow'], ['тен', 'shadow'], ['призрак', 'shadow'], ['невид', 'shadow'],
    ['слиз', 'slime'], ['slime', 'slime'],
    ['гоблин', 'goblin'], ['крыс', 'goblin'],
    ['хаос', 'chaos'], ['рандом', 'chaos'], ['баг', 'chaos'], ['нерф', 'chaos'], ['патч', 'chaos'], ['пинг', 'chaos'],
    ['404', 'chaos'], ['аналитик', 'chaos'], ['оффлайн', 'chaos'], ['донат', 'chaos'], ['пространств', 'chaos']
  ];
  function setOf(name) {
    var n = name.toLowerCase();
    for (var i = 0; i < SET_KW.length; i++) if (n.indexOf(SET_KW[i][0]) >= 0) return SET_KW[i][1];
    return null;
  }

  /* ---------- РУНЫ ---------- */
  var RUNES = [
    { k: 'fire', n: 'Руна Огня', i: '🔥', e: { fire: 5 } },
    { k: 'ice', n: 'Руна Льда', i: '❄️', e: { slow: 5 } },
    { k: 'shock', n: 'Руна Молнии', i: '⚡', e: { shock: 5 } },
    { k: 'poison', n: 'Руна Яда', i: '☠️', e: { poison: 5 } },
    { k: 'vamp', n: 'Руна Вампиризма', i: '🩸', e: { vamp: 2 } },
    { k: 'crit', n: 'Руна Крита', i: '🎯', e: { crit: 3 } },
    { k: 'gold', n: 'Руна Жадности', i: '🪙', e: { gold: 5 } },
    { k: 'time', n: 'Руна Времени', i: '⏳', e: { atkSpeed: 5 } },
    { k: 'space', n: 'Руна Пространства', i: '🌀', e: { dodge: 5 } },
    { k: 'chaos', n: 'Руна Хаоса', i: '🌈', e: { dmgPct: 10, randomEffect: 1 } },
    { k: 'death', n: 'Руна Смерти', i: '💀', e: { execute: 5 } },
    { k: 'life', n: 'Руна Жизни', i: '💚', e: { hpPct: 5 } },
    { k: 'luck', n: 'Руна Удачи', i: '🍀', e: { luck: 5 } },
    { k: 'rage', n: 'Руна Ярости', i: '😡', e: { rage: 5 } },
    { k: 'titan', n: 'Руна Титана', i: '🪨', e: { armor: 5 } },
    { k: 'slime', n: 'Руна Слизи', i: '🟢', e: { slow: 5 } },
    { k: 'blood', n: 'Руна Крови', i: '🩹', e: { bleed: 5 } },
    { k: 'bone', n: 'Руна Костей', i: '🦴', e: { dmgPct: 5 } },
    { k: 'shadow', n: 'Руна Тени', i: '🌑', e: { dodge: 5 } },
    { k: 'light', n: 'Руна Света', i: '✨', e: { heal: 5 } }
  ];

  /* ---------- ПИТОМЦЫ ---------- */
  var PETS = [
    { k: 'slime', n: 'Слизень', i: '🟢', e: { gold: 5 } },
    { k: 'goblin', n: 'Гоблин-вор', i: '👺', e: { luck: 5 } },
    { k: 'drake', n: 'Дракончик', i: '🐲', e: { fire: 10 } },
    { k: 'skel', n: 'Скелет-слуга', i: '💀', e: { dmgPct: 5 } },
    { k: 'fairy', n: 'Фея', i: '🧚', e: { heal: 5 } },
    { k: 'wolf', n: 'Волк', i: '🐺', e: { atkSpeed: 10 } },
    { k: 'shroom', n: 'Гриб', i: '🍄', e: { hpPct: 5 } },
    { k: 'eye', n: 'Глаз', i: '👁️', e: { crit: 5 } },
    { k: 'mimic', n: 'Мимик', i: '📦', e: { gold: 5, chaos: 1 } },
    { k: 'cat', n: 'Кот', i: '🐱', e: { luck: 5 } },
    { k: 'crow', n: 'Ворон', i: '🐦', e: { shards: 15 } },
    { k: 'golem', n: 'Голем', i: '🗿', e: { armor: 10 } },
    { k: 'ghost', n: 'Призрак', i: '👻', e: { dodge: 5 } },
    { k: 'fox', n: 'Лиса', i: '🦊', e: { fire: 5 } },
    { k: 'turtle', n: 'Черепаха', i: '🐢', e: { hpPct: 10 } },
    { k: 'spider', n: 'Паук', i: '🕷️', e: { poison: 5 } },
    { k: 'crab', n: 'Краб', i: '🦀', e: { armor: 5 } },
    { k: 'penguin', n: 'Пингвин', i: '🐧', e: { slow: 5 } },
    { k: 'cactus', n: 'Кактус', i: '🌵', e: { armor: 5, bleed: 3 } },
    { k: 'pumpkin', n: 'Тыква', i: '🎃', e: { gold: 5 } },
    { k: 'santa', n: 'Дед Мороз', i: '🎅', e: { gold: 10 } },
    { k: 'bug', n: 'Баг', i: '🐛', e: { randomEffect: 1 } },
    { k: 'admin', n: 'Администратор', i: '🕴️', e: { allPct: 10 } },
    { k: 'cthulhu', n: 'Ктулху', i: '🦑', e: { fear: 20 } },
    { k: 'devourer', n: 'Пожиратель', i: '👹', e: { dmgPct: 50 } }
  ];

  /* ---------- ГЕРОИ ---------- */
  var HEROES = [
    { k: 'warrior', n: 'Воин', i: '🛡️', c: '#ff8a3d', cost: 0, ult: 'whirl',
      p: 'Щит: −10% входящего урона', e: { armor: 10 } },
    { k: 'barbarian', n: 'Варвар', i: '🪓', c: '#ff4d6d', cost: 500, ult: 'berserk',
      p: '+40% HP, −15% брони', e: { hpPct: 40, armor: -15 } },
    { k: 'paladin', n: 'Паладин', i: '✨', c: '#ffe66d', cost: 900, ult: 'nova',
      p: 'Реген 1% HP/сек', e: { heal: 15 } },
    { k: 'mage', n: 'Маг', i: '🔮', c: '#42e8ff', cost: 1400, ult: 'meteor',
      p: '+25% урона стихиями', e: { fire: 25, slow: 25, shock: 25 } },
    { k: 'necro', n: 'Некромант', i: '💀', c: '#7dff5c', cost: 2000, ult: 'raise',
      p: '+20% вампиризма и яда', e: { vamp: 20, poison: 20 } },
    { k: 'hunter', n: 'Охотник', i: '🏹', c: '#9ede4a', cost: 2800, ult: 'volley',
      p: '+20% крита, питомец сильнее', e: { crit: 20, luck: 10 } },
    { k: 'assassin', n: 'Ассасин', i: '🔪', c: '#b45cff', cost: 3600, ult: 'shadow',
      p: '+35% крит-урона, +10% уклонения', e: { critDmg: 35, dodge: 10 } },
    { k: 'engineer', n: 'Инженер', i: '🔧', c: '#8fa3b8', cost: 4600, ult: 'turret',
      p: 'Турель: автоурон каждые 2 сек', e: { atkSpeed: 15, dmgPct: 10 } },
    { k: 'druid', n: 'Друид', i: '🌿', c: '#5dff8f', cost: 5800, ult: 'roots',
      p: '+20% лечения, +15% замедления', e: { heal: 20, slow: 15 } },
    { k: 'demonologist', n: 'Демонолог', i: '😈', c: '#ff2d6f', cost: 7200, ult: 'sacrifice',
      p: '+50% урона, −1% HP/сек', e: { dmgPct: 50, hpDrain: 1 } },
    { k: 'chaosmith', n: 'Кузнец Хаоса', i: '🔨', c: '#ff37f3', cost: 9999, ult: 'chaosstorm',
      p: '+25% ко всему, хаос-эффекты', e: { allPct: 25, randomBuff: 1 } }
  ];
  var ULTS = {
    meteor: { n: 'Метеор', i: '☄️', d: 'Урон по всем врагам ×8' },
    whirl: { n: 'Вихрь клинков', i: '🌀', d: '10 быстрых ударов по врагам' },
    pet: { n: 'Призыв питомца', i: '🐾', d: 'Питомец бьёт ×12 и бафает' },
    nova: { n: 'Ледяная нова', i: '❄️', d: 'Заморозка всех + урон' },
    berserk: { n: 'Берсерк', i: '😡', d: '+100% скорости атаки 8 сек' },
    raise: { n: 'Призыв скелетов', i: '🦴', d: 'Скелеты бьют врагов' },
    volley: { n: 'Град стрел', i: '🏹', d: '20 стрел по случайным целям' },
    shadow: { n: 'Теневой удар', i: '🌑', d: 'Крит ×15 по боссу' },
    turret: { n: 'Турель', i: '🔧', d: 'Турель стреляет 10 сек' },
    roots: { n: 'Корни', i: '🌿', d: 'Обездвижить всех + яд' },
    sacrifice: { n: 'Жертва', i: '🩸', d: '−20% HP, огромный урон' },
    chaosstorm: { n: 'Шторм Хаоса', i: '🌈', d: 'Случайные эффекты + урон ×10' }
  };

  /* ---------- УЛУЧШЕНИЯ (лавка прогресса) ---------- */
  var UPGRADES = [
    { k: 'dmg', n: 'Заточка клинка', i: '⚔️', base: 25, mul: 1.155, eff: 'dmg', val: 4, unit: 'ур.' },
    { k: 'hp', n: 'Ковка брони', i: '🦺', base: 20, mul: 1.155, eff: 'hp', val: 16, unit: 'HP' },
    { k: 'spd', n: 'Масло для колёс', i: '⏩', base: 40, mul: 1.19, eff: 'atkSpeed', val: 2, unit: '%' },
    { k: 'crit', n: 'Точный глаз', i: '🎯', base: 60, mul: 1.2, eff: 'crit', val: 6, unit: 'крит' },
    { k: 'gold', n: 'Мешок жадности', i: '🪙', base: 30, mul: 1.17, eff: 'gold', val: 4, unit: '%' },
    { k: 'luck', n: 'Магнит удачи', i: '🍀', base: 80, mul: 1.22, eff: 'luck', val: 5, unit: '% лута' },
    { k: 'tap', n: 'Сила тапа', i: '👆', base: 35, mul: 1.18, eff: 'tap', val: 8, unit: '% тапа' },
    { k: 'off', n: 'Оффлайн-сундук', i: '📦', base: 500, mul: 2.2, eff: 'offH', val: 1, unit: 'час' }
  ];

  /* ---------- ТАЛАНТЫ ---------- */
  var TALENTS = {
    war: { n: 'Война', i: '⚔️', c: '#ff5252', nodes: [
      { k: 'w1', n: 'Острый клинок', i: '🗡️', e: { dmgPct: 10 }, max: 10 },
      { k: 'w2', n: 'Ярость битвы', i: '😡', e: { rage: 15 }, max: 5 },
      { k: 'w3', n: 'Пробивание', i: '💥', e: { armor: -0, execute: 10 }, max: 8 },
      { k: 'w4', n: 'Тяжёлые удары', i: '🔨', e: { stun: 6 }, max: 6 },
      { k: 'w5', n: 'Крит-машина', i: '🎯', e: { crit: 15 }, max: 8 },
      { k: 'w6', n: 'Кровопускание', i: '🩸', e: { bleed: 20 }, max: 6 },
      { k: 'w7', n: 'Берсерк', i: '🪓', e: { dmgPct: 25, hpPct: -5 }, max: 5 },
      { k: 'w8', n: 'Мастер ульты', i: '⚡', e: { ultDmg: 30 }, max: 5 }
    ] },
    greed: { n: 'Жадность', i: '🪙', c: '#ffcc3d', nodes: [
      { k: 'g1', n: 'Золотые руки', i: '🪙', e: { gold: 15 }, max: 10 },
      { k: 'g2', n: 'Охотник за лутом', i: '🎁', e: { luck: 15 }, max: 8 },
      { k: 'g3', n: 'Оффлайн-король', i: '📦', e: { off: 20 }, max: 8 },
      { k: 'g4', n: 'Торговец', i: '⚖️', e: { shopDiscount: 10 }, max: 5 },
      { k: 'g5', n: 'Кузнец', i: '🔨', e: { craft: 20 }, max: 6 },
      { k: 'g6', n: 'Коллекционер', i: '📚', e: { collectionBonus: 1 }, max: 5 },
      { k: 'g7', n: 'Разборщик', i: '♻️', e: { shards: 25 }, max: 6 },
      { k: 'g8', n: 'Процент с босса', i: '👑', e: { bossGold: 40 }, max: 6 }
    ] },
    chaos: { n: 'Хаос', i: '🌈', c: '#ff37f3', nodes: [
      { k: 'c1', n: 'Искра хаоса', i: '✨', e: { dmgPct: 20, randomEffect: 1 }, max: 6 },
      { k: 'c2', n: 'Скорость', i: '⏩', e: { atkSpeed: 15 }, max: 8 },
      { k: 'c3', n: 'Вампиризм', i: '🩸', e: { vamp: 12 }, max: 8 },
      { k: 'c4', n: 'Уклонение', i: '💨', e: { dodge: 12 }, max: 6 },
      { k: 'c5', n: 'Стихии', i: '🔥', e: { fire: 20, slow: 20, shock: 20, poison: 20 }, max: 6 },
      { k: 'c6', n: 'Нерф врагов', i: '📉', e: { nerfEnemy: 15 }, max: 5 },
      { k: 'c7', n: 'Проклятый дар', i: '☠️', e: { dmgPct: 40, cursePower: 1 }, max: 5 },
      { k: 'c8', n: 'Слом правил', i: '🎲', e: { chaosRules: 1, allPct: 15 }, max: 4 }
    ] }
  };

  /* ---------- ДЕРЕВЬЯ ПРЕСТИЖА ---------- */
  var PTREES = [
    { k: 'prestige', n: 'Древо Престижа', i: '👻', cur: 'souls', req: 100, nodes: [
      { k: 'p1', n: 'Вечный клинок', i: '🗡️', e: { dmgPct: 50 }, cost: 5, max: 20 },
      { k: 'p2', n: 'Вечный мешок', i: '🪙', e: { gold: 50 }, cost: 5, max: 20 },
      { k: 'p3', n: 'Вечная удача', i: '🍀', e: { luck: 50 }, cost: 8, max: 15 },
      { k: 'p4', n: 'Вечная скорость', i: '⏩', e: { atkSpeed: 40 }, cost: 8, max: 15 },
      { k: 'p5', n: 'Вечный крит', i: '🎯', e: { crit: 40 }, cost: 10, max: 12 },
      { k: 'p6', n: 'Души в карман', i: '👻', e: { soulGain: 50 }, cost: 15, max: 10 }
    ] },
    { k: 'ascension', n: 'Древо Ассеншена', i: '🌀', cur: 'cores', req: 500, nodes: [
      { k: 'a1', n: 'Ядро урона', i: '💥', e: { dmgPct: 150 }, cost: 3, max: 25 },
      { k: 'a2', n: 'Ядро золота', i: '🪙', e: { gold: 150 }, cost: 3, max: 25 },
      { k: 'a3', n: 'Ядро лута', i: '🎁', e: { luck: 120 }, cost: 4, max: 20 },
      { k: 'a4', n: 'Ядро ярости', i: '⚡', e: { rage: 100, ultDmg: 100 }, cost: 5, max: 15 },
      { k: 'a5', n: 'Ядро времени', i: '⏳', e: { off: 150 }, cost: 5, max: 15 }
    ] },
    { k: 'transcend', n: 'Древо Трансценденции', i: '🔯', cur: 'seals', req: 2000, nodes: [
      { k: 't1', n: 'Печать Хаоса', i: '🌈', e: { dmgPct: 400, randomEffect: 1 }, cost: 2, max: 30 },
      { k: 't2', n: 'Печать Богов', i: '👑', e: { luck: 300, divineChance: 3 }, cost: 2, max: 25 },
      { k: 't3', n: 'Печать Бездны', i: '🕳️', e: { allPct: 150 }, cost: 3, max: 20 },
      { k: 't4', n: 'Печать Вечности', i: '♾️', e: { atkSpeed: 200, off: 300 }, cost: 3, max: 20 }
    ] },
    { k: 'awaken', n: 'Древо Пробуждения', i: '🌟', cur: 'sparks', req: 10000, nodes: [
      { k: 'k1', n: 'Пробуждённый клинок', i: '⚔️', e: { dmgPct: 1500 }, cost: 1, max: 50 },
      { k: 'k2', n: 'Пробуждённый кошель', i: '💰', e: { gold: 1500 }, cost: 1, max: 50 },
      { k: 'k3', n: 'Пробуждённый хаос', i: '🎲', e: { allPct: 500 }, cost: 2, max: 30 },
      { k: 'k4', n: 'Тайные биомы', i: '🗺️', e: { secretBiomes: 1 }, cost: 3, max: 5 },
      { k: 'k5', n: 'Секретные боссы', i: '👹', e: { secretBosses: 1 }, cost: 3, max: 5 }
    ] }
  ];

  /* ---------- МОНСТРЫ ---------- */
  var MONSTERS = [
    { k: 'slime', n: 'Слизь', sh: 'blob', c1: '#8dff6a', c2: '#31a04a', sz: 34 },
    { k: 'goblin', n: 'Гоблин', sh: 'quad', c1: '#9ede4a', c2: '#4f8b23', sz: 30, ears: 1 },
    { k: 'rat', n: 'Крыса', sh: 'quad', c1: '#b3a18c', c2: '#6b5b4b', sz: 25, legs: 4, tail: 1 },
    { k: 'skeleton', n: 'Скелет', sh: 'bone', c1: '#f0ece0', c2: '#a9a294', sz: 32 },
    { k: 'zombie', n: 'Зомби', sh: 'quad', c1: '#87b56f', c2: '#46683c', sz: 35 },
    { k: 'spider', n: 'Паук', sh: 'spider', c1: '#5c4780', c2: '#281c3c', sz: 30, legs: 8 },
    { k: 'ogre', n: 'Огр', sh: 'quad', c1: '#d19a68', c2: '#7d4c2b', sz: 46 },
    { k: 'witch', n: 'Ведьма', sh: 'witch', c1: '#c06cff', c2: '#5b1f9e', sz: 33, hat: 1 },
    { k: 'knight', n: 'Рыцарь', sh: 'quad', c1: '#c6cfda', c2: '#6b7683', sz: 36, armor: 1 },
    { k: 'dragon', n: 'Дракон', sh: 'dragon', c1: '#ff8a3d', c2: '#c02b1e', sz: 42, wings: 1 },
    { k: 'demon', n: 'Демон', sh: 'demon', c1: '#ff5b7a', c2: '#8b0f2a', sz: 38, horns: 2 },
    { k: 'mech', n: 'Механизм', sh: 'mech', c1: '#a3b6c9', c2: '#3c4a5a', sz: 38 },
    { k: 'cthul', n: 'Ктулхиец', sh: 'cthul', c1: '#63e0d1', c2: '#1d6b70', sz: 40 },
    { k: 'bug', n: 'Баг', sh: 'bug', c1: '#ff5bf3', c2: '#6b1fa8', sz: 28, glitch: 1 },
    { k: 'platskel', n: 'Платиновый скелет', sh: 'bone', c1: '#e6f0fb', c2: '#8fa6c4', sz: 34, shiny: 1 }
  ];

  /* ---------- БОССЫ ---------- */
  var BOSSES = [
    { k: 'goblinking', n: 'Гоблин-король', sh: 'quad', c1: '#a8e05a', c2: '#3f7a1c', sz: 60, ab: 'stealGold', ad: 'Крадёт золото' },
    { k: 'ratbaron', n: 'Крысиный барон', sh: 'quad', c1: '#c4b29c', c2: '#6b5b4b', sz: 55, ab: 'summon', ad: 'Призывает крыс' },
    { k: 'slimelord', n: 'Слизнелорд', sh: 'blob', c1: '#9dff7a', c2: '#2a8c42', sz: 66, ab: 'split', ad: 'Делится при смерти' },
    { k: 'skelgen', n: 'Скелет-генерал', sh: 'bone', c1: '#f5f2e8', c2: '#8f8878', sz: 58, ab: 'raise', ad: 'Поднимает скелетов' },
    { k: 'ogrebutcher', n: 'Огр-мясник', sh: 'quad', c1: '#e0a373', c2: '#7d4c2b', sz: 70, ab: 'stun', ad: 'Оглушает ударом' },
    { k: 'witchmist', n: 'Ведьма Тумана', sh: 'witch', c1: '#cf7cff', c2: '#4a1585', sz: 56, ab: 'curse', ad: 'Накладывает проклятие' },
    { k: 'rustrust', n: 'Рыцарь Ржавчины', sh: 'quad', c1: '#c08a4a', c2: '#5c3c1e', sz: 62, ab: 'breakWeapon', ad: 'Ломает оружие (−урон)' },
    { k: 'ashdragon', n: 'Дракон Пепла', sh: 'dragon', c1: '#ffa04d', c2: '#8f1f12', sz: 72, ab: 'fireBreath', ad: 'Огненное дыхание' },
    { k: 'spiderqueen', n: 'Королева Пауков', sh: 'spider', c1: '#7a5ca8', c2: '#2c1c46', sz: 64, ab: 'web', ad: 'Опутывает сетями' },
    { k: 'greeddemon', n: 'Демон Жадности', sh: 'demon', c1: '#ff6b8a', c2: '#7a0a22', sz: 64, ab: 'takeGold', ad: 'Забирает золото' },
    { k: 'titanmech', n: 'Механический Титан', sh: 'mech', c1: '#b8cade', c2: '#2f3c4a', sz: 74, ab: 'shield', ad: 'Ставит щиты' },
    { k: 'cthulhujr', n: 'Ктулху-младший', sh: 'cthul', c1: '#7af0e0', c2: '#12555c', sz: 68, ab: 'fear', ad: 'Вселяет страх' },
    { k: 'buglord', n: 'Баг-Лорд', sh: 'bug', c1: '#ff6bf3', c2: '#54138a', sz: 58, ab: 'teleport', ad: 'Телепорт и глюки' },
    { k: 'platskelboss', n: 'Платиновый Скелет', sh: 'bone', c1: '#f0f7ff', c2: '#7f96b4', sz: 66, ab: 'reflect', ad: 'Отражает урон', shiny: 1 },
    { k: 'chaosemperor', n: 'Император Хаоса', sh: 'demon', c1: '#ff37f3', c2: '#5b0f8a', sz: 78, ab: 'chaosRules', ad: 'Меняет правила боя' },
    { k: 'admin', n: 'Администратор', sh: 'mech', c1: '#ffffff', c2: '#3a2352', sz: 80, ab: 'ban', ad: 'Банит (мгновенный удар)' },
    { k: 'dev', n: 'Разработчик', sh: 'human', c1: '#7ad6ff', c2: '#123a55', sz: 70, ab: 'debuff', ad: 'Нерфит твои статы' },
    { k: 'santachaos', n: 'Дед Мороз Хаоса', sh: 'human', c1: '#ff5b5b', c2: '#ffffff', sz: 72, ab: 'snowstorm', ad: 'Метель и подарки' },
    { k: 'worldeater', n: 'Пожиратель Миров', sh: 'cthul', c1: '#ff3d6f', c2: '#2a0a1a', sz: 96, ab: 'devour', ad: 'Мировой босс', world: 1 },
    { k: 'chaosmith', n: 'Кузнец Хаоса', sh: 'human', c1: '#ffb02e', c2: '#5b1f9e', sz: 82, ab: 'mirror', ad: 'Твой злой двойник' }
  ];

  /* ---------- БИОМЫ ---------- */
  var BIOMES = [
    { k: 'fields', n: 'Зелёные поля', bg: 'bg_fields', tint: 'rgba(120,220,110,.10)', hue: 0, mod: { gold: 10 }, i: '🌿' },
    { k: 'forest', n: 'Тёмный лес', bg: 'bg_forest', tint: 'rgba(70,40,160,.16)', hue: 0, mod: { poison: 10 }, i: '🌲' },
    { k: 'caves', n: 'Пещеры', bg: 'bg_caves', tint: 'rgba(40,120,220,.14)', hue: 0, mod: { armor: 10 }, i: '🪨' },
    { k: 'graveyard', n: 'Кладбище', bg: 'bg_graveyard', tint: 'rgba(20,80,60,.16)', hue: 0, mod: { vamp: 10 }, i: '🪦' },
    { k: 'volcano', n: 'Вулкан', bg: 'bg_volcano', tint: 'rgba(255,90,20,.16)', hue: 0, mod: { fire: 10 }, i: '🌋' },
    { k: 'ice', n: 'Ледяные пики', bg: 'bg_caves', tint: 'rgba(120,200,255,.24)', hue: 170, mod: { slow: 10 }, i: '❄️' },
    { k: 'desert', n: 'Пустыня', bg: 'bg_volcano', tint: 'rgba(255,200,90,.22)', hue: -40, mod: { atkSpeed: 10 }, i: '🏜️' },
    { k: 'swamp', n: 'Болото', bg: 'bg_forest', tint: 'rgba(90,150,50,.24)', hue: 65, mod: { poison: 10 }, i: '🐸' },
    { k: 'sky', n: 'Небесные острова', bg: 'bg_fields', tint: 'rgba(120,220,255,.26)', hue: 200, mod: { crit: 10 }, i: '☁️' },
    { k: 'abyss', n: 'Бездна', bg: 'bg_void', tint: 'rgba(120,40,220,.20)', hue: 0, mod: { fear: 10 }, i: '🕳️' },
    { k: 'chaos', n: 'Хаос', bg: 'bg_void', tint: 'rgba(255,60,220,.24)', hue: 285, mod: { randomEffect: 1 }, i: '🌈' }
  ];

  /* ---------- ПОГОДА ---------- */
  var WEATHER = [
    { k: 'clear', n: 'Ясно', i: '☀️', e: { gold: 5 } },
    { k: 'rain', n: 'Дождь', i: '🌧️', e: { dmgPct: -10, luck: 10 } },
    { k: 'snow', n: 'Снег', i: '🌨️', e: { slow: 15 } },
    { k: 'fog', n: 'Туман', i: '🌫️', e: { crit: -10, dodge: 10 } },
    { k: 'blizzard', n: 'Метель', i: '❄️', e: { dmgPct: -15, gold: 20 } },
    { k: 'night', n: 'Ночь', i: '🌙', e: { vamp: 15, luck: 15 } }
  ];

  /* ---------- МУТАЦИИ ---------- */
  var MUTATIONS = [
    { k: 'armor', n: 'Броня', i: '🛡️', d: '−30% урона', reduc: 0.3 },
    { k: 'shield', n: 'Щит', i: '🔷', d: 'Щит 40% HP', shield: 0.4 },
    { k: 'poison', n: 'Яд', i: '☠️', d: 'Отравляет героя', poison: 1 },
    { k: 'heal', n: 'Лечение', i: '💚', d: 'Реген 3%/сек', regen: 0.03 },
    { k: 'explode', n: 'Взрыв', i: '💥', d: 'Взрывается при смерти', explode: 1 },
    { k: 'split', n: 'Деление', i: '🫧', d: 'Делится при смерти', split: 1 },
    { k: 'fast', n: 'Скорость', i: '💨', d: '+60% скорости', speed: 1.6 },
    { k: 'vampiric', n: 'Вампиризм', i: '🩸', d: 'Ворует HP', vamp: 0.2 },
    { k: 'thorns', n: 'Шипы', i: '🌵', d: 'Возвращает 20% урона', thorns: 0.2 },
    { k: 'fearaura', n: 'Аура страха', i: '😱', d: '−15% скорости атаки героя', fear: 1 }
  ];

  /* ---------- ВРАТА (баффы после босса) ---------- */
  var GATES = [
    { k: 'dmg2', n: '×2 УРОН', i: '⚔️', d: 'Урон ×2 до конца забега', e: { dmgMult: 2 } },
    { k: 'gold2', n: '×2 ЗОЛОТО', i: '🪙', d: 'Золото ×2', e: { goldMult: 2 } },
    { k: 'luck', n: '+50% К ЛУТУ', i: '🍀', d: 'Шанс редкого лута +50%', e: { luck: 50 } },
    { k: 'glass', n: 'СТЕКЛЯННАЯ ПУШКА', i: '🥃', d: '+100% урона, −50% HP', e: { dmgMult: 2, hpMult: 0.5 } },
    { k: 'haste', n: 'БЕРСЕРК', i: '⏩', d: '+60% скорости атаки', e: { atkSpeed: 60 } },
    { k: 'critup', n: 'КРИТ-ШТОРМ', i: '🎯', d: '+40 к криту, +50 к крит-урону', e: { crit: 40, critDmg: 50 } },
    { k: 'vampg', n: 'КРОВАВЫЙ ПИР', i: '🩸', d: '+25% вампиризма', e: { vamp: 25 } },
    { k: 'rageg', n: 'ЯРОСТЬ', i: '⚡', d: 'Ульта заряжается ×2 быстрее', e: { rage: 100 } },
    { k: 'shield', n: 'КАМЕННАЯ КОЖА', i: '🛡️', d: '+40% HP, +20% брони', e: { hpMult: 1.4, armor: 20 } },
    { k: 'chaosg', n: 'ХАОС', i: '🌈', d: 'Случайный мощный бафф', e: { randomBuff: 1, dmgMult: 1.5 } },
    { k: 'loot', n: 'ДОЖДЬ ИЗ ЛУТА', i: '🎁', d: 'Удвоенный шанс дропа', e: { dropChance: 2 } },
    { k: 'skull', n: 'ЧЕРЕП', i: '💀', d: '+200% урона, −1% HP/сек', e: { dmgMult: 3, hpDrain: 1 } }
  ];

  /* ---------- ТИТУЛЫ ---------- */
  var TITLES = [
    { k: 'newbie', n: 'Новичок', d: 'Так всё начиналось', e: {} },
    { k: 'slayer', n: 'Убийца слизи', d: '1000 убитых монстров', e: { dmgPct: 5 }, c: 'kills>=1000' },
    { k: 'rich', n: 'Толстосум', d: '1M золота за раз', e: { gold: 10 }, c: 'maxGold>=1e6' },
    { k: 'wave100', n: 'Покоритель сотни', d: 'Дойти до 100 этапа', e: { dmgPct: 10 }, c: 'maxWave>=100' },
    { k: 'prestiger', n: 'Перерождённый', d: 'Сделать престиж', e: { allPct: 5 }, c: 'prestige>=1' },
    { k: 'collector', n: 'Коллекционер', d: '50 предметов в коллекции', e: { luck: 10 }, c: 'collection>=50' },
    { k: 'smith', n: 'Кузнец', d: '100 улучшений в кузнице', e: { craft: 15 }, c: 'forgeUpg>=100' },
    { k: 'bosskiller', n: 'Охотник на боссов', d: '50 боссов', e: { bossGold: 25 }, c: 'bossKills>=50' },
    { k: 'chaotic', n: 'Агент Хаоса', d: '10 хаоситных предметов', e: { randomBuff: 1 }, c: 'chaosItems>=10' },
    { k: 'tapper', n: 'Тап-машина', d: '10000 тапов', e: { tap: 25 }, c: 'taps>=10000' },
    { k: 'idleking', n: 'Король Idle', d: '8 часов оффлайн-дохода', e: { off: 50 }, c: 'offHours>=8' },
    { k: 'immortal', n: 'Бессмертный', d: '1000 этап', e: { allPct: 10 }, c: 'maxWave>=1000' },
    { k: 'devslayer', n: 'Убийца разработчика', d: 'Победить Разработчика', e: { allPct: 15 }, c: 'killedDev>=1' },
    { k: 'admin', n: 'Администратор', d: 'Победить Администратора', e: { allPct: 20 }, c: 'killedAdmin>=1' },
    { k: 'chaoslord', n: 'Повелитель Хаоса', d: 'Победить Кузнеца Хаоса', e: { allPct: 30 }, c: 'killedChaos>=1' }
  ];

  /* ---------- ДОСТИЖЕНИЯ ---------- */
  var ACHIEVEMENTS = [
    { k: 'first_blood', n: 'Первая кровь', i: '🩸', d: 'Убей первого монстра', r: { gold: 100 } },
    { k: 'wave10', n: 'Десятка', i: '🌊', d: 'Дойди до 10 этапа', r: { crystals: 10 } },
    { k: 'wave25', n: 'Четвертак', i: '🌊', d: 'Дойди до 25 этапа', r: { crystals: 20 } },
    { k: 'wave50', n: 'Полтинник', i: '🌊', d: 'Дойди до 50 этапа', r: { crystals: 40 } },
    { k: 'wave100', n: 'Сотня', i: '🌊', d: 'Дойди до 100 этапа', r: { crystals: 100 } },
    { k: 'boss1', n: 'Первый босс', i: '👑', d: 'Победи босса', r: { gold: 5000 } },
    { k: 'boss10', n: 'Десять корон', i: '👑', d: 'Победи 10 боссов', r: { crystals: 50 } },
    { k: 'boss50', n: 'Корономан', i: '👑', d: 'Победи 50 боссов', r: { crystals: 200 } },
    { k: 'epic_loot', n: 'Эпик дроп', i: '🟣', d: 'Выбей эпический предмет', r: { gold: 10000 } },
    { k: 'legend_loot', n: 'Легендарка!', i: '🟠', d: 'Выбей легендарный предмет', r: { crystals: 50 } },
    { k: 'mythic_loot', n: 'Мифический восторг', i: '🔴', d: 'Выбей мифический предмет', r: { crystals: 150 } },
    { k: 'divine_loot', n: 'Дар богов', i: '🟡', d: 'Выбей божественный предмет', r: { crystals: 400 } },
    { k: 'chaos_loot', n: 'Хаос во плоти', i: '🌈', d: 'Выбей хаоситный предмет', r: { crystals: 1000 } },
    { k: 'prestige1', n: 'Перерождение', i: '👻', d: 'Сделай первый престиж', r: { crystals: 200 } },
    { k: 'prestige10', n: 'Мастер престижа', i: '👻', d: '10 престижей', r: { crystals: 500 } },
    { k: 'merge1', n: 'Слияние', i: '🔀', d: 'Слей 3 предмета', r: { gold: 50000 } },
    { k: 'merge50', n: 'Алхимик', i: '🔀', d: '50 слияний', r: { crystals: 100 } },
    { k: 'forge10', n: 'Кузнец-любитель', i: '🔨', d: '10 улучшений предметов', r: { gold: 20000 } },
    { k: 'forge100', n: 'Кузнец-мастер', i: '🔨', d: '100 улучшений предметов', r: { crystals: 100 } },
    { k: 'pet1', n: 'Друг человека', i: '🐾', d: 'Получи питомца', r: { gold: 10000 } },
    { k: 'pet5', n: 'Зоопарк', i: '🐾', d: '5 питомцев', r: { crystals: 80 } },
    { k: 'rune10', n: 'Рунный мастер', i: '🔯', d: 'Вставь 10 рун', r: { crystals: 60 } },
    { k: 'tap1000', n: 'Тапаем', i: '👆', d: '1000 тапов', r: { gold: 25000 } },
    { k: 'ult50', n: 'Ультра', i: '⚡', d: '50 ульт', r: { crystals: 120 } },
    { k: 'million', n: 'Миллионер', i: '💰', d: '1M золота', r: { crystals: 80 } },
    { k: 'billion', n: 'Миллиардер', i: '💰', d: '1B золота', r: { crystals: 200 } },
    { k: 'ad1', n: 'Любитель рекламы', i: '🎬', d: 'Посмотри «рекламу»', r: { crystals: 20 } },
    { k: 'minigame1', n: 'Как в рекламе', i: '🎮', d: 'Сыграй в мини-игру', r: { crystals: 30 } },
    { k: 'code1', n: 'Промокодчик', i: '🎟️', d: 'Введи промокод', r: { crystals: 50 } },
    { k: 'daily5', n: 'Исполнительный', i: '✅', d: '5 ежедневных заданий', r: { crystals: 60 } },
    { k: 'arena1', n: 'Арена зовёт', i: '🏟️', d: 'Первый бой на арене', r: { crystals: 40 } },
    { k: 'gacha10', n: 'Крутильщик', i: '🎰', d: '10 открытий портала', r: { crystals: 100 } }
  ];

  /* ---------- ШАБЛОНЫ ЗАДАНИЙ ---------- */
  var QUEST_POOL = {
    daily: [
      { k: 'kill', n: 'Убей {n} монстров', t: 'kill', v: [80, 250], r: { medals: 20, bp: 100 } },
      { k: 'wave', n: 'Пройди {n} волн', t: 'wave', v: [8, 25], r: { medals: 20, bp: 100 } },
      { k: 'boss', n: 'Победи {n} боссов', t: 'boss', v: [1, 4], r: { medals: 25, bp: 120 } },
      { k: 'forge', n: 'Улучши предмет {n} раз', t: 'forge', v: [2, 6], r: { medals: 20, bp: 100 } },
      { k: 'tap', n: 'Сделай {n} тапов', t: 'tap', v: [150, 500], r: { medals: 15, bp: 80 } },
      { k: 'gold', n: 'Заработай {n} золота', t: 'gold', v: [50000, 500000], r: { medals: 25, bp: 120 } },
      { k: 'ult', n: 'Используй ульту {n} раз', t: 'ult', v: [3, 10], r: { medals: 20, bp: 100 } }
    ],
    weekly: [
      { k: 'kill', n: 'Убей {n} монстров', t: 'kill', v: [1000, 3000], r: { medals: 80, bp: 500 } },
      { k: 'wave', n: 'Пройди {n} волн', t: 'wave', v: [50, 150], r: { medals: 80, bp: 500 } },
      { k: 'boss', n: 'Победи {n} боссов', t: 'boss', v: [5, 15], r: { medals: 90, bp: 550 } },
      { k: 'prestige', n: 'Сделай {n} престижей', t: 'prestige', v: [1, 3], r: { medals: 120, bp: 700 } },
      { k: 'merge', n: 'Слияний: {n}', t: 'merge', v: [5, 20], r: { medals: 80, bp: 500 } }
    ],
    season: [
      { k: 'wave', n: 'Пройди {n} волн за сезон', t: 'wave', v: [500, 2000], r: { medals: 300, bp: 2000 } },
      { k: 'prestige', n: 'Сделай {n} престижей', t: 'prestige', v: [10, 30], r: { medals: 300, bp: 2000 } },
      { k: 'gold', n: 'Потрать {n} золота', t: 'spend', v: [100000, 10000000], r: { medals: 250, bp: 1800 } },
      { k: 'loot', n: 'Выбей {n} предметов', t: 'loot', v: [200, 1000], r: { medals: 250, bp: 1800 } }
    ]
  };

  /* ---------- БАТТЛ-ПАСС (Сезон 1) ---------- */
  var BP = {
    name: 'Пробуждение Кузницы',
    levels: 150,
    xpPerLevel: 1000,
    price: { premium: 499, premiumPlus: 999 },
    free: { 1: { gold: 1000 }, 5: { chest: 1 }, 10: { rune: 1 }, 20: { pet: 'slime' }, 30: { skin: 1 }, 40: { crystals: 50 }, 50: { chestL: 1 } },
    premium: {
      1: { skin: 1 }, 5: { crystals: 100 }, 10: { rune: 1 }, 15: { pet: 'goblin' }, 20: { weapon: 'legend' },
      25: { frame: 1 }, 30: { skin: 1 }, 35: { chest: 3 }, 40: { crystals: 150 }, 45: { title: 'Перерождённый' },
      50: { pet: 'drake', petL: 1 }, 60: { chestM: 1 }, 70: { skin: 1 }, 80: { frame: 1 }, 90: { crystals: 300 },
      100: { skinEx: 'Кузнец Хаоса' }
    },
    premiumPlus: { 110: { avatar: 1 }, 120: { emote: 1 }, 130: { gold: 5000000 }, 140: { chestL: 2 }, 150: { skinChaos: 1 } }
  };

  /* ---------- МАГАЗИН ---------- */
  var SHOP = [
    { k: 'crystals_s', n: 'Горсть кристаллов', i: '💎', crystals: 100, price: '—', demo: 1 },
    { k: 'crystals_m', n: 'Мешок кристаллов', i: '💎', crystals: 600, price: '—', demo: 1 },
    { k: 'crystals_l', n: 'Сундук кристаллов', i: '💎', crystals: 3500, price: '—', demo: 1 },
    { k: 'noads', n: 'Убрать рекламу', i: '🚫', price: '299 ₽', eff: 'noAds' },
    { k: 'monthly', n: 'Месячная карта', i: '📅', price: '299 ₽', eff: 'monthly' },
    { k: 'starter', n: 'Стартовый набор', i: '🎁', price: '149 ₽', eff: 'starter' },
    { k: 'vip', n: 'VIP-статус', i: '👑', price: '999 ₽', eff: 'vip' }
  ];

  /* ---------- ПРОМОКОДЫ ---------- */
  var CODES = {
    'CHAOS': { crystals: 200, gold: 100000, tip: 'Хаос принят!' },
    'BLADE': { crystals: 100, chest: 1, tip: 'Клинок заточён!' },
    'FORGE': { dust: 500, shards: 500, tip: 'Кузница разогрета!' },
    '404': { crystals: 404, tip: 'Ошибка 404: кристаллы найдены!' },
    'DONATE': { gold: 1000000, tip: 'Донат... бесплатно. Баг или фича?' },
    'NERF': { crystals: 50, tip: 'Тебя нерфили, но держи подарок.' },
    'PING': { crystals: 30, tip: 'Пинг 0 мс. Приятной игры!' },
    'PATCH': { crystals: 77, tip: 'Патч 1.0.77 установлен.' },
    'ARENA': { tokens: 500, tip: 'Токены арены начислены!' },
    'PETS': { pet: 'cat', tip: 'Мяу. Кот теперь с тобой.' }
  };

  /* ---------- МИНИ-ИГРЫ («живая реклама») ---------- */
  var MINIGAMES = [
    { k: 'gates', n: 'Проведи героя через врата', i: '🚪', d: 'Выбери правильные врата!' },
    { k: 'princess', n: 'Спаси принцессу', i: '👸', d: 'Убери шипы в верном порядке!' },
    { k: 'slime', n: 'Убей слизь', i: '🟢', d: 'Натапай как можно быстрее!' },
    { k: 'chest', n: 'Выбери сундук', i: '📦', d: 'Интуиция или удача?' }
  ];

  /* ---------- ШУТКИ / СОВЕТЫ ---------- */
  var JOKES = [
    'Баг-Лорд одобряет этот билд.',
    'Мы не нерфили твой класс. Совсем. Честно.',
    'Этот монстр — просто текстура. Не бойся.',
    'Разработчик смотрит на твои статы... и плачет.',
    'Патч выкатится «скоро» (с) Разработчик',
    'Твой урон сейчас проходит валидацию на сервере. Сервер упал.',
    'Гоблин-король требует налог на золото. Он не уполномочен.',
    'Кузнец Хаоса куёт. Кузнец Хаоса устал. Кузнец Хаоса пьёт чай.',
    'Если закрыть игру — монстры заскучают.',
    'Аналитика показывает, что ты читаешь советы. Спасибо.',
    'Пинг 999 мс — это фича, даёт врагам фору.',
    'Проклятие? Это просто «особенность».',
    'Администратор наблюдает. Веди себя хорошо.',
    'Нажми на солнце на фоне. Вдруг повезёт?',
    'Кто-то из монстров — переодетый тестировщик.'
  ];
  var TIPS = [
    'Совет: тапай по экрану — тап-урон растёт от «Силы тапа».',
    'Совет: после босса выбирай врата — они действуют весь забег.',
    'Совет: сливай 3 одинаковых предмета в кузнице — получишь лучше.',
    'Совет: проклятые предметы очень сильные. Попробуй!',
    'Совет: питомцы дают пассивки, даже когда просто лежат в инвентаре.',
    'Совет: руны можно вставлять в экипировку и сливать.',
    'Совет: оффлайн-доход копится до 2 часов (прокачивается до 8).',
    'Совет: ручной режим даёт +10% золота.',
    'Совет: мини-игры «как из рекламы» дают реальные баффы.',
    'Совет: меняй героев в бою — у каждого своя ульта.'
  ];

  /* ---------- ФРАКЦИИ ---------- */
  var FACTIONS = ['smiths', 'goblins', 'skeletons', 'dragons', 'chaos'];
  var FACTION_NAMES = { smiths: 'Кузнецы', goblins: 'Гоблины', skeletons: 'Скелеты', dragons: 'Драконы', chaos: 'Хаос' };

  /* ---------- ПРЕСТИЖ ---------- */
  var PRESTIGE_TIERS = [
    { k: 'prestige', n: 'Престиж', i: '👻', wave: 100, cur: 'souls', curName: 'Души', f: function (w) { return Math.floor(Math.pow(w, 1.5) / 10); } },
    { k: 'ascension', n: 'Ассеншен', i: '🌀', wave: 500, cur: 'cores', curName: 'Ядра', f: function (w) { return Math.floor(Math.pow(w, 2) / 100); } },
    { k: 'transcend', n: 'Трансценденция', i: '🔯', wave: 2000, cur: 'seals', curName: 'Печати', f: function (w) { return Math.floor(Math.pow(w, 2.5) / 1000); } },
    { k: 'awaken', n: 'Пробуждение', i: '🌟', wave: 10000, cur: 'sparks', curName: 'Искры', f: function (w) { return Math.floor(Math.pow(w, 3) / 10000); } }
  ];

  return {
    EF: EF, ALL_PCT_KEYS: ALL_PCT_KEYS, RARITY: RARITY, SLOTS: SLOTS, WEAPONS: WEAPONS, ARMOR: ARMOR,
    ACCESSORIES: ACCESSORIES, SETS: SETS, setOf: setOf, RUNES: RUNES, PETS: PETS, HEROES: HEROES, ULTS: ULTS,
    UPGRADES: UPGRADES, TALENTS: TALENTS, PTREES: PTREES, MONSTERS: MONSTERS, BOSSES: BOSSES, BIOMES: BIOMES,
    WEATHER: WEATHER, MUTATIONS: MUTATIONS, GATES: GATES, TITLES: TITLES, ACHIEVEMENTS: ACHIEVEMENTS,
    QUEST_POOL: QUEST_POOL, BP: BP, SHOP: SHOP, CODES: CODES, MINIGAMES: MINIGAMES, JOKES: JOKES, TIPS: TIPS,
    FACTIONS: FACTIONS, FACTION_NAMES: FACTION_NAMES, PRESTIGE_TIERS: PRESTIGE_TIERS, wicon: wicon
  };
})();
if (typeof window !== 'undefined') window.D = D;
