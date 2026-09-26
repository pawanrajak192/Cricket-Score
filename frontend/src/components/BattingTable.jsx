import { battingSR } from '../engine/scoringEngine';

const HOWOUT_LABEL = {
  BOWLED: 'b', CAUGHT: 'c', LBW: 'lbw', RUN_OUT: 'run out', STUMPED: 'st',
  HIT_WICKET: 'hit wicket', RETIRED_HURT: 'retired hurt', OBSTRUCTING_THE_FIELD: 'obstructing field', OTHER: 'out'
};

export default function BattingTable({ battersOrdered, playerNames }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-sub border-b border-line">
            <th className="py-2 pr-2">Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th>
          </tr>
        </thead>
        <tbody>
          {battersOrdered.map((b) => (
            <tr key={b.id} className="border-b border-line/60">
              <td className="py-2 pr-2">
                <div className="font-semibold">{playerNames[b.id] || b.id}</div>
                <div className="text-xs text-sub">{b.out ? HOWOUT_LABEL[b.howOut] || 'out' : 'not out'}</div>
              </td>
              <td className="font-semibold">{b.runs}</td>
              <td>{b.balls}</td>
              <td>{b.fours}</td>
              <td>{b.sixes}</td>
              <td>{battingSR(b.runs, b.balls)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
