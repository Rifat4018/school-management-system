import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/client.js';

const DEMO = [
  ['Admin', 'admin@school.com', 'admin123'],
  ['Teacher', 'farhana@school.com', 'teacher123'],
  ['Student', 'student1@school.com', 'student123'],
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>🎓 School Management</h1>
        <p className="muted">Sign in to continue</p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="demo">
          <span className="muted">Demo accounts (after running the seed script):</span>
          {DEMO.map(([role, mail, pass]) => (
            <button
              type="button"
              key={role}
              className="btn btn-sm"
              onClick={() => {
                setEmail(mail);
                setPassword(pass);
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
