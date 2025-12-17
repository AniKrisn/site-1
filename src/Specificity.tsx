import { Link } from "react-router-dom";
import "./BlogPost.css";
import { ThemeToggle } from "./ThemeToggle";

function Specificity() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Specificity</h1>
          <p>1. Progress requires the production of more specific ideas.</p>
          <p>
            2. Every (real) domain is fractal - if something’s there, it keeps
            going.
          </p>
          <p>
            3. More specific ideas are more valuable (albeit for a smaller
            group).
          </p>
          <p>4. More specific ideas are harder to express.</p>
          <p>
            5. There is demand to experience, collect, create and share
            increasingly specific ideas.
          </p>
          <p>6. Specific ideas are generated from specific world models.</p>
          <p>
            7. There is demand to produce specific world models (both natural
            and artificial).
          </p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default Specificity;
