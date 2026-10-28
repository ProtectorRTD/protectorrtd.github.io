// Страница /reading/: выбор периода для «Прочитано» и сворачивание пустых тиров.
// Всё на стороне браузера; данные — атрибуты data-date="ГГГГ-ММ" у пейперов и книг.
(function () {
  const MONTHS = {
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };
  const MONTHS_FULL_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const T = {
    ru: {
      presets: { all: 'всё время', m6: '6 мес', m3: '3 мес', m1: 'месяц' },
      allTime: 'за всё время',
      showEmpty: 'показать пустые',
      hideEmpty: 'скрыть пустые',
      emptyAll: 'пусто за этот период · показать тиры',
      emptyEver: 'пока пусто · показать тиры',
      hint: 'клик — месяц, протянуть — диапазон',
      papers: n => n + ' ' + plural(n, 'пейпер', 'пейпера', 'пейперов'),
      books: n => n + ' ' + plural(n, 'книга', 'книги', 'книг'),
    },
    en: {
      presets: { all: 'all time', m6: '6 mo', m3: '3 mo', m1: 'month' },
      allTime: 'all time',
      showEmpty: 'show empty',
      hideEmpty: 'hide empty',
      emptyAll: 'nothing in this period · show tiers',
      emptyEver: 'nothing yet · show tiers',
      hint: 'click a month, drag for a range',
      papers: n => n + (n === 1 ? ' paper' : ' papers'),
      books: n => n + (n === 1 ? ' book' : ' books'),
    },
  };

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  const lang = () => (document.documentElement.getAttribute('data-ui') === 'eng' ? 'en' : 'ru');

  // месяц как одно число: удобно сравнивать и считать диапазоны
  const toYM = s => {
    const m = /^(\d{4})-(\d{1,2})/.exec(s || '');
    return m ? (+m[1]) * 12 + (+m[2] - 1) : null;
  };
  const ymYear = ym => Math.floor(ym / 12);
  const ymMonth = ym => ym % 12;

  // --- элементы ---------------------------------------------------------
  const tf = document.getElementById('timeframe');
  const readItems = [...document.querySelectorAll(
    '.js-read .papers--tier-items > li, .js-read .book')];
  const isBook = el => el.classList.contains('book');
  const itemYM = new Map(readItems.map(el => [el, toYM(el.dataset.date)]));

  const now = new Date();
  const curYM = now.getFullYear() * 12 + now.getMonth();
  const dated = [...itemYM.values()].filter(v => v !== null);
  const sinceYM = toYM(tf && tf.dataset.since) ?? (dated.length ? Math.min(...dated) : curYM);
  const startYM = Math.min(sinceYM, ...dated);
  const endYM = Math.max(curYM, ...dated);
  const months = [];
  for (let ym = startYM; ym <= endYM; ym++) months.push(ym);

  const counts = new Map(months.map(ym => [ym, { papers: 0, books: 0 }]));
  readItems.forEach(el => {
    const ym = itemYM.get(el);
    if (ym === null || !counts.has(ym)) return;
    counts.get(ym)[isBook(el) ? 'books' : 'papers']++;
  });

  // --- состояние ----------------------------------------------------------
  let range = null;            // null = всё время, иначе {from, to}
  const PRESETS = {
    all: () => null,
    m6: () => ({ from: Math.max(startYM, curYM - 5), to: curYM }),
    m3: () => ({ from: Math.max(startYM, curYM - 2), to: curYM }),
    m1: () => ({ from: curYM, to: curYM }),
  };
  const sameRange = (a, b) => (a === null && b === null) ||
    (a !== null && b !== null && a.from === b.from && a.to === b.to);

  // --- фильтр -------------------------------------------------------------
  function applyFilter() {
    readItems.forEach(el => {
      const ym = itemYM.get(el);
      el.hidden = range !== null && (ym === null || ym < range.from || ym > range.to);
    });
    updateTiers();
  }

  // --- пустые тиры --------------------------------------------------------
  const tierLists = [...document.querySelectorAll('.papers--tiers')];
  const toggles = new Map();
  tierLists.forEach(list => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tiers--toggle';
    btn.addEventListener('click', () => {
      list.classList.toggle('show-empty');
      updateTiers();
    });
    list.after(btn);
    toggles.set(list, btn);
  });

  function updateTiers() {
    const t = T[lang()];
    tierLists.forEach(list => {
      const tiers = [...list.querySelectorAll(':scope > .papers--tier')];
      const empty = [];
      tiers.forEach(tier => {
        const items = tier.querySelectorAll('.papers--tier-items > li, .book');
        const has = [...items].some(el => !el.hidden);
        tier.classList.toggle('is-empty', !has);
        if (!has) empty.push(tier);
      });
      const open = list.classList.contains('show-empty');
      const allEmpty = empty.length === tiers.length;
      list.classList.toggle('all-collapsed', allEmpty && !open);

      const btn = toggles.get(list);
      btn.classList.toggle('is-idle', empty.length === 0);
      if (empty.length === 0) { btn.textContent = ''; return; }
      if (open) {
        btn.textContent = '− ' + t.hideEmpty;
      } else if (allEmpty) {
        btn.textContent = '+ ' + (range === null ? t.emptyEver : t.emptyAll);
      } else {
        const names = empty.map(tier => tier.querySelector('.papers--tier-label').innerText.trim());
        btn.textContent = '+ ' + t.showEmpty + ': ' + names.join(', ');
      }
    });
  }

  // --- блок периода -------------------------------------------------------
  function periodLabel() {
    const l = lang();
    if (range === null) return T[l].allTime;
    const full = l === 'en' ? MONTHS_FULL_EN : MONTHS_FULL_RU;
    const name = ym => full[ymMonth(ym)];
    if (range.from === range.to) return name(range.from) + ' ' + ymYear(range.from);
    if (ymYear(range.from) === ymYear(range.to))
      return name(range.from) + ' – ' + name(range.to) + ' ' + ymYear(range.to);
    return name(range.from) + ' ' + ymYear(range.from) + ' – ' + name(range.to) + ' ' + ymYear(range.to);
  }

  function renderTimeframe() {
    if (!tf) return;
    const l = lang(), t = T[l];

    // пресеты
    const presetsEl = tf.querySelector('.tf--presets');
    presetsEl.innerHTML = '';
    Object.keys(PRESETS).forEach(key => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tf--chip' + (sameRange(range, PRESETS[key]()) ? ' active' : '');
      b.textContent = t.presets[key];
      b.addEventListener('click', () => { range = PRESETS[key](); update(); });
      presetsEl.appendChild(b);
    });

    // столбики по месяцам
    const barsEl = tf.querySelector('.tf--bars');
    barsEl.innerHTML = '';
    barsEl.title = t.hint;
    const max = Math.max(1, ...[...counts.values()].map(c => c.papers + c.books));
    months.forEach((ym, i) => {
      const c = counts.get(ym), total = c.papers + c.books;
      const col = document.createElement('div');
      col.className = 'tf--col';
      col.dataset.ym = ym;
      if (range !== null) col.classList.add(ym >= range.from && ym <= range.to ? 'in' : 'out');
      if (ym === curYM) col.classList.add('now');
      const showYear = i === 0 || ymMonth(ym) === 0;
      col.innerHTML =
        '<span class="tf--count">' + (total || '') + '</span>' +
        '<span class="tf--track"><span class="tf--bar" style="height:' +
          (total ? Math.max(8, Math.round(total / max * 100)) : 0) + '%"></span></span>' +
        '<span class="tf--month">' + MONTHS[l][ymMonth(ym)] + '</span>' +
        '<span class="tf--year">' + (showYear ? ymYear(ym) : '') + '</span>';
      barsEl.appendChild(col);
    });

    // итог
    let papers = 0, books = 0;
    readItems.forEach(el => { if (!el.hidden) isBook(el) ? books++ : papers++; });
    tf.querySelector('.tf--summary').innerHTML =
      '<span class="tf--period">' + periodLabel() + '</span>' +
      '<span class="tf--sep">·</span><span>' + t.papers(papers) + '</span>' +
      '<span class="tf--sep">·</span><span>' + t.books(books) + '</span>';
  }

  function update() {
    // С выбранным периодом «сейчас / следующие / потом» не нужны —
    // остаётся только то, что прочитано за этот период.
    document.documentElement.classList.toggle('reading-filtered', range !== null);
    applyFilter();
    renderTimeframe();
  }

  // клик — один месяц, протяжка — диапазон, клик по выбранному месяцу — сброс
  if (tf) {
    const barsEl = tf.querySelector('.tf--bars');
    let drag = null;     // {anchor, moved, wasSingle}
    const colAt = e => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const col = el && el.closest('.tf--col');
      return col && barsEl.contains(col) ? +col.dataset.ym : null;
    };
    barsEl.addEventListener('pointerdown', e => {
      const ym = colAt(e);
      if (ym === null) return;
      drag = { anchor: ym, moved: false,
               wasSingle: range !== null && range.from === ym && range.to === ym };
      range = { from: ym, to: ym };
      update();
      e.preventDefault();
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const ym = colAt(e);
      if (ym === null) return;
      const next = { from: Math.min(drag.anchor, ym), to: Math.max(drag.anchor, ym) };
      if (!sameRange(next, range)) { drag.moved = true; range = next; update(); }
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      if (!drag.moved && drag.wasSingle) { range = null; update(); }
      drag = null;
    });
    tf.hidden = false;
  }

  document.addEventListener('site-lang', () => { renderTimeframe(); updateTiers(); });
  update();
})();
