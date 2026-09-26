import { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WicketModal from '../components/WicketModal';
import ExtraRunsModal from '../components/ExtraRunsModal';
import OverTimeline from '../components/OverTimeline';
import useStore from '../store/useStore';
import { deriveInningsState, recordBall, recordWicket, undoLast, setNewOverBowler, battingSR, bowlingEcon, oversFromBalls } from '../engine/scoringEngine';

function teamOf(match, key) { return key === 'A' ? match.teamA : match.teamB; }

function BatterCard({ label, player, stat, striking }) {
  return (
    <div className={`card p-3 flex-1 ${striking ? 'border-amber border-2' : ''}`}>
      <div className="text-[10px] text-sub uppercase">{label}{striking ? ' • on strike' : ''}</div>
      <div className="font-display text-lg leading-tight">{player?.name || '—'}</div>
      <div className="text-sm">{stat.runs} <span className="text-sub">({stat.balls})</span></div>
      <div className="text-[11px] text-sub">4s {stat.fours} · 6s {stat.sixes} · SR {battingSR(stat.runs, stat.balls)}</div>
    </div>
  );
}

export default function LiveScoring() {
  const { id } = useParams();
  const match = useStore((s) => s.getMatch(id));
  const updateMatch = useStore((s) => s.updateMatch);
  const nav = useNavigate();

  const [wicketOpen, setWicketOpen] = useState(false);
  const [extraModal, setExtraModal] = useState(null); // 'wd' | 'nb' | 'bye' | 'lb'
  const [newBowlerId, setNewBowlerId] = useState('');
  const [secondInnStriker, setSecondInnStriker] = useState('');
  const [secondInnNon, setSecondInnNon] = useState('');
  const [secondInnBowler, setSecondInnBowler] = useState('');

  if (!match) return <Navigate to="/dashboard" replace />;

  const inningsIdx = match.innings.length - 1;
  const innings = match.innings[inningsIdx];
  const state = useMemo(() => deriveInningsState(innings), [innings]);

  const battingTeam = teamOf(match, innings.battingTeam);
  const bowlingTeam = teamOf(match, innings.bowlingTeam);
  const playerNames = {};
  [...match.teamA.players, ...match.teamB.players].forEach((p) => (playerNames[p.id] = p.name));

  const isSecondInnings = inningsIdx === 1;
  const target = isSecondInnings ? deriveInningsState(match.innings[0]).totalRuns + 1 : null;

  const oversDone = match.oversLimit ? state.totalLegalBalls >= match.oversLimit * 6 : false;
  const allOut = state.wickets >= match.wicketsLimit;
  const chaseWon = isSecondInnings && state.totalRuns >= target;
  const inningsOver = oversDone || allOut || chaseWon;

  function persist(nextInnings) {
    const list = [...match.innings];
    list[inningsIdx] = nextInnings;
    updateMatch(match.id, { innings: list });
  }

  function score(runs) { persist(recordBall(innings, { battingRuns: runs })); }
  function confirmExtra(kind, extra) {
    if (kind === 'wd') persist(recordBall(innings, { extraType: 'wd', extraRuns: 1 + extra }));
    if (kind === 'nb') persist(recordBall(innings, { extraType: 'nb', battingRuns: extra, extraRuns: 1 }));
    if (kind === 'bye') persist(recordBall(innings, { extraType: 'bye', extraRuns: extra || 1 }));
    if (kind === 'lb') persist(recordBall(innings, { extraType: 'lb', extraRuns: extra || 1 }));
    setExtraModal(null);
  }
  function confirmWicket(w) { persist(recordWicket(innings, w)); setWicketOpen(false); }
  function undo() { persist(undoLast(innings)); }
  function confirmNewBowler() {
    if (!newBowlerId) return alert('Pick the next over\'s bowler.');
    persist(setNewOverBowler(innings, newBowlerId));
    setNewBowlerId('');
  }

  function startSecondInnings() {
    if (!secondInnStriker || !secondInnNon || secondInnStriker === secondInnNon) return alert('Pick two different openers.');
    if (!secondInnBowler) return alert('Pick the opening bowler.');
    const nextInnings = {
      battingTeam: innings.bowlingTeam, bowlingTeam: innings.battingTeam,
      oversLimit: match.oversLimit,
      openingStrikerId: secondInnStriker, openingNonStrikerId: secondInnNon, openingBowlerId: secondInnBowler,
      events: [], pendingBowlerId: null
    };
    updateMatch(match.id, { innings: [...match.innings, nextInnings] });
  }

  function finishMatch() {
    const inn1 = deriveInningsState(match.innings[0]);
    const inn2 = match.innings[1] ? deriveInningsState(match.innings[1]) : null;
    let summary;
    if (inn2) {
      if (inn2.totalRuns >= target) {
        const wLeft = match.wicketsLimit - inn2.wickets;
        summary = `${teamOf(match, match.innings[1].battingTeam).name} won by ${wLeft} wicket${wLeft === 1 ? '' : 's'}`;
      } else if (inn2.totalRuns === target - 1) {
        summary = 'Match tied';
      } else {
        const runsDiff = inn1.totalRuns - inn2.totalRuns;
        summary = `${teamOf(match, match.innings[0].battingTeam).name} won by ${runsDiff} run${runsDiff === 1 ? '' : 's'}`;
      }
    } else {
      summary = 'Match complete';
    }
    updateMatch(match.id, { status: 'completed', result: { summary } });
    nav(`/match/${match.id}`);
  }

  const strikerP = { id: state.striker, name: playerNames[state.striker] };
  const nonStrikerP = { id: state.nonStriker, name: playerNames[state.nonStriker] };
  const bowlerId = innings.pendingBowlerId || state.bowler;
  const bowlerStat = state.bowlers[bowlerId] || { balls: 0, runsConceded: 0, wickets: 0, maidens: 0 };
  const outIds = new Set(Object.values(state.batters).filter((b) => b.out).map((b) => b.id));

  const runsReq = target ? Math.max(0, target - state.totalRuns) : null;
  const ballsLeft = match.oversLimit ? Math.max(0, match.oversLimit * 6 - state.totalLegalBalls) : null;

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="scoreboard text-white rounded-b-xl2 px-4 py-5 mb-5">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-display">{battingTeam.name}</div>
            <div className="text-4xl font-display">{state.totalRuns}/{state.wickets}</div>
          </div>
          <div className="text-sm text-[#EDE7D3] flex justify-between">
            <span>{match.oversLimit ? `${state.oversDisplay} / ${match.oversLimit} overs` : `${state.oversDisplay} overs`}</span>
            {isSecondInnings && !inningsOver && <span>Need {runsReq} from {ballsLeft} balls</span>}
          </div>
        </div>

        {inningsOver ? (
          <div className="card p-5 text-center">
            <h2 className="text-2xl text-pitch mb-1">
              {isSecondInnings ? 'Match complete' : 'Innings complete'}
            </h2>
            <p className="text-sm text-sub mb-4">{battingTeam.name} finished on {state.totalRuns}/{state.wickets} ({state.oversDisplay} ov)</p>
            {!isSecondInnings ? (
              <div className="text-left">
                <p className="text-sm font-semibold mb-2">Set up innings 2 — {bowlingTeam.name} to bat, chasing {state.totalRuns + 1}</p>
                <select className="input mb-2" value={secondInnStriker} onChange={(e) => setSecondInnStriker(e.target.value)}>
                  <option value="">Striker</option>
                  {bowlingTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="input mb-2" value={secondInnNon} onChange={(e) => setSecondInnNon(e.target.value)}>
                  <option value="">Non-striker</option>
                  {bowlingTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="input mb-3" value={secondInnBowler} onChange={(e) => setSecondInnBowler(e.target.value)}>
                  <option value="">Opening bowler ({battingTeam.name})</option>
                  {battingTeam.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="btn btn-amber w-full" onClick={startSecondInnings}>Start Innings 2</button>
              </div>
            ) : (
              <button className="btn btn-amber w-full" onClick={finishMatch}>Finish Match & View Result</button>
            )}
          </div>
        ) : state.needsNewBowler && !innings.pendingBowlerId ? (
          <div className="card p-5">
            <h3 className="text-xl text-pitch mb-2">Over complete — pick the next bowler</h3>
            <select className="input mb-3" value={newBowlerId} onChange={(e) => setNewBowlerId(e.target.value)}>
              <option value="">Select bowler</option>
              {bowlingTeam.players
                .filter((p) => !(state.overHistory.length && state.overHistory[state.overHistory.length - 1].bowlerId === p.id))
                .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-amber w-full" onClick={confirmNewBowler}>Confirm & Continue</button>
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-3">
              <BatterCard label="Striker" player={strikerP} stat={state.batters[state.striker] || { runs: 0, balls: 0, fours: 0, sixes: 0 }} striking />
              <BatterCard label="Non-striker" player={nonStrikerP} stat={state.batters[state.nonStriker] || { runs: 0, balls: 0, fours: 0, sixes: 0 }} />
            </div>
            <div className="card p-3 mb-4">
              <div className="text-[10px] text-sub uppercase">Bowling</div>
              <div className="font-display text-lg leading-tight">{playerNames[bowlerId]}</div>
              <div className="text-[11px] text-sub">{oversFromBalls(bowlerStat.balls)} ov · {bowlerStat.runsConceded} runs · {bowlerStat.wickets} wkts · Econ {bowlingEcon(bowlerStat.runsConceded, bowlerStat.balls)}</div>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button key={r} onClick={() => score(r)}
                  className={`btn text-xl ${r === 4 ? 'btn-pitch' : r === 6 ? 'btn-amber' : 'btn-ghost'}`}>{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <button className="btn btn-ghost" onClick={() => setExtraModal('wd')}>WD</button>
              <button className="btn btn-ghost" onClick={() => setExtraModal('nb')}>NB</button>
              <button className="btn btn-ghost" onClick={() => setExtraModal('bye')}>BYE</button>
              <button className="btn btn-ghost" onClick={() => setExtraModal('lb')}>LB</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button className="btn" style={{ background: '#B3432B', color: '#fff' }} onClick={() => setWicketOpen(true)}>WICKET</button>
              <button className="btn btn-ghost" disabled={!innings.events.length} onClick={undo}>Undo</button>
            </div>

            <OverTimeline currentOverEvents={state.currentOverEvents} overHistory={state.overHistory} />
          </>
        )}
      </div>

      {wicketOpen && (
        <WicketModal
          striker={strikerP} nonStriker={nonStrikerP}
          battingTeamPlayers={battingTeam.players} fieldingTeamPlayers={bowlingTeam.players}
          outIds={outIds} onClose={() => setWicketOpen(false)} onConfirm={confirmWicket}
        />
      )}
      {extraModal === 'wd' && <ExtraRunsModal title="Wide" hint="Additional runs run on the wide (the +1 wide is automatic)" onClose={() => setExtraModal(null)} onConfirm={(n) => confirmExtra('wd', n)} />}
      {extraModal === 'nb' && <ExtraRunsModal title="No Ball" hint="Runs scored off the bat (the +1 no-ball penalty is automatic)" onClose={() => setExtraModal(null)} onConfirm={(n) => confirmExtra('nb', n)} />}
      {extraModal === 'bye' && <ExtraRunsModal title="Bye" hint="Runs taken" max={4} onClose={() => setExtraModal(null)} onConfirm={(n) => confirmExtra('bye', n)} />}
      {extraModal === 'lb' && <ExtraRunsModal title="Leg Bye" hint="Runs taken" max={4} onClose={() => setExtraModal(null)} onConfirm={(n) => confirmExtra('lb', n)} />}
    </div>
  );
}
