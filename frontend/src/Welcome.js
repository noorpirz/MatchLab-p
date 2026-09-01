import React, { useState } from "react";
import bg from "./assets/MatchLab_bg.png";

export default function Welcome({ onStart, onFinish }) {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState([]);

  const updated = [...answers];
  
  const questions = [
    {
      type: "text",
      question: "What coding languages are you comfortable with?"
    },
    {
      type: "text",
      question: "What areas of computer science are you interested in?"
    },
    {
      type: "radio",
      question: "What's your goal in creating a project?",
      options: [
        "Learn new skills",
        "Build a portfolio",
        "Work with others",
        "Just for fun"
      ]
    }
  ];

  const nextQuestion = () => {
    const updated = [...answers];
    updated[currentQuestion] = input;
    setAnswers(updated);

    setInput("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      alert("Done!");
      console.log(updated);
    }
  };

  /*const backgroundStyle = {
    minHeight: "95vh",
    width: "100vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "flex-end",
    alignSelf: "center",
    padding: "20px"
  };*/

  const questionStyle = {
    width: "500px",
    height: "50vh",
    display: "flex",
    flexDirection: "column", 
    justifyContent: "center",
    gap: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.60)",
    borderRadius: "10px",
    padding: "20px",
    backdropFilter: "blur(6px)"
  };

  const current = questions[currentQuestion];

  return (
  <div style={questionStyle}>
        {!started ? (
          <>
            <h2>
              Welcome to MatchLab! Please fill out this form to get
              to know your interests to customize your project
              recommendations.
            </h2>
            <button onClick={() => setStarted(true)}>Ready?</button>
          </>
        ) : (
          <>
            <h2>{current.question}</h2>

            {/* TEXT INPUT */}
            {current.type === "text" && (
              <input
                type="text"
                placeholder="Type your answer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            )}

            {/* RADIO INPUT */}
            {current.type === "radio" && (
              <div>
                {current.options.map((option, index) => (
                  <label key={index} style={{ display: "block" }}>
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={input === option}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            <button disabled={!input}
                onClick={() => {
                    
                if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    updated[currentQuestion] = input;
                    setAnswers(updated);
                    setInput("");
                } else {
                    onFinish(updated); // THIS sends you to ChatBox
                }
                }
        }   >
                Next
            </button>
          </>
        )}
    </div>
  );
}