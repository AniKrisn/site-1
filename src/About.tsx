import { Link } from "react-router-dom";
import "./About.css";
import { ThemeToggle } from "./ThemeToggle";
import { TextCard } from "./Frame";

function About() {
  return (
    <main className="container">
      <TextCard>
        <div className="content about-content">
        <div className="about-text">
          <p>hey i'm Ani</p>
          <p>i work at tldraw</p>
          <p>i like art and technology</p>
        </div>
        <Link to="/" className="dot-about" aria-label="Home" />
      </div>
      </TextCard>
      <ThemeToggle />
    </main>
  );
}

export default About;
