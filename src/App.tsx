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
  { title: "Artefacts", slug: "/artefacts" },
  { title: "Love", slug: "/love" },
];

const projects: ProjectItem[] = [
  {
    title: "Code editor",
    slug: "/code-editor/",
    mobileHref: "https://github.com/AniKrisn/code-editor/",
  },
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
