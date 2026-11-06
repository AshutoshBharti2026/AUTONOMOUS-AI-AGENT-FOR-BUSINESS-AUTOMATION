/* ==========================================================
   data.js - Demo data (clearly sample data, not real business data)
   ========================================================== */
window.DEMO = {
  sales: {
    // values in thousand rupees
    months: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    revenue: [420, 480, 455, 570, 630, 710],
    orders: [310, 352, 339, 421, 468, 520],
    regions: { North: 240, South: 210, East: 120, West: 140 }, // November
    products: [
      { name: "Workflow Suite", revenue: 1280 },
      { name: "Analytics Pack", revenue: 940 },
      { name: "Support Desk", revenue: 690 },
      { name: "Mobile Add-on", revenue: 355 }
    ]
  },
  tasks: [
    { title: "Send invoices to November clients", priority: "High", due: 0, done: true },
    { title: "Update inventory spreadsheet", priority: "Medium", due: 0, done: true },
    { title: "Schedule team review meeting", priority: "Low", due: 1, done: true },
    { title: "Reconcile vendor payments", priority: "High", due: 0, done: true },
    { title: "Prepare Q4 sales presentation", priority: "High", due: 2, done: false },
    { title: "Follow up with pending customers", priority: "Medium", due: 1, done: false },
    { title: "Review monthly expense report", priority: "Medium", due: 3, done: false },
    { title: "Renew software licences", priority: "Low", due: 5, done: false }
  ],
  expenses: [
    { desc: "Team salaries (November)", cat: "Salaries", amount: 180000 },
    { desc: "Social media advertising", cat: "Marketing", amount: 32000 },
    { desc: "Office rent", cat: "Operations", amount: 45000 },
    { desc: "Cloud hosting", cat: "Software", amount: 18500 },
    { desc: "Client visit travel", cat: "Travel", amount: 14200 },
    { desc: "Design software licences", cat: "Software", amount: 9800 },
    { desc: "Internet and electricity", cat: "Operations", amount: 11600 },
    { desc: "Email campaign tool", cat: "Marketing", amount: 6500 }
  ],
  customers: [
    { name: "Aarav Sharma", company: "BrightMart Retail", email: "aarav@example.com", phone: "+91 90000 00001", last: "12 Oct 2026", value: 185, status: "Not started" },
    { name: "Neha Verma", company: "Verma Textiles", email: "neha@example.com", phone: "+91 90000 00002", last: "28 Oct 2026", value: 142, status: "Sent" },
    { name: "Rohan Gupta", company: "Gupta Logistics", email: "rohan@example.com", phone: "+91 90000 00003", last: "03 Nov 2026", value: 260, status: "Replied" },
    { name: "Priya Nair", company: "Nair Foods", email: "priya@example.com", phone: "+91 90000 00004", last: "21 Sep 2026", value: 98, status: "Not started" },
    { name: "Imran Khan", company: "Khan Electronics", email: "imran@example.com", phone: "+91 90000 00005", last: "30 Oct 2026", value: 210, status: "Sent" },
    { name: "Sneha Reddy", company: "Reddy Clinics", email: "sneha@example.com", phone: "+91 90000 00006", last: "15 Oct 2026", value: 120, status: "Not started" },
    { name: "Vikram Singh", company: "Singh Auto Parts", email: "vikram@example.com", phone: "+91 90000 00007", last: "05 Nov 2026", value: 175, status: "Replied" },
    { name: "Anjali Mehta", company: "Mehta Studios", email: "anjali@example.com", phone: "+91 90000 00008", last: "09 Oct 2026", value: 76, status: "Not started" }
  ],
  // minutesAgo, description, status
  activities: [
    [12, "Generated monthly sales summary", "Success"],
    [35, "Sent follow-up message to Neha Verma", "Success"],
    [80, "Categorised 8 expenses automatically", "Success"],
    [140, "Synced customer list (demo connector offline)", "Failed"],
    [260, "Marked 'Reconcile vendor payments' as completed", "Success"],
    [400, "Generated task management report", "Success"],
    [700, "Scheduled reminder for pending invoices", "Success"],
    [1500, "Imported sample bank statement (file format not supported)", "Failed"],
    [1700, "Created follow-up draft for Imran Khan", "Success"],
    [2900, "Generated business performance report", "Success"]
  ]
};
