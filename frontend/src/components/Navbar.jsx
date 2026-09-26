import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Navbar() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const nav = useNavigate();

  return (
    <div className="border-b border-line bg-white sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="text-2xl font-display text-pitch">Crease</Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-sub hidden sm:inline">Hi, {user.name}{user.guest ? ' (guest)' : ''}</span>
            <button className="btn btn-ghost !py-1.5 !px-3" onClick={() => { logout(); nav('/'); }}>Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}
