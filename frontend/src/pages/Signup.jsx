import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Signup() {
  const signup = useStore((s) => s.signup);
  const loginGuest = useStore((s) => s.loginGuest);
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name.');
    if (!email.trim() && !mobile.trim()) return setError('Enter an email or a mobile number.');
    if (password.length < 4) return setError('Password must be at least 4 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    const res = await signup({ name, email: email.trim() || null, mobile: mobile.trim() || null, password });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    nav('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card p-7 w-full max-w-sm">
        <h1 className="text-3xl text-pitch mb-1">Sign up</h1>
        <p className="text-sm text-sub mb-5">Keep your matches permanently, on any device you log into.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="input" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <div className="text-run text-sm">{error}</div>}
          <button className="btn btn-amber" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-line" /><span className="text-xs text-sub">or</span><div className="flex-1 h-px bg-line" />
        </div>
        <button className="btn btn-ghost w-full" onClick={() => { loginGuest(); nav('/dashboard'); }}>Continue as guest</button>
        <p className="text-xs text-sub mt-3 leading-relaxed">
          Guest matches are saved on this device. Create an account to keep your matches permanently.
        </p>
        <p className="text-xs text-sub mt-3">Already have an account? <Link to="/login" className="text-pitch font-semibold">Log in</Link></p>
      </div>
    </div>
  );
}
