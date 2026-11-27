const VARIANT_CLASSES = {
  neutral: 'border-border-subtle bg-canvas text-ink-secondary',
  dark: 'border-border-strong bg-ink-primary text-white',
  emerald: 'border-accent-emerald bg-surface text-accent-emerald',
  amber: 'border-accent-amber bg-surface text-accent-amber',
  crimson: 'border-accent-crimson bg-surface text-accent-crimson',
};

export default function StatusTag({ label, variant = 'neutral', className = '' }) {
  if (!label) return null;
  const style = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;

  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      [{label}]
    </span>
  );
}