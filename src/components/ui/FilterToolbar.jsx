import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../context/LanguageContext';

export default function FilterToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  filters = [],
  onReset,
  rightSlot = null,
}) {
  const { lang } = useLanguage();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 350);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (onSearchChange && debouncedSearch !== searchValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchValue]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {onSearchChange && (
          <div className="flex items-center border border-border-strong bg-canvas">
            <span className="border-r border-border-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-secondary">
              {lang === 'vi' ? 'TÌM' : 'FIND'}
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={
                searchPlaceholder ||
                (lang === 'vi' ? 'Từ khóa, tên vật phẩm...' : 'Keyword, item name...')
              }
              className="w-56 bg-transparent px-2.5 py-1.5 text-xs text-ink-primary outline-none placeholder:text-ink-secondary"
            />
          </div>
        )}

        {filters.map((filter) => (
          <div
            key={filter.key}
            className="flex items-center border border-border-strong bg-canvas"
          >
            <label
              htmlFor={`filter-${filter.key}`}
              className="border-r border-border-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase text-ink-secondary"
            >
              {filter.label}
            </label>
            <select
              id={`filter-${filter.key}`}
              value={filter.value ?? ''}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink-primary outline-none"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onReset && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onReset();
            }}
            className="border border-border-strong bg-subheader px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-canvas"
          >
            [{lang === 'vi' ? 'ĐẶT LẠI' : 'RESET'}]
          </button>
        )}
      </div>

      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}