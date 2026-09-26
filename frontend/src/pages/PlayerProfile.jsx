import { useParams, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import useStore from '../store/useStore';
import { computePlayerCareer, matchInningsOf } from '../engine/statsEngine';

export default function PlayerProfile() {
  const { id } = useParams();
  const matches = useStore((s) => s.myMatches());

  const allPlayers = {};
  matches.forEach((m) => [...m.teamA.players, ...m.teamB.players].forEach((p) => (allPlayers[p.id] = p.name)));
  const name = allPlayers[id];
  if (!name) return <Navigate to="/dashboard" replace />;

  const career = computePlayerCareer(matches, id);
  const runsPerInnings = matchInningsOf({ innings: matches.flatMap((m) => m.innings) }, id)
    .map((b, i) => ({ innings: `Inn ${i + 1}`, runs: b.runs }));

  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-pitch mb-6">{name}</h1>

        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          <div className="card p-4">
            <h3 className="text-lg text-pitch mb-2">Batting</h3>
            <Stat label="Matches" v={career.batting.matches} />
            <Stat label="Innings" v={career.batting.innings} />
            <Stat label="Runs" v={career.batting.runs} />
            <Stat label="Highest Score" v={career.batting.highScore} />
            <Stat label="Average" v={career.batting.average} />
            <Stat label="Strike Rate" v={career.batting.strikeRate} />
            <Stat label="4s / 6s" v={`${career.batting.fours} / ${career.batting.sixes}`} />
            <Stat label="50s / 100s" v={`${career.batting.fifties} / ${career.batting.hundreds}`} />
          </div>
          <div className="card p-4">
            <h3 className="text-lg text-pitch mb-2">Bowling</h3>
            <Stat label="Matches" v={career.bowling.matches} />
            <Stat label="Overs" v={career.bowling.overs} />
            <Stat label="Runs" v={career.bowling.runs} />
            <Stat label="Wickets" v={career.bowling.wickets} />
            <Stat label="Best Bowling" v={career.bowling.best} />
            <Stat label="Economy" v={career.bowling.economy} />
            <Stat label="Average" v={career.bowling.average} />
            <Stat label="Maidens" v={career.bowling.maidens} />
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg text-pitch mb-3">Runs per innings</h3>
          {runsPerInnings.length === 0 ? <p className="text-sm text-sub">No completed innings yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={runsPerInnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D3C6" />
                <XAxis dataKey="innings" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="runs" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-line/60">
      <span className="text-sub">{label}</span><span className="font-semibold">{v}</span>
    </div>
  );
}
