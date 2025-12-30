import { Link } from "react-router-dom";
import "./BlogPost.css";
import { ThemeToggle } from "./ThemeToggle";

function Descriptions() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Descriptions</h1>
          <p>1. Code is data, data is code, both are empty.</p>
          <p>
            2. Prescriptions are descriptions, descriptions are prescriptions,
            both are empty.
          </p>
          <p>
            3. Prescriptions tend to be heavy, descriptions tend to be light.
          </p>
          <p>
            4. Humility expands the possibility space and invites exploration.
            Hubris confines the possibility space and defuses imagination.
          </p>
          <p>5. Teaching doesn't exist but learning does.</p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default Descriptions;
