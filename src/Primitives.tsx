import { Link } from "react-router-dom";
import "./BlogPost.css";

function Primitives() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Primitives</h1>
          <p>
            1. Complexity <i>grows</i> from an initial set of primitives and
            some scaling process.
          </p>
          <p>
            2. Problem-solving is maintenance. Solutions that prune unnecessary
            complexity tend to be both beautiful and good.
          </p>
          <p>
            3. Healthy, curated, aligned and maximal growth is the dance between
            scaling the right set of initial primitives and relentlessly pruning
            unnecessary complexity.
          </p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
    </main>
  );
}

export default Primitives;
