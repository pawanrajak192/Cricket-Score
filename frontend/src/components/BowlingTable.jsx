import { bowlingEcon, oversFromBalls } from '../engine/scoringEngine';

export default function BowlingTable({ bowlers, playerNames }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-sub border-b border-line">
            <th className="py-2 pr-2">Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th><th>Wd</th><th>Nb</th>
          </tr>
        </thead>
        <tbody>
          {bowlers.map((bw) => (
            <tr key={bw.id} className="border-b border-line/60">
              <td className="py-2 pr-2 font-semibold">{playerNames[bw.id] || bw.id}</td>
              <td>{oversFromBalls(bw.balls)}</td>
              <td>{bw.maidens}</td>
              <td>{bw.runsConceded}</td>
              <td className="font-semibold">{bw.wickets}</td>
              <td>{bowlingEcon(bw.runsConceded, bw.balls)}</td>
              <td>{bw.wides}</td>
              <td>{bw.noBalls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
