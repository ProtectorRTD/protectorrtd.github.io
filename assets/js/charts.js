/*!
 * Графики и диаграммы в статьях.
 *
 * В markdown пишется блок ```chart с JSON внутри — здесь он превращается
 * в canvas с Chart.js. Библиотека грузится с CDN только на тех страницах,
 * где такой блок реально есть.
 *
 * Палитра и оформление заданы один раз здесь, чтобы все графики на сайте
 * выглядели одинаково. Порядок цветов менять нельзя: он подобран так, чтобы
 * соседние серии различались в том числе при дальтонизме.
 */
(function () {
  'use strict';

  var CHARTJS_URL  = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
  var MERMAID_URL  = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js';

  // --- палитра -------------------------------------------------------------
  // Порядок фиксированный. Первые три слота безопасны в любом сочетании
  // (точечные диаграммы), дальше цвета рассчитаны на соседние пары.
  var SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100',
                '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

  var INK        = '#0b0b0b';   // основной текст
  var INK_SOFT   = '#52514e';   // вторичный
  var INK_MUTED  = '#898781';   // подписи осей
  var GRID       = '#e1e0d9';   // линии сетки
  var AXIS       = '#c3c2b7';   // ось и базовая линия
  var SURFACE    = '#ffffff';   // фон, на котором рисуем

  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('не загрузился ' + src)); };
      document.head.appendChild(s);
    });
  }

  // Kramdown + Rouge заворачивают блок кода по-разному в зависимости от версии,
  // поэтому ищем оба варианта.
  function findBlocks(name) {
    var out = [];
    document.querySelectorAll('pre > code.language-' + name).forEach(function (c) {
      out.push({ host: c.closest('pre'), text: c.textContent });
    });
    document.querySelectorAll('div.language-' + name + ' pre code').forEach(function (c) {
      var host = c.closest('div.language-' + name);
      if (!out.some(function (b) { return host.contains(b.host); })) {
        out.push({ host: host, text: c.textContent });
      }
    });
    return out;
  }

  function fail(host, message) {
    var el = document.createElement('div');
    el.className = 'chart-error';
    el.textContent = 'График не построен: ' + message;
    host.replaceWith(el);
  }

  // --- построение конфигурации Chart.js ------------------------------------
  function buildConfig(spec) {
    // Полный конфиг Chart.js, если он передан как есть.
    if (spec.data && spec.type) return spec;

    var type = spec.type || 'line';
    var series = spec.series || [];
    if (series.length > SERIES.length) {
      console.warn('[charts] серий больше ' + SERIES.length +
                   ' — лишние стоит свести в «прочее» или разбить на несколько графиков');
      series = series.slice(0, SERIES.length);
    }

    var stacked = !!spec.stacked;

    var datasets = series.map(function (s, i) {
      var color = s.color || SERIES[i % SERIES.length];
      var ds = {
        label: s.name || ('Серия ' + (i + 1)),
        data: s.data,
        backgroundColor: type === 'bar' ? color : hexToRgba(color, 0.10),
        borderColor: color
      };
      if (type === 'line') {
        ds.borderWidth = 2;
        ds.tension = spec.smooth ? 0.35 : 0;
        ds.fill = spec.area !== false && series.length === 1;
        ds.pointRadius = 4;
        ds.pointHoverRadius = 6;
        ds.pointBackgroundColor = color;
        ds.pointBorderColor = SURFACE;
        ds.pointBorderWidth = 2;
      }
      if (type === 'bar') {
        ds.maxBarThickness = 24;
        ds.borderRadius = 4;
        ds.borderSkipped = 'start';
        if (stacked) { ds.borderWidth = 2; ds.borderColor = SURFACE; }
      }
      if (type === 'doughnut' || type === 'pie') {
        ds.backgroundColor = (s.data || []).map(function (_, j) { return SERIES[j % SERIES.length]; });
        ds.borderColor = SURFACE;
        ds.borderWidth = 2;
      }
      return ds;
    });

    var isRound = (type === 'doughnut' || type === 'pie');

    return {
      type: type,
      data: { labels: spec.labels || [], datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 4, right: 8, bottom: 0, left: 0 } },
        plugins: {
          // Заголовок рисуем сами, в <figcaption> — он должен читаться и без JS.
          title: { display: false },
          // Легенда обязательна от двух серий: цвет не должен быть единственным
          // признаком, по которому серии различают.
          legend: {
            display: isRound || datasets.length > 1,
            position: 'bottom',
            align: 'start',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
              color: INK_SOFT,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: SURFACE,
            titleColor: INK,
            bodyColor: INK_SOFT,
            borderColor: 'rgba(11,11,11,0.10)',
            borderWidth: 1,
            cornerRadius: 6,
            padding: 10,
            usePointStyle: true,
            displayColors: true,
            titleFont: { size: 12, weight: '600' },
            bodyFont: { size: 12 },
            callbacks: spec.y ? {
              label: function (ctx) {
                return ' ' + ctx.dataset.label + ': ' + ctx.formattedValue + ' ' + spec.y;
              }
            } : undefined
          }
        },
        scales: isRound ? {} : {
          x: {
            stacked: stacked,
            grid: { display: false, drawBorder: false },
            border: { color: AXIS },
            ticks: { color: INK_MUTED, font: { size: 12 } }
          },
          y: {
            stacked: stacked,
            beginAtZero: type === 'bar',
            grid: { color: GRID, drawTicks: false },
            border: { display: false, dash: undefined },
            ticks: {
              color: INK_MUTED,
              font: { size: 12 },
              padding: 8,
              callback: function (v) {
                var s = (typeof v === 'number') ? v.toLocaleString('ru-RU') : v;
                return spec.y ? s + ' ' + spec.y : s;
              }
            }
          }
        }
      }
    };
  }

  // Таблица с теми же числами. Нужна не для красоты: часть цветов палитры
  // намеренно светлее 3:1 к фону, и таблица — обязательная замена для тех,
  // кто не различает их на глаз.
  function buildTable(spec) {
    if (!spec.series || !spec.labels) return null;
    var wrap = document.createElement('details');
    wrap.className = 'chart-data';
    var sum = document.createElement('summary');
    sum.textContent = 'Данные';
    wrap.appendChild(sum);

    var t = document.createElement('table');
    var head = '<tr><th></th>' + spec.labels.map(function (l) {
      return '<th>' + String(l) + '</th>';
    }).join('') + '</tr>';
    var body = spec.series.map(function (s) {
      return '<tr><th>' + (s.name || '') + '</th>' +
        (s.data || []).map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    }).join('');
    t.innerHTML = '<thead>' + head + '</thead><tbody>' + body + '</tbody>';
    wrap.appendChild(t);
    return wrap;
  }

  function renderChart(block) {
    var spec;
    try {
      spec = JSON.parse(block.text);
    } catch (e) {
      fail(block.host, 'в блоке не JSON (' + e.message + ')');
      return;
    }

    var fig = document.createElement('figure');
    fig.className = 'chart';

    if (spec.title) {
      var cap = document.createElement('figcaption');
      cap.textContent = spec.title;
      fig.appendChild(cap);
    }

    var box = document.createElement('div');
    box.className = 'chart-box';
    box.style.height = (spec.height || 320) + 'px';
    var canvas = document.createElement('canvas');
    box.appendChild(canvas);
    fig.appendChild(box);

    var table = buildTable(spec);
    if (table) fig.appendChild(table);

    block.host.replaceWith(fig);

    try {
      new window.Chart(canvas.getContext('2d'), buildConfig(spec));
    } catch (e) {
      console.error('[charts]', e);
      fail(fig, e.message);
    }
  }

  function initCharts() {
    var blocks = findBlocks('chart');
    if (!blocks.length) return;
    loadScript(CHARTJS_URL).then(function () {
      window.Chart.defaults.font.family =
        "'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif";
      window.Chart.defaults.color = INK_SOFT;
      blocks.forEach(renderChart);
    }).catch(function (e) {
      blocks.forEach(function (b) { fail(b.host, e.message); });
    });
  }

  function initMermaid() {
    var blocks = findBlocks('mermaid');
    if (!blocks.length) return;
    var holders = blocks.map(function (b) {
      var pre = document.createElement('pre');
      pre.className = 'mermaid';
      pre.textContent = b.text;
      b.host.replaceWith(pre);
      return pre;
    });
    loadScript(MERMAID_URL).then(function () {
      window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });
      window.mermaid.run({ nodes: holders });
    }).catch(function (e) { console.error('[mermaid]', e); });
  }

  function init() { initCharts(); initMermaid(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
