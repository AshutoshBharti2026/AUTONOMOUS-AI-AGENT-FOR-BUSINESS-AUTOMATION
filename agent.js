/* ==========================================================
   agent.js - The demo "AI agent".
   IMPORTANT: this is a RULE-BASED, LOCAL simulation. It reads the
   instruction, matches keywords, and calculates answers from the demo
   data stored in the browser. No external AI model or API is used.
   ========================================================== */
window.Agent = (function () {
  var STAGES = ["User Instruction", "Input Analysis", "Task Identification", "Decision Making", "Task Execution", "Result Generation"];
  var A = { STAGES: STAGES, busy: false };
  var esc = App.esc, k = App.k, inr = App.inr;

  /* ---------- data helpers (all computed from stored state) ---------- */
  function salesStats() {
    var s = DEMO.sales, rev = s.revenue, n = rev.length;
    var total = rev.reduce(function (a, b) { return a + b; }, 0);
    var orders = s.orders.reduce(function (a, b) { return a + b; }, 0);
    var growth = (rev[n - 1] - rev[n - 2]) / rev[n - 2] * 100;
    var rises = 0; for (var i = 1; i < n; i++) if (rev[i] > rev[i - 1]) rises++;
    var topP = s.products.slice().sort(function (a, b) { return b.revenue - a.revenue; })[0];
    var regs = Object.keys(s.regions).sort(function (a, b) { return s.regions[b] - s.regions[a]; });
    return { total: total, orders: orders, aov: Math.round(total * 1000 / orders), growth: growth, rises: rises, steps: n - 1,
             best: s.months[rev.indexOf(Math.max.apply(null, rev))], topProduct: topP, topRegion: regs[0], regionShare: Math.round(s.regions[regs[0]] / rev[n - 1] * 100) };
  }
  function expStats() {
    var by = {}, total = 0;
    App.S.expenses.forEach(function (e) { by[e.cat] = (by[e.cat] || 0) + e.amount; total += e.amount; });
    var cats = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; });
    var rev = DEMO.sales.revenue[DEMO.sales.revenue.length - 1] * 1000;
    return { by: by, cats: cats, total: total, ratio: Math.round(total / rev * 100), rev: rev };
  }
  function taskStats() {
    var t = App.S.tasks, done = t.filter(function (x) { return x.done; }).length;
    return { total: t.length, done: done, pending: t.length - done, pct: t.length ? Math.round(done / t.length * 100) : 0 };
  }
  function followMessage(c) {
    return "Subject: Checking in after your last order\n\nDear " + c.name.split(" ")[0] + ",\n\nThank you for choosing us at " + "Demo Business Solutions" +
      ". Your last order was on " + c.last + ", and we wanted to make sure everything is working well for " + c.company +
      ".\n\nIf you have any questions or would like a quick review of your plan, reply to this message and we will arrange a call at a time that suits you.\n\nWarm regards,\n" + App.S.settings.name + "\nDemo Business Solutions";
  }
  A.followMessage = followMessage; A.taskStats = taskStats; A.expStats = expStats; A.salesStats = salesStats;

  /* ---------- intent detection (keyword rules) ---------- */
  function detect(text) {
    var t = text.toLowerCase();
    if (/^(add|create|new)\s+(a\s+)?(new\s+)?task\b/.test(t)) return "addtask";
    if (/follow.?up|customer message|message (to|for)|email (to|for)/.test(t)) return "followup";
    if (/performance|overview|business summary|summari[sz]e (the )?business/.test(t)) return "performance";
    if (/expense|spending|cost/.test(t)) return "expenses";
    if (/sales|revenue/.test(t)) return "sales";
    if (/(pending|open|list|show).*(tasks?|to-?do)/.test(t) || /(tasks?).*(pending|list)/.test(t)) return /report|manage/.test(t) ? "taskreport" : "listtasks";
    if (/task/.test(t)) return "taskreport";
    if (/report/.test(t)) return "performance";
    return "unknown";
  }
  function keywords(text) {
    var stop = " a an the to of for and please me my our is are in on with ";
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/).filter(function (w) { return w && stop.indexOf(" " + w + " ") < 0; }).slice(0, 4);
  }

  /* ---------- handlers: each returns {ok, label, steps[6], html, effect, log} ---------- */
  function handle(text) {
    var intent = detect(text), kw = keywords(text), S = App.S, h;
    var base = function (label, src, exec, html, log, effect) {
      return {
        ok: true, label: label, html: html, log: log, effect: effect,
        steps: ["Received: \u201C" + text + "\u201D",
          "Read " + text.split(/\s+/).length + " words. Keywords found: " + (kw.join(", ") || "none"),
          "Matched task type: " + label,
          "Chose data source: " + src,
          exec, "Built a readable response and updated the activity log"]
      };
    };
    if (intent === "sales") {
      var s = salesStats(), D = DEMO.sales;
      h = '<h4>Sales report (Jun to Nov, demo data)</h4><ul>' +
        '<li>Total revenue: <b>' + k(s.total) + '</b> from ' + s.orders + ' orders (average order ' + inr(s.aov) + ').</li>' +
        '<li>November revenue is <b>' + k(D.revenue[5]) + '</b>, ' + (s.growth >= 0 ? "up " : "down ") + Math.abs(s.growth).toFixed(1) + '% on October.</li>' +
        '<li>Revenue rose in ' + s.rises + ' of ' + s.steps + ' months, so the trend is ' + (s.rises >= 3 ? "upward" : "mixed") + '.</li>' +
        '<li>Top product: <b>' + esc(s.topProduct.name) + '</b>. Strongest region in November: <b>' + s.topRegion + '</b> (' + s.regionShare + '%).</li></ul>' +
        Charts.line(D.months, D.revenue, { fmt: function (v) { return k(Math.round(v)); }, label: "Monthly revenue" });
      return base("Sales report", "sales records (local demo data)", "Totalled revenue and orders, compared months, ranked products and regions", h, "Generated sales report from chat instruction");
    }
    if (intent === "expenses") {
      var e = expStats();
      h = '<h4>Expense analysis (' + S.expenses.length + ' expenses)</h4><ul>' +
        '<li>Total expenses: <b>' + inr(e.total) + '</b>, about ' + e.ratio + '% of November revenue.</li>' +
        '<li>Largest category: <b>' + e.cats[0] + '</b> at ' + inr(e.by[e.cats[0]]) + ' (' + Math.round(e.by[e.cats[0]] / e.total * 100) + '% of spend).</li>' +
        '<li>Smallest category: ' + e.cats[e.cats.length - 1] + ' at ' + inr(e.by[e.cats[e.cats.length - 1]]) + '.</li></ul>' +
        Charts.donut(e.cats.map(function (c) { return { label: c, value: e.by[c] }; }), { center: Math.round(e.total / 1000) + "k", sub: "total", fmt: inr });
      return base("Expense analysis", "expense records (stored in this browser)", "Grouped expenses by category and calculated totals and shares", h, "Analysed business expenses");
    }
    if (intent === "performance") {
      var s2 = salesStats(), e2 = expStats(), t2 = taskStats(), pend = S.customers.filter(function (c) { return c.status === "Not started" || c.status === "Draft ready"; }).length;
      h = '<h4>Business performance summary</h4><ul>' +
        '<li>Revenue (Nov): <b>' + k(DEMO.sales.revenue[5]) + '</b>, ' + (s2.growth >= 0 ? "up " : "down ") + Math.abs(s2.growth).toFixed(1) + '% on October.</li>' +
        '<li>Expenses logged: <b>' + inr(e2.total) + '</b>. Revenue minus logged expenses: <b>' + inr(e2.rev - e2.total) + '</b> (demo figures).</li>' +
        '<li>Tasks: ' + t2.done + ' completed, ' + t2.pending + ' pending (' + t2.pct + '% done).</li>' +
        '<li>Customers waiting for a follow-up: ' + pend + '.</li></ul><p class="muted">Open the Reports page to download the full report.</p>';
      return base("Performance summary", "sales, expenses, tasks and customers (local)", "Combined figures from all four modules", h, "Summarised business performance");
    }
    if (intent === "taskreport" || intent === "listtasks") {
      var t = taskStats(), pending = S.tasks.filter(function (x) { return !x.done; });
      var pr = { High: 0, Medium: 0, Low: 0 }; pending.forEach(function (x) { pr[x.priority]++; });
      h = '<h4>' + (intent === "taskreport" ? "Task management report" : "Pending tasks") + '</h4><ul>' +
        (intent === "taskreport" ? '<li>' + t.total + ' tasks in total: <b>' + t.done + ' completed</b> and <b>' + t.pending + ' pending</b> (' + t.pct + '% complete).</li>' +
          '<li>Pending by priority: ' + pr.High + ' high, ' + pr.Medium + ' medium, ' + pr.Low + ' low.</li>' : '') +
        pending.map(function (x) { return '<li>' + esc(x.title) + ' <span class="badge ' + x.priority.toLowerCase() + '">' + x.priority + '</span> due ' + App.fmtDay(x.due) + '</li>'; }).join("") +
        (pending.length ? "" : "<li>No pending tasks. Everything is complete.</li>") + '</ul>';
      return base(intent === "taskreport" ? "Task report" : "Pending task list", "task list (stored in this browser)", "Counted completed and pending tasks and grouped them by priority", h, intent === "taskreport" ? "Generated task management report" : "Listed pending tasks");
    }
    if (intent === "followup") {
      var low = text.toLowerCase(), c = S.customers.filter(function (x) { return low.indexOf(x.name.toLowerCase()) >= 0 || low.indexOf(x.name.split(" ")[0].toLowerCase()) >= 0; })[0] ||
        S.customers.filter(function (x) { return x.status === "Not started"; })[0] || S.customers[0];
      var msg = followMessage(c);
      h = '<h4>Follow-up draft for ' + esc(c.name) + '</h4><pre class="draft">' + esc(msg) + '</pre><p class="muted">Saved as a draft. Open Customers to send it or track the reply.</p>';
      return base("Customer follow-up message", "customer list (stored in this browser)", "Selected " + c.name + " and filled the message template", h, "Created follow-up draft for " + c.name, function () {
        c.draft = msg; if (c.status === "Not started") c.status = "Draft ready"; App.save();
      });
    }
    if (intent === "addtask") {
      var title = text.replace(/^(add|create|new)\s+(a\s+)?(new\s+)?task\s*(to|:|-)?\s*/i, "").trim();
      if (title) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
        h = '<h4>Task added</h4><p>\u201C' + esc(title) + '\u201D was added to your task list with medium priority, due tomorrow.</p>';
        return base("Add task", "task list (stored in this browser)", "Created a new task entry", h, "Added task: " + title, function () {
          S.tasks.unshift({ id: App.id(), title: title, priority: "Medium", due: App.dateOffset(1), done: false }); App.save();
        });
      }
    }
    // unknown instruction -> honest failure with suggestions
    return {
      ok: false, label: "Not recognised", log: "Could not match instruction: " + text.slice(0, 60),
      steps: ["Received: \u201C" + text + "\u201D", "Read " + text.split(/\s+/).length + " words. Keywords found: " + (kw.join(", ") || "none"),
        "No matching task type in the rule set", "No action chosen (nothing to execute)", "Skipped", "Returned suggestions instead"],
      html: '<h4>I could not match that instruction</h4><p>This demo agent works from a fixed set of rules, so it only understands certain business tasks. Try one of these:</p><ul><li>Prepare a sales report.</li><li>Analyse monthly business expenses.</li><li>Create a customer follow-up message.</li><li>Summarise business performance.</li><li>Generate a task management report.</li><li>Add task: call the supplier</li></ul>'
    };
  }

  function delay() { return { fast: 250, normal: 550, slow: 1000 }[App.S.settings.speed] || 550; }

  /* Runs the six workflow stages one by one. hooks: onStep(i,state,detail), onDone(result) */
  A.run = function (text, hooks) {
    hooks = hooks || {};
    text = String(text || "").trim();
    if (!text) { App.toast("Type an instruction first.", "bad"); return Promise.resolve(null); }
    if (A.busy) { App.toast("The agent is still working on the previous task.", "bad"); return Promise.resolve(null); }
    var res;
    try { res = handle(text); } catch (err) { console.error(err); res = { ok: false, label: "Error", steps: ["Received", "Error", "Error", "Error", "Error", "Error"], html: "<h4>Something went wrong</h4><p>The agent could not process this instruction. Please try again.</p>", log: "Agent error while processing instruction" }; }
    A.busy = true; App.setAgent("Active");
    var i = 0;
    return new Promise(function (resolve) {
      (function next() {
        if (i >= 6) {
          try { if (res.effect) res.effect(); } catch (e) { console.error(e); }
          App.activity(res.log, res.ok ? "Success" : "Failed");
          A.busy = false; App.setAgent("Idle");
          if (hooks.onDone) hooks.onDone(res);
          if (App.S.settings.notifyAgent) App.toast(res.ok ? "Task finished: " + res.label : "Instruction not recognised", res.ok ? "ok" : "bad");
          return resolve(res);
        }
        if (hooks.onStep) hooks.onStep(i, "running", res.steps[i]);
        setTimeout(function () { if (hooks.onStep) hooks.onStep(i, "done", res.steps[i]); i++; next(); }, delay());
      })();
    });
  };
  return A;
})();
