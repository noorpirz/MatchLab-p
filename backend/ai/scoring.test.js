/**
 * MatchLab Scoring Engine – Test Suite
 *
 * Run:  node ai/scoring.test.js
 *
 * Tests cover:
 *   1. Skill matching (exact, partial, none, case-insensitive)
 *   2. Interest matching against tags + title + description
 *   3. Complexity / time-commitment fit
 *   4. Composite scoring & ranking order
 *   5. Edge cases (empty inputs, missing fields)
 *   6. Multiple user profiles against a shared project set
 */

const {
  scoreProject,
  rankProjects,
  scoreSkills,
  scoreInterests,
  scoreComplexityFit,
  estimateComplexity,
} = require("./scoring");

// ─── Test Harness ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(60 - title.length)}`);
}

// ─── Mock Projects ──────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "p1",
    title: "Health Dashboard with Predictive Analytics",
    description:
      "Build a web dashboard that visualizes patient metrics and uses simple ML models to flag at-risk cases.",
    requiredSkills: ["Python", "React", "Data Analysis", "SQL"],
    tags: ["healthcare", "data", "machine learning"],
  },
  {
    id: "p2",
    title: "Sustainable Energy Usage Tracker",
    description:
      "A mobile-friendly app that tracks household energy usage, suggests savings, and shows comparisons.",
    requiredSkills: ["JavaScript", "React", "SQL", "Design"],
    tags: ["sustainability", "energy", "mobile"],
  },
  {
    id: "p3",
    title: "AI-Powered Study Buddy",
    description:
      "An education platform that uses NLP to generate quizzes from lecture notes and track student progress.",
    skills: ["Python", "NLP", "React", "Node.js", "MongoDB"],
    tags: ["education", "AI", "NLP"],
  },
  {
    id: "p4",
    title: "Open Source Contribution Finder",
    description:
      "A tool that helps developers find beginner-friendly open source issues matching their skill set.",
    requiredSkills: ["JavaScript", "GitHub API"],
    tags: ["open source", "developer tools"],
  },
  {
    id: "p5",
    title: "Smart Recipe Generator",
    description:
      "Generate personalized meal plans based on dietary preferences, using computer vision to scan pantry items.",
    skills: [
      "Python",
      "TensorFlow",
      "React",
      "Node.js",
      "Computer Vision",
      "Docker",
    ],
    tags: ["food", "AI", "computer vision", "health"],
  },
];

// ─── User Profiles ──────────────────────────────────────────────────────

const USERS = {
  fullStackDataScientist: {
    skills: ["Python", "React", "SQL", "Data Analysis"],
    interests: ["healthcare", "AI", "machine learning"],
    timeCommitment: "high",
  },
  frontEndBeginner: {
    skills: ["JavaScript", "React"],
    interests: ["sustainability", "mobile"],
    timeCommitment: "low",
  },
  mlEngineer: {
    skills: ["Python", "TensorFlow", "NLP", "Docker"],
    interests: ["AI", "education"],
    timeCommitment: "medium",
  },
  noOverlap: {
    skills: ["Rust", "Haskell", "Erlang"],
    interests: ["blockchain", "gaming"],
    timeCommitment: "high",
  },
  emptyProfile: {
    skills: [],
    interests: [],
    timeCommitment: "medium",
  },
};

// ─── 1. Skill Matching ─────────────────────────────────────────────────

section("1. Skill Matching");

(() => {
  const r = scoreSkills(["Python", "React", "SQL", "Data Analysis"], PROJECTS[0]);
  assert(r.score === 100, "Perfect skill match → 100");
  assert(r.matched.length === 4, "All 4 skills matched");
})();

(() => {
  const r = scoreSkills(["Python", "React"], PROJECTS[0]);
  assert(r.score === 50, "2/4 skills → 50");
})();

(() => {
  const r = scoreSkills(["Rust", "Go"], PROJECTS[0]);
  assert(r.score === 0, "No overlap → 0");
  assert(r.matched.length === 0, "Zero matched skills");
})();

(() => {
  const r = scoreSkills(["python", "REACT"], PROJECTS[0]);
  assert(r.score === 50, "Case-insensitive matching works");
})();

(() => {
  const r = scoreSkills(["JavaScript"], { requiredSkills: [] });
  assert(r.score === 0, "Empty project skills → 0");
})();

// ─── 2. Interest Matching ───────────────────────────────────────────────

section("2. Interest Matching");

(() => {
  const r = scoreInterests(
    ["healthcare", "machine learning"],
    PROJECTS[0]
  );
  assert(r.score === 100, "Both interests found in tags → 100");
  assert(r.matched.length === 2, "2 matched interests");
})();

(() => {
  const r = scoreInterests(["sustainability"], PROJECTS[1]);
  assert(r.score === 100, "Single interest in tags → 100");
})();

(() => {
  const r = scoreInterests(["education"], PROJECTS[2]);
  assert(r.score === 100, "Interest found in tags → 100");
})();

(() => {
  const r = scoreInterests(["blockchain", "gaming"], PROJECTS[0]);
  assert(r.score === 0, "No interest overlap → 0");
})();

(() => {
  const r = scoreInterests(["energy"], PROJECTS[1]);
  assert(r.score === 100, "Interest found in description/tags → 100");
})();

// ─── 3. Complexity / Time Fit ───────────────────────────────────────────

section("3. Complexity / Time Commitment Fit");

(() => {
  assert(estimateComplexity(PROJECTS[0]) === "medium", "4 skills → medium");
  assert(estimateComplexity(PROJECTS[3]) === "low", "2 skills → low");
  assert(estimateComplexity(PROJECTS[4]) === "high", "6 skills → high");
})();

(() => {
  const fit = scoreComplexityFit("low", PROJECTS[3]);
  assert(fit === 100, "Low user + low project → 100");
})();

(() => {
  const fit = scoreComplexityFit("high", PROJECTS[4]);
  assert(fit === 100, "High user + high project → 100");
})();

(() => {
  const fit = scoreComplexityFit("low", PROJECTS[4]);
  assert(fit === 10, "Low user + high project → 10 (big mismatch)");
})();

// ─── 4. Composite Scoring ───────────────────────────────────────────────

section("4. Composite Scoring");

(() => {
  const result = scoreProject(USERS.fullStackDataScientist, PROJECTS[0]);
  assert(result.score > 80, `Strong match scores high (got ${result.score})`);
  assert(result.matchedSkills.length === 4, "All skills matched");
  assert(result.breakdown.skillScore === 100, "Skill sub-score = 100");
})();

(() => {
  const result = scoreProject(USERS.noOverlap, PROJECTS[0]);
  assert(result.score < 20, `No-overlap user scores low (got ${result.score})`);
})();

(() => {
  const result = scoreProject(USERS.emptyProfile, PROJECTS[0]);
  assert(
    result.score <= 15,
    `Empty profile scores very low (got ${result.score})`
  );
})();

// ─── 5. Ranking Order ──────────────────────────────────────────────────

section("5. Ranking Order (Full-Stack Data Scientist)");

(() => {
  const ranked = rankProjects(USERS.fullStackDataScientist, PROJECTS);
  console.log(
    "    Ranking:",
    ranked.map((p) => `${p.id}:${p.score}`).join(" > ")
  );
  assert(ranked[0].id === "p1", "Health Dashboard ranked #1 for data scientist");
  assert(
    ranked[0].score >= ranked[1].score,
    "Scores are in descending order"
  );
  const allDescending = ranked.every(
    (p, i) => i === 0 || ranked[i - 1].score >= p.score
  );
  assert(allDescending, "Entire list is sorted descending");
})();

section("5b. Ranking Order (Front-End Beginner)");

(() => {
  const ranked = rankProjects(USERS.frontEndBeginner, PROJECTS);
  console.log(
    "    Ranking:",
    ranked.map((p) => `${p.id}:${p.score}`).join(" > ")
  );
  assert(
    ranked[0].id === "p2" || ranked[0].id === "p4",
    `JS/React projects ranked highest (got ${ranked[0].id})`
  );
  const allDescending = ranked.every(
    (p, i) => i === 0 || ranked[i - 1].score >= p.score
  );
  assert(allDescending, "Entire list is sorted descending");
})();

section("5c. Ranking Order (ML Engineer)");

(() => {
  const ranked = rankProjects(USERS.mlEngineer, PROJECTS);
  console.log(
    "    Ranking:",
    ranked.map((p) => `${p.id}:${p.score}`).join(" > ")
  );
  assert(
    ranked[0].id === "p3" || ranked[0].id === "p5",
    `AI/NLP projects ranked highest (got ${ranked[0].id})`
  );
})();

section("5d. Ranking Order (No-Overlap User)");

(() => {
  const ranked = rankProjects(USERS.noOverlap, PROJECTS);
  console.log(
    "    Ranking:",
    ranked.map((p) => `${p.id}:${p.score}`).join(" > ")
  );
  assert(ranked[0].score < 25, `Best score still low (got ${ranked[0].score})`);
})();

// ─── 6. Edge Cases ──────────────────────────────────────────────────────

section("6. Edge Cases");

(() => {
  const ranked = rankProjects(USERS.emptyProfile, PROJECTS);
  assert(ranked.length === PROJECTS.length, "All projects still returned");
  assert(ranked[0].score <= 15, "All scores low for empty profile");
})();

(() => {
  const ranked = rankProjects(USERS.fullStackDataScientist, []);
  assert(ranked.length === 0, "Empty project list returns empty");
})();

(() => {
  const sparse = { title: "Bare Project", description: "" };
  const result = scoreProject(USERS.fullStackDataScientist, sparse);
  assert(typeof result.score === "number", "Handles project missing skills/tags");
})();

(() => {
  const result = scoreProject({}, PROJECTS[0]);
  assert(typeof result.score === "number", "Handles user with no fields");
})();

// ─── 7. Detailed Breakdown Dump ─────────────────────────────────────────

section("7. Full Breakdown – Full-Stack Data Scientist");

(() => {
  const ranked = rankProjects(USERS.fullStackDataScientist, PROJECTS);
  ranked.forEach((p, i) => {
    console.log(
      `    #${i + 1}  ${p.title}` +
        `\n         Score: ${p.score}  |  Skills: ${p.breakdown.skillScore}  |  Interest: ${p.breakdown.interestScore}  |  Complexity: ${p.breakdown.complexityFit}` +
        `\n         Matched skills: [${p.matchedSkills.join(", ")}]  Matched interests: [${p.matchedInterests.join(", ")}]`
    );
  });
})();

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(66)}`);
console.log(`  Results:  ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(66)}\n`);

process.exit(failed > 0 ? 1 : 0);
