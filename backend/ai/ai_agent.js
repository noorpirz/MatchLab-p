/**
 * MatchLab AI Agent
 *
 * Wraps Google Gemini to power three core capabilities:
 *   1. generateProjects(profile)  – ranked project ideas tailored to a user profile
 *   2. generatePathway(project)   – step-by-step learning pathway for a chosen project
 *   3. generateGuidance(ctx)      – contextual help when a user is stuck on a step
 *
 * Each function:
 *   • Returns a STRUCTURED object with `data`, `confidence`, and `source`.
 *   • Falls back to deterministic mock data if `GEMINI_API_KEY` is missing or the
 *     model returns malformed JSON.  This keeps the full workflow demo-able offline.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { GoogleGenerativeAI } = require("@google/generative-ai");

const HAS_KEY =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

const genAI = HAS_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const MODEL_NAME = "gemini-2.5-flash";

// ── Prompt templates ──────────────────────────────────────────────────────

const PROJECT_SYSTEM_PROMPT = `You are a CS project idea generator for students building their portfolio.

RULES:
- Every item MUST be a specific, codeable software project — NOT a job, role, or career description
- NEVER output titles like "Machine Learning Engineer", "Data Scientist", "Backend Developer"
- NEVER use the words "role", "responsibilities", "position", "career"
- Each project must be something a student can open their laptop and start coding today

Respond with VALID JSON ONLY — no markdown, no explanation.

Return exactly this shape:
[
  {
    "title": "string – name of the app or tool (e.g. 'Spam Email Classifier API')",
    "description": "string – 2 sentences describing what it does and what you build",
    "skills": ["string"],
    "tags": ["string"],
    "difficulty": "low" | "medium" | "high"
  }
]`;

const PATHWAY_SYSTEM_PROMPT = `You are MatchLab's learning-pathway designer. Given a chosen project (title, description, skills) and the user's current skills, produce a clear, ordered learning pathway of 5-7 steps to take the user from their starting point to a working prototype.

Do NOT include emojis or unique symbols. 

Respond with VALID JSON ONLY.


Schema:
{
  "summary": "string – 1-2 sentence overview of the pathway",
  "estimatedHours": number,
  "steps": [
    {
      "order": number,
      "title": "string – short imperative title",
      "description": "string – what the user actually does",
      "resources": ["string – optional doc/tutorial title"],
      "skill": "string – primary skill practiced"
    }
  ]
}`;

const GUIDANCE_SYSTEM_PROMPT = `You are MatchLab's contextual mentor. The user is partway through a project pathway and asks a question. Provide focused, beginner-friendly guidance grounded in the current step.

Respond with VALID JSON ONLY.

Schema:
{
  "answer": "string – direct answer to the question",
  "hints": ["string – 1-3 actionable hints"],
  "nextAction": "string – what the user should try next",
  "confidence": "high" | "medium" | "low"
}`;

// ── Internal helpers ──────────────────────────────────────────────────────

function safeJsonParse(raw) {
  if (!raw) return null;
  // Strip code fences in case the model ignored instructions.
  const cleaned = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first JSON block.
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callGemini(systemPrompt, userPrompt, temperature = 0.7) {
  if (!HAS_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature },
    });
    const raw = result.response.text() || "";
    return safeJsonParse(raw);
  } catch (err) {
    console.error("[ai_agent] Gemini call failed:", err.message);
    return null;
  }
}

// ── Mock fallbacks (used when no API key or parsing fails) ────────────────

function mockProjects(profile) {
  const interests = (profile.interests || []).join(", ") || "general tech";
  const skills = profile.skills || ["JavaScript"];
  return [
    {
      title: `${interests.split(",")[0].trim() || "Smart"} Insights Dashboard`,
      description: `Build a web dashboard that analyzes ${interests} data and surfaces actionable insights using ${skills.join(" + ")}.`,
      skills: [...skills.slice(0, 3), "Data Visualization"],
      tags: [...(profile.interests || []).slice(0, 2), "dashboard"],
      difficulty: "medium",
    },
    {
      title: "Community Match Bot",
      description: `Create a chatbot that connects users with collaborators in the ${interests} space, recommending teammates based on shared goals.`,
      skills: [...skills.slice(0, 2), "NLP", "API Design"],
      tags: ["chatbot", "community"],
      difficulty: "high",
    },
    {
      title: "Daily Habit Tracker",
      description: `A lightweight tracker that helps users build habits in ${interests}, with streaks and weekly summaries.`,
      skills: skills.slice(0, 2),
      tags: ["productivity", "wellness"],
      difficulty: "low",
    },
  ];
}

function mockPathway(project) {
  const skills = project.skills || project.requiredSkills || ["JavaScript"];
  return {
    summary: `A 5-step path to build a working prototype of "${project.title}".`,
    estimatedHours: 18,
    steps: [
      {
        order: 1,
        title: "Set up your environment",
        description: `Install the tools you'll need (${skills.slice(0, 2).join(", ")}) and scaffold a new repo.`,
        resources: ["Official getting-started guide"],
        skill: skills[0] || "Setup",
      },
      {
        order: 2,
        title: "Sketch the data model",
        description: "Draft the core entities and how they relate. Keep it small — you can extend later.",
        resources: ["Domain-modeling primer"],
        skill: "Design",
      },
      {
        order: 3,
        title: "Build the core feature",
        description: `Implement the main capability of ${project.title}. Skip styling for now.`,
        resources: [],
        skill: skills[1] || skills[0] || "Coding",
      },
      {
        order: 4,
        title: "Connect a basic UI",
        description: "Wire a minimal interface so a real user can interact with the core feature.",
        resources: [],
        skill: "Frontend",
      },
      {
        order: 5,
        title: "Test, polish, and demo",
        description: "Add a few tests, iron out the rough edges, and record a 60-second demo.",
        resources: ["Testing 101"],
        skill: "QA",
      },
    ],
  };
}

function mockGuidance({ question = "", step = {} }) {
  const q = question.toLowerCase();
  const stepTitle = step.title || "the current step";
  const unclear = q.length < 8 || /^(help|idk|stuck|\?+)$/i.test(q.trim());

  if (unclear) {
    return {
      answer: `It sounds like you're stuck on "${stepTitle}", but I need a bit more detail to help. What specifically isn't working — an error message, a concept, or where to start?`,
      hints: [
        "Re-read the step description and identify the first action you don't understand.",
        "Try writing down what you expected vs. what happened.",
      ],
      nextAction: "Reply with the exact error or the part of the step you're unsure about.",
      confidence: "low",
    };
  }

  return {
    answer: `For "${stepTitle}", break it into 3 concrete actions:
1. Identify inputs and outputs
2. Implement a minimal working version
3. Test with one example dataset or case`,
    hints: [
      "Break the step into 2-3 sub-tasks and tackle them one at a time.",
      "Search for a concrete example that matches your stack and adapt it.",
      "Commit your progress before refactoring.",
    ],
    nextAction: "Try implementing the smallest piece end-to-end, then iterate.",
    confidence: "medium",
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Generate ranked project ideas from a user profile.
 * @param {{skills?: string[], interests?: string[], timeCommitment?: string}} profile
 */
/*async function generateProjects(profile = {}) {
  const userPrompt = `User profile:
- skills: ${JSON.stringify(profile.skills || [])}
- interests: ${JSON.stringify(profile.interests || [])}
- timeCommitment: ${profile.timeCommitment || "medium"}

Generate 3 CS student portfolio projects they can build with these skills.
Return a JSON array. Each item is a coding project, not a job or career.`;

  const aiData = await callGemini(PROJECT_SYSTEM_PROMPT, userPrompt, 0.8);
  if (Array.isArray(aiData) && aiData.length > 0) {
    return { data: aiData, confidence: "high", source: "gemini" };
  }
  return { data: mockProjects(profile), confidence: "medium", source: "mock" };
}*/
function looksLikeJobDescription(item) {
  const jobWords = ["engineer", "scientist", "developer", "role", "responsibilities",
    "position", "career", "deploy machine learning", "why it fits", "this role",
    "production environment", "enterprise"];
  const text = JSON.stringify(item).toLowerCase();
  return jobWords.some(word => text.includes(word));
}

async function generateProjects(profile = {}) {
  const userPrompt = `Return a JSON array of 3 coding projects a CS student can build.
Skills: ${JSON.stringify(profile.skills || [])}
Interests: ${JSON.stringify(profile.interests || [])}

Each item must follow this exact shape:
{ "title": "Name of the App", "description": "What it does and what you build.", "skills": ["Python"], "tags": ["ai"], "difficulty": "medium" }

Example good title: "Spam Email Classifier Web App"
Example bad title: "Machine Learning Engineer"

ONLY return the JSON array. No explanation. No job titles.`;

  const aiData = await callGemini(PROJECT_SYSTEM_PROMPT, userPrompt, 0.8);

  // Validate — if any item looks like a job description, reject and use mock
  if (Array.isArray(aiData) && aiData.length > 0) {
    const hasJobOutput = aiData.some(looksLikeJobDescription);
    if (!hasJobOutput) {
      return { data: aiData, confidence: "high", source: "gemini" };
    }
    console.warn("[ai_agent] Gemini returned job descriptions, falling back to mock");
  }

  return { data: mockProjects(profile), confidence: "medium", source: "mock" };
}

/**
 * Generate a learning pathway for a chosen project, given the user's current skills.
 * @param {object} project
 * @param {string[]} userSkills
 */
async function generatePathway(project = {}, userSkills = []) {
  const userPrompt = `Chosen project: ${JSON.stringify(project)}
User's current skills: ${JSON.stringify(userSkills)}

Produce a learning pathway from where they are to a working prototype.`;

  const aiData = await callGemini(PATHWAY_SYSTEM_PROMPT, userPrompt, 0.6);
  if (aiData && Array.isArray(aiData.steps) && aiData.steps.length > 0) {
    return { data: aiData, confidence: "high", source: "gemini" };
  }
  return { data: mockPathway(project), confidence: "medium", source: "mock" };
}

/**
 * Generate contextual guidance for a user question on a specific pathway step.
 * @param {{ question: string, step?: object, project?: object }} ctx
 */
async function generateGuidance(ctx = {}) {
  const { question = "", step = {}, project = {} } = ctx;

  const userPrompt = `Project: ${JSON.stringify({
    title: project.title,
    description: project.description,
  })}
Current step: ${JSON.stringify(step)}
User question: "${question}"

Answer ONLY based on the provided step.

Be extremely specific:
- mention exact tools/libraries when possible
- give concrete code-level or implementation guidance
- avoid generic motivational advice
- never mention careers or job roles`;

  const aiData = await callGemini(GUIDANCE_SYSTEM_PROMPT, userPrompt, 0.5);
  if (aiData && typeof aiData.answer === "string") {
    return {
      data: aiData,
      confidence: aiData.confidence || "high",
      source: "gemini",
    };
  }
  const mock = mockGuidance({ question, step });
  return { data: mock, confidence: mock.confidence, source: "mock" };
}

module.exports = {
  generateProjects,
  generatePathway,
  generateGuidance,
  // exposed for tests
  _internals: { safeJsonParse, mockProjects, mockPathway, mockGuidance, HAS_KEY },
};

// CLI: `node ai/ai_agent.js generate "machine learning"`
if (require.main === module) {
  const [, , cmd = "generate", ...rest] = process.argv;
  const arg = rest.join(" ") || "machine learning";

  (async () => {
    if (cmd === "generate") {
      const out = await generateProjects({
        skills: ["Python", "React"],
        interests: arg.split(",").map((s) => s.trim()),
        timeCommitment: "medium",
      });
      console.log(JSON.stringify(out, null, 2));
    } else if (cmd === "pathway") {
      const out = await generatePathway(
        { title: arg, description: "Demo project", skills: ["Python", "React"] },
        ["Python"]
      );
      console.log(JSON.stringify(out, null, 2));
    } else if (cmd === "guidance") {
      const out = await generateGuidance({
        question: arg,
        step: { title: "Build the core feature", description: "Implement the main capability." },
        project: { title: "Demo project" },
      });
      console.log(JSON.stringify(out, null, 2));
    } else {
      console.error("Usage: node ai/ai_agent.js [generate|pathway|guidance] <input>");
      process.exit(1);
    }
  })();
}
