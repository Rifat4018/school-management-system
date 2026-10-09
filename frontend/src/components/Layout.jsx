import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PAGES } from '../routes.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const links = PAGES.filter((p) => p.roles.includes(user.role));

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">🎓 School MS</div>
        <nav>
          {links.map((p) => (
            <NavLink key={p.path} to={p.path} end={p.path === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {p.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <strong>{user.name}</strong> <span className="badge">{user.role}</span>
          </div>
          <button type="button" className="btn" onClick={logout}>
            Log out
          </button>
        </header>
        <main className="content">
          {/* The matched child route is rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
