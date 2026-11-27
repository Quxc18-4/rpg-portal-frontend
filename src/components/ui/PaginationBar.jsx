import { useLanguage } from '../../hooks/useLanguage';

export default function PaginationBar({
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
}) {
  const { lang } = useLanguage();
  const safePage = Math.max(1, Number(page) || 1);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  if (safeTotalPages <= 1 && total === 0) return null;

  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-border-strong bg-subheader px-4 py-2.5 font-mono text-xs">
      <div className="tabular-nums text-ink-secondary">
        {lang === 'vi'
          ? `TỔNG: ${total} BẢN GHI // TRANG ${safePage}/${safeTotalPages}`
          : `TOTAL: ${total} RECORDS // PAGE ${safePage}/${safeTotalPages}`}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(safePage - 1)}
          className="border border-border-strong bg-surface px-2.5 py-1 font-semibold text-ink-primary hover:bg-canvas disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-ink-secondary"
        >
          &lt; {lang === 'vi' ? 'TRƯỚC' : 'PREV'}
        </button>

        <span className="border border-border-strong bg-ink-primary px-3 py-1 font-semibold text-white tabular-nums">
          {safePage}
        </span>

        <button
          type="button"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(safePage + 1)}
          className="border border-border-strong bg-surface px-2.5 py-1 font-semibold text-ink-primary hover:bg-canvas disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-ink-secondary"
        >
          {lang === 'vi' ? 'SAU' : 'NEXT'} &gt;
        </button>
      </div>
    </div>
  );
}