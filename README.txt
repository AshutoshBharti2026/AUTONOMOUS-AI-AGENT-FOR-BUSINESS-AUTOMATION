AUTONOMOUS AI AGENT FOR BUSINESS AUTOMATION - LIVE DEMO
B.Tech project, Noida International University
=======================================================

HOW TO RUN
1. Extract (unzip) this folder.
2. Open index.html in Google Chrome (double-click it, or right-click > Open with > Chrome).
3. Use "Open dashboard" or "Start demo". No installation, server or internet is needed.

HOW TO PRESENT (VIVA)
- Click "Start Demo" (top right) to open Demo Mode.
- "Run guided demo" plays a 6-step walkthrough automatically. "Stop demo" ends it.
- Or click an example command to run it yourself and explain each workflow step.
- "Reset demo data" restores the original sample data at any time.
- Settings > Agent speed > "Slow" gives you more time to explain each step.

PAGES
Dashboard, AI Agent (chat), Workflow, Tasks, Sales, Expenses, Customers, Reports, Activity, Settings.

EXAMPLE INSTRUCTIONS FOR THE AGENT
- Prepare a sales report.
- Analyse monthly business expenses.
- Create a customer follow-up message. (add a name, e.g. "for Priya")
- Summarise business performance.
- Generate a task management report.
- Add task: call the supplier
- Show pending tasks

IMPORTANT - WHAT IS REAL AND WHAT IS SIMULATED
- The "AI agent" is RULE-BASED. It reads keywords in your instruction, picks a matching task,
  and calculates the answer from the data stored in your browser. It is NOT connected to any
  external AI model, API or cloud service, and it does not understand free-form language.
- All business data (sales, customers, expenses, tasks, activity) is SAMPLE DEMO DATA.
- Sales figures are fixed sample values. Tasks, expenses, customers, follow-ups and settings
  can be changed and are saved in the browser (localStorage) on this computer only.
- Follow-up messages are drafts only. No email or message is actually sent.
- Charts are drawn with plain SVG code. No chart library or internet connection is used.
- Reports can be downloaded as an HTML file or printed / saved as PDF with the browser.

LIMITATIONS
- There is no backend server or database; everything runs in the browser.
- If the browser blocks localStorage (some strict privacy modes), the demo still works but
  changes last only until the page is closed.
- Tested for Google Chrome. Other modern browsers should also work.

PROJECT FILES
index.html        Page structure (landing page, app shell, demo panel)
css/style.css     Theme, layout, charts, responsive rules
js/data.js        Sample demo data
js/charts.js      Small SVG chart helpers (line, bar, donut)
js/app.js         State and localStorage, router, notifications, theme
js/agent.js       Rule-based agent and 6-stage workflow engine
js/pages.js       All pages and modules, plus Demo Mode
assets/           Logo and favicon
