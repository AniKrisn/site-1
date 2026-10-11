import { useEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { ThemeToggle } from "./ThemeToggle";

interface LinkItem {
  title: string;
  slug: string;
}

interface ProjectItem extends LinkItem {
  mobileHref?: string;
  thumb: string;
}

const posts: LinkItem[] = [
  { title: "Primitives", slug: "/primitives" },
  { title: "Specificity", slug: "/specificity" },
  { title: "Descriptions", slug: "/descriptions" },
];

const projects: ProjectItem[] = [
  {
    title: "Code editor",
    thumb: "/thumbs/code-editor.jpg",
    slug: "/code-editor/",
    mobileHref: "https://github.com/AniKrisn/code-editor/",
  },
  {
    title: "Beetle",
    thumb: "/thumbs/beetle.jpg",
    slug: "/beetle/",
    mobileHref: "/beetle/",
  },
  {
    title: "Ligne claire",
    thumb: "/thumbs/ligne-claire.jpg",
    slug: "/ligne-claire/",
    // it runs on a phone too -- without a mobileHref the entry is hidden
    // below 1024px, since that is where post-link-desktop stops showing
    mobileHref: "/ligne-claire/",
  },
  {
    title: "Marks (wip)",
    thumb: "/thumbs/marks.jpg",
    slug: "/marks/",
    // needs a wide screen, but it loads anywhere and the repo is private,
    // so the phone gets the same page rather than a 404
    mobileHref: "/marks/",
  },
  {
    title: "Cache",
    thumb: "/thumbs/cache.jpg",
    slug: "/cache/",
    mobileHref: "/cache/",
  },
  {
    title: "(Educative) contraptions",
    thumb: "/thumbs/contraptions.jpg",
    // outbound: its own Worker, see the own-deployment note in CLAUDE.md
    slug: "https://rb-machine.anikrishnantango.workers.dev/",
    mobileHref: "https://rb-machine.anikrishnantango.workers.dev/",
  },
];

const games: ProjectItem[] = [
  {
    title: "The Ferryman",
    thumb: "/thumbs/ferryman.jpg",
    // outbound rather than dropped into public/: it has an agent in it and
    // an API key behind a Worker, so it wants its own origin -- see the
    // "when a project should get its own deployment" note in CLAUDE.md
    slug: "https://ferryman.anikrisn.com/",
    // on a phone it shows a die to throw and says to come back on a
    // larger screen, so the entry should still be there
    mobileHref: "https://ferryman.anikrisn.com/",
  },
  {
    title: "Cenote",
    thumb: "/thumbs/cenote.jpg",
    // outbound: it has its own Worker and multiplayer rooms, see the own-deployment note in CLAUDE.md
    slug: "https://cenote.anikrishnantango.workers.dev/",
    // no mobileHref: it needs a keyboard and pointer lock, otherwise a phone gets a pause screen it can't leave
  },
  {
    title: "Overgrowth",
    thumb: "/thumbs/overgrowth.jpg",
    slug: "/overgrowth/",
    // no mobileHref: cutting is a precise drag at high zoom, otherwise a phone just pans
  },
  {
    title: "Pocket Captains",
    thumb: "/thumbs/pocket-captains.jpg",
    // outbound: its own Worker and multiplayer rooms, like Cenote
    slug: "https://pocket-captains.anikrishnantango.workers.dev/",
    mobileHref: "https://pocket-captains.anikrishnantango.workers.dev/",
  },
];

let hideTimer: ReturnType<typeof setTimeout> | undefined;

// Same as Cache's index: a preview that trails the cursor while a link is hovered.
function ProjectList({
  items,
  thumbRef,
}: {
  items: ProjectItem[];
  thumbRef: RefObject<HTMLImageElement | null>;
}) {
  const show = (src: string) => {
    const el = thumbRef.current;
    if (!el) return;
    clearTimeout(hideTimer);
    el.src = src;
    el.classList.add("on");
  };
  const move = (e: React.MouseEvent) => {
    const el = thumbRef.current;
    if (!el) return;
    el.style.left = Math.min(e.clientX + 24, innerWidth - 280) + "px";
    el.style.top = Math.min(e.clientY + 16, innerHeight - 280) + "px";
  };
  // a beat before fading, otherwise sliding to the next link blinks the thumb out and back
  const hide = () => {
    hideTimer = setTimeout(() => thumbRef.current?.classList.remove("on"), 60);
  };
  return (
    <nav className="projects-list">
      {items.map((project) => (
        <span key={project.slug} className="project-link-wrap">
          <a
            href={project.slug}
            className="post-link post-link-desktop"
            onMouseEnter={(e) => {
              move(e);
              show(project.thumb);
            }}
            onMouseMove={move}
            onMouseLeave={hide}
          >
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
  );
}

function App() {
  const thumbRef = useRef<HTMLImageElement>(null);

  // warm the thumbs once the page is up, otherwise the first hover shows an empty box
  useEffect(() => {
    const id = setTimeout(() => {
      for (const p of [...projects, ...games]) new Image().src = p.thumb;
    }, 1000);
    return () => clearTimeout(id);
  }, []);

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
            <ProjectList items={projects} thumbRef={thumbRef} />
          </section>
          <section className="projects">
            <h2 className="section-title">Games</h2>
            <ProjectList items={games} thumbRef={thumbRef} />
          </section>
        </div>
        <Link to="/about" className="dot" aria-label="About" />
      </div>
      <img ref={thumbRef} className="hover-thumb" alt="" />
      <ThemeToggle />
    </main>
  );
}

export default App;
