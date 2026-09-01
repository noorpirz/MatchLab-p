/**
 * AI project generation – mock implementation.
 * Returns 1–2 mock projects with title, description, and required skills.
 * Replace with real AI/LLM call when backend /generate is ready.
 *
 * @param {GenerateProjectsInput} input - User preferences (skills, interests, applications)
 * @returns {Promise<GenerateProjectsOutput>} List of suggested projects
 */

function generateProjects(input = {}) {
  const { skills = [], interests = [], applications = [] } = input;

  const mockProjects = [
    {
      id: "mock-1",
      title: "Health Dashboard with Predictive Analytics",
      description:
        "Build a web dashboard that visualizes patient metrics and uses simple ML models to flag at-risk cases. Integrates with sample healthcare datasets.",
      requiredSkills: ["Python", "React", "Data Analysis", "SQL"],
    },
    {
      id: "mock-2",
      title: "Sustainable Energy Usage Tracker",
      description:
        "A mobile-friendly app that tracks household energy usage, suggests savings, and shows comparisons with similar homes. Focus on clear UX and charts.",
      requiredSkills: ["JavaScript", "React", "SQL", "Design"],
    },
  ];

  const projects = mockProjects.slice(0, 2);

  return {
    projects,
    message: "Mock projects generated. Replace with /generate when backend is ready.",
  };
}

module.exports = { generateProjects };
