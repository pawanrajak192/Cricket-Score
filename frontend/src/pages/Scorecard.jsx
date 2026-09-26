import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { api } from '../api/client';
import { deriveInningsState } from '../engine/scoringEngine';
import BattingTable from '../components/BattingTable';
import BowlingTable from '../components/BowlingTable';

function teamOf(match, key) { return key === 'A' ? match.teamA : match.teamB; }

export default function Scorecard() {
  const { id } = useParams();
  const localMatch = useStore((s) => s.getMatch(id));
  const user = useStore((s) => s.user);
  const [remoteMatch, setRemoteMatch] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // If this browser doesn't have the match locally (e.g. someone opened a
  // share link on a different device), fall back to the public API — it
  // only works for matches created by a signed-up user, since guest
  // matches never leave the browser they were scored in.
  useEffect(() => {
    if (localMatch) return;
    api.getPublicMatch(id)
      .then(({ match }) => setRemoteMatch(match))
      .catch(() => setNotFound(true));
  }, [id, localMatch]);

  const match = localMatch || remoteMatch;

  if (!match) {
    if (notFound) return <Navigate to="/" replace />;
    return <div className="max-w-3xl mx-auto px-4 py-10 text-sub text-sm">Loading scorecard…</div>;
  }

  const playerNames = {};
  [...match.teamA.players, ...match.teamB.players].forEach((p) => (playerNames[p.id] = p.name));

  const innStates = (match.innings || []).map((inn) => ({ inn, s: deriveInningsState(inn) }));

  // simple Player of the Match: highest (runs + wickets*20) across the match
  let potm = null, potmScore = -1;
  innStates.forEach(({ s }) => {
    Object.values(s.batters).forEach((b) => {
      const bw = Object.values(s.bowlers).find((x) => x.id === b.id);
      const score = b.runs + (bw ? bw.wickets * 20 : 0);
      if (score > potmScore) { potmScore = score; potm = b.id; }
    });
  });

  function copyLink() {
    const url = `${window.location.origin}/match/${match.id}`;
    navigator.clipboard?.writeText(url);
    alert('Link copied:\n' + url);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <Link to={user ? '/dashboard' : '/'} className="text-2xl font-display text-pitch">Crease</Link>
        <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={copyLink}>Copy Scorecard Link</button>
      </div>

      <div className="scoreboard text-white rounded-xl2 px-5 py-6 mb-6">
        <div className="text-sm text-[#EDE7D3] mb-1">{match.matchType} · {match.date}</div>
        <div className="text-2xl font-display mb-2">{match.teamA.name} vs {match.teamB.name}</div>
        {match.status === 'completed'
          ? <div className="text-xl">🏆 {match.result?.summary}</div>
          : <div className="text-sm text-amber uppercase tracking-wide">{match.status}</div>}
      </div>

      {match.status === 'completed' && potm && (
        <div className="card p-4 mb-6">
          <div className="text-xs text-sub uppercase mb-1">Player of the Match</div>
          <div className="font-display text-2xl text-pitch">{playerNames[potm]}</div>
        </div>
      )}

      {innStates.map(({ inn, s }, i) => (
        <div key={i} className="mb-8">
          <h2 className="text-2xl text-pitch mb-2">
            {teamOf(match, inn.battingTeam).name} — {s.totalRuns}/{s.wickets} <span className="text-base text-sub">({s.oversDisplay} ov)</span>
          </h2>
          <div className="card p-4 mb-3">
            <BattingTable
              battersOrdered={Object.values(s.batters).sort((a, b) => (a.order || 0) - (b.order || 0))}
              playerNames={playerNames}
            />
          </div>
          <div className="card p-4">
            <BowlingTable bowlers={Object.values(s.bowlers)} playerNames={playerNames} />
          </div>
        </div>
      ))}

      {match.status !== 'completed' && (
        <p className="text-sm text-sub">This match is still in progress — the scorecard updates as it's scored. Refresh to see the latest.</p>
      )}
    </div>
  );
}
