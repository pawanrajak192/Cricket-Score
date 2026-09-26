import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useStore from '../store/useStore';
import { uid } from '../utils/id';

const STEPS = ['Match Details', 'Teams', 'Match Rules'];
const MATCH_TYPES = ['T20', 'ODI', 'Test', 'Custom'];

function emptyTeam(name) {
  return { name, players: [], captainId: null, keeperId: null };
}

function TeamEditor({ team, setTeam }) {
  const [name, setName] = useState('');
  function addPlayer() {
    if (!name.trim()) return;
    const p = { id: uid('p'), name: name.trim() };
    setTeam({ ...team, players: [...team.players, p] });
    setName('');
  }
  function removePlayer(id) {
    setTeam({
      ...team, players: team.players.filter((p) => p.id !== id),
      captainId: team.captainId === id ? null : team.captainId,
      keeperId: team.keeperId === id ? null : team.keeperId
    });
  }
  return (
    <div className="card p-4">
      <input className="input font-display text-xl mb-3 !py-2" value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} />
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Player name" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayer())} />
        <button type="button" className="btn btn-pitch !px-3" onClick={addPlayer}>Add</button>
      </div>
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {team.players.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm border border-line rounded-lg px-2.5 py-1.5">
            <span>{p.name}</span>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1 text-sub"><input type="radio" name={team.name + 'cap'} checked={team.captainId === p.id} onChange={() => setTeam({ ...team, captainId: p.id })} /> C</label>
              <label className="flex items-center gap-1 text-sub"><input type="radio" name={team.name + 'wk'} checked={team.keeperId === p.id} onChange={() => setTeam({ ...team, keeperId: p.id })} /> WK</label>
              <button type="button" className="text-run" onClick={() => removePlayer(p.id)}>✕</button>
            </div>
          </div>
        ))}
        {team.players.length === 0 && <p className="text-xs text-sub">No players added yet.</p>}
      </div>
    </div>
  );
}

export default function CreateMatch() {
  const user = useStore((s) => s.user);
  const createMatch = useStore((s) => s.createMatch);
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [matchType, setMatchType] = useState('T20');

  const [teamA, setTeamA] = useState(emptyTeam('Team A'));
  const [teamB, setTeamB] = useState(emptyTeam('Team B'));

  const [oversLimit, setOversLimit] = useState(20);
  const [wicketsLimit, setWicketsLimit] = useState(10);
  const [powerplayOvers, setPowerplayOvers] = useState(6);

  function next() {
    if (step === 0 && !name.trim()) return alert('Give the match a name.');
    if (step === 1 && (teamA.players.length < 2 || teamB.players.length < 2)) return alert('Add at least 2 players to each team.');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  function finish() {
    const match = createMatch({
      ownerId: user.id,
      name, date, matchType,
      oversLimit: matchType === 'Test' ? null : Number(oversLimit),
      wicketsLimit: Number(wicketsLimit),
      powerplayOvers: matchType === 'Test' ? null : Number(powerplayOvers),
      teamA, teamB,
      createdAt: Date.now()
    });
    nav(`/match/${match.id}/toss`);
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-pitch mb-1">Create Match</h1>
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`text-xs px-2.5 py-1 rounded-full border ${i === step ? 'bg-pitch text-white border-pitch' : 'border-line text-sub'}`}>{i + 1}. {s}</div>
          ))}
        </div>

        {step === 0 && (
          <div className="card p-5 flex flex-col gap-3">
            <label className="text-sm font-semibold">Match Name
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday League Final" />
            </label>
            <label className="text-sm font-semibold">Match Date
              <input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">Match Type
              <div className="flex gap-2 mt-1 flex-wrap">
                {MATCH_TYPES.map((t) => (
                  <button type="button" key={t} onClick={() => { setMatchType(t); if (t === 'T20') setOversLimit(20); if (t === 'ODI') setOversLimit(50); }}
                    className={`tab ${matchType === t ? '' : ''}`} style={matchType === t ? { background: '#1B4332', color: '#fff' } : {}}>{t}</button>
                ))}
              </div>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <TeamEditor team={teamA} setTeam={setTeamA} />
            <TeamEditor team={teamB} setTeam={setTeamB} />
          </div>
        )}

        {step === 2 && (
          <div className="card p-5 flex flex-col gap-3">
            {matchType !== 'Test' ? (
              <>
                <label className="text-sm font-semibold">Number of overs
                  <input className="input mt-1" type="number" min="1" value={oversLimit} onChange={(e) => setOversLimit(e.target.value)} />
                </label>
                <label className="text-sm font-semibold">Powerplay overs
                  <input className="input mt-1" type="number" min="0" value={powerplayOvers} onChange={(e) => setPowerplayOvers(e.target.value)} />
                </label>
              </>
            ) : (
              <p className="text-sm text-sub">Test matches are unlimited-overs, multi-innings — each innings runs until all out or declared. Scoring works the same, over limits are just not enforced.</p>
            )}
            <label className="text-sm font-semibold">Wickets per innings
              <input className="input mt-1" type="number" min="1" value={wicketsLimit} onChange={(e) => setWicketsLimit(e.target.value)} />
            </label>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button className="btn btn-ghost" onClick={back} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>Back</button>
          {step < STEPS.length - 1
            ? <button className="btn btn-amber" onClick={next}>Next</button>
            : <button className="btn btn-amber" onClick={finish}>Continue to Toss →</button>}
        </div>
      </div>
    </div>
  );
}
