/*import React, { useState } from "react";
import './App.css';

import bg from "./assets/MatchLab_bg.png";

import Nav from "./components/Nav.js";
import ChatBox from "./components/ChatBox.js";
import Welcome from "./Welcome.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5055";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [projects, setProjects] = useState([]);

  const handleFinishQuiz = async (quizAnswers) => {
    setScreen("chat");

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: quizAnswers[0] ? quizAnswers[0].split(",").map(s => s.trim()) : [],
          interests: quizAnswers[1] ? quizAnswers[1].split(",").map(s => s.trim()) : [],
          timeCommitment: "medium",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setProjects(data.data);
        console.log("Projects loaded:", data.data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const backgroundStyle = {
    minHeight: "100vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  };

  return (
    <div style={backgroundStyle}>
      {screen === "welcome" && (
        <Welcome onFinish={handleFinishQuiz} />
      )}

      {screen === "chat" && (
        <div style={{ display: "flex", width: "100%", height: "100vh" }}>
          <Nav />
          <div style={{ marginLeft: "180px", flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ChatBox projects={projects} />
          </div>
        </div>
      )}
    </div>
  );*/

/*import React, { useState } from "react";
import "./App.css";

import bg from "./assets/MatchLab_bg.png";

import Nav from "./components/Nav.js";
import ChatBox from "./components/ChatBox.js";
import Welcome from "./Welcome.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5055";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinishQuiz = async (quizAnswers) => {
    setScreen("chat");
    setLoading(true);
    setError("");

    try {
      const prompt = `
You are a strict JSON generator.

Return ONLY valid JSON.
No explanations.
No markdown.
No backticks.

Output format must be EXACTLY:

[
  {
    "name": "string",
    "description": "string",
    "whyFit": "string"
  }
]

User skills: ${quizAnswers[0] || "none"}
User interests: ${quizAnswers[1] || "none"}
Time commitment: medium
`;

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.ok) {
        try {
          const text = data.data.message;

const start = text.indexOf("[");
const end = text.lastIndexOf("]");

const clean = text.substring(start, end + 1);

const parsed = JSON.parse(clean);

setProjects(parsed);
        } catch (e) {
          console.error("JSON parse failed:", e);
          setError("AI returned invalid format");
        }
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle = {
    minHeight: "100vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  };

  return (
    <div style={backgroundStyle}>
      {screen === "welcome" && (
        <Welcome onFinish={handleFinishQuiz} />
      )}

      {screen === "chat" && (
        <div style={{ display: "flex", width: "100%", height: "100vh" }}>
          <Nav />

          <div
            style={{
              marginLeft: "180px",
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            {loading && <p>Loading AI suggestions...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && !error && (
              <ChatBox projects={projects} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}*/
import React, { useState } from "react";
import "./App.css";

import bg from "./assets/MatchLab_bg.png";
import Nav from "./components/Nav.js";
import ChatBox from "./components/ChatBox.js";
import Welcome from "./Welcome.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5055";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [projects, setProjects] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinishQuiz = async (quizAnswers) => {
    const skills = quizAnswers?.[0]
      ? quizAnswers[0].split(",").map(s => s.trim())
      : [];

    setUserSkills(skills);
    setScreen("chat");
    setLoading(true);
    setError("");

    try {
      const prompt = `
Return ONLY valid JSON array.

User skills: ${quizAnswers?.[0] || "none"}
User interests: ${quizAnswers?.[1] || "none"}
Time commitment: medium
`;

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      console.log("FULL BACKEND RESPONSE:", data);

      if (!data?.ok) {
        setError(data?.error || "Server error");
        return;
      }

      // ✅ DIRECTLY USE BACKEND DATA (NO PARSING)
      const projects = data?.data;

      if (!Array.isArray(projects)) {
        setError("Invalid project format from backend");
        return;
      }

      setProjects(projects);

    } catch (err) {
      console.error("Request failed:", err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle = {
    minHeight: "100vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  };

  return (
    <div style={backgroundStyle}>
      {screen === "welcome" && (
        <Welcome onFinish={handleFinishQuiz} />
      )}

      {screen === "chat" && (
        <div style={{ display: "flex", width: "100%", height: "100vh" }}>
          <Nav />

          <div style={{
            marginLeft: "180px",
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}>
            {loading && (
              <p style={{ color: "white" }}>
                Loading AI suggestions...
              </p>
            )}

            {error && (
              <p style={{ color: "red" }}>
                {error}
              </p>
            )}

            {!loading && !error && (
              <ChatBox
                projects={projects}
                userSkills={userSkills}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}