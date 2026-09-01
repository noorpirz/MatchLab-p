const path = require("path");
const { generateProjects } = require(path.join(__dirname, "..", "ai", "generateProjects.js"));

async function run() {
  console.log("Testing generateProjects()...\n");

  // Test 1: no input
  const result1 = await generateProjects();
  console.log("--- Call with no input ---");
  console.log(JSON.stringify(result1, null, 2));
  console.log("");

  // Test 2: with input (skills, interests, applications)
  const result2 = await generateProjects({
    skills: ["python", "react"],
    interests: ["ai", "web-development"],
    applications: ["healthcare"],
  });
  console.log("--- Call with input ---");
  console.log(JSON.stringify(result2, null, 2));
  console.log("");

  console.log("Done. Projects count:", result2.projects.length);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
