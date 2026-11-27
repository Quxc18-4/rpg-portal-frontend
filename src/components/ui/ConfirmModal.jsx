import { useLanguage } from '../../context/LanguageContext';

export default function ConfirmModal({
  open = false,
  title,
  message,
  confirmLabel,
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  const { lang } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-2 border-border-strong bg-surface">
        <div className="flex items-center justify-between border-b border-border-strong bg-subheader px-4 py-2.5">
          <span className="font-mono text-xs font-bold uppercase text-ink-primary">
            {title || (lang === 'vi' ? 'XÁC NHẬN THAO TÁC' : 'CONFIRM ACTION')}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="font-mono text-xs font-bold text-ink-secondary hover:text-ink-primary"
          >
            [X]
          </button>
        </div>

        <div className="p-4 text-sm text-ink-primary">{message}</div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-canvas px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="border border-border-strong bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
          >
            {lang === 'vi' ? 'HỦY' : 'CANCEL'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`border border-border-strong px-3 py-1.5 font-mono text-xs font-semibold text-white ${
              danger ? 'bg-accent-crimson' : 'bg-accent-emerald'
            } disabled:opacity-60`}
          >
            {loading
              ? '...'
              : confirmLabel || (lang === 'vi' ? 'XÁC NHẬN' : 'CONFIRM')}
          </button>
        </div>
      </div>
    </div>
  );
}