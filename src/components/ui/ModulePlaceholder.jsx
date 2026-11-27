export default function ModulePlaceholder({ code, endpoint }) {
  return (
    <div className="border border-border-strong bg-surface p-6">
      <div className="font-mono text-xs font-semibold text-accent-emerald">
        [MODULE // {code}]
      </div>
      <p className="mt-2 font-mono text-xs text-ink-secondary">
        API Target: {endpoint}
      </p>
    </div>
  );
}