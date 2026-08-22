import { Link, Outlet } from "react-router-dom";
import { useState } from "react";

export function Layout() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            {logoOk && (
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt=""
                className="brand-logo"
                width={32}
                height={32}
                onError={() => setLogoOk(false)}
              />
            )}
            <span>ABRuntime</span>
            <span className="brand-muted">Docs</span>
          </Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/#posts">Posts</Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Internal documentation — ABRuntime</p>
      </footer>
    </div>
  );
}
