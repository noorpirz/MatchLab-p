/*const path = require("path");
//require("dotenv").config({ path: path.resolve(__dirname, "backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const apiRoutes = require("./routes/generateRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    data: {
      name: "MatchLab API",
      endpoints: ["/health", "/generate", "/pathway", "/guidance"],
    },
  });
});

/*app.use("/", apiRoutes);*/
/*app.use(apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: "NOT_FOUND", message: "Unknown route: " + req.method + " " + req.path },
  });
});

app.use((err, _req, res, _next) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: { code: "SERVER_ERROR", message: err.message || "Internal error" },
  });
});

const PORT = process.env.PORT || 5050;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("MatchLab backend running on http://localhost:" + PORT);
  });
}

module.exports = app;*/

/*const express = require("express");

const app = express();
app.use(express.json());

console.log("SERVER STARTED");

app.get("/", (req, res) => {
  console.log("ROOT HIT");
  res.send("ROOT WORKS");
});

app.get("/health", (req, res) => {
  console.log("HEALTH HIT");
  res.send("HEALTH WORKS");
});

app.post("/generate", (req, res) => {
  console.log("GENERATE HIT");
  res.json({ ok: true });
});

const PORT = 5055;

app.listen(PORT, () => {
  console.log("Running on", PORT);
});*/

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const generateRoutes = require("./routes/generateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/", generateRoutes);

// Error fallback
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    error: "Internal server error",
  });
});

const PORT = 5055;

app.listen(PORT, () => {
  console.log(`MatchLab backend running on http://localhost:${PORT}`);
});
