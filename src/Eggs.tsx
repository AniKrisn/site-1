import { Link } from "react-router-dom";
import "./BlogPost.css";
import { ThemeToggle } from "./ThemeToggle";

function Eggs() {
  return (
    <main className="container">
      <div className="content post-content">
        <article className="post-text">
          <h1>Eggs</h1>
          <p>1. A big egg could be a very large egg.</p>
          <p>2. Or an omelette.</p>
          <p>3. Or a plate of scrambled eggs.</p>
          <p>4. Or a rather large boiled egg.</p>
          <p>5. Or a bowl of many poached eggs.</p>
          <p>6. Or a huge, flat, fried egg.</p>
          <p>7. It's not clear which one of these is a big egg.</p>
        </article>
        <Link to="/" className="dot-post" aria-label="Home" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default Eggs;
