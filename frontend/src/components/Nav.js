import React from "react";

export default function Nav() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>MatchLab💡</div>
      <div style={styles.links}>
        <a href="/" style={styles.link}>Home</a>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "180px",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: "20px",
    backgroundColor: "rgba(255,255,255,0.3)",
    backdropFilter: "blur(10px)",
    gap: "30px",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  links: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontSize: "14px",
  },
};
