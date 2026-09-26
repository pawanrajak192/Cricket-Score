import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const FEATURES = [
  ['Live Ball-by-Ball Scoring', 'Tap runs, extras and wickets as they happen — the score, overs and strike rotate themselves.'],
  ['Complete Batting Statistics', 'Runs, balls, 4s, 6s and strike rate for every batter, every innings.'],
  ['Complete Bowling Statistics', 'Overs, maidens, runs, wickets and economy tracked automatically.'],
  ['Match History', 'Every match you score is saved — resume a live match or revisit a finished one.'],
  ['Player Performance', 'Career batting and bowling numbers, rolled up automatically from your saved matches.'],
  ['Share Scorecard', 'Send a read-only link so anyone can follow the match without an account.']
];

export default function Landing() {
  const user = useStore((s) => s.user);
  const loginGuest = useStore((s) => s.loginGuest);
  const nav = useNavigate();

  function startGuest() {
    loginGuest();
    nav('/create-match');
  }

  return (
    <div>
      <div className="scoreboard text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl sm:text-6xl mb-3">Live Cricket Scoring Made Simple</h1>
          <p className="text-lg text-[#EDE7D3] max-w-xl mx-auto mb-8">
            Score every ball. Track every player. Save every match.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to={user ? '/create-match' : '/signup'} className="btn btn-amber">Create Match</Link>
            <button onClick={startGuest} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.4)', color: '#fff' }}>
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(([title, body]) => (
          <div key={title} className="card p-5">
            <h3 className="text-xl text-pitch mb-1">{title}</h3>
            <p className="text-sm text-sub leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
