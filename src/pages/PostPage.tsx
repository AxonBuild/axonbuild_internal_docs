import { isValidElement, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { getPost } from "../data/posts";
import { formatDateDdMmYyyy } from "../formatDate";
import { MermaidDiagram } from "../components/MermaidDiagram";

export function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = getPost(slug);
  const [md, setMd] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setMd(null);
    setFailed(false);
    fetch(`${import.meta.env.BASE_URL}docs/${slug}.md`)
      .then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.text();
      })
      .then(setMd)
      .catch(() => setFailed(true));
  }, [slug]);

  if (!meta || failed) {
    return (
      <div className="doc doc-error">
        <h1>Not found</h1>
        <p>This post does not exist or failed to load.</p>
        <Link to="/">← Home</Link>
      </div>
    );
  }

  if (md === null) {
    return (
      <div className="doc">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <article className="doc">
      <p className="doc-meta">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> · </span>
        <time dateTime={meta.date}>{formatDateDdMmYyyy(meta.date)}</time>
      </p>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeHighlight, {
            aliases: { ini: ["dotenv", "env"] },
            plainText: ["mermaid", "text", "txt"],
          }],
        ]}
        components={{
          pre: ({ children, ...props }) => {
            const child = Array.isArray(children) ? children[0] : children;
            if (
              isValidElement<{ className?: string; children?: unknown }>(child) &&
              child.props.className === "language-mermaid"
            ) {
              return <MermaidDiagram chart={String(child.props.children).trim()} />;
            }
            return <pre {...props}>{children}</pre>;
          },
          a: ({ href, children, ...props }) => {
            if (href?.startsWith("http")) {
              return (
                <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
                  {children}
                </a>
              );
            }
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          },
          img: ({ src, alt, ...props }) => {
            if (!src) return null;
            const resolved = src.startsWith("/")
              ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}${src}`
              : src;
            return <img src={resolved} alt={alt ?? ""} loading="lazy" {...props} />;
          },
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
