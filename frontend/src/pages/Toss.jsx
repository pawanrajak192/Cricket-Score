import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useStore from '../store/useStore';

export default function Toss() {
  const { id } = useParams();
  const match = useStore((s) => s.getMatch(id));
  const updateMatch = useStore((s) => s.updateMatch);
  const nav = useNavigate();

  const [wonBy, setWonBy] = useState(null); // 'A' | 'B'
  const [decision, setDecision] = useState(null); // 'bat' | 'bowl'
  const [strikerId, setStrikerId] = useState('');
  const [nonStrikerId, setNonStrikerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');

  if (!match) return <Navigate to="/dashboard" replace />;

  const battingTeam = wonBy && decision
    ? (wonBy === 'A' ? (decision === 'bat' ? 'A' : 'B') : (decision === 'bat' ? 'B' : 'A'))
    : null;
  const bTeam = battingTeam === 'A' ? match.teamA : match.teamB;
  const fTeam = battingTeam === 'A' ? match.teamB : match.teamA;

  function start() {
    if (!strikerId || !nonStrikerId || strikerId === nonStrikerId) return alert('Pick two different opening batters.');
    if (!bowlerId) return alert('Pick the opening bowler.');
    const innings = {
      battingTeam, bowlingTeam: battingTeam === 'A' ? 'B' : 'A',
      oversLimit: match.oversLimit,
      openingStrikerId: strikerId, openingNonStrikerId: nonStrikerId, openingBowlerId: bowlerId,
      events: [], pendingBowlerId: null
    };
    updateMatch(match.id, {
      status: 'live',
      toss: { wonBy, decision },
      innings: [innings]
    });
    nav(`/match/${match.id}/live`);
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-3xl text-pitch mb-1">Toss</h1>
        <p className="text-sm text-sub mb-6">{match.teamA.name} vs {match.teamB.name}</p>

        <div className="card p-5 mb-4">
          <div className="text-sm font-semibold mb-2">Team that won the toss</div>
          <div className="flex gap-2">
            {['A', 'B'].map((t) => (
              <button key={t} className={`btn ${wonBy === t ? 'btn-pitch' : 'btn-ghost'}`} onClick={() => setWonBy(t)}>
                {t === 'A' ? match.teamA.name : match.teamB.name}
              </button>
            ))}
          </div>
        </div>

        {wonBy && (
          <div className="card p-5 mb-4">
            <div className="text-sm font-semibold mb-2">Elected to</div>
            <div className="flex gap-2">
              <button className={`btn ${decision === 'bat' ? 'btn-pitch' : 'btn-ghost'}`} onClick={() => setDecision('bat')}>Bat</button>
              <button className={`btn ${decision === 'bowl' ? 'btn-pitch' : 'btn-ghost'}`} onClick={() => setDecision('bowl')}>Bowl</button>
            </div>
          </div>
        )}

        {battingTeam && (
          <div className="card p-5 mb-4 flex flex-col gap-3">
            <div className="text-sm font-semibold">Opening batters — {bTeam.name}</div>
            <select className="input" value={strikerId} onChange={(e) => setStrikerId(e.target.value)}>
              <option value="">Striker</option>
              {bTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="input" value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)}>
              <option value="">Non-striker</option>
              {bTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-sm font-semibold mt-2">Opening bowler — {fTeam.name}</div>
            <select className="input" value={bowlerId} onChange={(e) => setBowlerId(e.target.value)}>
              <option value="">Bowler</option>
              {fTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {battingTeam && <button className="btn btn-amber w-full" onClick={start}>Start Match</button>}
      </div>
    </div>
  );
}
