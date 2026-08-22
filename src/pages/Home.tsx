import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import { formatDateDdMmYyyy } from "../formatDate";
import { useState } from "react";

const heroImage = `${import.meta.env.BASE_URL}hero.jpg`;

export function Home() {
  const [showHero, setShowHero] = useState(true);

  return (
    <>
      <section className="hero">
        <h1>Internal handbook</h1>
        <p className="lede">
          ABRuntime builds AI-powered and full-stack products. This site holds technical guidance, process notes, and
          articles for the team.
        </p>
      </section>

      <section className="about">
        <h2>About</h2>
        <p>
          We focus on reliable delivery: clear architecture, pragmatic code quality, and honest communication with
          stakeholders. Use the posts below for standards, onboarding, and deep dives.
        </p>
        {showHero && (
          <figure className="hero-figure">
            <div className="hero-image-frame">
              <div className="hero-image-shine" aria-hidden="true" />
              <img
                src={heroImage}
                alt=""
                className="hero-image"
                width={1825}
                height={1065}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={() => setShowHero(false)}
              />
            </div>
            <figcaption className="hero-caption">ABRuntime</figcaption>
          </figure>
        )}
        {!showHero && (
          <p className="image-hint">
            Add <code>public/hero.jpg</code> for the homepage image.
          </p>
        )}
      </section>

      <section className="post-index" id="posts">
        <h2>Posts</h2>
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link to={`/p/${p.slug}`} className="post-card">
                <span className="post-title">{p.title}</span>
                <time dateTime={p.date}>{formatDateDdMmYyyy(p.date)}</time>
                <span className="post-desc">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
