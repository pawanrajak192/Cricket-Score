import { useState } from 'react';

const TYPES = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Retired Hurt', 'Obstructing the Field', 'Other'];
const NEEDS_FIELDER = ['Caught', 'Run Out', 'Stumped'];

export default function WicketModal({ striker, nonStriker, battingTeamPlayers, fieldingTeamPlayers, outIds, onConfirm, onClose }) {
  const [type, setType] = useState('Bowled');
  const [outBatterId, setOutBatterId] = useState(striker.id);
  const [fielderId, setFielderId] = useState('');
  const [runsBeforeDismissal, setRunsBeforeDismissal] = useState(0);
  const [newBatterId, setNewBatterId] = useState('');

  const available = battingTeamPlayers.filter((p) => !outIds.has(p.id) && p.id !== striker.id && p.id !== nonStriker.id);

  function confirm() {
    if (NEEDS_FIELDER.includes(type) && !fielderId) return alert('Select the fielder.');
    if (available.length > 0 && !newBatterId && type !== 'Retired Hurt') return alert('Select the next batter.');
    onConfirm({
      type: type.toUpperCase().replace(/ /g, '_'),
      outBatterId,
      fielderId: NEEDS_FIELDER.includes(type) ? fielderId : null,
      runsBeforeDismissal: type === 'Run Out' ? Number(runsBeforeDismissal) : 0,
      newBatterId: newBatterId || null
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl text-run mb-3">Wicket</h3>

        <label className="text-xs font-semibold text-sub">Dismissal type</label>
        <select className="input mt-1 mb-3" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <label className="text-xs font-semibold text-sub">Batter out</label>
        <select className="input mt-1 mb-3" value={outBatterId} onChange={(e) => setOutBatterId(e.target.value)}>
          <option value={striker.id}>{striker.name} (striker)</option>
          <option value={nonStriker.id}>{nonStriker.name} (non-striker)</option>
        </select>

        {type === 'Run Out' && (
          <>
            <label className="text-xs font-semibold text-sub">Runs completed before the dismissal</label>
            <input className="input mt-1 mb-3" type="number" min="0" value={runsBeforeDismissal} onChange={(e) => setRunsBeforeDismissal(e.target.value)} />
          </>
        )}

        {NEEDS_FIELDER.includes(type) && (
          <>
            <label className="text-xs font-semibold text-sub">{type === 'Stumped' ? 'Wicketkeeper' : 'Fielder'}</label>
            <select className="input mt-1 mb-3" value={fielderId} onChange={(e) => setFielderId(e.target.value)}>
              <option value="">Select</option>
              {fieldingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}

        {available.length > 0 && type !== 'Retired Hurt' && (
          <>
            <label className="text-xs font-semibold text-sub">Next batter</label>
            <select className="input mt-1 mb-3" value={newBatterId} onChange={(e) => setNewBatterId(e.target.value)}>
              <option value="">Select</option>
              {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}

        <div className="flex gap-2 mt-2">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-pitch flex-1" style={{ background: '#B3432B' }} onClick={confirm}>Confirm Out</button>
        </div>
      </div>
    </div>
  );
}
