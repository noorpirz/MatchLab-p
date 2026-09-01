# Generate API – Input/Output & Backend Integration

---

## Input format (client → backend)

**Endpoint:** `POST /generate`  
**Content-Type:** `application/json`

```json
{
  "skills": ["python", "javascript", "react"],
  "interests": ["ai", "web-development"],
  "applications": ["healthcare", "education"]
}
```

| Field         | Type     | Required | Description                          |
|---------------|----------|----------|--------------------------------------|
| `skills`      | string[] | No       | User's skills (e.g. from dropdown)   |
| `interests`   | string[] | No       | User's interests                     |
| `applications`| string[] | No       | Application domains they care about  |

All fields are optional; empty body `{}` is valid (backend can return generic suggestions).

---

## Output format (backend → client)

```json
{
  "projects": [
    {
      "id": "proj-001",
      "title": "Health Dashboard with Predictive Analytics",
      "description": "Build a web dashboard that visualizes patient metrics and uses simple ML models to flag at-risk cases.",
      "requiredSkills": ["Python", "React", "Data Analysis", "SQL"]
    },
    {
      "id": "proj-002",
      "title": "Sustainable Energy Usage Tracker",
      "description": "A mobile-friendly app that tracks household energy usage and suggests savings.",
      "requiredSkills": ["JavaScript", "React", "SQL", "Design"]
    }
  ],
  "message": "Optional status or hint for the user."
}
```

**Project object:**

| Field            | Type     | Description                    |
|------------------|----------|--------------------------------|
| `id`             | string   | Unique project identifier      |
| `title`          | string   | Project title                  |
| `description`    | string   | Short project description      |
| `requiredSkills` | string[] | Skills needed for the project  |

---

## Using the mock locally

The repo includes a mock implementation and test script:

- **Mock function:** `ai/generateProjects.js` – returns 1–2 hardcoded projects; same input/output shape as above.
- **Test:** `node scripts/testGenerateProjects.js` – calls the mock with no input and with sample input.

When the backend `POST /generate` is live, replace calls to `generateProjects()` with:

```