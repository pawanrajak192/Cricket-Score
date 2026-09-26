import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useStore from '../store/useStore';

const FILTERS = ['All', 'Live', 'Completed', 'Draft', 'T20', 'ODI', 'Test'];

export default function Dashboard() {
  const user = useStore((s) => s.user);
  const matches = useStore((s) => s.myMatches());
  const deleteMatch = useStore((s) => s.deleteMatch);
  const nav = useNavigate();
  const [filter, setFilter] = useState('All');

  const filtered = matches.filter((m) => {
    if (filter === 'All') return true;
    if (['Live', 'Completed', 'Draft'].includes(filter)) return m.status === filter.toLowerCase();
    return m.matchType === filter;
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  function share(m) {
    const url = `${window.location.origin}/match/${m.id}`;
    navigator.clipboard?.writeText(url);
    alert('Scorecard link copied:\n' + url);
  }

  function openMatch(m) {
    if (m.status === 'completed') return nav(`/match/${m.id}`);
    if (m.status === 'draft') return nav(`/match/${m.id}/toss`);
    return nav(`/match/${m.id}/live`);
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-pitch mb-1">Welcome, {user.name}</h1>
        <p className="text-sub text-sm mb-6">Create a new match or jump back into one you've already started.</p>

        <Link to="/create-match" className="card p-5 mb-8 flex items-center justify-between hover:border-amber transition">
          <div>
            <div className="text-xl font-display text-pitch">Create Match</div>
            <div className="text-sm text-sub">Set up teams, players and match rules</div>
          </div>
          <span className="btn btn-pitch">New Match</span>
        </Link>

        <div className="flex gap-2 flex-wrap mb-4">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab ${filter === f ? '!bg-pitch !text-white' : ''}`}
              style={filter === f ? { background: '#1B4332', color: '#fff' } : {}}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p className="text-sub text-sm">No matches here yet.</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="tag">{m.matchType}</span>
                <span className={`tag ${m.status === 'live' ? 'text-run border-run' : ''}`}>{m.status}</span>
              </div>
              <div className="font-display text-xl mb-1">{m.name}</div>
              <div className="text-sm text-sub mb-3">{m.teamA?.name} vs {m.teamB?.name} · {m.date}</div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-pitch !py-1.5 !px-3 text-sm" onClick={() => openMatch(m)}>
                  {m.status === 'completed' ? 'View' : 'Continue'}
                </button>
                <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={() => share(m)}>Share</button>
                <button className="btn btn-ghost !py-1.5 !px-3 text-sm text-run" onClick={() => { if (confirm('Delete this match?')) deleteMatch(m.id); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
