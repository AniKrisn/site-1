import { Link } from "react-router-dom";
import "./App.css";
import { ThemeToggle } from "./ThemeToggle";

interface Post {
  title: string;
  slug: string;
}

const posts: Post[] = [
  { title: "Primitives", slug: "/primitives" },
  { title: "Specificity", slug: "/specificity" },
];

function App() {
  return (
    <main className="container">
      <div className="content">
        <nav className="posts">
          {posts.map((post) => (
            <a key={post.slug} href={post.slug} className="post-link">
              {post.title}
            </a>
          ))}
        </nav>
        <Link to="/about" className="dot" aria-label="About" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default App;
