import { Link } from "react-router-dom";
import "./BlogPost.css";

function Primitives() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Primitives</h1>
          <p>
            1. Complexity is grown from an initial set of primitives and some
            scaling process.
          </p>
          <p>
            2. Aligned growth comes from relentlessly pruning unnecessary
            complexity and scaling the right set of primitives.
          </p>
          <p>
            3. Unhealthy complexity is both ugly and evil. Solutions that prune
            unnecessary complexity tend not only to be elegant, but also deeply{" "}
            <i>good</i>.
          </p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
    </main>
  );
}

export default Primitives;
