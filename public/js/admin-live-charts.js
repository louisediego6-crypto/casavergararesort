/* =============================================================================
   Casa Vergara — Live admin & staff charts
   Replaces initDashboardCharts() and initReportsCharts() from admin.js.
   Loaded right AFTER admin.js. Delete this file (and its <script>/<link> tags)
   to go back to the old charts.

   What it does
   - Uses the REAL reservation data only (nothing is faked or randomised).
   - Line segments / bars are green when the value went UP compared with the
     previous period and red when it went DOWN, so high and low periods are
     obvious at a glance.
   - Revenue (line, left axis) and bookings (bars, right axis) now have their own
     scales, so bookings no longer disappear next to the revenue numbers.
   - Charts animate from their old values to the new ones whenever data changes
     (new booking, payment approved, other tab, 15-second server refresh).
   - Range switch: 14 days / 8 weeks / 6 months / 12 months.
   - Works in light & dark mode and on small screens.
   ========================================================================== */
(function () {
  "use strict";

  var RANGES = {
    "14d": { unit: "day", n: 14, label: "14 days", prev: "yesterday" },
    "8w": { unit: "week", n: 8, label: "8 weeks", prev: "last week" },
    "6m": { unit: "month", n: 6, label: "6 months", prev: "last month" },
    "12m": { unit: "month", n: 12, label: "12 months", prev: "last month" },
  };
  var COLORS = { up: "#1f9d6b", down: "#d64550", flat: "#328bc3", navy: "#0c3b5d", gold: "#d9b312" };
  var POLL_MS = 15000;
  var range = "6m";
  try {
    var saved = localStorage.getItem("cvrChartRange");
    if (saved && RANGES[saved]) range = saved;
  } catch (_) {}

  var registry = []; // { render: fn } for every chart on the page

  /* ------------------------------ helpers -------------------------------- */
  function records() {
    return typeof getStoredReservations === "function" ? getStoredReservations() : [];
  }
  function peso(n) {
    return typeof cvrPeso === "function" ? cvrPeso(n) : "\u20b1" + Math.round(Number(n) || 0).toLocaleString();
  }
  var compactFmt;
  try { compactFmt = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }); } catch (_) {}
  function compact(n) { return compactFmt ? compactFmt.format(n) : String(n); }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function theme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      text: dark ? "#9fb2c4" : "#5b6b7b",
      grid: dark ? "rgba(255,255,255,0.08)" : "rgba(12,59,93,0.08)",
      surface: dark ? "#15212c" : "#ffffff",
      line: dark ? "#5aa9dc" : "#328bc3",
      bar: dark ? "#8cc4ec" : "#0c3b5d",
    };
  }

  function bucketStart(d, unit) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    if (unit === "week") x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
    if (unit === "month") x.setDate(1);
    return x;
  }
  function addUnit(d, unit, k) {
    var x = new Date(d);
    if (unit === "day") x.setDate(x.getDate() + k);
    else if (unit === "week") x.setDate(x.getDate() + 7 * k);
    else x.setMonth(x.getMonth() + k);
    return x;
  }
  function labelFor(d, unit, multiYear) {
    if (unit === "month") {
      return d.toLocaleDateString(undefined, multiYear ? { month: "short", year: "2-digit" } : { month: "short" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function buildSeries(rec, key) {
    var cfg = RANGES[key] || RANGES["6m"];
    var last = bucketStart(new Date(), cfg.unit);
    var first = addUnit(last, cfg.unit, -(cfg.n - 1));
    var multiYear = cfg.unit === "month" && first.getFullYear() !== last.getFullYear();
    var buckets = [];
    for (var i = cfg.n - 1; i >= 0; i--) {
      var s = addUnit(last, cfg.unit, -i);
      buckets.push({ start: s, end: addUnit(s, cfg.unit, 1), label: labelFor(s, cfg.unit, multiYear), revenue: 0, bookings: 0 });
    }
    (rec || []).forEach(function (r) {
      var raw = r.checkIn || r.preferredDate || r.createdAt || r.dateCreated;
      var d = raw ? new Date(raw) : null;
      if (!d || isNaN(d.getTime())) return;
      for (var j = 0; j < buckets.length; j++) {
        if (d >= buckets[j].start && d < buckets[j].end) {
          buckets[j].bookings += 1;
          if (typeof isVerifiedReservation === "function" && isVerifiedReservation(r)) {
            buckets[j].revenue += typeof parseReservationAmount === "function" ? parseReservationAmount(r) : 0;
          }
          break;
        }
      }
    });
    return {
      cfg: cfg,
      labels: buckets.map(function (b) { return b.label; }),
      revenue: buckets.map(function (b) { return Math.round(b.revenue); }),
      bookings: buckets.map(function (b) { return b.bookings; }),
    };
  }

  function direction(arr, i) {
    if (i <= 0) return "flat";
    return arr[i] > arr[i - 1] ? "up" : arr[i] < arr[i - 1] ? "down" : "flat";
  }

  /* --------------------------- card decorations --------------------------- */
  function decorate(canvas, opts) {
    var card = canvas.closest(".admin-chart-card");
    if (!card) return null;
    if (card.__cvrHead) return card.__cvrHead;
    var title = card.querySelector("h6");
    var head = document.createElement("div");
    head.className = "cvr-chart-head";
    if (title) {
      title.parentNode.insertBefore(head, title);
      title.classList.add("mb-0");
      var left = document.createElement("div");
      left.className = "cvr-chart-title";
      left.appendChild(title);
      var trend = document.createElement("span");
      trend.className = "cvr-trend is-flat";
      trend.setAttribute("aria-live", "polite");
      left.appendChild(trend);
      head.appendChild(left);
      head.__trend = trend;
    }
    if (opts && opts.controls) {
      var group = document.createElement("div");
      group.className = "cvr-range btn-group btn-group-sm";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Chart range");
      Object.keys(RANGES).forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn cvr-range-btn" + (k === range ? " active" : "");
        b.dataset.range = k;
        b.textContent = RANGES[k].label;
        b.addEventListener("click", function () {
          if (range === k) return;
          range = k;
          try { localStorage.setItem("cvrChartRange", k); } catch (_) {}
          document.querySelectorAll(".cvr-range-btn").forEach(function (x) {
            x.classList.toggle("active", x.dataset.range === k);
          });
          registry.forEach(function (c) { c.render(); });
        });
        group.appendChild(b);
      });
      head.appendChild(group);
    }
    card.__cvrHead = head;
    return head;
  }

  function setTrend(head, values, cfg, unitLabel) {
    if (!head || !head.__trend) return;
    var el = head.__trend;
    var cur = values[values.length - 1] || 0;
    var prev = values[values.length - 2] || 0;
    var cls = "is-flat";
    var txt = "No change";
    if (!cur && !prev) {
      txt = "No activity yet";
    } else if (!prev && cur) {
      cls = "is-up";
      txt = "\u25B2 New activity";
    } else {
      var pct = Math.round(((cur - prev) / prev) * 100);
      if (pct > 0) { cls = "is-up"; txt = "\u25B2 " + pct + "% vs " + cfg.prev; }
      else if (pct < 0) { cls = "is-down"; txt = "\u25BC " + Math.abs(pct) + "% vs " + cfg.prev; }
      else txt = "\u25AC Same as " + cfg.prev;
    }
    el.className = "cvr-trend " + cls;
    el.textContent = txt;
    if (unitLabel) el.title = unitLabel;
  }

  function pulse(canvas) {
    var card = canvas.closest(".admin-chart-card");
    if (!card || reduced()) return;
    card.classList.remove("cvr-pulse");
    void card.offsetWidth;
    card.classList.add("cvr-pulse");
  }

  function stamp() {
    var t = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
    var el = document.getElementById("dashLiveStamp");
    if (el) el.textContent = "Live \u00b7 updated " + t;
    document.querySelectorAll(".cvr-live-badge").forEach(function (b) {
      b.title = "Updated " + t;
    });
  }

  /* ------------------------------ chart bits ------------------------------ */
  function baseOptions(t) {
    var small = function (ctx) { return ctx.chart.width < 420 ? 10 : 12; };
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduced() ? false : { duration: 900, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 6, right: 4 } },
      plugins: {
        legend: { labels: { color: t.text, usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
        tooltip: { padding: 10, cornerRadius: 10, displayColors: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: t.text, autoSkip: true, maxRotation: 0, font: { size: small } },
        },
      },
    };
  }

  function gradient(ctx, hex) {
    var area = ctx.chart.chartArea;
    if (!area) return hex + "33";
    var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, hex + "55");
    g.addColorStop(1, hex + "00");
    return g;
  }

  function revenueDataset(data, t) {
    return {
      type: "line",
      label: "Revenue",
      data: data,
      order: 1,
      yAxisID: "y",
      tension: 0.42,
      cubicInterpolationMode: "monotone", // never overshoots below zero between points
      borderWidth: 3,
      borderColor: COLORS.flat,
      fill: true,
      backgroundColor: function (ctx) { return gradient(ctx, "#328bc3"); },
      segment: {
        borderColor: function (c) {
          return c.p1.parsed.y > c.p0.parsed.y ? COLORS.up : c.p1.parsed.y < c.p0.parsed.y ? COLORS.down : COLORS.flat;
        },
      },
      pointRadius: function (c) { return c.dataIndex === c.dataset.data.length - 1 ? 6 : 4; },
      pointHoverRadius: 7,
      pointBorderWidth: 2,
      pointBorderColor: t.surface,
      pointBackgroundColor: function (c) { return COLORS[direction(c.dataset.data, c.dataIndex)]; },
    };
  }

  function bookingDataset(data, t, onRight) {
    return {
      type: "bar",
      label: "Bookings",
      data: data,
      order: 2,
      yAxisID: onRight ? "y1" : "y",
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 38,
      backgroundColor: function (c) {
        var d = direction(c.dataset.data, c.dataIndex);
        var last = c.dataIndex === c.dataset.data.length - 1;
        var base = d === "up" ? COLORS.up : d === "down" ? COLORS.down : t.bar;
        return last ? base : base + "cc";
      },
    };
  }

  function revenueScale(t) {
    return {
      beginAtZero: true,
      position: "left",
      grid: { color: t.grid },
      border: { display: false },
      ticks: {
        color: t.text,
        maxTicksLimit: 6,
        callback: function (v) { return "\u20b1" + compact(v); },
      },
    };
  }
  function bookingScale(t, withGrid) {
    return {
      beginAtZero: true,
      position: "right",
      grid: { display: !!withGrid, color: t.grid, drawOnChartArea: !!withGrid },
      border: { display: false },
      ticks: { color: t.text, precision: 0, maxTicksLimit: 6 },
      suggestedMax: 4,
    };
  }

  function applyTheme(chart) {
    var t = theme();
    var o = chart.options;
    if (o.plugins && o.plugins.legend && o.plugins.legend.labels) o.plugins.legend.labels.color = t.text;
    Object.keys(o.scales || {}).forEach(function (k) {
      var s = o.scales[k];
      if (s.ticks) s.ticks.color = t.text;
      if (s.grid && k !== "x" && !(k === "y1")) s.grid.color = t.grid;
    });
    chart.data.datasets.forEach(function (ds) {
      if (ds.type === "line") ds.pointBorderColor = t.surface;
    });
    chart.update("none");
  }

  var themeBound = false;
  function bindTheme() {
    if (themeBound) return;
    themeBound = true;
    try {
      new MutationObserver(function () {
        ["__cvrRevenueChart", "__cvrBookingChart", "__cvrTrendChart", "__cvrRoomChart"].forEach(function (k) {
          if (window[k]) applyTheme(window[k]);
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    } catch (_) {}
  }

  function changed(a, b) { return JSON.stringify(a) !== JSON.stringify(b); }

  /* ------------------------------ live refresh ----------------------------- */
  var liveBound = false;
  function bindLive() {
    if (liveBound) return;
    liveBound = true;
    var rerender = function () {
      registry.forEach(function (c) { c.render(true); });
      stamp();
    };
    document.addEventListener("cvr-reservations-synced", rerender);
    window.addEventListener("storage", function (e) {
      if (e.key === "cvrReservations") {
        rerender();
        if (typeof initDashboardFromData === "function" && document.getElementById("dashKpiBookings")) initDashboardFromData();
      }
    });
    var poll = function () {
      if (document.hidden) return;
      if (typeof window.cvrSyncReservationsFromServer === "function") window.cvrSyncReservationsFromServer();
    };
    window.__cvrChartsPoll = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(); });
    // Phone rotated / window resized: let Chart.js re-fit smoothly
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        ["__cvrRevenueChart", "__cvrBookingChart", "__cvrTrendChart", "__cvrRoomChart"].forEach(function (k) {
          if (window[k]) window[k].resize();
        });
      }, 120);
    });
  }

  /* ------------------------------- dashboard ------------------------------- */
  window.initDashboardCharts = function () {
    var revCanvas = document.getElementById("revenueChart");
    var bookCanvas = document.getElementById("bookingChart");
    if (!bookCanvas || !window.Chart) return;
    bindTheme();

    var revHead = revCanvas ? decorate(revCanvas, { controls: true }) : null;
    var bookHead = decorate(bookCanvas, { controls: !revCanvas });
    var prevRev = null;
    var prevBook = null;

    function render(fromLive) {
      var t = theme();
      var s = buildSeries(records(), range);

      if (revCanvas) {
        if (!window.__cvrRevenueChart || window.__cvrRevenueChart.canvas !== revCanvas) {
          var o = baseOptions(t);
          o.plugins.legend.display = false;
          o.plugins.tooltip.callbacks = { label: function (c) { return " Revenue: " + peso(c.parsed.y); } };
          o.scales.y = revenueScale(t);
          window.__cvrRevenueChart = new Chart(revCanvas, {
            type: "line",
            data: { labels: s.labels, datasets: [revenueDataset(s.revenue, t)] },
            options: o,
          });
        } else {
          var c = window.__cvrRevenueChart;
          c.data.labels = s.labels;
          c.data.datasets[0].data = s.revenue;
          c.update();
        }
        setTrend(revHead, s.revenue, s.cfg);
        if (fromLive && prevRev && changed(prevRev, s.revenue)) pulse(revCanvas);
        prevRev = s.revenue;
      }

      if (!window.__cvrBookingChart || window.__cvrBookingChart.canvas !== bookCanvas) {
        var o2 = baseOptions(t);
        o2.plugins.legend.display = false;
        o2.plugins.tooltip.callbacks = { label: function (c) { return " Bookings: " + c.parsed.y; } };
        o2.scales.y = bookingScale(t, true);
        o2.scales.y.position = "left";
        window.__cvrBookingChart = new Chart(bookCanvas, {
          type: "bar",
          data: { labels: s.labels, datasets: [bookingDataset(s.bookings, t, false)] },
          options: o2,
        });
      } else {
        var b = window.__cvrBookingChart;
        b.data.labels = s.labels;
        b.data.datasets[0].data = s.bookings;
        b.update();
      }
      setTrend(bookHead, s.bookings, s.cfg);
      if (fromLive && prevBook && changed(prevBook, s.bookings)) pulse(bookCanvas);
      prevBook = s.bookings;
      stamp();
    }

    registry.push({ render: render });
    render(false);
    bindLive();
  };

  /* -------------------------------- reports -------------------------------- */
  var kpiValues = {};
  function animateText(el, to, fmt) {
    if (!el) return;
    var from = kpiValues[el.id];
    kpiValues[el.id] = to;
    if (to === null || typeof to !== "number") { el.textContent = fmt(to); return; }
    if (typeof from !== "number" || from === to || reduced()) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    var dur = 700;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  window.initReportsCharts = function () {
    var trend = document.getElementById("trendChart");
    var room = document.getElementById("roomChart");
    if (!trend || !room || !window.Chart) return;
    bindTheme();

    var head = decorate(trend, { controls: true });
    var live = document.createElement("span");
    live.className = "cvr-live-badge";
    live.innerHTML = '<span class="cvr-live-dot"></span>Live';
    if (head && head.__trend) head.__trend.parentNode.appendChild(live);

    var note = document.querySelector(".admin-reports-page .admin-page-head p.text-muted-brand");
    if (note && /sample trends/i.test(note.textContent)) {
      note.textContent = "Charts and totals update live from your reservation data.";
    }
    var sub = trend.closest(".admin-chart-card");
    var h = sub && sub.querySelector("h6");
    if (h) h.textContent = "Performance";

    var prev = null;

    function render(fromLive) {
      var t = theme();
      var rec = records();
      var el = function (id) { return document.getElementById(id); };

      var verified = rec.filter(typeof isVerifiedReservation === "function" ? isVerifiedReservation : function () { return false; });
      var currency = typeof mostCommonCurrency === "function" ? mostCommonCurrency(rec) : "PHP";
      var fmtCur = function (n) {
        return typeof fmtCurrencyReport === "function" ? fmtCurrencyReport(n, currency) : peso(n);
      };
      var totalRevenue = verified.reduce(function (sum, r) { return sum + parseReservationAmount(r); }, 0);
      var rate = rec.length ? Math.round((verified.length / rec.length) * 100) : 0;
      var avg = verified.length ? totalRevenue / verified.length : 0;

      animateText(el("repKpiRevenue"), rec.length ? totalRevenue : null, function (v) { return v === null ? "\u2014" : fmtCur(Math.round(v)); });
      animateText(el("repKpiBookings"), rec.length, function (v) { return String(Math.round(v)); });
      animateText(el("repKpiVerifiedRate"), rec.length ? rate : null, function (v) { return v === null ? "\u2014" : Math.round(v) + "%"; });
      animateText(el("repKpiAvgRevenue"), verified.length ? avg : null, function (v) { return v === null ? "\u2014" : fmtCur(Math.round(v)); });

      var s = buildSeries(rec, range);

      if (!window.__cvrTrendChart || window.__cvrTrendChart.canvas !== trend) {
        var o = baseOptions(t);
        o.plugins.tooltip.callbacks = {
          label: function (c) {
            return c.dataset.yAxisID === "y" ? " Revenue: " + peso(c.parsed.y) : " Bookings: " + c.parsed.y;
          },
        };
        o.scales.y = revenueScale(t);
        o.scales.y1 = bookingScale(t, false);
        window.__cvrTrendChart = new Chart(trend, {
          type: "bar",
          data: { labels: s.labels, datasets: [revenueDataset(s.revenue, t), bookingDataset(s.bookings, t, true)] },
          options: o,
        });
      } else {
        var c = window.__cvrTrendChart;
        c.data.labels = s.labels;
        c.data.datasets[0].data = s.revenue;
        c.data.datasets[1].data = s.bookings;
        c.update();
      }
      setTrend(head, s.revenue, s.cfg);
      var sig = [s.revenue, s.bookings];
      if (fromLive && prev && changed(prev, sig)) pulse(trend);
      prev = sig;

      var dist = typeof buildRoomDistribution === "function" ? buildRoomDistribution(rec) : { labels: [], data: [] };
      var has = dist.labels.length > 0;
      var labels = has ? dist.labels : ["No bookings yet"];
      var data = has ? dist.data : [1];
      var palette = ["#0c3b5d", "#328bc3", "#d9b312", "#3d4963", "#1f9d6b", "#8a97a6"];
      var colors = has ? labels.map(function (_, i) { return palette[i % palette.length]; }) : [t.grid];
      if (!window.__cvrRoomChart || window.__cvrRoomChart.canvas !== room) {
        window.__cvrRoomChart = new Chart(room, {
          type: "doughnut",
          data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderColor: t.surface, borderWidth: 3, hoverOffset: 8 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            animation: reduced() ? false : { duration: 1000, easing: "easeOutQuart", animateRotate: true, animateScale: true },
            plugins: {
              legend: { position: "bottom", labels: { color: t.text, usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 12 } } },
              tooltip: {
                padding: 10,
                cornerRadius: 10,
                callbacks: {
                  label: function (c) {
                    return c.label === "No bookings yet" ? " No bookings yet" : " " + c.label + ": " + c.parsed + " booking" + (c.parsed === 1 ? "" : "s");
                  },
                },
              },
            },
          },
        });
      } else {
        var rc = window.__cvrRoomChart;
        rc.data.labels = labels;
        rc.data.datasets[0].data = data;
        rc.data.datasets[0].backgroundColor = colors;
        rc.data.datasets[0].borderColor = t.surface;
        rc.update();
      }
      stamp();
    }

    registry.push({ render: render });
    render(false);
    bindLive();
  };
})();
