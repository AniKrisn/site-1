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
    title: "Marks (wip)",
    slug: "/marks/",
    // needs a wide screen, but it loads anywhere and the repo is private,
    // so the phone gets the same page rather than a 404
    mobileHref: "/marks/",
  },
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
  {
    title: "The Ferryman",
    // outbound rather than dropped into public/: it has an agent in it and
    // an API key behind a Worker, so it wants its own origin -- see the
    // "when a project should get its own deployment" note in CLAUDE.md
    slug: "https://ferryman.anikrisn.com/",
    // on a phone it shows a die to throw and says to come back on a
    // larger screen, so the entry should still be there
    mobileHref: "https://ferryman.anikrisn.com/",
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
