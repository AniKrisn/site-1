import { Link } from "react-router-dom";
import "./App.css";
import { ThemeToggle } from "./ThemeToggle";

interface LinkItem {
  title: string;
  slug: string;
}

interface ProjectItem extends LinkItem {
  mobileHref?: string;
}

const posts: LinkItem[] = [
  { title: "Primitives", slug: "/primitives" },
  { title: "Specificity", slug: "/specificity" },
  { title: "Descriptions", slug: "/descriptions" },
];

const projects: ProjectItem[] = [
  {
    title: "Code editor",
    slug: "/code-editor/",
    mobileHref: "https://github.com/AniKrisn/code-editor/",
  },
  {
    title: "Beetle",
    slug: "/beetle/",
    mobileHref: "/beetle/",
  },
  {
    title: "Ligne claire",
    slug: "/ligne-claire/",
    // it runs on a phone too -- without a mobileHref the entry is hidden
    // below 1024px, since that is where post-link-desktop stops showing
    mobileHref: "/ligne-claire/",
  },
];

function App() {
  return (
    <main className="container">
      <div className="content">
        <div className="sections">
          <section className="posts-section">
            <h2 className="section-title">notes</h2>
            <nav className="posts">
              {posts.map((post) => (
                <Link key={post.slug} to={post.slug} className="post-link">
                  {post.title}
                </Link>
              ))}
            </nav>
          </section>
          <section className="projects">
            <h2 className="section-title">Projects</h2>
            <nav className="projects-list">
              {projects.map((project) => (
                <span key={project.slug} className="project-link-wrap">
                  <a href={project.slug} className="post-link post-link-desktop">
                    {project.title}
                  </a>
                  {project.mobileHref && (
                    <a
                      href={project.mobileHref}
                      className="post-link post-link-mobile"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.title}
                    </a>
                  )}
                </span>
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
