import "./App.css";

const posts = [
  { title: "Specificity", slug: "/specificity" },
  { title: "Primitives", slug: "/primitives" },
];

function App() {
  return (
    <main className="container">
      <div className="dot" />
      <nav className="posts">
        {posts.map((post) => (
          <a key={post.slug} href={post.slug} className="post-link">
            {post.title}
          </a>
        ))}
      </nav>
    </main>
  );
}

export default App;
