import React from "react";
import './App.css';

import bg from "./assets/MatchLab_bg.png";

import Nav from "./components/Nav.js";
import ChatBox from "./components/ChatBox.js";
import Welcome from "./Welcome.js";

//import { generateProjects } from "MatchLab/ai/generateProjects";

import { useState } from 'react';

export default function App() {
  const [screen, setScreen] = useState("welcome");

  const onFinish = () => {
    setScreen("chat");
  };

  const handleFinishQuiz = async (quizAnswers) => {
  setScreen("chat");

  try {
    const res = await fetch("http://localhost:5000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers: quizAnswers })
    });

    const data = await res.json();
    console.log("AI response:", data);
  } catch (err) {
    console.error(err);
  }
};

  const backgroundStyle = {
    minHeight: "95vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  };

  return (
    <div style={backgroundStyle}>
      {screen === "welcome" && (
        <Welcome
          onStart={() => setScreen("quiz")}
          onFinish={(handleFinishQuiz) => setScreen("chat")}
        />
      )}

      {screen === "chat" && (
        <>
          <Nav />
          <ChatBox />
        </>
      )}
    </div>
  );
};