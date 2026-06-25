import { Link } from "react-router-dom";
import "./BlogPost.css";
import { ThemeToggle } from "../ThemeToggle";

function Love() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Love</h1>
          <p>
            1. It takes work to construct increasingly specific world models.
          </p>
          <p>
            2. Specific world models resemble each other and recognise this
            resemblance; at best this takes the form of mutual affinity and
            understanding.
          </p>
          <p>3. Understanding is love.</p>
          <p>
            4. Love sustains, energises, and metabolises ill.
          </p>
          <p>
            5. Supranormal returns result from the conference of specific world
            models that resemble, recognise and love each other.
          </p>
          <p>
            6. Love itself is the foundation of any ontology and the basis for
            its development.
          </p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default Love;
