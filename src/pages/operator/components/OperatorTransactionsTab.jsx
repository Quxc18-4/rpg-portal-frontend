import { useState } from 'react';
import { operatorApi } from '../../../api/services/operator.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { formatDateTime } from '../../../utils/date.util';
import ChestGrid from '../../../components/rpg/ChestGrid';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import ItemSlotCell from '../../../components/rpg/ItemSlotCell';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function OperatorTransactionsTab({ onInspectTarget, lang }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [playerQuery, setPlayerQuery] = useState('');
  const [minCopper, setMinCopper] = useState('');
  const [oneSidedOnly, setOneSidedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);

  const [appliedFilters, setAppliedFilters] = useState({
    type: 'ALL',
    player: '',
    minCopper: '',
    oneSidedOnly: false,
    from: '',
    to: '',
  });

  const { data, loading, reload } = useAsyncData(
    () => {
      const params = {
        type: appliedFilters.type,
        page,
        limit: 20,
      };
      if (appliedFilters.player.trim()) params.player = appliedFilters.player.trim();
      if (appliedFilters.minCopper !== '') params.minCopper = Number(appliedFilters.minCopper);
      if (appliedFilters.oneSidedOnly) params.oneSidedOnly = true;
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;

      return operatorApi.auditTransactions(params);
    },
    [appliedFilters, page]
  );

  const items = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination || {
    page,
    totalPages: 1,
    total: items.length,
  };

  const handleApply = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({
      type: typeFilter,
      player: playerQuery,
      minCopper,
      oneSidedOnly,
      from: dateFrom,
      to: dateTo,
    });
  };

  const handleReset = () => {
    setTypeFilter('ALL');
    setPlayerQuery('');
    setMinCopper('');
    setOneSidedOnly(false);
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setAppliedFilters({
      type: 'ALL',
      player: '',
      minCopper: '',
      oneSidedOnly: false,
      from: '',
      to: '',
    });
  };

  const columns = [
    {
      key: 'type',
      header: lang === 'vi' ? 'LOẠI // THỜI GIAN' : 'TYPE // TIMESTAMP',
      render: (row) => {
        const txType = String(row.type || 'TRADE').toUpperCase();
        const flags = Array.isArray(row.flags) ? row.flags : [];
        return (
          <div className="space-y-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusTag
                label={txType}
                variant={txType === 'AUCTION' ? 'emerald' : 'neutral'}
              />
              {flags.map((flag) => (
                <StatusTag
                  key={flag}
                  label={flag}
                  variant={flag === 'ONE_SIDED_TRANSFER' ? 'crimson' : 'amber'}
                />
              ))}
            </div>
            <div className="text-[10px] text-ink-secondary">
              {formatDateTime(row.timestamp, lang)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'parties',
      header: lang === 'vi' ? 'CÁC BÊN THAM GIA' : 'PARTIES INVOLVED',
      render: (row) => {
        const p1 = row.participants?.from || row.participants?.side1 || null;
        const p2 = row.participants?.to || row.participants?.side2 || null;

        return (
          <div className="space-y-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-ink-secondary">
                {row.type === 'AUCTION' ? '[BÁN]' : '[A]'}
              </span>
              {p1?.username ? (
                <>
                  <PlayerBadge player={p1} />
                  {onInspectTarget && (
                    <button
                      type="button"
                      onClick={() => onInspectTarget(p1.username)}
                      className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald hover:bg-subheader"
                    >
                      [SOI 360]
                    </button>
                  )}
                </>
              ) : (
                <span className="text-ink-secondary">Unknown</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-ink-secondary">
                {row.type === 'AUCTION' ? '[MUA]' : '[B]'}
              </span>
              {p2?.username ? (
                <>
                  <PlayerBadge player={p2} />
                  {onInspectTarget && (
                    <button
                      type="button"
                      onClick={() => onInspectTarget(p2.username)}
                      className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald hover:bg-subheader"
                    >
                      [SOI 360]
                    </button>
                  )}
                </>
              ) : (
                <span className="text-ink-secondary">—</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'assets',
      header: lang === 'vi' ? 'TÀI SẢN TRAO ĐỔI' : 'EXCHANGED ASSETS',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-semibold text-ink-primary">{row.summary || '—'}</div>
          <div className="text-[10px] text-ink-secondary">{row.auditId}</div>
        </div>
      ),
    },
    {
      key: 'value',
      header: lang === 'vi' ? 'GIÁ TRỊ // CHI TIẾT' : 'VALUE // INSPECT',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end gap-1.5 font-mono text-xs">
          <CurrencyDisplay currency={row.valueCopper || 0} compact />
          <button
            type="button"
            onClick={() => setSelectedTx(row)}
            className="border border-border-strong bg-canvas px-2 py-0.5 text-[10px] font-bold text-ink-primary hover:bg-ink-primary hover:text-white"
          >
            [{lang === 'vi' ? 'XEM CHI TIẾT' : 'INSPECT TX'}]
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <form
        onSubmit={handleApply}
        className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
          <span className="font-bold uppercase text-ink-primary">
            [TRANSACTION AUDIT //{' '}
            {lang === 'vi' ? 'BỘ LỌC SOÁT XÉT DÒNG TIỀN & RMT' : 'AML & RMT FILTER'}]
          </span>
          <button
            type="button"
            onClick={() => reload()}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-semibold hover:bg-subheader"
          >
            [{lang === 'vi' ? 'LÀM MỚI' : 'REFRESH'}]
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'NGUỒN GIAO DỊCH' : 'SOURCE TYPE'}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-semibold text-ink-primary"
            >
              <option value="ALL">ALL (AUCTION + TRADE)</option>
              <option value="AUCTION">AUCTION ONLY</option>
              <option value="TRADE">DIRECT TRADE ONLY</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'TÊN NGƯỜI CHƠI' : 'PLAYER USERNAME'}
            </label>
            <input
              type="text"
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
              placeholder="vd: Kuuhaku"
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'GIÁ TRỊ TỐI THIỂU (COPPER)' : 'MIN COPPER'}
            </label>
            <input
              type="number"
              min="0"
              value={minCopper}
              onChange={(e) => setMinCopper(e.target.value)}
              placeholder="4096 = 1 Vàng"
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary tabular-nums"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'TỪ NGÀY' : 'FROM DATE'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'ĐẾN NGÀY' : 'TO DATE'}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-accent-crimson">
              <input
                type="checkbox"
                checked={oneSidedOnly}
                onChange={(e) => setOneSidedOnly(e.target.checked)}
              />
              <span>{lang === 'vi' ? 'CHỈ GIAO DỊCH 1 CHIỀU' : 'ONE-SIDED ONLY'}</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald"
          >
            [{lang === 'vi' ? 'TRUY VẤN DỮ LIỆU' : 'RUN AUDIT QUERY'}]
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="border border-border-strong bg-canvas px-3 py-1.5 font-semibold text-ink-primary hover:bg-subheader"
          >
            [{lang === 'vi' ? 'ĐẶT LẠI' : 'RESET'}]
          </button>
        </div>
      </form>

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row, idx) => row.auditId || idx}
        loading={loading}
      />

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs tabular-nums">
        <span className="text-ink-secondary">
          {lang === 'vi' ? 'TỔNG BẢN GHI' : 'TOTAL RECORDS'}:{' '}
          <strong className="text-ink-primary">{pagination.total ?? items.length}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-bold disabled:opacity-40"
          >
            {'< PREV'}
          </button>
          <span className="font-bold text-ink-primary">
            PAGE {pagination.page || page} / {Math.max(1, pagination.totalPages || 1)}
          </span>
          <button
            type="button"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-bold disabled:opacity-40"
          >
            {'NEXT >'}
          </button>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-2 border-border-strong bg-surface p-5 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-strong pb-3">
              <div>
                <div className="font-bold uppercase text-accent-crimson">
                  [AUDIT RECORD DETAIL // {selectedTx.auditId}]
                </div>
                <div className="text-[11px] text-ink-secondary">
                  {formatDateTime(selectedTx.timestamp, lang)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="border border-border-strong bg-canvas px-2.5 py-1 font-bold hover:bg-subheader"
              >
                [X]
              </button>
            </div>

            {selectedTx.type === 'AUCTION' && selectedTx.detail && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3 border border-border-subtle bg-canvas p-3">
                  <ItemSlotCell item={selectedTx.detail.item} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-bold text-ink-primary">
                      {selectedTx.detail.item?.displayName || selectedTx.detail.item?.type} x
                      {selectedTx.detail.item?.amount ?? 1}
                    </div>
                    <div className="text-[11px] text-ink-secondary">
                      Seller: <strong>{selectedTx.detail.seller?.username || 'Unknown'}</strong> |
                      Buyer: <strong>{selectedTx.detail.buyer?.username || '—'}</strong>
                    </div>
                    <div>
                      <CurrencyDisplay currency={selectedTx.detail.price || 0} />
                    </div>
                  </div>
                </div>

                {Array.isArray(selectedTx.detail.item?.lore) &&
                  selectedTx.detail.item.lore.length > 0 && (
                    <div className="border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-3 text-[11px] text-[#AAAAAA]">
                      {selectedTx.detail.item.lore.map((line, i) => (
                        <div key={i}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {selectedTx.type === 'TRADE' && selectedTx.detail && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* Side 1 */}
                <div className="space-y-2 border border-border-strong bg-canvas p-3">
                  <div className="border-b border-border-subtle pb-1.5 font-bold text-ink-primary">
                    [SIDE 1 // {selectedTx.detail.side1?.player?.username || 'Unknown'}]
                  </div>
                  <div>
                    <CurrencyDisplay currency={selectedTx.detail.side1?.currency || 0} compact />
                  </div>
                  <div className="overflow-x-auto">
                    <ChestGrid
                      items={selectedTx.detail.side1?.items || []}
                      totalSlots={18}
                      mode="index"
                    />
                  </div>
                </div>

                {/* Side 2 */}
                <div className="space-y-2 border border-border-strong bg-canvas p-3">
                  <div className="border-b border-border-subtle pb-1.5 font-bold text-ink-primary">
                    [SIDE 2 // {selectedTx.detail.side2?.player?.username || 'Unknown'}]
                  </div>
                  <div>
                    <CurrencyDisplay currency={selectedTx.detail.side2?.currency || 0} compact />
                  </div>
                  <div className="overflow-x-auto">
                    <ChestGrid
                      items={selectedTx.detail.side2?.items || []}
                      totalSlots={18}
                      mode="index"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}