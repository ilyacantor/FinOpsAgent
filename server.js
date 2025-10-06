const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- /api/unified_data endpoint (mock DCL output) ---
app.get("/api/unified_data", (req, res) => {
  const now = new Date();
  const day = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0,10);
  };

  const usage_timeseries = [
    { date: day(6), vendor: "AWS", cost: 1123 },
    { date: day(5), vendor: "AWS", cost: 1104 },
    { date: day(4), vendor: "AWS", cost: 1680 }, // spike
    { date: day(3), vendor: "AWS", cost: 1188 },
    { date: day(2), vendor: "AWS", cost: 1220 },
    { date: day(1), vendor: "AWS", cost: 1254 },
    { date: day(0), vendor: "AWS", cost: 1272 }
  ];

  res.json({
    period: {
      month_iso: now.toISOString().slice(0,7),
      days_in_month: new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(),
      day_of_month: now.getDate(),
    },
    vendors: [{ name: "AWS", account_id: "1111-2222-3333" }],
    budgets: [{ scope: "vendor", key: "AWS", monthly_budget: 35000 }],
    usage_timeseries
  });
});

// --- Serve your front-end files (optional if using /src) ---
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
