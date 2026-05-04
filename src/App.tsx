import { Link } from "react-router-dom";
import "./App.css";
import { ThemeToggle } from "./ThemeToggle";

interface LinkItem {
  title: string;
  slug: string;
}

const posts: LinkItem[] = [
  { title: "Primitives", slug: "/primitives" },
  { title: "Specificity", slug: "/specificity" },
  { title: "Descriptions", slug: "/descriptions" },
];

const projects: LinkItem[] = [
  { title: "Code editor", slug: "/code-editor/" },
];

function App() {
  return (
    <main className="container">
      <div className="content">
        <div className="sections">
          <nav className="posts">
            {posts.map((post) => (
              <a key={post.slug} href={post.slug} className="post-link">
                {post.title}
              </a>
            ))}
          </nav>
          <section className="projects">
            <h2 className="section-title">Projects</h2>
            <nav className="projects-list">
              {projects.map((project) => (
                <a key={project.slug} href={project.slug} className="post-link">
                  {project.title}
                </a>
              ))}
            </nav>
          </section>
        </div>
        <Link to="/about" className="dot" aria-label="About" />
      </div>
      <ThemeToggle />
    </main>
  );
}

export default App;
