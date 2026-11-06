/* ==========================================================
   pages.js - All pages/modules, their actions, and Demo Mode.
   ========================================================== */
(function () {
  var A = App.Act, F = App.Forms, esc = App.esc, k = App.k, inr = App.inr;
  var S = function () { return App.S; };
  var chat = [], wf = null, taskFilter = "all", actFilter = "all", selCust = 1, reportShown = false;
  var COMMANDS = ["Prepare a sales report.", "Analyse monthly business expenses.", "Create a customer follow-up message.", "Summarise business performance.", "Generate a task management report."];

  function head(title, sub, actions) {
    return '<div class="page-head"><div><h1>' + title + '</h1><p class="muted">' + sub + '</p></div><div class="actions">' + (actions || "") + "</div></div>";
  }
  function stat(label, value, note) { return '<div class="card stat"><span class="muted">' + label + '</span><strong>' + value + '</strong><small class="muted">' + (note || "") + "</small></div>"; }
  function chips(cmds) { return cmds.map(function (c) { return '<button class="chip" data-act="quick" data-cmd="' + esc(c) + '">' + esc(c) + "</button>"; }).join(""); }
  function successRate() {
    var a = S().activities; if (!a.length) return 0;
    return Math.round(a.filter(function (x) { return x.status === "Success"; }).length / a.length * 100);
  }

  /* ================= Dashboard ================= */
  App.route("dashboard", {
    title: "Dashboard",
    render: function () {
      var t = Agent.taskStats(), D = DEMO.sales;
      var recent = S().activities.slice(0, 5).map(function (a) {
        return '<li><span class="dot ' + a.status.toLowerCase() + '"></span><div><b>' + esc(a.desc) + '</b><small class="muted">' + App.fmtDT(a.ts) + "</small></div></li>";
      }).join("");
      return head("Welcome back, " + esc(S().settings.name), 'Here is an overview of your business automation. <span class="badge demo">Demo data</span>',
        '<button class="btn primary" data-act="goTasks">Add a task</button><button class="btn" data-act="quick" data-cmd="Prepare a sales report.">Run sales report</button>') +
        '<div class="grid stats">' + stat("Total tasks", t.total, "All tasks in the list") + stat("Completed tasks", t.done, t.pct + "% complete") +
        stat("Pending tasks", t.pending, "Waiting to be done") + stat("Automation success rate", successRate() + "%", "Successful runs in the activity log") + "</div>" +
        '<div class="grid two"><div class="card"><h3>Revenue trend <small class="muted">(thousand rupees, demo data)</small></h3>' +
        Charts.line(D.months, D.revenue, { fmt: function (v) { return Math.round(v); }, label: "Monthly revenue" }) + "</div>" +
        '<div class="card"><h3>AI agent</h3><p>Status: <span class="pill js-agent">Idle</span></p><p class="muted">The agent is a rule-based simulation that works on the demo data in this browser. No external AI service is connected.</p>' +
        '<h4>Quick actions</h4><div class="chips">' + chips(["Prepare a sales report.", "Analyse monthly business expenses.", "Summarise business performance."]) + "</div></div></div>" +
        '<div class="grid two"><div class="card"><h3>Task status</h3>' + Charts.donut([{ label: "Completed", value: t.done }, { label: "Pending", value: t.pending }], { center: t.pct + "%", sub: "done" }) + "</div>" +
        '<div class="card"><h3>Recent activities</h3><ul class="feed">' + recent + '</ul><a href="#activity" class="link">View all activity</a></div></div>';
    }
  });
  A.goTasks = function () { location.hash = "#tasks"; };
  A.quick = function (el) { App.pendingCmd = el.getAttribute("data-cmd"); App.Act.demoClose(); if (App.current === "agent") { runChat(App.pendingCmd); App.pendingCmd = null; } else location.hash = "#agent"; };

  /* ================= AI Agent chat ================= */
  function renderChat() {
    var log = App.$("#chatLog"); if (!log) return;
    log.innerHTML = chat.map(function (m) {
      if (m.role === "user") return '<div class="msg user">' + esc(m.text) + "</div>";
      var steps = Agent.STAGES.map(function (n, i) {
        var st = m.steps[i];
        return '<li class="' + st.state + '"><span class="tick"></span><div><b>' + n + '</b><small class="muted">' + esc(st.detail || "") + "</small></div></li>";
      }).join("");
      return '<div class="msg bot"><ol class="steps">' + steps + "</ol>" + (m.reply ? '<div class="reply">' + m.reply + "</div>" : '<p class="muted">Working on it...</p>') + "</div>";
    }).join("");
    log.scrollTop = log.scrollHeight;
  }
  function runChat(text) {
    text = String(text || "").trim();
    if (!text || Agent.busy) { if (!text) App.toast("Type an instruction first.", "bad"); else App.toast("The agent is still working.", "bad"); return Promise.resolve(); }
    var m = { role: "bot", steps: Agent.STAGES.map(function () { return { state: "idle", detail: "" }; }), reply: "" };
    chat.push({ role: "user", text: text }); chat.push(m); renderChat();
    return Agent.run(text, {
      onStep: function (i, st, d) { m.steps[i] = { state: st, detail: st === "done" ? d : "" }; renderChat(); },
      onDone: function (res) { m.reply = res.html; renderChat(); }
    });
  }
  App.route("agent", {
    title: "AI Agent",
    render: function () {
      if (!chat.length) chat.push({ role: "bot", steps: Agent.STAGES.map(function () { return { state: "done", detail: "" }; }), reply: "<p>Hello, I am the demo business agent. Give me a business instruction and I will show each step I take.</p><p class=\"muted\">I am a rule-based simulation running locally. I am not connected to any external AI model.</p>", greeting: true });
      return head("AI Agent", "Type an instruction and watch the agent work through it.", '<span class="pill js-agent">Idle</span>') +
        '<div class="agent-layout"><section class="card chat"><div id="chatLog" class="chat-log" aria-live="polite"></div>' +
        '<form data-form="agent" class="chat-form"><input id="agentInput" type="text" placeholder="For example: Prepare a sales report." autocomplete="off" maxlength="200"><button class="btn primary" type="submit">Send</button></form></section>' +
        '<aside class="card"><h3>Example instructions</h3><div class="chips col">' + chips(COMMANDS) + '</div><h4>Also try</h4><p class="muted">Add task: call the supplier<br>Show pending tasks<br>Follow-up message for Priya</p></aside></div>';
    },
    after: function () {
      renderChat();
      if (App.pendingCmd) { var c = App.pendingCmd; App.pendingCmd = null; runChat(c); }
    }
  });
  F.agent = function () { var i = App.$("#agentInput"), v = i.value; i.value = ""; runChat(v); };

  /* ================= Workflow ================= */
  function renderWF() {
    var box = App.$("#wfNodes"); if (!box) return;
    box.innerHTML = Agent.STAGES.map(function (n, i) {
      var st = wf ? wf.steps[i] : { state: "idle", detail: "Waiting for an instruction" };
      return '<div class="node ' + st.state + '"><div class="num">' + (st.state === "done" ? "\u2713" : i + 1) + "</div><b>" + n + '</b><small>' + esc(st.detail || (st.state === "running" ? "In progress..." : "Waiting")) + "</small></div>";
    }).join('<div class="link-arrow" aria-hidden="true"></div>');
    var out = App.$("#wfOut"); if (out) out.innerHTML = wf && wf.reply ? '<div class="card"><h3>Result</h3><div class="reply">' + wf.reply + "</div></div>" : "";
  }
  function runWF(text) {
    text = String(text || "").trim();
    if (!text) return App.toast("Type an instruction first.", "bad");
    if (Agent.busy) return App.toast("The agent is still working.", "bad");
    wf = { steps: Agent.STAGES.map(function () { return { state: "idle", detail: "" }; }), reply: "" }; renderWF();
    return Agent.run(text, {
      onStep: function (i, st, d) { wf.steps[i] = { state: st, detail: st === "done" ? d : "" }; renderWF(); },
      onDone: function (res) { wf.reply = res.html; renderWF(); }
    });
  }
  App.route("workflow", {
    title: "Automation Workflow",
    render: function () {
      return head("Automation workflow", "Submit a task to see the agent move through each stage.") +
        '<div class="card"><form data-form="wf" class="chat-form"><input id="wfInput" type="text" placeholder="Type an instruction" autocomplete="off" maxlength="200"><button class="btn primary" type="submit">Run workflow</button></form>' +
        '<div class="chips">' + COMMANDS.slice(0, 4).map(function (c) { return '<button class="chip" data-act="wfRun" data-cmd="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div></div>" +
        '<div class="wf" id="wfNodes"></div><div id="wfOut"></div>';
    },
    after: renderWF
  });
  F.wf = function () { var i = App.$("#wfInput"), v = i.value; i.value = ""; runWF(v); };
  A.wfRun = function (el) { runWF(el.getAttribute("data-cmd")); };

  /* ================= Tasks ================= */
  App.route("tasks", {
    title: "Task Automation",
    render: function () {
      var all = S().tasks, list = all.filter(function (t) { return taskFilter === "all" || (taskFilter === "done" ? t.done : !t.done); });
      var rows = list.map(function (t) {
        return '<li class="task ' + (t.done ? "done" : "") + '"><button class="check" data-act="toggleTask" data-id="' + t.id + '" aria-label="' + (t.done ? "Mark as pending" : "Mark as completed") + '">' + (t.done ? "\u2713" : "") + "</button>" +
          '<div class="grow"><b>' + esc(t.title) + '</b><small class="muted">Due ' + App.fmtDay(t.due) + '</small></div><span class="badge ' + t.priority.toLowerCase() + '">' + t.priority + '</span><span class="badge ' + (t.done ? "ok" : "wait") + '">' + (t.done ? "Completed" : "Pending") +
          '</span><button class="icon-btn" data-act="delTask" data-id="' + t.id + '" aria-label="Delete task">Delete</button></li>';
      }).join("") || '<li class="empty">No tasks here yet. Add one above.</li>';
      var tab = function (v, l) { return '<button class="tab ' + (taskFilter === v ? "on" : "") + '" data-act="taskFilter" data-v="' + v + '">' + l + "</button>"; };
      return head("Task automation", "Add, complete and remove tasks. Changes are saved in this browser.") +
        '<div class="card"><form data-form="task" class="row-form"><input name="title" placeholder="New task, for example: Send weekly report" maxlength="120" required>' +
        '<select name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select><input type="date" name="due" value="' + App.dateOffset(1) + '"><button class="btn primary">Add task</button></form></div>' +
        '<div class="card"><div class="tabs">' + tab("all", "All (" + all.length + ")") + tab("pending", "Pending (" + all.filter(function (t) { return !t.done; }).length + ")") + tab("done", "Completed (" + all.filter(function (t) { return t.done; }).length + ")") + "</div><ul class=\"tasks\">" + rows + "</ul></div>";
    }
  });
  F.task = function (f) {
    var title = f.title.value.trim();
    if (!title) return App.toast("Enter a task title.", "bad");
    S().tasks.unshift({ id: App.id(), title: title, priority: f.priority.value, due: f.due.value || App.dateOffset(1), done: false });
    App.activity("Added task: " + title); App.save(); App.toast("Task added"); App.renderView();
  };
  A.toggleTask = function (el) {
    var t = S().tasks.filter(function (x) { return x.id == el.getAttribute("data-id"); })[0]; if (!t) return;
    t.done = !t.done; App.activity((t.done ? "Marked '" : "Reopened '") + t.title + (t.done ? "' as completed" : "'")); App.save();
    if (S().settings.notifyTask) App.toast(t.done ? "Task completed" : "Task reopened"); App.renderView();
  };
  A.delTask = function (el) {
    var id = el.getAttribute("data-id"), t = S().tasks.filter(function (x) { return x.id == id; })[0];
    S().tasks = S().tasks.filter(function (x) { return x.id != id; });
    if (t) App.activity("Deleted task: " + t.title); App.save(); App.toast("Task deleted"); App.renderView();
  };
  A.taskFilter = function (el) { taskFilter = el.getAttribute("data-v"); App.renderView(); };

  /* ================= Sales ================= */
  var salesNote = "";
  App.route("sales", {
    title: "Sales Analysis",
    render: function () {
      var D = DEMO.sales, s = Agent.salesStats(), maxP = D.products[0].revenue;
      var prods = D.products.map(function (p) { return "<tr><td>" + esc(p.name) + "</td><td>" + k(p.revenue) + '</td><td><div class="meter"><i style="width:' + Math.round(p.revenue / maxP * 100) + '%"></i></div></td></tr>'; }).join("");
      return head("Sales analysis", 'Sample sales for June to November. <span class="badge demo">Demo data</span>', '<button class="btn primary" data-act="salesSummary">Generate sales summary</button>') +
        '<div class="grid stats">' + stat("Total revenue", k(s.total), "Jun to Nov") + stat("November revenue", k(D.revenue[5]), (s.growth >= 0 ? "Up " : "Down ") + Math.abs(s.growth).toFixed(1) + "% on October") +
        stat("Orders", s.orders, "Six months") + stat("Average order", inr(s.aov), "Revenue / orders") + "</div>" +
        '<div id="salesSummary">' + salesNote + '</div><div class="grid two"><div class="card"><h3>Monthly revenue (thousand rupees)</h3>' + Charts.line(D.months, D.revenue, { fmt: function (v) { return Math.round(v); } }) + "</div>" +
        '<div class="card"><h3>November revenue by region</h3>' + Charts.bar(Object.keys(D.regions), Object.keys(D.regions).map(function (r) { return D.regions[r]; }), { fmt: function (v) { return Math.round(v); } }) + "</div></div>" +
        '<div class="card"><h3>Revenue by product</h3><div class="scroll"><table><thead><tr><th>Product</th><th>Revenue</th><th>Share of best seller</th></tr></thead><tbody>' + prods + "</tbody></table></div></div>";
    }
  });
  A.salesSummary = function () {
    var s = Agent.salesStats(), D = DEMO.sales;
    salesNote = '<div class="card note"><h3>Sales summary</h3><ul><li><b>Trend:</b> revenue rose in ' + s.rises + " of " + s.steps + " months and reached " + k(D.revenue[5]) + " in November (" + (s.growth >= 0 ? "+" : "") + s.growth.toFixed(1) + "% on October).</li><li><b>Best month:</b> " + s.best + ".</li><li><b>Top product:</b> " + esc(s.topProduct.name) + " with " + k(s.topProduct.revenue) + ".</li><li><b>Strongest region:</b> " + s.topRegion + " (" + s.regionShare + "% of November revenue).</li></ul></div>";
    App.activity("Generated sales summary"); App.toast("Sales summary ready"); App.renderView();
  };

  /* ================= Expenses ================= */
  var CATS = ["Salaries", "Marketing", "Operations", "Software", "Travel", "Other"];
  App.route("expenses", {
    title: "Expense Management",
    render: function () {
      var e = Agent.expStats(), items = S().expenses.map(function (x) {
        return "<tr><td>" + esc(x.desc) + '</td><td><span class="badge cat">' + esc(x.cat) + "</span></td><td>" + inr(x.amount) + '</td><td><button class="icon-btn" data-act="delExp" data-id="' + x.id + '" aria-label="Delete expense">Delete</button></td></tr>';
      }).join("") || '<tr><td colspan="4" class="empty">No expenses yet. Add one above.</td></tr>';
      return head("Expense management", "Add expenses and see where the money goes.") +
        '<div class="card"><form data-form="expense" class="row-form"><input name="desc" placeholder="Expense description" maxlength="80" required><select name="cat">' + CATS.map(function (c) { return "<option>" + c + "</option>"; }).join("") +
        '</select><input name="amount" type="number" min="1" step="1" placeholder="Amount in rupees" required><button class="btn primary">Add expense</button></form></div>' +
        '<div class="grid stats">' + stat("Total expenses", inr(e.total), S().expenses.length + " entries") + stat("Largest category", e.cats[0] || "None", e.cats[0] ? inr(e.by[e.cats[0]]) : "") + stat("Share of November revenue", e.ratio + "%", "Against " + k(e.rev / 1000)) + "</div>" +
        '<div class="grid two"><div class="card"><h3>Spending by category</h3>' + (e.total ? Charts.donut(e.cats.map(function (c) { return { label: c, value: e.by[c] }; }), { center: Math.round(e.total / 1000) + "k", sub: "total", fmt: inr }) : '<p class="empty">Add an expense to see the chart.</p>') + "</div>" +
        '<div class="card"><h3>Amount by category (rupees)</h3>' + (e.total ? Charts.bar(e.cats, e.cats.map(function (c) { return e.by[c]; }), { fmt: function (v) { return v >= 1000 ? Math.round(v / 1000) + "k" : Math.round(v); } }) : '<p class="empty">No data yet.</p>') + "</div></div>" +
        '<div class="card"><h3>All expenses</h3><div class="scroll"><table><thead><tr><th>Description</th><th>Category</th><th>Amount</th><th></th></tr></thead><tbody>' + items + "</tbody></table></div></div>";
    }
  });
  F.expense = function (f) {
    var amt = Math.round(Number(f.amount.value)), desc = f.desc.value.trim();
    if (!desc || !(amt > 0)) return App.toast("Enter a description and an amount above zero.", "bad");
    S().expenses.unshift({ id: App.id(), desc: desc, cat: f.cat.value, amount: amt });
    App.activity("Added expense: " + desc + " (" + inr(amt) + ")"); App.save(); App.toast("Expense added"); App.renderView();
  };
  A.delExp = function (el) {
    var id = el.getAttribute("data-id"); S().expenses = S().expenses.filter(function (x) { return x.id != id; });
    App.activity("Deleted an expense"); App.save(); App.toast("Expense deleted"); App.renderView();
  };

  /* ================= Customers ================= */
  var STATUS = ["Not started", "Draft ready", "Sent", "Replied"];
  App.route("customers", {
    title: "Customer Management",
    render: function () {
      var cs = S().customers, c = cs.filter(function (x) { return x.id === selCust; })[0] || cs[0];
      if (c) selCust = c.id;
      var rows = cs.map(function (x) {
        return '<tr class="clickable ' + (x.id === selCust ? "sel" : "") + '" data-act="selCust" data-id="' + x.id + '" tabindex="0"><td><b>' + esc(x.name) + "</b><small class=\"muted\">" + esc(x.company) + '</small></td><td><span class="badge st-' + STATUS.indexOf(x.status) + '">' + x.status + "</span></td></tr>";
      }).join("");
      var detail = c ? '<h3>' + esc(c.name) + '</h3><p class="muted">' + esc(c.company) + '</p><dl><dt>Email</dt><dd>' + esc(c.email) + "</dd><dt>Phone</dt><dd>" + esc(c.phone) + "</dd><dt>Last order</dt><dd>" + esc(c.last) + "</dd><dt>Total value</dt><dd>" + k(c.value) +
        '</dd></dl><div class="pipeline">' + STATUS.map(function (s, i) { return '<span class="' + (i <= STATUS.indexOf(c.status) ? "on" : "") + '">' + s + "</span>"; }).join("") + "</div>" +
        '<div class="btns"><button class="btn primary" data-act="makeDraft">Create follow-up message</button>' + (c.draft ? '<button class="btn" data-act="markSent">Mark as sent</button><button class="btn" data-act="markReplied">Mark as replied</button>' : "") + "</div>" +
        (c.draft ? '<pre class="draft">' + esc(c.draft) + '</pre><button class="btn small" data-act="copyDraft">Copy message</button>' : '<p class="muted">No follow-up message yet.</p>') : "";
      var counts = STATUS.map(function (s) { return cs.filter(function (x) { return x.status === s; }).length; });
      return head("Customer management", 'Sample customers and follow-up tracking. <span class="badge demo">Demo data</span>') +
        '<div class="grid stats">' + STATUS.map(function (s, i) { return stat(s, counts[i], "customers"); }).join("") + "</div>" +
        '<div class="grid cust"><div class="card"><h3>Customers</h3><div class="scroll"><table><thead><tr><th>Customer</th><th>Follow-up</th></tr></thead><tbody>' + rows + "</tbody></table></div></div><div class=\"card\">" + detail + "</div></div>";
    }
  });
  function cust() { return S().customers.filter(function (x) { return x.id === selCust; })[0]; }
  A.selCust = function (el) { selCust = Number(el.getAttribute("data-id")); App.renderView(); };
  A.makeDraft = function () { var c = cust(); if (!c) return; c.draft = Agent.followMessage(c); if (c.status === "Not started") c.status = "Draft ready"; App.activity("Created follow-up draft for " + c.name); App.save(); App.toast("Follow-up message created"); App.renderView(); };
  A.markSent = function () { var c = cust(); if (!c) return; c.status = "Sent"; App.activity("Sent follow-up message to " + c.name); App.save(); App.toast("Marked as sent"); App.renderView(); };
  A.markReplied = function () { var c = cust(); if (!c) return; c.status = "Replied"; App.activity(c.name + " replied to the follow-up"); App.save(); App.toast("Marked as replied"); App.renderView(); };
  A.copyDraft = function () {
    var c = cust(); if (!c) return;
    try { navigator.clipboard.writeText(c.draft).then(function () { App.toast("Message copied"); }, function () { App.toast("Copy is blocked here. Select the text and copy it.", "bad"); }); }
    catch (e) { App.toast("Copy is blocked here. Select the text and copy it.", "bad"); }
  };

  /* ================= Reports ================= */
  function reportData() {
    var s = Agent.salesStats(), e = Agent.expStats(), t = Agent.taskStats(), cs = S().customers;
    return { date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), s: s, e: e, t: t,
      pending: S().tasks.filter(function (x) { return !x.done; }), done: S().tasks.filter(function (x) { return x.done; }),
      fu: STATUS.map(function (st) { return [st, cs.filter(function (x) { return x.status === st; }).length]; }) };
  }
  function reportBody(r) {
    var D = DEMO.sales;
    return "<h2>Business Performance Report</h2><p>Generated on " + r.date + " by " + esc(S().settings.name) + ". All figures are demo data.</p>" +
      "<h3>Sales summary</h3><ul><li>Total revenue (Jun to Nov): " + k(r.s.total) + "</li><li>November revenue: " + k(D.revenue[5]) + " (" + (r.s.growth >= 0 ? "+" : "") + r.s.growth.toFixed(1) + "% on October)</li><li>Orders: " + r.s.orders + ", average order " + inr(r.s.aov) + "</li><li>Top product: " + esc(r.s.topProduct.name) + "; strongest region: " + r.s.topRegion + "</li></ul>" +
      "<h3>Expense summary</h3><ul><li>Total expenses: " + inr(r.e.total) + " (" + r.e.ratio + "% of November revenue)</li>" + r.e.cats.map(function (c) { return "<li>" + c + ": " + inr(r.e.by[c]) + "</li>"; }).join("") + "</ul>" +
      "<h3>Tasks</h3><p>" + r.t.done + " completed, " + r.t.pending + " pending (" + r.t.pct + "% complete).</p><p><b>Pending:</b></p><ul>" + (r.pending.map(function (x) { return "<li>" + esc(x.title) + " (" + x.priority + ", due " + App.fmtDay(x.due) + ")</li>"; }).join("") || "<li>None</li>") + "</ul><p><b>Completed:</b></p><ul>" + (r.done.map(function (x) { return "<li>" + esc(x.title) + "</li>"; }).join("") || "<li>None</li>") + "</ul>" +
      "<h3>Customer follow-ups</h3><ul>" + r.fu.map(function (f) { return "<li>" + f[0] + ": " + f[1] + "</li>"; }).join("") + "</ul>";
  }
  App.route("reports", {
    title: "Reports",
    render: function () {
      return head("Reports", "Create a business report from the data in this demo.", '<button class="btn primary" data-act="genReport">Generate report</button>' + (reportShown ? '<button class="btn" data-act="dlReport">Download report</button><button class="btn" data-act="printReport">Print or save as PDF</button>' : "")) +
        '<div class="card report" id="reportOut">' + (reportShown ? reportBody(reportData()) : '<p class="empty">No report yet. Select "Generate report" to create one.</p>') + "</div>";
    }
  });
  A.genReport = function () { reportShown = true; App.activity("Generated business performance report"); App.toast("Report generated"); App.renderView(); };
  A.dlReport = function () {
    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Business Performance Report</title><style>body{font-family:Segoe UI,Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#0b1f3a;line-height:1.5}h2{color:#0f62fe}h3{margin-top:24px}</style></head><body>' + reportBody(reportData()) + "</body></html>";
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.href = url; a.download = "business-report-" + App.dateOffset(0) + ".html"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000); App.activity("Downloaded business report"); App.toast("Report downloaded");
  };
  A.printReport = function () { window.print(); };

  /* ================= Activity ================= */
  App.route("activity", {
    title: "Activity Monitoring",
    render: function () {
      var all = S().activities, list = all.filter(function (a) { return actFilter === "all" || a.status.toLowerCase() === actFilter; });
      var rows = list.map(function (a) { return "<tr><td>" + App.fmtDT(a.ts) + "</td><td>" + esc(a.desc) + '</td><td><span class="badge ' + (a.status === "Success" ? "ok" : "bad") + '">' + a.status + "</span></td></tr>"; }).join("") || '<tr><td colspan="3" class="empty">No activity to show.</td></tr>';
      var tab = function (v, l) { return '<button class="tab ' + (actFilter === v ? "on" : "") + '" data-act="actFilter" data-v="' + v + '">' + l + "</button>"; };
      var ok = all.filter(function (a) { return a.status === "Success"; }).length;
      return head("Activity monitoring", "Every automation run is recorded here.") +
        '<div class="grid stats">' + stat("Total runs", all.length, "In the log") + stat("Successful", ok, successRate() + "% success rate") + stat("Failed", all.length - ok, "Needs attention") + "</div>" +
        '<div class="card"><div class="tabs">' + tab("all", "All") + tab("success", "Success") + tab("failed", "Failed") + '</div><div class="scroll"><table><thead><tr><th>Date and time</th><th>Description</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>";
    }
  });
  A.actFilter = function (el) { actFilter = el.getAttribute("data-v"); App.renderView(); };

  /* ================= Settings ================= */
  App.route("settings", {
    title: "Settings",
    render: function () {
      var s = S().settings, sw = function (key, label) { return '<label class="switch"><input type="checkbox" data-act="toggleSetting" data-key="' + key + '"' + (s[key] ? " checked" : "") + "><span>" + label + "</span></label>"; };
      return head("Settings", "Demo account and local preferences. Nothing leaves this browser.") +
        '<div class="grid two"><div class="card"><h3>Profile (demo account)</h3><form data-form="profile" class="stack"><label>Name<input name="name" value="' + esc(s.name) + '" maxlength="40" required></label><label>Role<input name="role" value="' + esc(s.role) + '" maxlength="40"></label><button class="btn primary">Save profile</button></form></div>' +
        '<div class="card"><h3>Notifications</h3>' + sw("toasts", "Show pop-up notifications") + sw("notifyTask", "Notify when a task is completed") + sw("notifyAgent", "Notify when the agent finishes") + "</div>" +
        '<div class="card"><h3>Appearance and agent</h3><label class="stack">Theme<select data-act="setTheme"><option value="light"' + (s.theme === "light" ? " selected" : "") + '>Light</option><option value="dark"' + (s.theme === "dark" ? " selected" : "") + '>Dark</option></select></label>' +
        '<label class="stack">Agent speed<select data-act="setSpeed"><option value="fast"' + (s.speed === "fast" ? " selected" : "") + '>Fast</option><option value="normal"' + (s.speed === "normal" ? " selected" : "") + '>Normal</option><option value="slow"' + (s.speed === "slow" ? " selected" : "") + '>Slow (best for explaining)</option></select></label><p>Agent status: <span class="pill js-agent">Idle</span></p></div>' +
        '<div class="card"><h3>Data</h3><p class="muted">Demo data is stored in this browser only' + (App.memoryOnly ? " (storage is blocked, so changes last until the page is closed)" : "") + '.</p><button class="btn danger" data-act="resetData">Reset demo data</button></div></div>';
    }
  });
  F.profile = function (f) { S().settings.name = f.name.value.trim() || "Demo User"; S().settings.role = f.role.value.trim(); App.save(); App.toast("Profile saved"); };
  A.toggleSetting = function (el) { S().settings[el.getAttribute("data-key")] = el.checked; App.save(); };
  document.addEventListener("change", function (e) {
    var el = e.target.closest("select[data-act]"); if (!el) return;
    if (el.getAttribute("data-act") === "setTheme") { S().settings.theme = el.value; App.save(); App.applyTheme(); }
    if (el.getAttribute("data-act") === "setSpeed") { S().settings.speed = el.value; App.save(); App.toast("Agent speed updated"); }
    if (el.getAttribute("data-act") === "toggleSetting") A.toggleSetting(el);
  });
  A.resetData = function () {
    if (!confirm("Reset all demo data and settings to the original sample data?")) return;
    chat = []; wf = null; reportShown = false; salesNote = ""; App.reset(false); App.toast("Demo data reset"); App.renderView();
  };

  /* ================= Demo Mode ================= */
  var demoToken = 0;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function banner(text) { var b = App.$("#demoBanner"); b.hidden = !text; App.$("#demoBannerText").textContent = text || ""; }
  function typeInto(input, text, token) {
    return new Promise(function (resolve) {
      var i = 0; input.value = "";
      (function step() { if (token !== demoToken) return resolve(); if (i < text.length) { input.value += text.charAt(i++); setTimeout(step, 28); } else resolve(); })();
    });
  }
  function waitIdle(token) { return new Promise(function (r) { (function chk() { if (!Agent.busy || token !== demoToken) return r(); setTimeout(chk, 150); })(); }); }
  async function askAgent(text, token) {
    var input = App.$("#agentInput"); await typeInto(input, text, token);
    if (token !== demoToken) return; await sleep(300); F.agent(); await sleep(200); await waitIdle(token); await sleep(1500);
  }
  A.demoStart = async function () {
    var token = ++demoToken; App.Act.demoClose();
    chat = []; wf = null; reportShown = false; salesNote = ""; App.reset(true);
    var alive = function () { return token === demoToken; };
    try {
      location.hash = "#dashboard"; App.renderView(); banner("Step 1 of 6: The dashboard opens with preloaded demo data."); await sleep(3200); if (!alive()) return;
      location.hash = "#agent"; await sleep(500); banner("Step 2 of 6: Asking the agent for a sales report."); await askAgent("Prepare a sales report.", token); if (!alive()) return;
      banner("Step 3 of 6: Analysing expenses."); await askAgent("Analyse monthly business expenses.", token); if (!alive()) return;
      location.hash = "#tasks"; await sleep(600); banner("Step 4 of 6: The agent adds a task, then we complete one.");
      S().tasks.unshift({ id: App.id(), title: "Review the Q4 sales report", priority: "High", due: App.dateOffset(1), done: false }); App.activity("Added task: Review the Q4 sales report"); App.save(); App.renderView(); App.toast("Task added"); await sleep(1800); if (!alive()) return;
      var first = S().tasks.filter(function (t) { return !t.done; })[1]; if (first) { first.done = true; App.activity("Marked '" + first.title + "' as completed"); App.save(); App.renderView(); App.toast("Task completed"); } await sleep(2000); if (!alive()) return;
      location.hash = "#customers"; await sleep(600); banner("Step 5 of 6: Creating a follow-up message for a customer."); A.makeDraft(); await sleep(2800); if (!alive()) return;
      location.hash = "#reports"; await sleep(600); banner("Step 6 of 6: Generating the business report."); A.genReport(); await sleep(2500);
      if (alive()) banner("Demo finished. Use the Demo Mode panel to run another example or reset.");
      await sleep(4000); if (alive()) banner("");
    } catch (err) { console.error(err); banner(""); App.toast("The demo was interrupted. You can run it again.", "bad"); }
  };
  A.demoStop = function () { demoToken++; banner(""); App.toast("Demo stopped"); };
  A.demoReset = function () {
    demoToken++; banner(""); chat = []; wf = null; reportShown = false; salesNote = ""; App.reset(true); App.toast("Demo data reset"); App.renderView();
  };
  A.demoSampleTask = function () {
    S().tasks.unshift({ id: App.id(), title: "Review supplier contracts", priority: "Medium", due: App.dateOffset(2), done: false });
    App.activity("Added task: Review supplier contracts"); App.save(); App.toast("Sample task added"); App.renderView();
  };
  A.demoBulkFollow = function () {
    var n = 0; S().customers.forEach(function (c) { if (c.status === "Not started") { c.draft = Agent.followMessage(c); c.status = "Draft ready"; n++; } });
    App.activity("Created " + n + " follow-up drafts automatically"); App.save(); App.toast(n ? n + " follow-up drafts created" : "No customers need a draft"); App.renderView();
  };
  A.demoReport = function () { App.Act.demoClose(); location.hash = "#reports"; setTimeout(A.genReport, 200); };

  /* ---------- start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    App.$("#demoCommands").innerHTML = COMMANDS.slice(0, 4).map(function (c) { return '<button class="chip" data-act="quick" data-cmd="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
    App.start();
  });
})();
