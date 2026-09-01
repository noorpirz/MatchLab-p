/**
 * End-to-end integration test for MatchLab's AI workflow.
 *
 * Boots the express app in-process (no port needed), then drives the full
 * pipeline against multiple user profiles and edge cases.
 *
 *   node scripts/integration_test.js
 *
 * Exit code 0 = all assertions passed.  Non-zero = at least one failure.
 */

const http = require("http");
const app = require("../server");

let pass = 0;
let fail = 0;

function assert(cond, label) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

// ── Tiny request helper using the in-process server ───────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const data = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": data ? Buffer.byteLength(data) : 0,
          },
        },
        (res) => {
          let chunks = "";
          res.on("data", (c) => (chunks += c));
          res.on("end", () => {
            server.close();
            try {
              resolve({ status: res.statusCode, json: JSON.parse(chunks || "{}") });
            } catch {
              resolve({ status: res.statusCode, json: null, raw: chunks });
            }
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (data) req.write(data);
      req.end();
    });
  });
}

// ── Test profiles ─────────────────────────────────────────────────────────

const profiles = [
  {
    name: "Backend-leaning healthcare dev",
    profile: { skills: ["Python", "SQL"], interests: ["healthcare", "AI"], timeCommitment: "high" },
  },
  {
    name: "Frontend-leaning sustainability dev",
    profile: { skills: ["JavaScript", "React", "CSS"], interests: ["sustainability"], timeCommitment: "medium" },
  },
  {
    name: "Beginner",
    profile: { skills: ["HTML"], interests: ["games"], timeCommitment: "low" },
  },
];

async function runHappyPath(label, profile) {
  console.log(`\n▶ ${label}`);
  const gen = await request("POST", "/generate", profile);
  assert(gen.status === 200, "/generate returns 200");
  assert(gen.json.ok === true, "/generate ok=true");
  assert(Array.isArray(gen.json.data) && gen.json.data.length > 0, "/generate has projects");
  assert(typeof gen.json.data[0].score === "number", "projects are scored");
  assert(
    gen.json.data.every((p, i, arr) => i === 0 || arr[i - 1].score >= p.score),
    "projects are sorted by score desc"
  );
  assert(["high", "medium", "low"].includes(gen.json.meta.confidence), "meta.confidence present");

  const top = gen.json.data[0];
  const pw = await request("POST", "/pathway", { project: top, userSkills: profile.skills });
  assert(pw.status === 200, "/pathway returns 200");
  assert(pw.json.ok === true, "/pathway ok=true");
  assert(Array.isArray(pw.json.data.steps) && pw.json.data.steps.length >= 3, "pathway has >=3 steps");
  assert(
    pw.json.data.steps.every((s, i, arr) => i === 0 || arr[i - 1].order < s.order),
    "pathway steps ordered"
  );

  const step = pw.json.data.steps[0];
  const gd = await request("POST", "/guidance", {
    question: "How should I approach this step practically?",
    step,
    project: top,
  });
  assert(gd.status === 200, "/guidance returns 200");
  assert(gd.json.ok === true, "/guidance ok=true");
  assert(typeof gd.json.data.answer === "string" && gd.json.data.answer.length > 10, "guidance has answer");
  assert(Array.isArray(gd.json.data.hints), "guidance has hints array");
}

async function runEdgeCases() {
  console.log("\n▶ Edge cases");

  // Missing skills
  let r = await request("POST", "/generate", { interests: ["AI"] });
  assert(r.status === 400, "missing skills → 400");
  assert(r.json.ok === false && r.json.error.code === "INVALID_INPUT", "missing skills error code");

  // Missing interests
  r = await request("POST", "/generate", { skills: ["Python"] });
  assert(r.status === 400, "missing interests → 400");

  // Missing project on /pathway
  r = await request("POST", "/pathway", {});
  assert(r.status === 400, "missing project → 400");

  // Project without title
  r = await request("POST", "/pathway", { project: { description: "x" } });
  assert(r.status === 400, "project without title → 400");

  // Empty question
  r = await request("POST", "/guidance", { question: "" });
  assert(r.status === 400, "empty question → 400");

  // Very short question
  r = await request("POST", "/guidance", { question: "?" });
  assert(r.status === 400, "too-short question → 400");

  // Unclear question (valid length but vague) — should succeed but flag low confidence
  r = await request("POST", "/guidance", {
    question: "I am stuck, help me out",
    step: { title: "Build the core feature" },
    project: { title: "Demo" },
  });
  assert(r.status === 200, "vague question → 200 (handled, not error)");
  assert(r.json.ok === true, "vague question ok=true");
  assert(
    typeof r.json.data.confidence === "string",
    "vague question returns a confidence label"
  );

  // 404 unknown route
  r = await request("POST", "/nope", {});
  assert(r.status === 404, "unknown route → 404");
  assert(r.json.error?.code === "NOT_FOUND", "unknown route error code");
}

(async () => {
  console.log("MatchLab — full workflow integration test\n");
  console.log("=".repeat(50));

  // Health check
  const h = await request("GET", "/health");
  assert(h.status === 200 && h.json.ok === true, "/health ok");

  for (const p of profiles) {
    await runHappyPath(p.name, p.profile);
  }

  await runEdgeCases();

  console.log("\n" + "=".repeat(50));
  console.log(`Passed: ${pass}   Failed: ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(2);
});
