/*import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5055";

export default function ChatBox({ projects = [] }) {
  /*const [messages, setMessages] = useState(
    projects.length > 0
      ? [{ text: `Here are your top project matches! Ask me anything about them.`, sender: "MatchBot" }]
      : [{ text: "Hi! Ask me anything about your project ideas.", sender: "MatchBot" }]
  );
  const [input, setInput] = useState("");*/
/*  const [messages, setMessages] = useState([
    { text: "Hi! Ask me anything about your project ideas.", sender: "MatchBot" }
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (projects && projects.length > 0) {
      const formattedProjects = projects
        .map(
          (p, i) =>
            `🔹 ${p.name}\n${p.description}\nWhy it fits: ${p.whyFit}`
        )
        .join("\n\n");

      setMessages([
        {
          text: `Here are your top project matches:\n\n${formattedProjects}`,
          sender: "MatchBot",
        },
      ]);
    }
  }, [projects]);

  const styles = {
    chatContainer: {
      width: "1100px",
      height: "95vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(255, 255, 255, 0.61)",
      borderRadius: "10px",
      overflow: "hidden",
      backdropFilter: "blur(6px)",
    },
    messages: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    message: {
      padding: "10px 14px",
      borderRadius: "8px",
      maxWidth: "70%",
      fontSize: "14px",
    },
    inputArea: {
      display: "flex",
      padding: "10px",
    },
    input: {
      flex: 1,
      padding: "10px",
      backgroundColor: "rgba(122, 120, 120, 0.61)",
      border: "none",
      color: "white",
      borderRadius: "40px",
      outline: "none",
    },
    button: {
      marginLeft: "10px",
      padding: "10px 16px",
      backgroundColor: "#A4CCCC",
      border: "none",
      color: "black",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    try {
      const res = await fetch(`${API_BASE}/guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          project: projects[0] || {},
          step: {},
        }),
      });

      const data = await res.json();

      const botMessage = {
        text: data.ok ? data.data.answer : "Something went wrong. Try again.",
        sender: "MatchBot",
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { text: "Something went wrong. Try again.", sender: "MatchBot" },
      ]);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "user" ? "#A4CCCC" : "rgba(255,255,255,0.0)",
              color: "black",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="What are your ideas?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
} */

import React, { useState, useEffect, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5055";

export default function ChatBox({ projects = [], userSkills = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (projects.length > 0) {
      setMessages([{
        type: "projects",
        sender: "MatchBot",
        text: "Here are your top project matches! Click one to see your learning pathway.",
        projects,
      }]);
    } else {
      setMessages([{
        type: "text",
        sender: "MatchBot",
        text: "Hi! Ask me anything about your project ideas.",
      }]);
    }
  }, [projects]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg) => setMessages(prev => [...prev, msg]);

  const handleSelectProject = async (project) => {
    // normalize: support both name and title fields
    const projectName = project.name || project.title || "this project";
    const normalizedProject = { ...project, title: projectName };

    setSelectedProject(normalizedProject);
    addMessage({ type: "text", sender: "user", text: `I want to build: ${projectName}` });
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/pathway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: normalizedProject, userSkills }),
      });
      const data = await res.json();

      if (data.ok && data.data?.steps) {
        addMessage({
          type: "pathway",
          sender: "MatchBot",
          text: data.data.summary,
          steps: data.data.steps,
          estimatedHours: data.data.estimatedHours,
        });
      } else {
        addMessage({ type: "text", sender: "MatchBot", text: "Couldn't load the pathway. Try again!" });
      }
    } catch (err) {
      console.error(err);
      addMessage({ type: "text", sender: "MatchBot", text: "Something went wrong loading the pathway." });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    addMessage({ type: "text", sender: "user", text: input });
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          project: selectedProject || projects[0] || {},
          step: {},
        }),
      });

      const data = await res.json();
      addMessage({
        type: "text",
        sender: "MatchBot",
        text: data.ok ? data.data.answer : "Something went wrong. Try again.",
      });
    } catch (err) {
      console.error(err);
      addMessage({ type: "text", sender: "MatchBot", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    chatContainer: {
      width: "1100px",
      height: "95vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(255, 255, 255, 0.61)",
      borderRadius: "10px",
      overflow: "hidden",
      backdropFilter: "blur(6px)",
    },
    messages: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    bubble: (sender) => ({
      padding: "10px 14px",
      borderRadius: "8px",
      maxWidth: "75%",
      fontSize: "14px",
      alignSelf: sender === "user" ? "flex-end" : "flex-start",
      backgroundColor: sender === "user" ? "#A4CCCC" : "rgba(255,255,255,0.8)",
      color: "black",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      whiteSpace: "pre-wrap",
    }),
    projectGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "8px",
    },
    projectCard: (isSelected) => ({
      padding: "12px 16px",
      borderRadius: "10px",
      border: isSelected ? "2px solid #A4CCCC" : "2px solid #ddd",
      backgroundColor: isSelected ? "rgba(164,204,204,0.2)" : "white",
      cursor: "pointer",
      maxWidth: "220px",
      fontSize: "13px",
      transition: "all 0.2s",
    }),
    projectTitle: {
      fontWeight: "bold",
      marginBottom: "4px",
      color: "#333",
    },
    projectDesc: {
      color: "#666",
      fontSize: "12px",
    },
    pathwayBox: {
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    stepCard: {
      padding: "10px 14px",
      borderRadius: "8px",
      backgroundColor: "white",
      border: "1px solid #eee",
      fontSize: "13px",
    },
    stepNum: {
      display: "inline-block",
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      backgroundColor: "#A4CCCC",
      color: "white",
      fontWeight: "bold",
      fontSize: "12px",
      textAlign: "center",
      lineHeight: "22px",
      marginRight: "8px",
    },
    inputArea: {
      display: "flex",
      padding: "10px",
      borderTop: "1px solid rgba(0,0,0,0.08)",
    },
    input: {
      flex: 1,
      padding: "10px",
      backgroundColor: "rgba(122, 120, 120, 0.61)",
      border: "none",
      color: "white",
      borderRadius: "40px",
      outline: "none",
    },
    button: {
      marginLeft: "10px",
      padding: "10px 16px",
      backgroundColor: "#A4CCCC",
      border: "none",
      color: "black",
      borderRadius: "4px",
      cursor: "pointer",
    },
    loadingDot: {
      alignSelf: "flex-start",
      padding: "10px 16px",
      borderRadius: "8px",
      backgroundColor: "rgba(255,255,255,0.8)",
      color: "#999",
      fontSize: "14px",
    },
  };

  const renderMessage = (msg, index) => {
    if (msg.type === "projects") {
      return (
        <div key={index} style={styles.bubble("MatchBot")}>
          <div>{msg.text}</div>
          <div style={styles.projectGrid}>
            {msg.projects.map((p, i) => {
              const name = p.name || p.title || "Unnamed Project";
              return (
                <div
                  key={i}
                  style={styles.projectCard(selectedProject?.title === name)}
                  onClick={() => handleSelectProject(p)}
                >
                  <div style={styles.projectTitle}>{name}</div>
                  <div style={styles.projectDesc}>{p.description?.slice(0, 80)}…</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (msg.type === "pathway") {
      return (
        <div key={index} style={styles.bubble("MatchBot")}>
          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
            Your Learning Pathway
            {msg.estimatedHours ? ` (~${msg.estimatedHours} hrs)` : ""}
          </div>
          <div style={{ marginBottom: "8px", color: "#555" }}>{msg.text}</div>
          <div style={styles.pathwayBox}>
            {msg.steps.map((step, i) => (
              <div key={i} style={styles.stepCard}>
                <span style={styles.stepNum}>{step.order}</span>
                <strong>{step.title}</strong>
                <div style={{ color: "#666", marginTop: "4px", paddingLeft: "30px" }}>
                  {step.description}
                </div>
                {step.resources?.length > 0 && (
                  <div style={{ paddingLeft: "30px", marginTop: "4px", color: "#999", fontSize: "12px" }}>
                    {step.resources.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "8px", color: "#888", fontSize: "12px" }}>
            Ask me anything about any of these steps!
          </div>
        </div>
      );
    }

    return (
      <div key={index} style={styles.bubble(msg.sender)}>
        {msg.text}
      </div>
    );
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messages}>
        {messages.map(renderMessage)}
        {loading && <div style={styles.loadingDot}>MatchBot is thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Click a project above, or ask me anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}