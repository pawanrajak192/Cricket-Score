function ballLabel(ev) {
  if (ev.wicket) return 'W';
  if (ev.extraType === 'wd') return `${ev.extraRuns}wd`;
  if (ev.extraType === 'nb') return `${ev.battingRuns}nb`;
  if (ev.extraType === 'bye') return `${ev.extraRuns}b`;
  if (ev.extraType === 'lb') return `${ev.extraRuns}lb`;
  return String(ev.battingRuns);
}

export default function OverTimeline({ currentOverEvents, overHistory }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-sub mb-2">THIS OVER</div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {currentOverEvents.length === 0 && <span className="text-sub text-sm">No balls bowled yet</span>}
        {currentOverEvents.map((ev, i) => (
          <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
            ${ev.wicket ? 'bg-run text-white' : ev.battingRuns === 6 ? 'bg-amber text-[#241300]' : ev.battingRuns === 4 ? 'bg-pitch text-white' : 'bg-[#efece2] text-ink'}`}>
            {ballLabel(ev)}
          </span>
        ))}
      </div>
      {overHistory.length > 0 && (
        <>
          <div className="text-xs font-semibold text-sub mb-2">PREVIOUS OVERS</div>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {overHistory.slice().reverse().map((o) => (
              <div key={o.overNumber} className="flex justify-between text-sm border-b border-line/60 py-1">
                <span className="text-sub">Over {o.overNumber}</span>
                <span className="flex gap-1">{o.events.map((ev, i) => <span key={i} className="text-xs">{ballLabel(ev)}</span>)}</span>
                <span className="font-semibold">{o.runs} runs</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
