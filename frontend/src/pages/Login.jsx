import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Login() {
  const login = useStore((s) => s.login);
  const loginGuest = useStore((s) => s.loginGuest);
  const nav = useNavigate();
  const [method, setMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const res = await login({ identifier, password });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    nav('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-7 w-full max-w-sm">
        <h1 className="text-3xl text-pitch mb-1">Log in</h1>
        <p className="text-sm text-sub mb-5">Score, save and resume your matches.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <select className="input !w-28" value={method} onChange={(e) => { setMethod(e.target.value); setIdentifier(''); }}>
              <option value="email">Email</option>
              <option value="mobile">Mobile</option>
            </select>
            <input className="input" placeholder={method === 'email' ? 'you@example.com' : '10-digit number'} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </div>
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-run text-sm">{error}</div>}
          <button className="btn btn-amber" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <button type="button" className="text-xs text-sub text-left hover:underline" onClick={() => alert('Password reset would be emailed/texted to you in the full backend version.')}>
            Forgot password?
          </button>
        </form>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-line" /><span className="text-xs text-sub">or</span><div className="flex-1 h-px bg-line" />
        </div>
        <button className="btn btn-ghost w-full" onClick={() => { loginGuest(); nav('/dashboard'); }}>Continue as guest</button>
        <p className="text-xs text-sub mt-4">No account? <Link to="/signup" className="text-pitch font-semibold">Sign up</Link></p>
      </div>
    </div>
  );
}
