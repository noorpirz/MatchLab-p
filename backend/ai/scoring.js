/**
 * MatchLab Project Scoring & Ranking Engine
 *
 * Scores and ranks projects based on how well they match a user profile.
 *
 * ── User Input Format ──────────────────────────────────────────────────
 * {
 *   skills:         string[]   – e.g. ["Python", "React", "SQL"]
 *   interests:      string[]   – e.g. ["healthcare", "AI", "sustainability"]
 *   timeCommitment: "low" | "medium" | "high"
 * }
 *
 * ── Project Format (from Gemini AI agent or mock data) ─────────────────
 * {
 *   title:          string
 *   description:    string
 *   skills | requiredSkills:  string[]   – accepts either key
 *   tags:           string[]              – optional
 * }
 *
 * ── Output Format ──────────────────────────────────────────────────────
 * [
 *   {
 *     ...project,
 *     score:        number   – 0‒100 composite score
 *     breakdown: {
 *       skillScore:     number – 0‒100
 *       interestScore:  number – 0‒100
 *       complexityFit:  number – 0‒100
 *     }
 *     matchedSkills:    string[]
 *     matchedInterests: string[]
 *   }
 * ]
 *
 * ── Scoring Weights ────────────────────────────────────────────────────
 *   skill match      = 60 %
 *   interest match   = 25 %
 *   complexity fit   = 15 %
 */

// ─── Helpers ────────────────────────────────────────────────────────────

const normalize = (s) => s.toLowerCase().trim();

const COMPLEXITY_TIERS = { low: 3, medium: 5, high: 8 };

function getProjectSkills(project) {
  return (project.requiredSkills || project.skills || []).map(normalize);
}

function getProjectTags(project) {
  return (project.tags || []).map(normalize);
}

/**
 * Rough heuristic: project complexity ~ number of required skills.
 * Maps to "low" (1‒3), "medium" (4‒5), "high" (6+).
 */
function estimateComplexity(project) {
  const count = getProjectSkills(project).length;
  if (count <= 3) return "low";
  if (count <= 5) return "medium";
  return "high";
}

// ─── Individual Scorers ─────────────────────────────────────────────────

function scoreSkills(userSkills, project) {
  const projSkills = getProjectSkills(project);
  if (projSkills.length === 0) return { score: 0, matched: [] };

  const userSet = new Set(userSkills.map(normalize));
  const matched = projSkills.filter((s) => userSet.has(s));

  return {
    score: Math.round((matched.length / projSkills.length) * 100),
    matched,
  };
}

function scoreInterests(userInterests, project) {
  const haystack = [
    ...getProjectTags(project),
    normalize(project.title || ""),
    normalize(project.description || ""),
  ].join(" ");

  const normalizedInterests = userInterests.map(normalize);
  const matched = normalizedInterests.filter((interest) =>
    haystack.includes(interest)
  );

  if (normalizedInterests.length === 0) return { score: 0, matched: [] };

  return {
    score: Math.round((matched.length / normalizedInterests.length) * 100),
    matched,
  };
}

function scoreComplexityFit(timeCommitment, project) {
  const userTier = COMPLEXITY_TIERS[timeCommitment] ?? COMPLEXITY_TIERS.medium;
  const projTier = COMPLEXITY_TIERS[estimateComplexity(project)];
  const diff = Math.abs(userTier - projTier);

  if (diff === 0) return 100;
  if (diff <= 2) return 70;
  if (diff <= 4) return 40;
  return 10;
}

// ─── Weights ────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { skill: 0.6, interest: 0.25, complexity: 0.15 };

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Score a single project against a user profile.
 */
function scoreProject(user, project, weights = DEFAULT_WEIGHTS) {
  const { skills = [], interests = [], timeCommitment = "medium" } = user;

  const skillResult = scoreSkills(skills, project);
  const interestResult = scoreInterests(interests, project);
  const complexityFit = scoreComplexityFit(timeCommitment, project);

  const composite = Math.round(
    skillResult.score * weights.skill +
      interestResult.score * weights.interest +
      complexityFit * weights.complexity
  );

  return {
    ...project,
    score: composite,
    breakdown: {
      skillScore: skillResult.score,
      interestScore: interestResult.score,
      complexityFit,
    },
    matchedSkills: skillResult.matched,
    matchedInterests: interestResult.matched,
  };
}

/**
 * Rank an array of projects for a given user (highest score first).
 */
function rankProjects(user, projects, weights = DEFAULT_WEIGHTS) {
  return projects
    .map((p) => scoreProject(user, p, weights))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  scoreProject,
  rankProjects,
  // Exported for testing internals
  scoreSkills,
  scoreInterests,
  scoreComplexityFit,
  estimateComplexity,
  DEFAULT_WEIGHTS,
};
