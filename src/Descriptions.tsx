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
            4. Prescriptions confine the possibility space and defuse
            imagination. Descriptions expand the possibility space and invite
            exploration.
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
