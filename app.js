/* ==========================================================
   app.js - Core: state (localStorage), utilities, toasts,
   theme, hash router and global event handling.
   ========================================================== */
(function () {
  var KEY = "aaba_demo_state_v1";
  var S = null;                 // application state
  var memoryOnly = false;       // true if localStorage is blocked

  /* ---------- utilities ---------- */
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function inr(n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); }
  function k(n) { return "\u20B9" + n + "k"; }
  function fmtDT(iso) {
    var d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  function dateOffset(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function fmtDay(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------- state ---------- */
  function seed() {
    var D = window.DEMO, now = Date.now();
    return {
      nextId: 100,
      tasks: D.tasks.map(function (t, i) { return { id: i + 1, title: t.title, priority: t.priority, due: dateOffset(t.due), done: t.done }; }),
      expenses: D.expenses.map(function (e, i) { return { id: i + 1, desc: e.desc, cat: e.cat, amount: e.amount }; }),
      customers: D.customers.map(function (c, i) { return Object.assign({ id: i + 1, draft: "" }, c); }),
      activities: D.activities.map(function (a, i) { return { id: i + 1, ts: new Date(now - a[0] * 60000).toISOString(), desc: a[1], status: a[2] }; }),
      settings: { name: "Demo User", role: "Operations Manager", toasts: true, notifyTask: true, notifyAgent: true, theme: "light", speed: "normal" }
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && Array.isArray(p.tasks) && Array.isArray(p.customers) && p.settings) return p;
      }
    } catch (e) { memoryOnly = true; }
    return seed();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { memoryOnly = true; }
  }
  function reset(keepSettings) {
    var old = S && S.settings, fresh = seed();
    if (keepSettings && old) fresh.settings = old;
    S = fresh; save(); applyTheme();
  }
  function id() { return S.nextId++; }

  /* ---------- activity log, toast, agent status ---------- */
  function activity(desc, status) {
    S.activities.unshift({ id: id(), ts: new Date().toISOString(), desc: desc, status: status || "Success" });
    if (S.activities.length > 80) S.activities.length = 80;
    save();
  }
  function toast(msg, type) {
    if (!S.settings.toasts) return;
    var box = $("#toasts"), t = document.createElement("div");
    t.className = "toast " + (type || "ok");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2600);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function setAgent(status) {
    document.querySelectorAll(".js-agent").forEach(function (el) {
      el.textContent = status;
      el.classList.toggle("active", status === "Active");
    });
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", S.settings.theme === "dark" ? "dark" : "light");
  }

  /* ---------- router ---------- */
  var routes = {}, current = null;
  function route(name, def) { routes[name] = def; }
  function go() {
    var name = (location.hash || "").replace("#", "");
    var landing = $("#landing"), app = $("#app");
    if (!name || name === "landing") {
      landing.hidden = false; app.hidden = true; document.title = "AI Agent for Business Automation";
      return;
    }
    if (!routes[name]) name = "dashboard";
    landing.hidden = true; app.hidden = false;
    current = name;
    document.querySelectorAll("#sidebar a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + name);
    });
    $("#sidebar").classList.remove("open");
    $("#pageTitle").textContent = routes[name].title;
    document.title = routes[name].title + " | AI Agent for Business Automation";
    renderView();
    window.scrollTo(0, 0);
  }
  function renderView() {
    var view = $("#view"), r = routes[current];
    if (!r) return;
    try {
      view.innerHTML = r.render();
      if (r.after) r.after();
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="card"><h3>This page could not be displayed</h3><p class="muted">Something went wrong while loading it. Use "Reset demo data" in Settings and try again.</p></div>';
    }
    setAgent(window.Agent && Agent.busy ? "Active" : "Idle");
  }

  /* ---------- global event delegation ---------- */
  var Act = {};   // click actions: data-act="name"
  var Forms = {}; // submit handlers: data-form="name"
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var fn = Act[el.getAttribute("data-act")];
    if (fn) { try { fn(el, e); } catch (err) { console.error(err); toast("That action failed. Please try again.", "bad"); } }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    var fn = Forms[f.getAttribute("data-form")];
    if (fn) { try { fn(f, e); } catch (err) { console.error(err); toast("That action failed. Please try again.", "bad"); } }
  });
  window.addEventListener("error", function () { /* keep the demo running; details are in the console */ });

  /* ---------- shell actions ---------- */
  Act.menu = function () { $("#sidebar").classList.toggle("open"); };
  Act.theme = function () { S.settings.theme = S.settings.theme === "dark" ? "light" : "dark"; save(); applyTheme(); if (current === "settings") renderView(); };
  Act.enter = function () { location.hash = "#dashboard"; };
  Act.demoOpen = function () { $("#demoPanel").classList.add("open"); };
  Act.demoClose = function () { $("#demoPanel").classList.remove("open"); };
  Act.landingDemo = function () { location.hash = "#dashboard"; setTimeout(Act.demoOpen, 150); };

  window.addEventListener("hashchange", go);

  window.App = {
    get S() { return S; }, esc: esc, inr: inr, k: k, fmtDT: fmtDT, fmtDay: fmtDay, dateOffset: dateOffset, $: $,
    save: save, reset: reset, id: id, activity: activity, toast: toast, setAgent: setAgent, applyTheme: applyTheme,
    route: route, renderView: renderView, Act: Act, Forms: Forms,
    get current() { return current; }, get memoryOnly() { return memoryOnly; },
    start: function () { S = load(); applyTheme(); go(); }
  };
})();
