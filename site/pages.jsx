/* pages.jsx — markdown-driven page content.
   Each page loads its content from content/{id}.md
   Blog posts load from content/posts/{slug}.md
   Blog post list is fetched from content/blog-posts.json
*/

// ── Slug helper ─────────────────────────────────────────────────────
function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Custom marked renderer: add slug ids on headings so we can deep-link
// from the graph (e.g. research#causal-inference-in-neuroscience).
// Note: marked.use() invokes renderer methods with the legacy
// (text, level, raw) signature even on v13 — text is already inline-rendered HTML.
(function setupMarked() {
  if (typeof marked === 'undefined' || marked.__kfHeadingIdsSetup) return;
  marked.use({
    renderer: {
      heading(text, level) {
        // Handle both legacy (string, number) and token-based ({ tokens, depth }) shapes
        if (typeof text === 'object' && text !== null) {
          const tokens = text.tokens;
          const depth = text.depth;
          const rendered = (this && this.parser) ? this.parser.parseInline(tokens) : (text.text || '');
          const plain = String(rendered).replace(/<[^>]*>/g, '');
          return `<h${depth} id="${slugify(plain)}">${rendered}</h${depth}>\n`;
        }
        const plain = String(text).replace(/<[^>]*>/g, '');
        return `<h${level} id="${slugify(plain)}">${text}</h${level}>\n`;
      }
    }
  });
  marked.__kfHeadingIdsSetup = true;
})();

// ── Frontmatter parser ──────────────────────────────────────────────
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

// ── Data hook ───────────────────────────────────────────────────────
// id  = page id (about, research, cv, blog, monkey, contact)
// sub = blog post slug (only set when navigating to a blog post)
function usePage(id, sub) {
  const [state, setState] = React.useState({ loading: true, meta: {}, html: '', posts: null });

  React.useEffect(() => {
    setState({ loading: true, meta: {}, html: '', posts: null });

    const path = sub
      ? `content/posts/${sub}.md`
      : `content/${id}.md`;

    fetch(path)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(text => {
        const { meta, body } = parseFrontmatter(text);
        const html = marked.parse(body);
        // For the blog index page, also fetch the posts list
        if (id === 'blog' && !sub) {
          fetch('content/blog-posts.json')
            .then(r => r.json())
            .then(posts => setState({ loading: false, meta, html, posts }))
            .catch(() => setState({ loading: false, meta, html, posts: [] }));
        } else {
          setState({ loading: false, meta, html, posts: null });
        }
      })
      .catch(() => setState({
        loading: false,
        meta: { kicker: id, title: 'Content not found.' },
        html: '<p>This page\'s markdown file is missing. Create <code>content/' + (sub ? 'posts/' + sub : id) + '.md</code> to get started.</p>',
        posts: null,
      }));
  }, [id, sub]);

  return state;
}

// ── Parallax dot-grid background ───────────────────────────────────
function ParallaxBg() {
  const [m, setM] = React.useState({ x: 0, y: 0 });
  React.useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setM({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div style={{
      position: 'absolute', inset: -40,
      opacity: 0.14, pointerEvents: 'none',
      transform: `translate(${m.x * -10}px, ${m.y * -10}px)`,
      transition: 'transform 500ms cubic-bezier(.2,.6,.2,1)',
      background: `
        radial-gradient(circle at 1px 1px, #F53A61 0.6px, transparent 1px) 0 0/9px 9px,
        radial-gradient(circle at 2px 2px, rgba(0,73,146,0.85) 0.6px, transparent 1px) 1.5px 1.5px/9px 9px`
    }} />
  );
}

// ── Page component ──────────────────────────────────────────────────
function Page({ id, sub, anchor, onNav }) {
  const { loading, meta, html, posts } = usePage(id, sub);
  const isBlogPost = !!sub;
  const isBlogIndex = id === 'blog' && !sub;
  const proseRef = React.useRef(null);

  // Scroll to anchored heading after render
  React.useEffect(() => {
    if (loading || !anchor) return;
    // Delay so the slide-in animation settles before we scroll
    const t = setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(t);
  }, [anchor, loading, html]);

  if (loading) {
    return (
      <div style={{ padding: '140px 56px 64px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.45,
          letterSpacing: '0.04em'
        }}>loading…</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <ParallaxBg />
      <div style={{ position: 'relative', padding: '120px 56px 64px' }}>

        {/* Kicker line */}
        {meta.kicker && (
          <p className="kf-page-kicker">▦ {meta.kicker}</p>
        )}

        {/* Title */}
        {meta.title && (
          <h1 className="kf-page-title">{meta.title}</h1>
        )}

        {/* Blog post metadata box */}
        {isBlogPost && (meta.description || meta.date || meta.author) && (
          <div style={{
            border: '2px solid var(--color-hairline)',
            borderRadius: '8px',
            padding: '18px 24px',
            marginBottom: '32px',
            background: 'var(--color-metadata-bg, rgba(245, 58, 97, 0.03))',
          }}>
            {meta.description && (
              <p style={{
                fontFamily: 'var(--font-text)',
                fontSize: '16px',
                fontStyle: 'italic',
                lineHeight: 1.6,
                margin: '0 0 12px 0',
                color: 'var(--fg2, rgba(0,0,0,0.75))',
              }}>{meta.description}</p>
            )}
            <div style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg3, rgba(0,0,0,0.6))',
            }}>
              {meta.date && (
                <span>
                  <strong style={{ color: '#F53A61' }}>Date:</strong> {meta.date}
                </span>
              )}
              {meta.author && (
                <span>
                  <strong style={{ color: '#F53A61' }}>Author:</strong> {meta.author}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body — rendered markdown */}
        <div
          ref={proseRef}
          className="kf-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Blog index: list of posts loaded from blog-posts.json */}
        {isBlogIndex && posts && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
            {posts.map(post => (
              <li
                key={post.id}
                style={{
                  padding: '14px 0',
                  borderTop: '1px solid var(--color-hairline)',
                  cursor: 'pointer'
                }}
                onClick={() => onNav('blog/' + post.id)}
              >
                <a style={{
                  fontFamily: 'var(--font-text)', fontSize: 18,
                  color: '#F53A61', textDecoration: 'none'
                }}>
                  <span style={{ marginRight: '.5em', fontSize: '.85em' }}>▦</span>
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Back button */}
        <button
          onClick={() => onNav(isBlogPost ? 'blog' : 'home')}
          style={{
            background: 'transparent', color: 'inherit',
            fontFamily: 'var(--font-text)', fontSize: 16,
            padding: '8px 12px', border: '2px solid currentColor',
            borderRadius: 0, cursor: 'pointer', letterSpacing: '0.02em',
            marginTop: '2em', display: 'block'
          }}
        >{isBlogPost ? '← back to blog' : '← close page'}</button>

      </div>
    </div>
  );
}

window.Page = Page;
