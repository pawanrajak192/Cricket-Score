export default function ExtraRunsModal({ title, hint, max = 6, onConfirm, onClose }) {
  const options = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl text-pitch mb-1">{title}</h3>
        {hint && <p className="text-xs text-sub mb-3">{hint}</p>}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {options.map((n) => (
            <button key={n} className="btn btn-ghost text-lg" onClick={() => onConfirm(n)}>{n}</button>
          ))}
        </div>
        <button className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
