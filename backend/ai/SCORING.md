# MatchLab – Project Scoring & Ranking

## Overview

`scoring.js` scores and ranks AI-generated (or mock) projects against a user
profile so the best-fit projects appear first.

---

## User Input Format

```json
{
  "skills":         ["Python", "React", "SQL"],
  "interests":      ["healthcare", "AI"],
  "timeCommitment": "low" | "medium" | "high"
}
```

| Field            | Type       | Required | Notes                                            |
|------------------|------------|----------|--------------------------------------------------|
| `skills`         | `string[]` | Yes      | Exact skill names (case-insensitive)             |
| `interests`      | `string[]` | Yes      | Free-text keywords searched in tags/title/desc   |
| `timeCommitment` | `string`   | No       | Defaults to `"medium"` if omitted                |

---

## Project Input Format

Accepts projects from the Gemini AI agent **or** the existing mock data — either
`skills` or `requiredSkills` key is supported.

```json
{
  "title":          "Health Dashboard with Predictive Analytics",
  "description":    "Build a web dashboard that …",
  "skills":         ["Python", "React", "SQL"],
  "requiredSkills": ["Python", "React", "SQL"],
  "tags":           ["healthcare", "data"]
}
```

`skills` and `requiredSkills` are interchangeable; whichever is present will be used.

---

## Output Format

`rankProjects(user, projects)` returns an array sorted by `score` descending:

```json
[
  {
    "title": "Health Dashboard with Predictive Analytics",
    "description": "…",
    "requiredSkills": ["Python", "React", "Data Analysis", "SQL"],
    "tags": ["healthcare", "data", "machine learning"],
    "score": 83,
    "breakdown": {
      "skillScore": 100,
      "interestScore": 67,
      "complexityFit": 40
    },
    "matchedSkills": ["python", "react", "data analysis", "sql"],
    "matchedInterests": ["healthcare", "machine learning"]
  }
]
```

| Field              | Type       | Description                                  |
|--------------------|------------|----------------------------------------------|
| `score`            | `number`   | 0–100 composite score                        |
| `breakdown`        | `object`   | Sub-scores for each dimension                |
| `matchedSkills`    | `string[]` | Which user skills matched project skills     |
| `matchedInterests` | `string[]` | Which user interests matched tags/title/desc |

---

## Scoring Algorithm

### Weights

| Dimension        | Weight | What it measures                                    |
|------------------|--------|-----------------------------------------------------|
| **Skill match**  | 60%    | % of project's required skills the user has         |
| **Interest match** | 25%  | % of user interests found in project tags/title/desc|
| **Complexity fit** | 15%  | How well project complexity matches time commitment |

### Skill Score (0–100)

```
skillScore = (matchedSkills.length / projectSkills.length) * 100
```

Case-insensitive comparison. If a project has 0 required skills, score is 0.

### Interest Score (0–100)

```
interestScore = (matchedInterests.length / userInterests.length) * 100
```

Each user interest is searched as a substring in the concatenation of the
project's tags, title, and description (all lowercased).

### Complexity Fit (0–100)

Project complexity is estimated from the number of required skills:

| Skills Count | Complexity |
|-------------|------------|
| 1–3         | low        |
| 4–5         | medium     |
| 6+          | high       |

Fit scoring based on difference between user time tier and project complexity tier:

| Match     | Score |
|-----------|-------|
| Exact     | 100   |
| ±1 tier   | 70    |
| ±2 tiers  | 40    |
| ±3+ tiers | 10    |

### Composite Score

```
score = round(skillScore × 0.60 + interestScore × 0.25 + complexityFit × 0.15)
```

---

## Backend Integration

```js
const { rankProjects } = require("./scoring");

// User profile from request body
const user = {
  skills: ["Python", "React", "SQL"],
  interests: ["healthcare", "AI"],
  timeCommitment: "high",
};

// Projects from Gemini AI agent or database
const projects = await generateProjects(topic);

// Rank and return
const ranked = rankProjects(user, projects);
res.json({ projects: ranked });
```

Custom weights can be passed as a third argument:

```js
rankProjects(user, projects, { skill: 0.5, interest: 0.35, complexity: 0.15 });
```

---

## Running Tests

```bash
node ai/scoring.test.js
```

The test suite covers 36 assertions across skill matching, interest matching,
complexity fit, composite scoring, ranking order for 4 different user profiles,
and edge cases.
