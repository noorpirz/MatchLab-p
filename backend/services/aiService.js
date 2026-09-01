/**
 * Backend AI service layer.
 *
 * Bridges the route controllers with the AI agent + scoring engine and
 * normalizes every response to a single envelope shape:
 *
 *   { ok: true,  data: <payload>, meta: { confidence, source, ... } }
 *   { ok: false, error: { code, message, details? } }
 */

const aiAgent = require("../ai/ai_agent");
const { rankProjects } = require("../ai/scoring");

// ── Validation helpers ────────────────────────────────────────────────────

function validateProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return "Profile is required.";
  }
  const { skills, interests } = profile;
  if (!Array.isArray(skills) || skills.length === 0) {
    return "At least one skill is required.";
  }
  if (!Array.isArray(interests) || interests.length === 0) {
    return "At least one interest is required.";
  }
  return null;
}

function validateProject(project) {
  if (!project || typeof project !== "object") return "Project is required.";
  if (!project.title || typeof project.title !== "string") {
    return "Project must include a title.";
  }
  return null;
}

function validateGuidanceCtx(ctx) {
  if (!ctx || typeof ctx !== "object") return "Context is required.";
  if (!ctx.question || typeof ctx.question !== "string") {
    return "A question is required.";
  }
  if (ctx.question.trim().length < 3) {
    return "Question is too short — please provide more detail.";
  }
  return null;
}

// ── Generate ranked projects ──────────────────────────────────────────────

async function getRankedProjects(profile) {
  const err = validateProfile(profile);
  if (err) return { ok: false, error: { code: "INVALID_INPUT", message: err } };

  const { data: projects, confidence, source } = await aiAgent.generateProjects(profile);

  // Defensive: ensure we have an array.
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      ok: false,
      error: {
        code: "AI_EMPTY",
        message: "AI did not return any projects. Please try again.",
      },
    };
  }

  const ranked = rankProjects(profile, projects);

  return {
    ok: true,
    data: ranked,
    meta: {
      confidence,
      source,
      count: ranked.length,
      profileEcho: profile,
    },
  };
}

// ── Generate a learning pathway ───────────────────────────────────────────

async function getPathway(project, userSkills = []) {
  const err = validateProject(project);
  if (err) return { ok: false, error: { code: "INVALID_INPUT", message: err } };

  const { data: pathway, confidence, source } = await aiAgent.generatePathway(
    project,
    userSkills
  );

  if (!pathway || !Array.isArray(pathway.steps) || pathway.steps.length === 0) {
    return {
      ok: false,
      error: {
        code: "AI_EMPTY",
        message: "Could not build a pathway for this project.",
      },
    };
  }

  // Normalize step ordering & required fields.
  pathway.steps = pathway.steps
    .map((s, i) => ({
      order: typeof s.order === "number" ? s.order : i + 1,
      title: s.title || `Step ${i + 1}`,
      description: s.description || "",
      resources: Array.isArray(s.resources) ? s.resources : [],
      skill: s.skill || "",
    }))
    .sort((a, b) => a.order - b.order);

  return {
    ok: true,
    data: pathway,
    meta: { confidence, source, stepCount: pathway.steps.length },
  };
}

// ── Generate contextual guidance ──────────────────────────────────────────

async function getGuidance(ctx) {
  const err = validateGuidanceCtx(ctx);
  if (err) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: err },
    };
  }

  const { data: guidance, confidence, source } = await aiAgent.generateGuidance(ctx);

  if (!guidance || !guidance.answer) {
    return {
      ok: false,
      error: { code: "AI_EMPTY", message: "No guidance could be generated." },
    };
  }

  // If confidence is low, surface a clarifying-question flag for the UI.
  const needsClarification = confidence === "low";

  return {
    ok: true,
    data: guidance,
    meta: {
      confidence,
      source,
      needsClarification,
    },
  };
}

module.exports = {
  getRankedProjects,
  getPathway,
  getGuidance,
  // Re-exported for legacy callers / tests
  validateProfile,
  validateProject,
  validateGuidanceCtx,
};
