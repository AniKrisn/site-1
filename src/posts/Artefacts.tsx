import { Link } from "react-router-dom";
import "./BlogPost.css";
import { ThemeToggle } from "../ThemeToggle";

function Artefacts() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Artefacts</h1>
          <p>
            1. Artefacts produced by world models resemble the world model in
            their structure.
          </p>
          <p>
            2. Learning a structure is learning the world model contained within
            it.
          </p>
          <p>
            3. Good artefacts come from good world models, where goodness is
            determined by specificity.
          </p>
          <p>
            4. Consuming good artefacts is how models improve; consuming
            bad artefacts leads to mode collapse.
          </p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default Artefacts;
