/*const express = require("express");
const router = express.Router();

const { generateController } = require("../controllers/generateController");

// Root test route
router.get("/", (req, res) => {
  return res.send("ROOT OK");
});

// Health check route
router.get("/health", (req, res) => {
  console.log("HEALTH HIT");
  return res.send("HEALTH OK");
});

// Main AI route
router.post("/generate", generateController);

module.exports = router;*/

/*const express = require("express");
const router = express.Router();

const { generateController } = require("../controllers/generateController");

// test routes
router.get("/", (req, res) => {
  res.send("ROOT WORKS");
});

router.get("/health", (req, res) => {
  console.log("HEALTH HIT");
  res.send("HEALTH WORKS");
});

// AI route
router.post("/generate", generateController);

module.exports = router;*/
const express = require("express");
const router = express.Router();

const {
  generateProjects,
  generatePathway,
  generateGuidance,
} = require("../ai/ai_agent"); // <-- adjust path if your file is elsewhere

// ─────────────────────────────────────────────
// Health + sanity routes
// ─────────────────────────────────────────────

router.get("/", (req, res) => {
  res.send("ROOT WORKS");
});

router.get("/health", (req, res) => {
  console.log("HEALTH HIT");
  res.send("HEALTH OK");
});

// ─────────────────────────────────────────────
// AI: Generate projects
// ─────────────────────────────────────────────

router.post("/generate", async (req, res) => {
  try {
    const profile = req.body;

    const result = await generateProjects(profile);

    return res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("Generate route error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to generate projects",
    });
  }
});

// ─────────────────────────────────────────────
// AI: Generate pathway
// ─────────────────────────────────────────────

router.post("/pathway", async (req, res) => {
  try {
    const { project, userSkills = [] } = req.body;

    if (!project) {
      return res.status(400).json({
        ok: false,
        error: "Project is required",
      });
    }

    const result = await generatePathway(project, userSkills);

    return res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("Pathway route error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to generate pathway",
    });
  }
});


router.post("/guidance", async (req, res) => {
  try {
    const ctx = req.body;

    if (!ctx?.question) {
      return res.status(400).json({
        ok: false,
        error: "Question is required",
      });
    }

    const result = await generateGuidance(ctx);

    return res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("Guidance route error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to generate guidance",
    });
  }
});

module.exports = router;