/*// We'll import the AI service later
const { generateMockProjects } = require('../services/aiService');

const generateController = (req, res) => {
  // For now, just return a mock response
  // Later, we'll use the service
  const mockProjects = generateMockProjects();
  res.json({ success: true, projects: mockProjects });
};

module.exports = { generateController };*/
/*const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateController = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "Prompt is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.2,
  },
});
    const response = await result.response;
    const text = response.text();

    return res.json({
      ok: true,
      data: {
        message: text,
      },
    });

  } catch (err) {
    console.error("Gemini error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Something went wrong",
    });
  }
};

module.exports = { generateController };*/
const {
  generateProjects,
  generatePathway,
  generateGuidance,
} = require("../ai/ai_agent"); // adjust path if needed

// 1. PROJECTS
const generateProjectsController = async (req, res) => {
  try {
    const { skills, interests, timeCommitment } = req.body;

    const result = await generateProjects({
      skills,
      interests,
      timeCommitment,
    });

    return res.json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error("generateProjects error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

// 2. PATHWAY
const generatePathwayController = async (req, res) => {
  try {
    const { project, userSkills } = req.body;

    if (!project) {
      return res.status(400).json({
        ok: false,
        error: "Project is required",
      });
    }

    const result = await generatePathway(project, userSkills || []);

    return res.json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error("generatePathway error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

// 3. GUIDANCE
const generateGuidanceController = async (req, res) => {
  try {
    const { question, step, project } = req.body;

    const result = await generateGuidance({
      question,
      step,
      project,
    });

    return res.json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error("generateGuidance error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

module.exports = {
  generateProjectsController,
  generatePathwayController,
  generateGuidanceController,
};