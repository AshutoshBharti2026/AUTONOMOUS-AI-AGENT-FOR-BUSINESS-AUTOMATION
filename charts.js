/* ==========================================================
   charts.js - Tiny SVG chart library (no external dependencies)
   Every function returns an HTML/SVG string.
   ========================================================== */
window.Charts = (function () {
  var COLORS = ["#0f62fe", "#78a9ff", "#00539a", "#33b1ff", "#8a3ffc", "#f1c21b"];

  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v || 1)));
    var n = v / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * p;
  }

  function frame(w, h, pad, max, ticks, fmt) {
    var s = "";
    for (var i = 0; i <= ticks; i++) {
      var y = pad.t + (h - pad.t - pad.b) * (1 - i / ticks);
      s += '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + y + '" y2="' + y + '" class="c-grid"/>' +
           '<text x="' + (pad.l - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="c-axis">' + fmt(max * i / ticks) + '</text>';
    }
    return s;
  }

  function line(labels, values, o) {
    o = o || {};
    var w = 560, h = 240, pad = { l: 46, r: 16, t: 14, b: 30 }, fmt = o.fmt || String;
    var max = niceMax(Math.max.apply(null, values)), iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var pts = values.map(function (v, i) {
      return [pad.l + (labels.length === 1 ? iw / 2 : iw * i / (labels.length - 1)), pad.t + ih * (1 - v / max)];
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = d + " L" + pts[pts.length - 1][0] + " " + (pad.t + ih) + " L" + pts[0][0] + " " + (pad.t + ih) + " Z";
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" class="chart" role="img" aria-label="' + (o.label || "Line chart") + '">' + frame(w, h, pad, max, 4, fmt);
    s += '<path d="' + area + '" class="c-area"/><path d="' + d + '" class="c-line" pathLength="1"/>';
    pts.forEach(function (p, i) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" class="c-dot"><title>' + labels[i] + ": " + fmt(values[i]) + "</title></circle>" +
           '<text x="' + p[0] + '" y="' + (h - 9) + '" text-anchor="middle" class="c-axis">' + labels[i] + "</text>";
    });
    return s + "</svg>";
  }

  function bar(labels, values, o) {
    o = o || {};
    var w = 560, h = 240, pad = { l: 46, r: 16, t: 14, b: 30 }, fmt = o.fmt || String;
    var max = niceMax(Math.max.apply(null, values)), iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var bw = iw / labels.length;
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" class="chart" role="img" aria-label="' + (o.label || "Bar chart") + '">' + frame(w, h, pad, max, 4, fmt);
    values.forEach(function (v, i) {
      var bh = ih * v / max, x = pad.l + i * bw + bw * 0.2;
      s += '<rect x="' + x + '" y="' + (pad.t + ih - bh) + '" width="' + bw * 0.6 + '" height="' + bh + '" rx="3" class="c-bar" style="fill:' + COLORS[i % COLORS.length] + ';animation-delay:' + i * 60 + 'ms"><title>' + labels[i] + ": " + fmt(v) + "</title></rect>" +
           '<text x="' + (x + bw * 0.3) + '" y="' + (h - 9) + '" text-anchor="middle" class="c-axis">' + labels[i] + "</text>";
    });
    return s + "</svg>";
  }

  function donut(items, o) {
    o = o || {};
    var total = items.reduce(function (a, b) { return a + b.value; }, 0) || 1, off = 25, fmt = o.fmt || String;
    var s = '<svg viewBox="0 0 42 42" class="donut" role="img" aria-label="' + (o.label || "Donut chart") + '"><circle cx="21" cy="21" r="15.915" fill="none" class="c-donut-bg" stroke-width="6"/>';
    items.forEach(function (it, i) {
      var pct = it.value / total * 100;
      s += '<circle cx="21" cy="21" r="15.915" fill="none" stroke="' + COLORS[i % COLORS.length] + '" stroke-width="6" stroke-dasharray="' + pct.toFixed(2) + " " + (100 - pct).toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"><title>' + it.label + ": " + fmt(it.value) + "</title></circle>";
      off -= pct;
    });
    s += '<text x="21" y="20.5" text-anchor="middle" class="donut-n">' + (o.center || "") + '</text><text x="21" y="26" text-anchor="middle" class="donut-l">' + (o.sub || "") + "</text></svg>";
    var legend = items.map(function (it, i) {
      return '<li><span class="sw" style="background:' + COLORS[i % COLORS.length] + '"></span>' + it.label + "<b>" + Math.round(it.value / total * 100) + "%</b></li>";
    }).join("");
    return '<div class="donut-wrap">' + s + '<ul class="legend">' + legend + "</ul></div>";
  }

  return { line: line, bar: bar, donut: donut, COLORS: COLORS };
})();
