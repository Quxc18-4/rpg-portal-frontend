import { useLanguage } from '../../hooks/useLanguage';

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  loading = false,
  emptyText,
  onRowClick,
}) {
  const { lang } = useLanguage();

  return (
    <div className="w-full overflow-x-auto border border-border-strong bg-surface">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border-strong bg-subheader font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-primary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`border-r border-border-subtle px-3 py-2.5 last:border-r-0 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border-subtle">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center font-mono text-xs text-ink-secondary"
              >
                [{lang === 'vi' ? 'ĐANG TẢI DỮ LIỆU...' : 'LOADING DATA...'}]
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center font-mono text-xs text-ink-secondary"
              >
                [{emptyText || (lang === 'vi' ? 'KHÔNG CÓ DỮ LIỆU' : 'NO RECORDS FOUND')}]
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const key = typeof rowKey === 'function' ? rowKey(row, rowIndex) : row[rowKey] ?? rowIndex;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`bg-surface transition-colors hover:bg-canvas ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-r border-border-subtle px-3 py-2.5 align-middle last:border-r-0 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}